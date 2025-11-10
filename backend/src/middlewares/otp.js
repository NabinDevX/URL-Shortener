import axios from "axios";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { safeRedisOperation } from "../utils/redisClient.js";
import User from "../models/user.js";

// Utility: generate 6-digit OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

//
// ─── SEND OTP CONTROLLER ───────────────────────────────────────────
//

// Send OTP to email (Brevo API) - Text only
const sendOtpToEmail = asyncHandler(async (req, res) => {
  const { email, name } = req.body;

  if (!email) {
    throw new ApiError(400, "Email is required");
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new ApiError(400, "Invalid email format");
  }

  // ✅ CHECK: Email already exists in database
  const existingUser = await User.findOne({ email });

  if (existingUser) {
    throw new ApiError(409, "User with this email already exists");
  }

  // ✅ CHECK: Prevent multiple OTP requests for same email (rate limiting)
  const existingOtp = await safeRedisOperation(async (client) => {
    const data = await client.get(`otp:email:${email}`);
    return data;
  });

  if (existingOtp) {
    const ttl = await safeRedisOperation(async (client) => {
      return await client.ttl(`otp:email:${email}`);
    });

    throw new ApiError(
      429,
      `OTP already sent. Please wait ${ttl} seconds before requesting again.`
    );
  }

  if (!process.env.BREVO_SENDER_EMAIL) {
    throw new ApiError(500, "Email service not configured");
  }

  if (!process.env.BREVO_API_KEY) {
    throw new ApiError(500, "Brevo API key not configured");
  }

  // Generate OTP
  const otp = generateOTP();

  // Store OTP in Redis with 60-second expiry
  await safeRedisOperation(async (client) => {
    const key = `otp:email:${email}`;
    const otpData = JSON.stringify({
      otp,
      createdAt: Date.now(),
    });

    // Set with 60 seconds TTL
    await client.setEx(key, 60, otpData);
    console.log(`✅ OTP stored in Redis for ${email} with 60s expiry`);
  });

  // Send email via Brevo (text only)
  try {
    await axios.post(
      "https://api.brevo.com/v3/smtp/email",
      {
        sender: {
          name: "URL Shortener",
          email: process.env.BREVO_SENDER_EMAIL,
        },
        to: [{ email, name: name || "User" }],
        subject: "Your OTP Code - URL Shortener",
        textContent: `
Hi ${name || "there"},

Your OTP code is: ${otp}

This code will expire in 60 seconds.

If you didn't request this code, please ignore this email.

---
URL Shortener Team
© ${new Date().getFullYear()} All rights reserved.
        `.trim(),
      },
      {
        headers: {
          "Content-Type": "application/json",
          "api-key": process.env.BREVO_API_KEY,
        },
      }
    );

    console.log(`✅ OTP sent successfully to ${email}`);
  } catch (error) {
    // Clean up OTP on send failure
    await safeRedisOperation(async (client) => {
      await client.del(`otp:email:${email}`);
    });

    console.error("❌ Brevo API error:", error.response?.data || error.message);

    if (error.response?.status === 400) {
      throw new ApiError(400, "Invalid email address or sender configuration");
    } else if (error.response?.status === 401) {
      throw new ApiError(500, "Email service authentication failed");
    } else {
      throw new ApiError(
        500,
        `Failed to send OTP: ${error.response?.data?.message || error.message}`
      );
    }
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { email },
        "OTP sent successfully to your email. Valid for 60 seconds."
      )
    );
});

//
// ─── OTP VALIDATION MIDDLEWARE ───────────────────────────────────────────
//

// Middleware to validate email OTP
const emailOtpValidation = asyncHandler(async (req, res, next) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    throw new ApiError(400, "Email and OTP are required");
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new ApiError(400, "Invalid email format");
  }

  // Validate OTP format (6 digits)
  if (!/^\d{6}$/.test(otp)) {
    throw new ApiError(400, "OTP must be 6 digits");
  }

  // ✅ CHECK: Email already exists (double-check before signup)
  const existingUser = await User.findOne({ email });

  if (existingUser) {
    // Clean up OTP since user already exists
    await safeRedisOperation(async (client) => {
      await client.del(`otp:email:${email}`);
    });
    throw new ApiError(409, "User with this email already exists");
  }

  // Get OTP from Redis
  const otpData = await safeRedisOperation(async (client) => {
    const key = `otp:email:${email}`;
    const data = await client.get(key);
    return data;
  });

  if (!otpData) {
    throw new ApiError(
      400,
      "OTP not found or has expired. Please request a new one"
    );
  }

  const record = JSON.parse(otpData);

  if (record.otp !== otp) {
    throw new ApiError(400, "Invalid OTP");
  }

  // OTP is valid - remove from Redis
  await safeRedisOperation(async (client) => {
    await client.del(`otp:email:${email}`);
    console.log(`✅ OTP verified and deleted for ${email}`);
  });

  next();
});

//
// ─── UTILITY FUNCTIONS ───────────────────────────────────────────
//

// Check if OTP exists for email
const checkOtpExists = async (email) => {
  return await safeRedisOperation(async (client) => {
    const exists = await client.exists(`otp:email:${email}`);
    return exists === 1;
  });
};

// Get OTP info (for debugging)
const getOtpInfo = async (email) => {
  return await safeRedisOperation(async (client) => {
    const key = `otp:email:${email}`;
    const data = await client.get(key);

    if (!data) return null;

    const record = JSON.parse(data);
    const ttl = await client.ttl(key);

    return {
      exists: true,
      expiresIn: ttl,
      createdAt: new Date(record.createdAt).toISOString(),
    };
  });
};

// Get remaining time for OTP
const getOtpTTL = async (email) => {
  return await safeRedisOperation(async (client) => {
    const ttl = await client.ttl(`otp:email:${email}`);
    return ttl > 0 ? ttl : 0;
  });
};

// Clear OTP manually
const clearOtp = async (email) => {
  return await safeRedisOperation(async (client) => {
    const result = await client.del(`otp:email:${email}`);
    console.log(`🗑️ OTP cleared for ${email}`);
    return result;
  });
};

// Clear all OTPs (for testing)
const clearAllOtps = async () => {
  return await safeRedisOperation(async (client) => {
    const keys = await client.keys("otp:email:*");
    if (keys.length > 0) {
      await client.del(keys);
      console.log(`🗑️ Cleared ${keys.length} OTP(s)`);
      return keys.length;
    }
    return 0;
  });
};

export {
  sendOtpToEmail,
  emailOtpValidation,
  checkOtpExists,
  getOtpInfo,
  getOtpTTL,
  clearOtp,
  clearAllOtps,
};
