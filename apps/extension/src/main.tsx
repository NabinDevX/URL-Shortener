import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { AuthProvider } from "@repo/ui";
import { GoogleOAuthProvider } from "@react-oauth/google";
import axios from "axios";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL as string | undefined;
if (apiBaseUrl) {
  axios.defaults.baseURL = apiBaseUrl;
}

const googleClientIdRaw = import.meta.env.VITE_GOOGLE_EXTENSION_CLIENT_ID as
  | string
  | undefined;
const googleClientId =
  googleClientIdRaw && googleClientIdRaw.endsWith(".apps.googleusercontent.com")
    ? googleClientIdRaw
    : undefined;

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Root element not found");

createRoot(rootElement).render(
  <StrictMode>
    {googleClientId ? (
      <GoogleOAuthProvider clientId={googleClientId}>
        <AuthProvider initialLoadingTime={2000}>
          <App />
        </AuthProvider>
      </GoogleOAuthProvider>
    ) : (
      <AuthProvider initialLoadingTime={2000}>
        <App />
      </AuthProvider>
    )}
  </StrictMode>
);
