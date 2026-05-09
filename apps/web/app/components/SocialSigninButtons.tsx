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
    const globalCapacitor = (window as any).Capacitor;
    const platform =
      typeof globalCapacitor?.getPlatform === "function"
        ? globalCapacitor.getPlatform()
        : typeof Capacitor?.getPlatform === "function"
          ? Capacitor.getPlatform()
          : (Capacitor as any).platform || "web";

    return (
      platform !== "web" ||
      globalCapacitor?.isNativePlatform?.() === true ||
      window.location.protocol === "capacitor:"
    );
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
  const [nativeLoginDebug, setNativeLoginDebug] = useState<string | null>(null);

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
            if (response.error) {
              Toast.dismiss();
              if (
                response.error === "popup_closed_by_user" ||
                response.error === "access_denied" ||
                response.error === "user_cancelled"
              ) {
                try {
                  const { SocialLogin } =
                    await import("@capgo/capacitor-social-login");

                  const nativeResult = await SocialLogin.login({
                    provider: "google",
                    options: { responseType: "id_token" } as any,
                  } as any);

                  const nativePayload: any = nativeResult?.result ?? {};
                  const nativeId =
                    nativePayload.idToken ?? nativePayload.id_token ?? null;
                  if (nativeId) {
                    if (isSignup) {
                      await signupWithCapgoGoogle(nativeId);
                    } else {
                      await loginWithCapgoGoogle(nativeId);
                    }
                    Toast.dismiss();
                    Toast.success(
                      isSignup ? "Sign up successful!" : "Sign in successful!"
                    );
                    onSuccess?.();
                    resolve();
                    return;
                  }

                  const nativeCode =
                    nativePayload.serverAuthCode ??
                    nativePayload.authorizationCode ??
                    nativePayload.code ??
                    null;
                  if (nativeCode) {
                    if (isSignup) {
                      await signupWithGoogleCode(nativeCode);
                    } else {
                      await loginWithGoogleCode(nativeCode);
                    }
                    Toast.dismiss();
                    Toast.success(
                      isSignup ? "Sign up successful!" : "Sign in successful!"
                    );
                    onSuccess?.();
                    resolve();
                    return;
                  }
                } catch (err) {
                  void err;
                }

                await handleNativeGoogleLogin();
                resolve();
                return;
              }

              Toast.error("Google authentication failed");
              reject(
                new Error(response.error || "Google authentication error")
              );
              return;
            }

            if (!response.code) {
              Toast.dismiss();
              Toast.error("Google authentication failed");
              reject(new Error("Missing authorization code"));
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
        // Request an ID token (online flow) where possible. Some plugin/platform
        // combinations will return a server auth code instead — handle both.
        options: { responseType: "id_token" } as any,
      } as any);

      // eslint-disable-next-line no-console
      console.debug("[SocialLogin] native login result:", loginResult);

      try {
        const debugFlag =
          typeof window !== "undefined" &&
          (window.location.search.includes("debugNative=1") ||
            window.localStorage.getItem("showNativeLoginDebug") === "1");
        if (debugFlag) {
          setNativeLoginDebug(JSON.stringify(loginResult, null, 2));
        }
      } catch {
        // ignore
      }

      if (loginResult.provider !== "google") {
        throw new Error("Unexpected provider response");
      }

      const result: any = loginResult.result;

      const idToken = result.idToken ?? result.id_token ?? null;

      if (idToken) {
        if (isSignup) {
          await signupWithCapgoGoogle(idToken);
        } else {
          await loginWithCapgoGoogle(idToken);
        }
        Toast.dismiss();
        Toast.success(isSignup ? "Sign up successful!" : "Sign in successful!");
        onSuccess?.();
        return;
      }

      const serverCode =
        result.serverAuthCode ??
        result.authorizationCode ??
        result.code ??
        null;

      if (serverCode) {
        if (isSignup) {
          await signupWithGoogleCode(serverCode);
        } else {
          await loginWithGoogleCode(serverCode);
        }
        Toast.dismiss();
        Toast.success(isSignup ? "Sign up successful!" : "Sign in successful!");
        onSuccess?.();
        return;
      }

      await handleWebGoogleLogin();
      return;
    } catch (error) {
      const isCancellation = (() => {
        try {
          if (!error) return false;
          const anyErr = error as any;
          const code = anyErr?.code || anyErr?.error?.code || "";
          const msg = (
            anyErr?.message ||
            anyErr?.error?.message ||
            ""
          ).toString();

          if (code === "USER_CANCELLED" || /cancel/i.test(code)) return true;
          if (/cancel/i.test(msg)) return true;
          if (/reauth failed/i.test(msg)) return true;
          if (/GetCredentialCancellationException/i.test(msg)) return true;
          return false;
        } catch {
          return false;
        }
      })();

      if (isCancellation) {
        try {
          await handleWebGoogleLogin();
          return;
        } catch (webFallbackError) {
          const fallbackMessage =
            webFallbackError instanceof AxiosError
              ? webFallbackError.response?.data?.message ||
                webFallbackError.message
              : webFallbackError instanceof Error
                ? webFallbackError.message
                : "Google sign-in cancelled by user";
          Toast.error(fallbackMessage);
        }
        onError?.(new Error("Google sign-in cancelled by user"));
        return;
      }

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
    <>
      <button
        type="button"
        disabled={disabled || loading}
        onClick={handleClick}
        className={`w-full py-3 px-4 border border-gray-200 rounded-lg font-semibold transition-all hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed ${className}`}
      >
        {loading ? "Authenticating..." : "Continue with Google"}
      </button>
      {nativeLoginDebug && (
        <div
          style={{
            position: "fixed",
            right: 12,
            bottom: 12,
            width: 360,
            maxHeight: "50vh",
            overflow: "auto",
            background: "rgba(0,0,0,0.8)",
            color: "#fff",
            padding: 12,
            borderRadius: 8,
            zIndex: 9999,
            fontSize: 12,
          }}
        >
          <div
            style={{ display: "flex", justifyContent: "space-between", gap: 8 }}
          >
            <strong>Native login debug</strong>
            <button
              onClick={() => {
                try {
                  window.localStorage.setItem("showNativeLoginDebug", "0");
                } catch {}
                setNativeLoginDebug(null);
              }}
              style={{
                background: "transparent",
                color: "#fff",
                border: "none",
              }}
            >
              Close
            </button>
          </div>
          <pre style={{ whiteSpace: "pre-wrap", marginTop: 8 }}>
            {nativeLoginDebug}
          </pre>
        </div>
      )}
    </>
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
