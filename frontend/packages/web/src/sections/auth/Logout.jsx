import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const Logout = ({ onLogout }) => {
  const [status, setStatus] = useState("logging out");
  const navigate = useNavigate();

  useEffect(() => {
    const performLogout = async () => {
      try {
        await axios.post("/api/v1/user/logout", {}, { withCredentials: true });

        console.log("✅ Logout successful");
        setStatus("success");

        // 🔹 Call the callback to clear App's auth state
        if (onLogout) {
          onLogout();
        }

        // Redirect to welcome page after a short delay
        setTimeout(() => {
          navigate("/welcome", { replace: true });
        }, 1000);
      } catch (err) {
        console.error("❌ Logout failed:", err.response?.data || err.message);
        setStatus("error");

        // Still clear state and redirect even on error
        if (onLogout) {
          onLogout();
        }

        setTimeout(() => {
          navigate("/welcome", { replace: true });
        }, 2000);
      }
    };

    performLogout();
  }, [navigate, onLogout]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-purple-600 via-blue-600 to-indigo-700">
      <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
        {status === "logging out" && (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-700 text-lg">Logging out...</p>
          </>
        )}
        {status === "success" && (
          <>
            <div className="text-green-500 text-5xl mb-4">✓</div>
            <p className="text-gray-700 text-lg">Logged out successfully!</p>
            <p className="text-gray-500">Redirecting...</p>
          </>
        )}
        {status === "error" && (
          <>
            <div className="text-red-500 text-5xl mb-4">✗</div>
            <p className="text-gray-700 text-lg">Logout failed</p>
            <p className="text-gray-500">Redirecting anyway...</p>
          </>
        )}
      </div>
    </div>
  );
};

export default Logout;
