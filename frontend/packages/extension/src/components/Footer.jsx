import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatDateTime = (date) => {
    return date.toLocaleString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  return (
    <footer className="bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Main Content - Compact Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-4">
          {/* Brand Section */}
          <div className="space-y-2 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2">
              <span className="text-2xl">🔗</span>
              <h3 className="text-lg font-bold">URL Shortener</h3>
            </div>
            <p className="text-blue-100 text-xs">
              Clean, professional short links.
            </p>
            {/* Social Links */}
            <div className="flex gap-3 justify-center md:justify-start">
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-200 hover:text-white transition-all hover:scale-110"
                aria-label="Twitter"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z" />
                </svg>
              </a>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-200 hover:text-white transition-all hover:scale-110"
                aria-label="GitHub"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-200 hover:text-white transition-all hover:scale-110"
                aria-label="LinkedIn"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="text-center">
            <h4 className="font-semibold mb-2 text-white text-sm">Quick Links</h4>
            <ul className="space-y-1">
              <li>
                <Link to="/dashboard" className="text-blue-100 hover:text-white transition-colors text-xs">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link to="/profile" className="text-blue-100 hover:text-white transition-colors text-xs">
                  Profile
                </Link>
              </li>
              <li>
                <a href="#features" className="text-blue-100 hover:text-white transition-colors text-xs">
                  Features
                </a>
              </li>
            </ul>
          </div>

          {/* Legal & Support */}
          <div className="text-center">
            <h4 className="font-semibold mb-2 text-white text-sm">Support</h4>
            <ul className="space-y-1">
              <li>
                <a href="#help" className="text-blue-100 hover:text-white transition-colors text-xs">
                  Help Center
                </a>
              </li>
              <li>
                <a href="#contact" className="text-blue-100 hover:text-white transition-colors text-xs">
                  Contact Us
                </a>
              </li>
              <li>
                <a href="#privacy" className="text-blue-100 hover:text-white transition-colors text-xs">
                  Privacy Policy
                </a>
              </li>
            </ul>
          </div>

          {/* Date/Time Display */}
          <div className="text-center md:text-right">
            <h4 className="font-semibold mb-2 text-white text-sm">Current Time</h4>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2 inline-block">
              <p className="text-white text-xs font-mono leading-relaxed">
                {formatDateTime(currentDateTime)}
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Bar - Compact */}
        <div className="border-t border-white/20 pt-3">
          <div className="flex flex-col md:flex-row justify-between items-center gap-2">
            {/* Copyright with Year */}
            <p className="text-blue-100 text-xs">
              © {currentYear} URL Shortener. All rights reserved.
            </p>

            {/* Trust Badges */}
            <div className="flex flex-wrap justify-center gap-3">
              <span className="text-blue-100 text-xs flex items-center gap-1">
                <span className="text-green-300">🔒</span> SSL Secured
              </span>
              <span className="text-blue-100 text-xs flex items-center gap-1">
                <span className="text-blue-300">🛡️</span> GDPR Compliant
              </span>
              <span className="text-blue-100 text-xs flex items-center gap-1">
                <span className="text-purple-300">⚡</span> 99.9% Uptime
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Back to Top Button - Smaller */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="fixed bottom-6 right-6 bg-white text-purple-600 hover:bg-white/90 p-2 rounded-full shadow-lg transition-all hover:scale-110 z-50"
        aria-label="Back to top"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
        </svg>
      </button>
    </footer>
  );
};

export default Footer;