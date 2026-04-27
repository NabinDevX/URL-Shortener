"use client";

import dynamicImport from "next/dynamic";
import { Navigate, Route, Routes } from "react-router-dom";
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
const Footer = dynamicImport(() => import("@/components/Footer"), {
  ssr: false,
});
const Dashboard = dynamicImport(() => import("@/sections/Dashboard"), {
  ssr: false,
});
const URLS = dynamicImport(() => import("@/sections/URLS"), { ssr: false });
const Profile = dynamicImport(() => import("@/sections/Profile"), {
  ssr: false,
});
const Analytics = dynamicImport(() => import("@/sections/Analytics"), {
  ssr: false,
});
const Campaigns = dynamicImport(() => import("@/sections/Campaigns"), {
  ssr: false,
});
const Settings = dynamicImport(() => import("@/sections/Settings"), {
  ssr: false,
});
const ApiPanel = dynamicImport(() => import("@/sections/ApiPanel"), {
  ssr: false,
});
const ApiKeyDocs = dynamicImport(() => import("@/sections/ApiKeyDocs"), {
  ssr: false,
});
const DownloadExtension = dynamicImport(
  () => import("@/components/DownloadExtension"),
  {
    ssr: false,
  }
);

function AuthenticatedShell({ userData }: { userData?: any }) {
  return (
    <>
      <Navbar userData={userData} />
      <div className="min-h-screen bg-surface">
        <div className="max-w-7xl mx-auto py-6 px-4">
          <Routes>
            <Route
              path="/dashboard"
              element={<Dashboard userData={userData} />}
            />
            <Route path="/urls" element={<URLS />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/campaigns" element={<Campaigns />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/api" element={<ApiPanel />} />
            <Route path="/api-key-docs" element={<ApiKeyDocs />} />
            <Route
              path="/api/key-docs"
              element={<Navigate to="/api-key-docs" replace />}
            />
            <Route path="/download" element={<DownloadExtension />} />
            <Route path="/*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </div>
      <Footer />
    </>
  );
}

export default function RouterApp() {
  const { isAuthenticated, loading, userData } = useAuth();

  useLenis({
    duration: 1.2,
    easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
  });

  if (loading || isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="text-center space-y-4">
          <div className="relative inline-block">
            <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-b-4 border-primary"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-lg font-bold text-primary">URL</span>
            </div>
          </div>
          <div>
            <p className="text-on-surface text-2xl font-bold">URLTinier</p>
            <p className="text-on-surface-variant text-lg mt-2">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
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
        <Route path="/*" element={<AuthenticatedShell userData={userData} />} />
      ) : (
        <Route path="*" element={<Navigate to="/welcome" replace />} />
      )}
    </Routes>
  );
}
