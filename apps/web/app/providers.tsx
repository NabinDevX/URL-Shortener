"use client";

import { AuthProvider, ThemeProvider } from "@repo/ui";
import { GoogleOAuthProvider } from "@react-oauth/google";
import dynamic from "next/dynamic";

const BrowserRouterProvider = dynamic(() => import("./BrowserRouterProvider"), {
  ssr: false,
});

export default function Providers({ children }: { children: React.ReactNode }) {
  const googleClientIdRaw = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const googleClientId =
    googleClientIdRaw &&
    googleClientIdRaw !== "your_google_client_id_here" &&
    googleClientIdRaw.endsWith(".apps.googleusercontent.com")
      ? googleClientIdRaw
      : undefined;

  return (
    <BrowserRouterProvider>
      {googleClientId ? (
        <GoogleOAuthProvider clientId={googleClientId}>
          <ThemeProvider defaultTheme="light">
            <AuthProvider initialLoadingTime={2000}>{children}</AuthProvider>
          </ThemeProvider>
        </GoogleOAuthProvider>
      ) : (
        <ThemeProvider defaultTheme="light">
          <AuthProvider initialLoadingTime={2000}>{children}</AuthProvider>
        </ThemeProvider>
      )}
    </BrowserRouterProvider>
  );
}
