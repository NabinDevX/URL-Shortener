"use client";

import { useState, useCallback } from "react";
import { useAuth, Toast } from "@repo/ui";
import { AxiosError } from "axios";

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initCodeClient: (config: {
            client_id: string;
            scope: string;
            ux_mode: "popup" | "redirect";
            callback: (response: { code?: string; error?: string }) => void;
          }) => {
            requestCode: () => void;
          };
        };
      };
    };
  }
}

export interface SocialLoginButtonProps {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  isSignup?: boolean;
  disabled?: boolean;
  className?: string;
}

function loadGsiScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.oauth2) {
      resolve();
      return;
    }

    const existing = document.querySelector(
      'script[src="https://accounts.google.com/gsi/client"]'
    );
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () =>
        reject(new Error("Failed to load Google Identity Services"))
      );
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () =>
      reject(new Error("Failed to load Google Identity Services"));
    document.head.appendChild(script);
  });
}

async function checkIsNative(): Promise<boolean> {
  try {
    const { Capacitor } = await import("@capacitor/core");
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

export const GoogleSignInButton: React.FC<SocialLoginButtonProps> = ({
  onSuccess,
  onError,
  isSignup = false,
  disabled = false,
  className = "",
}) => {
  const {
    loginWithGoogleCode,
    signupWithGoogleCode,
    loginWithCapgoGoogle,
    signupWithCapgoGoogle,
  } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleWebGoogleLogin = useCallback(async () => {
    setLoading(true);
    try {
      Toast.loading("Authenticating with Google...");

      await loadGsiScript();

      const clientId = process.env.NEXT_PUBLIC_GOOGLE_WEB_CLIENT_ID;
      if (!clientId) {
        throw new Error("Google Client ID not configured");
      }

      await new Promise<void>((resolve, reject) => {
        const client = window.google!.accounts.oauth2.initCodeClient({
          client_id: clientId,
          scope: "email profile openid",
          ux_mode: "popup",
          callback: async (response) => {
            if (response.error || !response.code) {
              Toast.dismiss();
              Toast.error("Google authentication failed");
              reject(new Error(response.error || "Missing authorization code"));
              return;
            }

            try {
              if (isSignup) {
                await signupWithGoogleCode(response.code);
              } else {
                await loginWithGoogleCode(response.code);
              }

              Toast.dismiss();
              Toast.success(
                isSignup ? "Sign up successful!" : "Sign in successful!"
              );
              onSuccess?.();
              resolve();
            } catch (err) {
              const message =
                err instanceof AxiosError
                  ? err.response?.data?.message || err.message
                  : "Authentication failed";
              Toast.dismiss();
              Toast.error(message);
              onError?.(err as Error);
              reject(err);
            }
          },
        });

        client.requestCode();
      });
    } catch (error) {
      Toast.dismiss();
      if (
        error instanceof Error &&
        !error.message.includes("Authentication failed")
      ) {
        const message =
          error instanceof Error
            ? error.message
            : "Google authentication failed";
        Toast.error(message);
        onError?.(error as Error);
      }
    } finally {
      setLoading(false);
    }
  }, [isSignup, loginWithGoogleCode, signupWithGoogleCode, onSuccess, onError]);

  const handleNativeGoogleLogin = useCallback(async () => {
    setLoading(true);
    try {
      Toast.loading("Authenticating with Google...");

      const { SocialLogin } = await import("@capgo/capacitor-social-login");

      const loginResult = await SocialLogin.login({
        provider: "google",
        options: {},
      });

      if (loginResult.provider !== "google") {
        throw new Error("Unexpected provider response");
      }

      const result = loginResult.result;

      if ("responseType" in result && result.responseType === "offline") {
        throw new Error("Google offline mode is not supported.");
      }

      const onlineResult = result as { idToken: string | null };
      const idToken = onlineResult.idToken;
      if (!idToken) {
        throw new Error("Google authentication failed. Missing token.");
      }

      if (isSignup) {
        await signupWithCapgoGoogle(idToken);
      } else {
        await loginWithCapgoGoogle(idToken);
      }

      Toast.dismiss();
      Toast.success(isSignup ? "Sign up successful!" : "Sign in successful!");
      onSuccess?.();
    } catch (error) {
      Toast.dismiss();
      const message =
        error instanceof AxiosError
          ? error.response?.data?.message || error.message
          : error instanceof Error
            ? error.message
            : "Google authentication failed";
      Toast.error(message);
      onError?.(error as Error);
    } finally {
      setLoading(false);
    }
  }, [
    isSignup,
    loginWithCapgoGoogle,
    signupWithCapgoGoogle,
    onSuccess,
    onError,
  ]);

  const handleClick = async () => {
    const isNative = await checkIsNative();
    if (isNative) {
      await handleNativeGoogleLogin();
    } else {
      await handleWebGoogleLogin();
    }
  };

  return (
    <button
      type="button"
      disabled={disabled || loading}
      onClick={handleClick}
      className={`w-full py-3 px-4 border border-gray-200 rounded-lg font-semibold transition-all hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed ${className}`}
    >
      {loading ? "Authenticating..." : "Continue with Google"}
    </button>
  );
};

export const SocialSigninButtons: React.FC<SocialLoginButtonProps> = ({
  onSuccess,
  onError,
  isSignup = false,
  disabled = false,
  className = "",
}) => {
  return (
    <div className={`space-y-3 ${className}`}>
      <GoogleSignInButton
        onSuccess={onSuccess}
        onError={onError}
        isSignup={isSignup}
        disabled={disabled}
      />
    </div>
  );
};

export default SocialSigninButtons;
