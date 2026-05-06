"use client";

import { AuthProvider, ThemeProvider, Toaster } from "@repo/ui";
import axios from "axios";
import dynamic from "next/dynamic";

const CapacitorBridge = dynamic(() => import("./components/CapacitorBridge"), {
  ssr: false,
});

export default function Providers({ children }: { children: React.ReactNode }) {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL!;
  axios.defaults.baseURL = base;
  axios.defaults.withCredentials = true;

  return (
    <>
      <CapacitorBridge />
      <ThemeProvider defaultTheme="light">
        <AuthProvider initialLoadingTime={0}>
          {children}
          <Toaster />
        </AuthProvider>
      </ThemeProvider>
    </>
  );
}
