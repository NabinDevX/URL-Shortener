import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Dashboard from "@/components/Dashboard";
import Profile from "@/components/Profile";
import Welcome from "@/auth/welcome";
import Signup from "@/auth/Signup";
import Login from "@/auth/Login";
import Logout from "@/auth/Logout";

const App = ({ isAuthenticated }) => {
  // ✅ Debug log (remove in production)
  console.log('🎨 App rendering with isAuthenticated:', isAuthenticated);

  return (
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
          isAuthenticated ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <Welcome />
          )
        } 
      />
      
      <Route 
        path="/login" 
        element={
          isAuthenticated ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <Login />
          )
        } 
      />
      
      <Route 
        path="/signup" 
        element={
          isAuthenticated ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <Signup />
          )
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
  );
};

export default App;
