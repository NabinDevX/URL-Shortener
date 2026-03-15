import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import type {
  SignupFormData,
  SignupFormErrors,
  AxiosErrorResponse,
  ChangeEvent,
  FormEvent,
  KeyboardEvent,
  ClipboardEvent,
} from "@/types";

const Signup = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<SignupFormData>({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [errors, setErrors] = useState<SignupFormErrors>({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  const handleChange = (e: ChangeEvent) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name as keyof SignupFormErrors]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }

    if (errors.otp) {
      setErrors((prev) => ({ ...prev, otp: "" }));
    }
  };

  const handleOtpKeyDown = (index: number, e: KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus();
    }
  };

  const handleOtpPaste = (e: ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, 6);
    if (!/^\d+$/.test(pastedData)) return;

    const newOtp = [...otp];
    for (let i = 0; i < pastedData.length && i < 6; i++) {
      newOtp[i] = pastedData[i];
    }
    setOtp(newOtp);
  };

  const validateForm = () => {
    const newErrors: SignupFormErrors = {};

    if (!formData.username.trim()) {
      newErrors.username = "Username is required";
    } else if (formData.username.length < 3) {
      newErrors.username = "Username must be at least 3 characters";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password =
        "Password must contain uppercase, lowercase, and number";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const startResendTimer = () => {
    setResendTimer(60);
    const interval = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      await axios.post(
        "/api/v1/user/send-otp",
        {
          email: formData.email,
          name: formData.username,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
          withCredentials: true,
        }
      );

      setStep(2);
      startResendTimer();
    } catch (err) {
      const error = err as AxiosErrorResponse;

      if (error.response) {
        const errorMessage =
          error.response.data?.message || "Failed to send OTP";

        if (error.response.status === 409) {
          setErrors({
            email: "Email already registered",
          });
        } else {
          setErrors({
            general: errorMessage,
          });
        }
      } else if (error.request) {
        setErrors({
          general: "Network error. Please check your connection.",
        });
      } else {
        setErrors({
          general: "An unexpected error occurred. Please try again.",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: FormEvent) => {
    e.preventDefault();

    const otpValue = otp.join("");

    if (otpValue.length !== 6) {
      setErrors({ otp: "Please enter complete OTP" });
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      await axios.post(
        "/api/v1/user/signup",
        {
          name: formData.username,
          email: formData.email,
          password: formData.password,
          otp: otpValue,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
          withCredentials: true,
        }
      );

      navigate("/", { replace: true });
    } catch (err) {
      const error = err as AxiosErrorResponse;

      if (error.response) {
        const errorMessage = error.response.data?.message || "Invalid OTP";

        if (error.response.status === 400) {
          setErrors({
            otp: "Invalid or expired OTP. Please try again.",
          });
        } else {
          setErrors({
            general: errorMessage,
          });
        }
      } else if (error.request) {
        setErrors({
          general: "Network error. Please check your connection.",
        });
      } else {
        setErrors({
          general: "An unexpected error occurred. Please try again.",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0) return;

    setLoading(true);
    setErrors({});
    setOtp(["", "", "", "", "", ""]);

    try {
      await axios.post(
        "/api/v1/user/send-otp",
        {
          email: formData.email,
          name: formData.username,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
          withCredentials: true,
        }
      );

      startResendTimer();

      setErrors({
        success: "OTP sent successfully! Check your email.",
      });
    } catch (err) {
      const error = err as AxiosErrorResponse;
      setErrors({
        general: error.response?.data?.message || "Failed to resend OTP",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-purple-600 via-blue-600 to-indigo-700 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          <div className="bg-linear-to-r from-purple-600 to-indigo-600 px-8 py-6">
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="text-4xl">🔗</span>
              <h1 className="text-3xl font-bold text-white">
                {step === 1 ? "Sign Up" : "Verify Email"}
              </h1>
            </div>
            <p className="text-center text-purple-100">
              {step === 1
                ? "Create your account"
                : "Enter the OTP sent to your email"}
            </p>
          </div>

          <div className="px-8 pt-6">
            <div className="flex items-center justify-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                  step === 1
                    ? "bg-purple-600 text-white"
                    : "bg-green-500 text-white"
                }`}
              >
                {step === 1 ? "1" : "✓"}
              </div>
              <div
                className={`w-16 h-1 ${step === 2 ? "bg-purple-600" : "bg-gray-300"}`}
              ></div>
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                  step === 2
                    ? "bg-purple-600 text-white"
                    : "bg-gray-300 text-gray-600"
                }`}
              >
                2
              </div>
            </div>
            <div className="flex justify-between text-xs text-gray-600 mt-2">
              <span>Details</span>
              <span>Verify</span>
            </div>
          </div>

          <div className="px-8 py-8">
            {errors.general && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <span className="text-red-500 text-xl">⚠️</span>
                  <p className="text-red-700 text-sm">{errors.general}</p>
                </div>
              </div>
            )}

            {errors.success && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <span className="text-green-500 text-xl">✅</span>
                  <p className="text-green-700 text-sm">{errors.success}</p>
                </div>
              </div>
            )}

            {step === 1 && (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label
                    htmlFor="username"
                    className="block text-sm font-semibold text-gray-700 mb-2"
                  >
                    Username
                  </label>
                  <input
                    type="text"
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border ${
                      errors.username ? "border-red-500" : "border-gray-300"
                    } rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all`}
                    placeholder="Enter your username"
                    disabled={loading}
                  />
                  {errors.username && (
                    <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                      <span>❌</span> {errors.username}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-semibold text-gray-700 mb-2"
                  >
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border ${
                      errors.email ? "border-red-500" : "border-gray-300"
                    } rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all`}
                    placeholder="Enter your email"
                    disabled={loading}
                  />
                  {errors.email && (
                    <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                      <span>❌</span> {errors.email}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-semibold text-gray-700 mb-2"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border ${
                        errors.password ? "border-red-500" : "border-gray-300"
                      } rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all`}
                      placeholder="Enter your password"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? "👁️" : "👁️‍🗨️"}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                      <span>❌</span> {errors.password}
                    </p>
                  )}
                  {!errors.password && formData.password && (
                    <p className="text-gray-500 text-xs mt-1">
                      Must be 8+ characters with uppercase, lowercase, and
                      number
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="block text-sm font-semibold text-gray-700 mb-2"
                  >
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      id="confirmPassword"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border ${
                        errors.confirmPassword
                          ? "border-red-500"
                          : "border-gray-300"
                      } rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all`}
                      placeholder="Confirm your password"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showConfirmPassword ? "👁️" : "👁️‍🗨️"}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                      <span>❌</span> {errors.confirmPassword}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full py-3 px-4 bg-linear-to-r from-purple-600 to-indigo-600 text-white font-bold rounded-lg shadow-lg transition-all ${
                    loading
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:from-purple-700 hover:to-indigo-700 hover:shadow-xl transform hover:scale-105"
                  }`}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Sending OTP...
                    </span>
                  ) : (
                    "Continue"
                  )}
                </button>
              </form>
            )}

            {step === 2 && (
              <form onSubmit={handleVerifyOtp} className="space-y-6">
                <div className="text-center mb-6">
                  <p className="text-gray-600 text-sm">
                    We've sent a 6-digit code to
                  </p>
                  <p className="text-purple-600 font-semibold">
                    {formData.email}
                  </p>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-sm text-gray-500 hover:text-purple-600 mt-2"
                  >
                    Change email
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3 text-center">
                    Enter OTP
                  </label>
                  <div className="flex justify-center gap-2">
                    {otp.map((digit, index) => (
                      <input
                        key={index}
                        id={`otp-${index}`}
                        type="text"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                        onPaste={handleOtpPaste}
                        className={`w-12 h-14 text-center text-2xl font-bold border ${
                          errors.otp ? "border-red-500" : "border-gray-300"
                        } rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all`}
                        disabled={loading}
                      />
                    ))}
                  </div>
                  {errors.otp && (
                    <p className="text-red-500 text-xs mt-2 text-center flex items-center justify-center gap-1">
                      <span>❌</span> {errors.otp}
                    </p>
                  )}
                </div>

                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-2">
                    Didn't receive the code?
                  </p>
                  {resendTimer > 0 ? (
                    <p className="text-sm text-gray-500">
                      Resend in{" "}
                      <span className="font-semibold text-purple-600">
                        {resendTimer}s
                      </span>
                    </p>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={loading}
                      className="text-sm text-purple-600 font-semibold hover:text-purple-800"
                    >
                      Resend OTP
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading || otp.join("").length !== 6}
                  className={`w-full py-3 px-4 bg-linear-to-r from-purple-600 to-indigo-600 text-white font-bold rounded-lg shadow-lg transition-all ${
                    loading || otp.join("").length !== 6
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:from-purple-700 hover:to-indigo-700 hover:shadow-xl transform hover:scale-105"
                  }`}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Verifying...
                    </span>
                  ) : (
                    "Verify & Create Account"
                  )}
                </button>
              </form>
            )}

            <div className="mt-6 text-center">
              <p className="text-gray-600 text-sm">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="text-purple-600 font-semibold hover:text-purple-800 transition-colors"
                >
                  Sign In
                </Link>
              </p>
            </div>

            <div className="mt-6 flex items-center">
              <div className="flex-1 border-t border-gray-300"></div>
              <span className="px-4 text-sm text-gray-500">or</span>
              <div className="flex-1 border-t border-gray-300"></div>
            </div>

            <div className="mt-6 text-center">
              <Link
                to="/welcome"
                className="inline-flex items-center gap-2 text-gray-600 hover:text-purple-600 transition-colors text-sm font-medium"
              >
                <span>←</span>
                Back to Home
              </Link>
            </div>
          </div>
        </div>

        <p className="text-center text-white text-xs mt-6">
          By signing up, you agree to our{" "}
          <a href="#terms" className="underline hover:text-blue-200">
            Terms of Service
          </a>{" "}
          and{" "}
          <a href="#privacy" className="underline hover:text-blue-200">
            Privacy Policy
          </a>
        </p>
      </div>
    </div>
  );
};

export default Signup;
