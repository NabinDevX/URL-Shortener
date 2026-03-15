import User from "@/models/user";
import { safeRedisOperation } from "@/utils/redisClient";
import { ApiError } from "@/utils/apiError";
import type { OTPRecord, SendOtpInput } from "@/types";
const memoryOtpStore = new Map<string, { data: string; expiresAt: number }>();

const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};
const getOtp = async (email: string): Promise<string | null> => {
  const redisResult = await safeRedisOperation(async (client) => {
    return await client.get(`otp:email:${email}`);
  });

  if (redisResult !== null) {
    return redisResult;
  }
  const memoryEntry = memoryOtpStore.get(`otp:email:${email}`);
  if (memoryEntry && memoryEntry.expiresAt > Date.now()) {
    return memoryEntry.data;
  }
  if (memoryEntry) {
    memoryOtpStore.delete(`otp:email:${email}`);
  }

  return null;
};
const setOtp = async (
  email: string,
  otpData: string,
  ttlSeconds: number
): Promise<void> => {
  const redisResult = await safeRedisOperation(async (client) => {
    await client.setEx(`otp:email:${email}`, ttlSeconds, otpData);
    return true;
  });

  if (redisResult === null) {
    memoryOtpStore.set(`otp:email:${email}`, {
      data: otpData,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
    console.log(`⚠️ Redis unavailable - OTP stored in memory for ${email}`);
  }
};
const deleteOtp = async (email: string): Promise<void> => {
  await safeRedisOperation(async (client) => {
    await client.del(`otp:email:${email}`);
  });
  memoryOtpStore.delete(`otp:email:${email}`);
};
const getOtpTtl = async (email: string): Promise<number> => {
  const redisTtl = await safeRedisOperation(async (client) => {
    return await client.ttl(`otp:email:${email}`);
  });

  if (redisTtl !== null && redisTtl > 0) {
    return redisTtl;
  }
  const memoryEntry = memoryOtpStore.get(`otp:email:${email}`);
  if (memoryEntry && memoryEntry.expiresAt > Date.now()) {
    return Math.ceil((memoryEntry.expiresAt - Date.now()) / 1000);
  }

  return 0;
};

export const sendOtp = async (
  input: SendOtpInput
): Promise<{ email: string; message: string }> => {
  const { email, name } = input;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(409, "User with this email already exists");
  }

  const existingOtp = await getOtp(email);

  if (existingOtp) {
    const ttl = await getOtpTtl(email);
    throw new ApiError(
      429,
      `OTP already sent. Please wait ${ttl} seconds before requesting again.`
    );
  }

  const otp = generateOTP();
  const otpData = JSON.stringify({ otp, createdAt: Date.now() });
  await setOtp(email, otpData, 60);
  const isEmailConfigured =
    process.env.BREVO_SENDER_EMAIL && process.env.BREVO_API_KEY;

  if (!isEmailConfigured) {
    console.log(`\n📧 ========================================`);
    console.log(`📧 OTP for ${email}: ${otp}`);
    console.log(`📧 (Email not configured - using console output)`);
    console.log(`📧 ========================================\n`);

    return {
      email,
      message: `OTP sent successfully. Valid for 60 seconds. (Dev mode: Check console for OTP)`,
    };
  }

  try {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": process.env.BREVO_API_KEY!,
      },
      body: JSON.stringify({
        sender: {
          name: "URL Shortener",
          email: process.env.BREVO_SENDER_EMAIL,
        },
        to: [{ email, name: name || "User" }],
        subject: "Your OTP Code - URL Shortener",
        textContent: `Hi ${name || "there"},\n\nYour OTP code is: ${otp}\n\nThis code will expire in 60 seconds.`,
      }),
    });

    if (!response.ok) {
      await deleteOtp(email);
      throw new ApiError(500, "Failed to send OTP email");
    }
  } catch (error) {
    await deleteOtp(email);
    if (error instanceof ApiError) throw error;
    throw new ApiError(500, "Failed to send OTP email");
  }

  return { email, message: "OTP sent successfully. Valid for 60 seconds." };
};

export const verifyOtp = async (
  email: string,
  otp: string
): Promise<boolean> => {
  const otpData = await getOtp(email);

  if (!otpData) {
    throw new ApiError(
      400,
      "OTP not found or has expired. Please request a new one."
    );
  }

  const record = JSON.parse(otpData) as OTPRecord;
  if (record.otp !== otp) {
    throw new ApiError(400, "Invalid OTP");
  }

  await deleteOtp(email);

  return true;
};
