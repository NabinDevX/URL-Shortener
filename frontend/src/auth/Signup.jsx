import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const Signup = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Username validation
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain uppercase, lowercase, and number';
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const response = await axios.post(
        '/api/v1/user/signup',
        {
          name: formData.username,
          email: formData.email,
          password: formData.password
        },
        {
          headers: {
            'Content-Type': 'application/json'
          },
          withCredentials: true
        }
      );

      console.log('✅ Signup successful:', response.data);

      // Redirect to login or dashboard
      navigate('/login', { 
        state: { 
          message: 'Account created successfully! Please log in.' 
        } 
      });

    } catch (error) {
      console.error('❌ Signup error:', error);

      if (error.response) {
        // Server responded with error
        const errorMessage = error.response.data?.message || 'Signup failed';
        
        if (error.response.status === 409) {
          // User already exists
          setErrors({ 
            email: 'Email already registered',
            username: 'Username already taken'
          });
        } else if (error.response.status === 400) {
          // Validation error from server
          setErrors({ 
            general: errorMessage 
          });
        } else {
          setErrors({ 
            general: errorMessage 
          });
        }
      } else if (error.request) {
        // Network error
        setErrors({ 
          general: 'Network error. Please check your connection.' 
        });
      } else {
        setErrors({ 
          general: 'An unexpected error occurred. Please try again.' 
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-8 py-6">
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="text-4xl">🔗</span>
              <h1 className="text-3xl font-bold text-white">Sign Up</h1>
            </div>
            <p className="text-center text-purple-100">Create your account</p>
          </div>

          {/* Form */}
          <div className="px-8 py-8">
            {/* General Error */}
            {errors.general && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <span className="text-red-500 text-xl">⚠️</span>
                  <p className="text-red-700 text-sm">{errors.general}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Username Field */}
              <div>
                <label htmlFor="username" className="block text-sm font-semibold text-gray-700 mb-2">
                  Username
                </label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border ${
                    errors.username ? 'border-red-500' : 'border-gray-300'
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

              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border ${
                    errors.email ? 'border-red-500' : 'border-gray-300'
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

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border ${
                      errors.password ? 'border-red-500' : 'border-gray-300'
                    } rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all`}
                    placeholder="Enter your password"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                    <span>❌</span> {errors.password}
                  </p>
                )}
                {!errors.password && formData.password && (
                  <p className="text-gray-500 text-xs mt-1">
                    Must be 8+ characters with uppercase, lowercase, and number
                  </p>
                )}
              </div>

              {/* Confirm Password Field */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border ${
                      errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                    } rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all`}
                    placeholder="Confirm your password"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                    <span>❌</span> {errors.confirmPassword}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold rounded-lg shadow-lg transition-all ${
                  loading
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:from-purple-700 hover:to-indigo-700 hover:shadow-xl transform hover:scale-105'
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
                    Creating Account...
                  </span>
                ) : (
                  'Create Account'
                )}
              </button>
            </form>

            {/* Sign In Link */}
            <div className="mt-6 text-center">
              <p className="text-gray-600 text-sm">
                Already have an account?{' '}
                <Link
                  to="/login"
                  className="text-purple-600 font-semibold hover:text-purple-800 transition-colors"
                >
                  Sign In
                </Link>
              </p>
            </div>

            {/* Divider */}
            <div className="mt-6 flex items-center">
              <div className="flex-1 border-t border-gray-300"></div>
              <span className="px-4 text-sm text-gray-500">or</span>
              <div className="flex-1 border-t border-gray-300"></div>
            </div>

            {/* Back to Home */}
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

        {/* Terms */}
        <p className="text-center text-white text-xs mt-6">
          By signing up, you agree to our{' '}
          <a href="#terms" className="underline hover:text-blue-200">
            Terms of Service
          </a>{' '}
          and{' '}
          <a href="#privacy" className="underline hover:text-blue-200">
            Privacy Policy
          </a>
        </p>
      </div>
    </div>
  );
};

export default Signup;