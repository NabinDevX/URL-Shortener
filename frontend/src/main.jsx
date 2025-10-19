import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import axios from 'axios'
import './index.css'
import App from './App.jsx'

const RootComponent = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [loading, setLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    checkAuth();
  }, [retryCount]);

  const checkAuth = async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await axios.get('/api/v1/user/current-user', {
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      console.log('✅ User authenticated:', response.data.data?.email || response.data.data?.username);
      setIsAuthenticated(true);

    } catch (error) {
      clearTimeout(timeoutId);

      if (error.code === 'ECONNABORTED' || error.message === 'canceled') {
        console.error('⏱️ Request timeout');
      } else if (error.response) {
        console.log('❌ User not authenticated:', error.response.status);
        setIsAuthenticated(false);
        setLoading(false);
        return;
      } else if (error.request) {
        console.error('🌐 Network error:', error.message);
      } else {
        console.error('⚠️ Error:', error.message);
      }

      if (retryCount < 2) {
        console.log(`🔄 Retrying... (Attempt ${retryCount + 1}/2)`);
        setTimeout(() => setRetryCount(prev => prev + 1), 1000);
        return;
      }
      
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700">
        <div className="text-center space-y-4">
          <div className="relative inline-block">
            <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-b-4 border-white"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-4xl">🔗</span>
            </div>
          </div>
          <div>
            <p className="text-white text-2xl font-bold">URL Shortener</p>
            <p className="text-white/80 text-lg mt-2">
              {retryCount > 0 ? `Retrying... (${retryCount}/2)` : 'Checking authentication...'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ✅ Always render App with all routes
  return (
    <BrowserRouter>
      <App isAuthenticated={isAuthenticated} />
    </BrowserRouter>
  );
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RootComponent />
  </StrictMode>,
)
