"use client";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { problems, useCases } from "@/constants";
import { benefits } from "../../constants";

const Welcome = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentStep((prev) => (prev + 1) % useCases.length);
        setIsAnimating(false);
      }, 300);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleGetStarted = () => navigate("/signup");
  const handleSignIn = () => navigate("/signin");

  return (
    <div className="min-h-screen bg-linear-to-br from-purple-600 via-blue-600 to-indigo-700">
      <div className="w-full px-4 sm:px-6 md:px-8 py-12 overflow-hidden">
        <div className="text-center mb-16">
          <div className="flex flex-wrap justify-center items-center gap-3 mb-6">
            <span className="text-5xl sm:text-6xl animate-bounce">🔗</span>
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold text-white wrap-break-word">
              URL Shortener
            </h1>
          </div>
          <p className="text-lg sm:text-2xl md:text-3xl text-blue-100 font-light max-w-3xl mx-auto px-2">
            Hide Your Confidential URLs Behind Clean, Professional Short Links
          </p>
        </div>

        <div className="max-w-6xl mx-auto mb-16">
          <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl overflow-hidden">
            <div className="bg-linear-to-r from-red-500 to-orange-500 p-6">
              <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                <span className="text-4xl">⚠️</span>
                The Problem with Public URLs
              </h2>
            </div>
            <div className="p-8 space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {problems.map((problem, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-4 p-4 bg-red-50 rounded-xl border-2 border-red-100"
                  >
                    <span className="text-4xl shrink-0">{problem.icon}</span>
                    <div>
                      <h3 className="font-bold text-red-900 text-lg mb-1">
                        {problem.title}
                      </h3>
                      <p className="text-red-700 text-sm">{problem.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto mb-16">
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold text-white mb-4">
              ✨ Our Solution: Complete URL Privacy
            </h2>
            <p className="text-xl text-blue-100">
              Transform any confidential URL into a clean, secure short link
            </p>
          </div>

          <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-8">
            <div
              className={`transition-all duration-300 ${
                isAnimating
                  ? "opacity-0 transform scale-95"
                  : "opacity-100 transform scale-100"
              }`}
            >
              <div className="text-center mb-8">
                <div className="text-7xl mb-4">
                  {useCases[currentStep]?.icon}
                </div>
                <h3 className="text-3xl font-bold text-gray-800 mb-2">
                  {useCases[currentStep]?.title}
                </h3>
                <p className="text-lg text-gray-600">
                  {useCases[currentStep]?.description}
                </p>
              </div>

              <div className="space-y-6 w-full max-w-full overflow-hidden">
                <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
                    <div className="shrink-0">
                      <div className="bg-red-500 text-white rounded-full w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center font-bold text-lg sm:text-xl">
                        ❌
                      </div>
                    </div>
                    <div className="flex-1 min-w-0 overflow-hidden">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="font-bold text-red-700">EXPOSED:</span>
                        <span className="text-sm text-red-600">
                          Everyone can see this
                        </span>
                      </div>
                      <div className="bg-white rounded-lg p-3 sm:p-4 border border-red-300 overflow-x-auto">
                        <p className="text-sm text-red-800 font-mono leading-relaxed break-all whitespace-pre-wrap">
                          {useCases[currentStep]?.example?.before}
                        </p>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className="text-xs bg-red-200 text-red-800 px-2 py-1 rounded">
                          🔓 Visible Parameters
                        </span>
                        <span className="text-xs bg-red-200 text-red-800 px-2 py-1 rounded">
                          😱 Authentication Exposed
                        </span>
                        <span className="text-xs bg-red-200 text-red-800 px-2 py-1 rounded">
                          📍 Tracking Visible
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-center">
                  <div className="text-3xl sm:text-5xl animate-bounce">⬇️</div>
                </div>

                <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
                    <div className="shrink-0">
                      <div className="bg-green-500 text-white rounded-full w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center font-bold text-lg sm:text-xl">
                        ✅
                      </div>
                    </div>
                    <div className="flex-1 min-w-0 overflow-hidden">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="font-bold text-green-700">
                          PROTECTED:
                        </span>
                        <span className="text-sm text-green-600">
                          Clean and secure
                        </span>
                      </div>
                      <div className="bg-white rounded-lg p-3 sm:p-4 border border-green-300 overflow-x-auto">
                        <p className="text-base sm:text-lg text-green-800 font-mono font-bold break-all whitespace-pre-wrap">
                          {useCases[currentStep]?.example?.after}
                        </p>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded">
                          🔐 Fully Hidden
                        </span>
                        <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded">
                          ✨ Professional
                        </span>
                        <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded">
                          📊 Still Trackable
                        </span>
                        <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded">
                          🛡️ Secure
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-center gap-3 mt-8">
              {useCases.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentStep(index)}
                  className={`transition-all duration-300 rounded-full ${
                    index === currentStep
                      ? "w-12 h-3 bg-purple-600"
                      : "w-3 h-3 bg-gray-300 hover:bg-gray-400"
                  }`}
                  aria-label={`Go to use case ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto mb-16">
          <h2 className="text-4xl font-bold text-white text-center mb-12">
            🎯 Why Hide Your URLs?
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300"
              >
                <div className="text-5xl mb-4">{benefit.icon}</div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  {benefit.title}
                </h3>
                <p className="text-gray-600">{benefit.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-12 border border-white/20 shadow-2xl">
            <h2 className="text-4xl font-bold text-white mb-4">
              Ready to Protect Your URLs?
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Join thousands of users who trust us to keep their links secure
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={handleGetStarted}
                className="px-10 py-5 bg-white text-purple-600 rounded-xl font-bold text-xl shadow-xl hover:shadow-2xl hover:scale-105 transform transition-all duration-200"
              >
                Get Started Free 🚀
              </button>
              <button
                onClick={handleSignIn}
                className="px-10 py-5 bg-transparent border-2 border-white text-white rounded-xl font-bold text-xl hover:bg-white hover:text-purple-600 transform transition-all duration-200"
              >
                Sign In
              </button>
            </div>
            <p className="text-blue-100 mt-6 text-sm">
              No credit card required • Unlimited short links • Cancel anytime
            </p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto mt-16 overflow-visible">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { number: "1M+", label: "Secure Links Created", icon: "🔗" },
              { number: "50K+", label: "Protected Users", icon: "👥" },
              { number: "99.9%", label: "Privacy Guaranteed", icon: "🛡️" },
            ].map((stat, index) => (
              <div
                key={index}
                className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 flex flex-col items-center justify-center text-center shadow-xl hover:shadow-2xl transition-all overflow-visible"
              >
                <div className="text-4xl mb-2">{stat.icon}</div>
                <p className="text-2xl sm:text-3xl font-bold text-purple-600 mb-1 leading-tight whitespace-nowrap">
                  {stat.number}
                </p>
                <p className="text-sm text-gray-600 font-medium">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="fixed top-10 left-10 text-6xl animate-float opacity-20 pointer-events-none">
        🔐
      </div>
      <div className="fixed bottom-10 right-10 text-6xl animate-float-delayed opacity-20 pointer-events-none">
        ✨
      </div>
    </div>
  );
};

export default Welcome;
