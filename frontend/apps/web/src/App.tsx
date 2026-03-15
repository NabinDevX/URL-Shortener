import { useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@myorg/ui";
import Welcome from "@/sections/auth/Welcome";
import Signup from "@/sections/auth/Signup";
import Login from "@/sections/auth/Login";
import Logout from "@/sections/auth/Logout";
import Navbar from "@/components/Navbar";
import Dashboard from "@/sections/Dashboard";
import URLS from "@/sections/URLS";
import Profile from "@/sections/Profile";
import Footer from "@/components/Footer";
import { Error, useLenis } from "@myorg/ui";

const App: React.FC = () => {
  const { isAuthenticated, loading, userData, refreshAuth } = useAuth();
  const location = useLocation();
  useLenis({
    duration: 1.2,
    smoothWheel: true,
  });
  useEffect(() => {
    if (!loading && isAuthenticated !== null) {
      refreshAuth();
    }
  }, [location.pathname]);

  if (loading || isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-purple-600 via-blue-600 to-indigo-700">
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

  return (
    <>
      <Routes>
        <Route
          path="/"
          element={
            isAuthenticated === true ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Navigate to="/welcome" replace />
            )
          }
        />

        <Route
          path="/welcome"
          element={
            isAuthenticated === true ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Welcome />
            )
          }
        />

        <Route
          path="/login"
          element={
            isAuthenticated === true ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Login />
            )
          }
        />

        <Route
          path="/signup"
          element={
            isAuthenticated === true ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Signup />
            )
          }
        />

        <Route
          path="/dashboard"
          element={
            isAuthenticated === true ? (
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
            isAuthenticated === true ? (
              <>
                <Navbar userData={userData} />
                <URLS userData={userData} />
              </>
            ) : (
              <Navigate to="/welcome" replace />
            )
          }
        />

        <Route
          path="/profile/:userId"
          element={
            isAuthenticated === true ? (
              <>
                <Navbar userData={userData} />
                <Profile userData={userData} />
              </>
            ) : (
              <Navigate to="/welcome" replace />
            )
          }
        />

        <Route
          path="/profile"
          element={
            isAuthenticated === true && userData?._id ? (
              <Navigate to={`/profile/${userData._id}`} replace />
            ) : (
              <Navigate to="/welcome" replace />
            )
          }
        />

        <Route
          path="/logout"
          element={
            isAuthenticated === true ? (
              <>
                <Navbar userData={userData} />
                <Logout />
              </>
            ) : (
              <Navigate to="/welcome" replace />
            )
          }
        />

        <Route path="*" element={<Error />} />
      </Routes>
      <Footer />
    </>
  );
};

export default App;
