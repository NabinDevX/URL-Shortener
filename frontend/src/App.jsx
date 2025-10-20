import { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import axios from "axios";
import Navbar from "@/components/Navbar";
import Dashboard from "@/components/Dashboard";
import Profile from "@/components/Profile";
import Welcome from "@/auth/Welcome";
import Signup from "@/auth/Signup";
import Login from "@/auth/Login";
import Logout from "@/auth/Logout";
import Footer from "@/components/Footer";

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    // ⏱️ Minimum loading time of 2 seconds
    const startTime = Date.now();

    try {
      const response = await axios.get('/api/v1/user/current-user', {
        timeout: 5000,
        withCredentials: true
      });

      console.log('✅ User authenticated:', response.data.data?.email || response.data.data?.username);
      setIsAuthenticated(true);

    } catch (error) {
      if (error.response) {
        console.log('❌ User not authenticated:', error.response.status);
      } else if (error.request) {
        console.error('🌐 Network error:', error.message);
      } else {
        console.error('⚠️ Error:', error.message);
      }
      setIsAuthenticated(false);
    } finally {
      // ✅ Ensure minimum 2 second loading time
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, 2000 - elapsedTime);

      setTimeout(() => {
        setLoading(false);
      }, remainingTime);
    }
  };

  // 🔄 Loading Screen
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
            <p className="text-white/80 text-lg mt-2">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  // ✅ Debug log (remove in production)
  console.log("🎨 App rendering with isAuthenticated:", isAuthenticated);

  return (
    <>
      <Routes>
        {/* Public Routes - Redirect to dashboard if authenticated */}
        <Route
          path="/"
          element={
            isAuthenticated ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Navigate to="/welcome" replace />
            )
          }
        />

        <Route
          path="/welcome"
          element={
            isAuthenticated ? <Navigate to="/dashboard" replace /> : <Welcome />
          }
        />

        <Route
          path="/login"
          element={
            isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />
          }
        />

        <Route
          path="/signup"
          element={
            isAuthenticated ? <Navigate to="/dashboard" replace /> : <Signup />
          }
        />

        {/* Protected Routes - Redirect to welcome if not authenticated */}
        <Route
          path="/dashboard"
          element={
            isAuthenticated ? (
              <>
                <Navbar />
                <Dashboard />
              </>
            ) : (
              <Navigate to="/welcome" replace />
            )
          }
        />

        <Route
          path="/profile"
          element={
            isAuthenticated ? (
              <>
                <Navbar />
                <Profile />
              </>
            ) : (
              <Navigate to="/welcome" replace />
            )
          }
        />

        <Route
          path="/logout"
          element={
            isAuthenticated ? (
              <>
                <Navbar />
                <Logout />
              </>
            ) : (
              <Navigate to="/welcome" replace />
            )
          }
        />

        {/* 404 - Catch all */}
        <Route
          path="*"
          element={
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700">
              <div className="text-center text-white">
                <h1 className="text-6xl font-bold mb-4">404</h1>
                <p className="text-2xl mb-8">Page Not Found</p>
                <a
                  href={isAuthenticated ? "/dashboard" : "/welcome"}
                  className="px-6 py-3 bg-white text-purple-600 rounded-lg font-bold hover:scale-105 transition-transform inline-block"
                >
                  Go Home
                </a>
              </div>
            </div>
          }
        />
      </Routes>
      <Footer />
    </>
  );
};

export default App;
