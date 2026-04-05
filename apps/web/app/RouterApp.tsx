"use client";

import dynamicImport from "next/dynamic";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth, useLenis } from "@repo/ui";

export const dynamic = "force-dynamic";

const Welcome = dynamicImport(() => import("@/sections/auth/Welcome"), {
  ssr: false,
});
const Signup = dynamicImport(() => import("@/sections/auth/Signup"), {
  ssr: false,
});
const Login = dynamicImport(() => import("@/sections/auth/Login"), {
  ssr: false,
});
const Logout = dynamicImport(() => import("@/sections/auth/Logout"), {
  ssr: false,
});
const Navbar = dynamicImport(() => import("@/components/Navbar"), {
  ssr: false,
});
const Dashboard = dynamicImport(() => import("@/sections/Dashboard"), {
  ssr: false,
});
const URLS = dynamicImport(() => import("@/sections/URLS"), { ssr: false });
const Profile = dynamicImport(() => import("@/sections/Profile"), {
  ssr: false,
});
const Footer = dynamicImport(() => import("@/components/Footer"), {
  ssr: false,
});
const DownloadExtension = dynamicImport(
  () => import("@/components/DownloadExtension"),
  {
    ssr: false,
  }
);

export default function RouterApp() {
  const { isAuthenticated, loading, userData } = useAuth();

  useLenis({
    duration: 1.2,
    easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
  });

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
          path="/welcome"
          element={
            isAuthenticated ? <Navigate to="/dashboard" replace /> : <Welcome />
          }
        />
        <Route
          path="/signup"
          element={
            isAuthenticated ? <Navigate to="/dashboard" replace /> : <Signup />
          }
        />
        <Route
          path="/signin"
          element={
            isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />
          }
        />
        <Route
          path="/signout"
          element={
            isAuthenticated ? <Logout /> : <Navigate to="/welcome" replace />
          }
        />
        {isAuthenticated ? (
          <>
            <Route
              path="/*"
              element={
                <>
                  <Navbar userData={userData} />
                  <div className="min-h-screen bg-gray-50">
                    <div className="max-w-7xl mx-auto py-6 px-4">
                      <Routes>
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/urls" element={<URLS />} />
                        <Route path="/profile" element={<Profile />} />
                        <Route
                          path="/download"
                          element={<DownloadExtension />}
                        />
                        <Route
                          path="/*"
                          element={<Navigate to="/dashboard" replace />}
                        />
                      </Routes>
                    </div>
                  </div>
                  <Footer />
                </>
              }
            />
          </>
        ) : (
          <Route path="*" element={<Navigate to="/welcome" />} />
        )}
      </Routes>
    </>
  );
}
