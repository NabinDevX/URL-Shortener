import { useEffect, useState } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import axios from "axios";
import Welcome from "@/sections/auth/Welcome";
import Signup from "@/sections/auth/Signup";
import Login from "@/sections/auth/Login";
import Logout from "@/sections/auth/Logout";
import Navbar from "@/components/Navbar";
import Dashboard from "@/sections/Dashboard";
import URLS from "@/sections/URLS";
import Profile from "@/sections/Profile";
import Footer from "@/components/Footer";
import { Error } from "@myorg/common";

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [userData, setUserData] = useState(null); // 🔹 Store user data
  const location = useLocation();

  // 🔹 Initial auth check with 2-second loading
  useEffect(() => {
    checkAuth(true); // Pass true for initial load
  }, []);

  // 🔹 Quick auth check on route changes (no loading screen)
  useEffect(() => {
    if (!isInitialLoad) {
      console.log("🔄 Route changed to:", location.pathname);
      checkAuth(false); // Pass false for quick check
    }
  }, [location.pathname]);

  const checkAuth = async (showLoading = true) => {
    const startTime = Date.now();

    // Only show loading on initial load
    if (showLoading) {
      setLoading(true);
    }

    try {
      // 🔹 Step 1: Try to get current user
      const response = await axios.get("/api/v1/user/current-user", {
        timeout: 5000,
        withCredentials: true,
      });

      console.log(
        "✅ User authenticated:",
        response.data.data?.email || response.data.data?.name
      );

      // 🔹 Store user data from response
      setUserData(response.data.data);
      setIsAuthenticated(true);
    } catch (error) {
      console.log("⚠️ Initial auth check failed, attempting token refresh...");

      // 🔹 Step 2: Try to refresh the token
      try {
        const refreshResponse = await axios.post(
          "/api/v1/user/refresh-token",
          {},
          {
            timeout: 5000,
            withCredentials: true,
          }
        );

        console.log("✅ Token refreshed successfully:", refreshResponse.data);

        // 🔹 Step 3: Retry getting current user with refreshed token
        try {
          const retryResponse = await axios.get("/api/v1/user/current-user", {
            timeout: 5000,
            withCredentials: true,
          });

          console.log(
            "✅ User authenticated after refresh:",
            retryResponse.data.data?.email || retryResponse.data.data?.name
          );

          // 🔹 Store user data
          setUserData(retryResponse.data.data);
          setIsAuthenticated(true);
        } catch (retryError) {
          console.error(
            "❌ Failed to authenticate after token refresh:",
            retryError.response?.status
          );
          setIsAuthenticated(false);
          setUserData(null);
        }
      } catch (refreshError) {
        // 🔹 Token refresh failed - user is not authenticated
        if (refreshError.response) {
          console.log("❌ Token refresh failed:", refreshError.response.status);
        } else if (refreshError.request) {
          console.error(
            "🌐 Network error during refresh:",
            refreshError.message
          );
        } else {
          console.error("⚠️ Error during refresh:", refreshError.message);
        }
        setIsAuthenticated(false);
        setUserData(null);
      }
    } finally {
      // ✅ Only apply 2-second minimum on initial load
      if (showLoading) {
        const elapsedTime = Date.now() - startTime;
        const remainingTime = Math.max(0, 2000 - elapsedTime);

        setTimeout(() => {
          setLoading(false);
          setIsInitialLoad(false);
        }, remainingTime);
      }
    }
  };

  // 🔄 Loading Screen (only on initial load)
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
  console.log("👤 User data:", userData);

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
                <Navbar userData={userData} />
                <Dashboard userData={userData} />
              </>
            ) : (
              <Navigate to="/welcome" replace />
            )
          }
        />

        <Route
          path="/urls"
          element={
            isAuthenticated ? (
              <>
                <Navbar userData={userData} />
                <URLS userData={userData} />
              </>
            ) : (
              <Navigate to="/welcome" replace />
            )
          }
        />

        {/* 🔹 Profile route with _id from response */}
        <Route
          path="/profile/:userId"
          element={
            isAuthenticated ? (
              <>
                <Navbar userData={userData} />
                <Profile userData={userData} />
              </>
            ) : (
              <Navigate to="/welcome" replace />
            )
          }
        />

        {/* 🔹 Redirect /profile to current user's profile using _id */}
        <Route
          path="/profile"
          element={
            isAuthenticated && userData?._id ? (
              <Navigate to={`/profile/${userData._id}`} replace />
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
                <Navbar userData={userData} />
                <Logout />
              </>
            ) : (
              <Navigate to="/welcome" replace />
            )
          }
        />

        {/* 404 - Catch all */}
        <Route path="*" element={<Error />} />
      </Routes>
      <Footer />
    </>
  );
};

export default App;
