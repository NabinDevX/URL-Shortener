import { defineConfig, mergeConfig, loadEnv } from "vite";
import tailwindcss from "@tailwindcss/vite";
import { crx } from "@crxjs/vite-plugin";
import manifest from "./manifest.json";
import path from "path";
import baseConfig from "../../vite.config.js"; // 👈 Import shared root config

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  // Define environment-based output or base URL if needed
  const isProd = env.NODE_ENV === "production";

  console.log(`🧩 Chrome Extension Vite Config [${mode}]`);

  return mergeConfig(baseConfig, {
    root: __dirname,
    plugins: [tailwindcss(), crx({ manifest })],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"), // extension local src alias
        "@myorg/common": path.resolve(__dirname, "../common/src"), // shared utilities/components
      },
    },
    server: {
      port: 5174, // Different port than web app
      hmr: false, // HMR doesn’t work inside Chrome extensions
      watch: {
        usePolling: true,
      },
    },
  });
});
