"use client";

import { useEffect } from "react";

export default function CapacitorBridge() {
  useEffect(() => {
    void (async () => {
      try {
        const { Capacitor, SystemBarType, SystemBars, SystemBarsStyle } =
          await import("@capacitor/core");

        const platform = Capacitor.getPlatform();

        if (platform !== "web") {
          const googleWebClientId =
            process.env.NEXT_PUBLIC_GOOGLE_WEB_CLIENT_ID;
          const hasValidGoogleId =
            googleWebClientId &&
            googleWebClientId !== "your_google_client_id_here" &&
            googleWebClientId.endsWith(".apps.googleusercontent.com");

          if (hasValidGoogleId) {
            const { SocialLogin } =
              await import("@capgo/capacitor-social-login");

            const googleAndroidClientId =
              process.env.NEXT_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;

            const initGoogle: Record<string, unknown> = {
              webClientId: googleWebClientId,
            };

            if (
              googleAndroidClientId &&
              googleAndroidClientId.endsWith(".apps.googleusercontent.com")
            ) {
              (initGoogle as any).androidClientId = googleAndroidClientId;
            }

            (initGoogle as any).mode = "online";

            const initConfig: Parameters<typeof SocialLogin.initialize>[0] = {
              google: initGoogle,
            };

            await SocialLogin.initialize(initConfig).catch((err: unknown) =>
              console.warn("Social signin initialization skipped:", err)
            );
          }

          document.documentElement.classList.add("capacitor-native");

          void SystemBars.setStyle({
            style: SystemBarsStyle.Default,
            bar: SystemBarType.StatusBar,
          });

          void SystemBars.show({ bar: SystemBarType.StatusBar });
        }
      } catch (err) {
        console.warn("CapacitorBridge init skipped:", err);
      }
    })();
  }, []);

  return null;
}
