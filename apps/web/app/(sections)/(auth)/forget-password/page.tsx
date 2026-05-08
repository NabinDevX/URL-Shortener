"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Toast } from "@repo/ui";

type Step = 1 | 2;

const createEmptyOtp = () => ["", "", "", "", "", ""];

const ForgetPasswordPage = () => {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(createEmptyOtp());
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (resendTimer <= 0) {
      return;
    }

    const interval = setInterval(() => {
      setResendTimer((current) => {
        if (current <= 1) {
          clearInterval(interval);
          return 0;
        }

        return current - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const nextOtp = [...otp];
    nextOtp[index] = value.slice(-1);
    setOtp(nextOtp);

    if (value && index < 5) {
      document.getElementById(`forget-password-otp-${index + 1}`)?.focus();
    }

    if (errors.otp) {
      setErrors((current) => ({ ...current, otp: "" }));
    }
  };

  const handleOtpKeyDown = (
    index: number,
    event: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (event.key === "Backspace" && !otp[index] && index > 0) {
      document.getElementById(`forget-password-otp-${index - 1}`)?.focus();
    }
  };

  const handleOtpPaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    const pasted = event.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);

    if (!pasted) {
      return;
    }

    const nextOtp = createEmptyOtp();
    pasted.split("").forEach((digit, index) => {
      nextOtp[index] = digit;
    });

    setOtp(nextOtp);
    document
      .getElementById(`forget-password-otp-${Math.min(pasted.length, 5)}`)
      ?.focus();
  };

  const requestResetOtp = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setErrors({ email: "Email is required" });
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const response = await axios.post(
        "/user/forgot-password/send-otp",
        { email: trimmedEmail },
        {
          headers: { "Content-Type": "application/json" },
          withCredentials: true,
        }
      );

      Toast.success(response.data?.message || "OTP sent to your email.");
      setStep(2);
      setResendTimer(60);
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? error.response?.data?.message || "Failed to send OTP"
        : "Failed to send OTP";

      setErrors({ general: message });
      Toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async () => {
    const otpValue = otp.join("");

    if (!email.trim()) {
      setErrors({ email: "Email is required" });
      setStep(1);
      return;
    }

    if (otpValue.length !== 6) {
      setErrors({ otp: "Please enter a valid 6-digit OTP" });
      return;
    }

    if (!newPassword) {
      setErrors({ newPassword: "New password is required" });
      return;
    }

    if (newPassword.length < 6) {
      setErrors({ newPassword: "New password must be at least 6 characters" });
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrors({ confirmPassword: "Passwords do not match" });
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const response = await axios.post(
        "/user/forgot-password/change-password",
        {
          email: email.trim(),
          otp: otpValue,
          newPassword,
        },
        {
          headers: { "Content-Type": "application/json" },
          withCredentials: true,
        }
      );

      Toast.success(response.data?.message || "Password changed successfully.");
      router.replace(
        "/signin?message=" +
          encodeURIComponent(
            "Password reset successful. Sign in with your new password."
          )
      );
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? error.response?.data?.message || "Password reset failed"
        : "Password reset failed";

      setErrors({ general: message });
      Toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-surface-container-lowest shadow-sm">
          <div className="border-b border-slate-200 bg-surface-container-low px-8 py-6">
            <div className="mb-2 flex items-center justify-center gap-2">
              <span className="text-4xl">🔐</span>
              <h1 className="text-3xl font-bold text-on-surface">
                {step === 1 ? "Forgot Password" : "Reset Password"}
              </h1>
            </div>
            <p className="text-center text-on-surface-variant">
              {step === 1
                ? "Send an OTP to your email to reset your password"
                : "Enter the OTP and your new password"}
            </p>
          </div>

          <div className="px-8 py-8">
            {errors.general && (
              <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
                <p className="text-sm text-red-700">{errors.general}</p>
              </div>
            )}

            {step === 1 ? (
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  void requestResetOtp();
                }}
                className="space-y-5"
              >
                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block text-sm font-semibold text-gray-700"
                  >
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(event) => {
                      setEmail(event.target.value);
                      if (errors.email) {
                        setErrors((current) => ({ ...current, email: "" }));
                      }
                    }}
                    autoComplete="email"
                    disabled={loading}
                    placeholder="Enter your account email"
                    className={`w-full rounded-lg border px-4 py-3 transition-all focus:outline-none focus:ring-2 focus:ring-(--ring) ${
                      errors.email ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  {errors.email && (
                    <p className="mt-1 text-xs text-red-500">{errors.email}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full rounded-lg bg-primary px-4 py-3 font-bold text-white shadow-sm transition-colors ${
                    loading
                      ? "cursor-not-allowed opacity-50"
                      : "hover:bg-primary-container"
                  }`}
                >
                  {loading ? "Sending OTP..." : "Send OTP"}
                </button>
              </form>
            ) : (
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  void resetPassword();
                }}
                className="space-y-6"
              >
                <div className="text-center">
                  <p className="text-sm text-gray-600">OTP sent to</p>
                  <p className="font-semibold text-primary">{email}</p>
                  <button
                    type="button"
                    className="mt-2 text-sm font-semibold text-gray-500 transition-colors hover:text-primary"
                    onClick={() => {
                      setStep(1);
                      setOtp(createEmptyOtp());
                      setResendTimer(0);
                    }}
                  >
                    Change email
                  </button>
                </div>

                <div>
                  <label className="mb-3 block text-center text-sm font-semibold text-gray-700">
                    Enter OTP
                  </label>
                  <div className="flex justify-center gap-2">
                    {otp.map((digit, index) => (
                      <input
                        key={index}
                        id={`forget-password-otp-${index}`}
                        type="text"
                        maxLength={1}
                        inputMode="numeric"
                        value={digit}
                        onChange={(event) =>
                          handleOtpChange(index, event.target.value)
                        }
                        onKeyDown={(event) => handleOtpKeyDown(index, event)}
                        onPaste={handleOtpPaste}
                        disabled={loading}
                        className={`h-14 w-12 rounded-lg border text-center text-2xl font-bold transition-all focus:outline-none focus:ring-2 focus:ring-(--ring) ${
                          errors.otp ? "border-red-500" : "border-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                  {errors.otp && (
                    <p className="mt-2 text-center text-xs text-red-500">
                      {errors.otp}
                    </p>
                  )}
                </div>

                <div className="space-y-5">
                  <div>
                    <label
                      htmlFor="newPassword"
                      className="mb-2 block text-sm font-semibold text-gray-700"
                    >
                      New Password
                    </label>
                    <input
                      id="newPassword"
                      type="password"
                      value={newPassword}
                      onChange={(event) => {
                        setNewPassword(event.target.value);
                        if (errors.newPassword) {
                          setErrors((current) => ({
                            ...current,
                            newPassword: "",
                          }));
                        }
                      }}
                      disabled={loading}
                      autoComplete="new-password"
                      placeholder="Enter a new password"
                      className={`w-full rounded-lg border px-4 py-3 transition-all focus:outline-none focus:ring-2 focus:ring-(--ring) ${
                        errors.newPassword
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                    />
                    {errors.newPassword && (
                      <p className="mt-1 text-xs text-red-500">
                        {errors.newPassword}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="confirmPassword"
                      className="mb-2 block text-sm font-semibold text-gray-700"
                    >
                      Confirm New Password
                    </label>
                    <input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(event) => {
                        setConfirmPassword(event.target.value);
                        if (errors.confirmPassword) {
                          setErrors((current) => ({
                            ...current,
                            confirmPassword: "",
                          }));
                        }
                      }}
                      disabled={loading}
                      autoComplete="new-password"
                      placeholder="Re-enter the new password"
                      className={`w-full rounded-lg border px-4 py-3 transition-all focus:outline-none focus:ring-2 focus:ring-(--ring) ${
                        errors.confirmPassword
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                    />
                    {errors.confirmPassword && (
                      <p className="mt-1 text-xs text-red-500">
                        {errors.confirmPassword}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <p className="text-gray-600">Didn&apos;t get the code?</p>
                  {resendTimer > 0 ? (
                    <span className="font-semibold text-gray-500">
                      Resend in {resendTimer}s
                    </span>
                  ) : (
                    <button
                      type="button"
                      className="font-semibold text-primary transition-colors hover:text-primary-container"
                      disabled={loading}
                      onClick={() => void requestResetOtp()}
                    >
                      Resend OTP
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading || otp.join("").length !== 6}
                  className={`w-full rounded-lg bg-primary px-4 py-3 font-bold text-white shadow-sm transition-colors ${
                    loading || otp.join("").length !== 6
                      ? "cursor-not-allowed opacity-50"
                      : "hover:bg-primary-container"
                  }`}
                >
                  {loading ? "Updating Password..." : "Reset Password"}
                </button>
              </form>
            )}

            <div className="mt-6 text-center">
              <Link
                href="/signin/"
                className="text-sm font-semibold text-primary transition-colors hover:text-primary-container"
              >
                Back to Sign In
              </Link>
            </div>

            <div className="mt-4 text-center">
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 transition-colors hover:text-primary"
              >
                <span>←</span>
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgetPasswordPage;
