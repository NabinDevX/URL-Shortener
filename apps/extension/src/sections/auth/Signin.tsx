import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleButton, useAuth } from "@repo/ui";
import { useGoogleLogin } from "@react-oauth/google";
import type { AxiosErrorResponse } from "@/types";

const Signin = () => {
  const navigate = useNavigate();
  const { login: authSignin, loginWithGoogleCode } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const googleSignin = useGoogleLogin({
    flow: "auth-code",
    onSuccess: async (codeResponse) => {
      if (!codeResponse.code) {
        setErrors({ general: "Google authentication failed" });
        return;
      }

      setGoogleLoading(true);
      setErrors({});
      try {
        await loginWithGoogleCode(codeResponse.code);
        navigate("/dashboard", { replace: true });
      } catch (err: unknown) {
        const message =
          (err as AxiosErrorResponse)?.response?.data?.message ||
          "Google sign in failed";
        setErrors({ general: message });
      } finally {
        setGoogleLoading(false);
      }
    },
    onError: () => {
      setErrors({ general: "Google sign in failed" });
    },
  });

  const googleClientIdRaw = import.meta.env.VITE_GOOGLE_EXTENSION_CLIENT_ID as
    | string
    | undefined;
  const googleClientId =
    googleClientIdRaw &&
    googleClientIdRaw !== "your_google_client_id_here" &&
    googleClientIdRaw.endsWith(".apps.googleusercontent.com")
      ? googleClientIdRaw
      : undefined;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      await authSignin(formData.email, formData.password);
      navigate("/dashboard", { replace: true });
    } catch (err: unknown) {
      console.error("❌ Sign-in error:", err);
      const error = err as AxiosErrorResponse;

      if (error.response) {
        const errorMessage = error.response.data?.message || "Sign-in failed";

        if (error.response.status === 401) {
          setErrors({
            general: "Invalid email or password",
          });
        } else if (error.response.status === 404) {
          setErrors({
            general: "No account found with this email",
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

  const openWebApp = () => {
    window.open("https://urltinier.app/signup", "_blank");
  };

  return (
    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 p-4 overflow-y-auto">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4">
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="text-3xl">🔗</span>
              <h1 className="text-2xl font-bold text-white">Welcome Back</h1>
            </div>
            <p className="text-center text-purple-100 text-sm">
              Sign in to your account
            </p>
          </div>

          <div className="px-6 py-6">
            {errors.general && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <span className="text-red-500 text-lg">⚠️</span>
                  <p className="text-red-700 text-xs">{errors.general}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="block text-xs font-semibold text-gray-700 mb-1"
                >
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border text-sm ${
                    errors.email ? "border-red-500" : "border-gray-300"
                  } rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all`}
                  placeholder="Enter your email"
                  disabled={loading}
                  autoComplete="email"
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
                  className="block text-xs font-semibold text-gray-700 mb-1"
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
                    className={`w-full px-3 py-2 border text-sm ${
                      errors.password ? "border-red-500" : "border-gray-300"
                    } rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all`}
                    placeholder="Enter your password"
                    disabled={loading}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors text-sm"
                  >
                    {showPassword ? "👁️" : "👁️‍🗨️"}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                    <span>❌</span> {errors.password}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-2.5 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold rounded-lg shadow-lg transition-all text-sm ${
                  loading
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:from-purple-700 hover:to-indigo-700 hover:shadow-xl transform hover:scale-105"
                }`}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
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
                    Signing in...
                  </span>
                ) : (
                  "Sign In"
                )}
              </button>
            </form>

            {googleClientId ? (
              <div className="mt-4">
                <div className="flex items-center gap-3 my-4">
                  <div className="h-px bg-gray-200 flex-1" />
                  <span className="text-gray-500 text-xs">OR</span>
                  <div className="h-px bg-gray-200 flex-1" />
                </div>
                <div
                  className={
                    googleLoading ? "opacity-60 pointer-events-none" : ""
                  }
                >
                  <GoogleButton
                    onClick={() => googleSignin()}
                    disabled={googleLoading}
                    loading={googleLoading}
                  />
                </div>
              </div>
            ) : null}

            <div className="mt-4 text-center">
              <p className="text-gray-600 text-xs">
                Don't have an account?{" "}
                <button
                  onClick={openWebApp}
                  className="text-purple-600 font-semibold hover:text-purple-800 transition-colors"
                >
                  Sign Up in Web App
                </button>
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-center gap-2 text-white text-xs">
          <span className="text-green-300">🔒</span>
          <span>Secure SSL Connection</span>
        </div>
      </div>
    </div>
  );
};

export default Signin;
