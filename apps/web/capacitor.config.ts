import type { CapacitorConfig } from "@capacitor/cli";

const serverUrl = process.env.CAPACITOR_SERVER_URL?.trim();

const config: CapacitorConfig = {
  appId: "com.nabindevx.urltinier",
  appName: "URL Tinier",
  webDir: "out",
  plugins: {
    SystemBars: {
      insetsHandling: "css",
      style: "DEFAULT",
      hidden: false,
      animation: "FADE",
    },
  },
  server: serverUrl
    ? {
        url: serverUrl,
        cleartext:
          serverUrl.startsWith("http://") && !serverUrl.startsWith("https://"),
        allowNavigation: [
          "urltinier.app",
          "*.urltinier.app",
          "urlshortner.app",
          "*.urlshortner.app",
        ],
      }
    : undefined,
};

export default config;
