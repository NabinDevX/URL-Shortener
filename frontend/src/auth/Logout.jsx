import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Logout = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading'); // loading, success, error
  const [message, setMessage] = useState('Logging you out safely...');

  useEffect(() => {
    performLogout();
  }, []);

  const performLogout = async () => {
    try {
      setStatus('loading');
      setMessage('Logging you out safely...');

      const response = await axios.post('/api/v1/user/logout', {}, {
        withCredentials: true,
        timeout: 10000
      });

      if (response.data.success) {
        setStatus('success');
        setMessage('Successfully logged out! 👋');
        
        // Auto redirect after 2 seconds
        setTimeout(() => {
          navigate('/');
        }, 2000);
      }
    } catch (error) {
      console.error('Logout error:', error);
      setStatus('error');
      setMessage(error.response?.data?.message || 'Logout failed, but you can still go home');
      
      // Even on error, redirect after 3 seconds
      setTimeout(() => {
        navigate('/');
      }, 3000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#667eea] to-[#764ba2] flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-3xl shadow-2xl p-12 text-center">
          {/* Icon Animation */}
          <div className="mb-8">
            {status === 'loading' && (
              <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-[#667eea] to-[#764ba2] rounded-full shadow-2xl animate-pulse">
                <span className="text-5xl animate-wave">👋</span>
              </div>
            )}

            {status === 'success' && (
              <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-green-400 to-green-600 rounded-full shadow-2xl animate-bounce-once">
                <span className="text-5xl">✅</span>
              </div>
            )}

            {status === 'error' && (
              <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full shadow-2xl">
                <span className="text-5xl">⚠️</span>
              </div>
            )}
          </div>

          {/* Title */}
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            {status === 'loading' && 'Logging Out...'}
            {status === 'success' && 'See You Soon!'}
            {status === 'error' && 'Oops!'}
          </h1>

          {/* Message */}
          <p className="text-gray-600 text-lg mb-8">
            {message}
          </p>

          {/* Loading Spinner */}
          {status === 'loading' && (
            <div className="flex justify-center mb-6">
              <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-[#667eea]"></div>
            </div>
          )}

          {/* Success Animation */}
          {status === 'success' && (
            <div className="mb-6">
              <div className="inline-flex items-center gap-2 text-green-600 font-semibold">
                <svg className="w-6 h-6 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
                Redirecting to home page...
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="space-y-3">
            <button
              onClick={() => navigate('/')}
              className="w-full py-4 px-6 bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white rounded-2xl font-bold text-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 flex items-center justify-center gap-3 group"
            >
              <svg 
                className="w-6 h-6 group-hover:-translate-x-1 transition-transform" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Go to Home Page
            </button>

            {status === 'error' && (
              <button
                onClick={performLogout}
                className="w-full py-4 px-6 bg-white text-[#667eea] border-2 border-[#667eea] rounded-2xl font-bold text-lg hover:bg-[#667eea] hover:text-white transition-all duration-300 hover:scale-105 flex items-center justify-center gap-3"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Try Again
              </button>
            )}
          </div>

          {/* Additional Info */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              {status === 'success' && 'Thank you for using URL Shortener! 🎉'}
              {status === 'loading' && 'Please wait while we securely log you out...'}
              {status === 'error' && 'You can safely return to the home page'}
            </p>
          </div>
        </div>

        {/* Security Note */}
        <div className="mt-6 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white px-6 py-3 rounded-2xl shadow-lg">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span className="text-sm font-semibold">Your session has been securely ended</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Logout;