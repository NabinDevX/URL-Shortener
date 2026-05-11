"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth, Toast } from "@repo/ui";
import { AxiosError } from "axios";
import { SocialSigninButtons } from "@/components/SocialSigninButtons";

const Login = () => {
  const router = useRouter();
  const { login: authLogin } = useAuth();
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState(
    searchParams.get("message") || ""
  );

  const handleChange = (e: any): void => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, any> = {};

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: any): Promise<void> => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setErrors({});
    setSuccessMessage("");

    try {
      await authLogin(formData.email, formData.password);
      Toast.success("Sign in successful!");
      router.replace("/dashboard");
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }> | unknown;

      if (axiosError instanceof AxiosError) {
        const errorMessage =
          axiosError.response?.data?.message || "Login failed";

        if (axiosError.response?.status === 401) {
          Toast.error("Invalid email or password");
        } else if (axiosError.response?.status === 404) {
          Toast.error("No account found with this email");
        } else {
          Toast.error(errorMessage);
        }
      } else {
        Toast.error("An unexpected error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        <div className="bg-surface-container-lowest rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-surface-container-low border-b border-slate-200 px-8 py-6">
            <h1 className="text-center text-3xl font-bold text-on-surface">
              Welcome Back
            </h1>
            <p className="mt-2 text-center text-on-surface-variant">
              Sign in to your account
            </p>
          </div>

          <div className="px-8 py-8">
            {successMessage && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <span className="text-green-600 text-sm font-semibold uppercase tracking-wide">
                    Success
                  </span>
                  <p className="text-green-700 text-sm">{successMessage}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
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
                  } rounded-lg focus:outline-none focus:ring-2 focus:ring-(--ring) transition-all`}
                  placeholder="Enter your email"
                  disabled={loading}
                  autoComplete="email"
                />
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                    <span className="font-semibold uppercase tracking-wide">
                      Error
                    </span>
                    {errors.email}
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
                    } rounded-lg focus:outline-none focus:ring-2 focus:ring-(--ring) transition-all`}
                    placeholder="Enter your password"
                    disabled={loading}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                    <span className="font-semibold uppercase tracking-wide">
                      Error
                    </span>
                    {errors.password}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-(--ring)"
                  />
                  <span className="text-sm text-gray-600">Remember me</span>
                </label>
                <Link
                  href="/forget-password"
                  className="text-sm text-primary hover:text-primary-container font-semibold transition-colors"
                >
                  Forgot Password?
                </Link>
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3 px-4 bg-primary text-white font-bold rounded-lg shadow-sm transition-colors ${
                  loading
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-primary-container"
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
                    Signing In...
                  </span>
                ) : (
                  "Sign In"
                )}
              </button>
            </form>

            <div className="mt-5">
              <div className="flex items-center gap-3 my-4">
                <div className="h-px bg-gray-200 flex-1" />
                <span className="text-gray-500 text-sm">OR</span>
                <div className="h-px bg-gray-200 flex-1" />
              </div>
              <SocialSigninButtons
                onSuccess={() => router.replace("/dashboard")}
                isSignup={false}
              />
            </div>

            <div className="mt-6 text-center">
              <p className="text-gray-600 text-sm">
                Don&apos;t have an account?{" "}
                <Link
                  href="/signup/"
                  className="text-primary font-semibold hover:text-primary-container transition-colors"
                >
                  Sign Up
                </Link>
              </p>
            </div>

            <div className="mt-6 text-center">
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-gray-600 hover:text-primary transition-colors text-sm font-medium"
              >
                <span>←</span>
                Back to Home
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-center gap-2 text-on-surface-variant text-sm">
          <span className="font-semibold uppercase tracking-wide text-xs">
            Secure
          </span>
          <span>Secure SSL Connection</span>
        </div>
      </div>
    </div>
  );
};

export default Login;
