import { defineConfig, mergeConfig, loadEnv } from "vite";
import tailwindcss from "@tailwindcss/vite";
import { crx } from "@crxjs/vite-plugin";
import manifest from "./manifest.json";
import path from "node:path";
import baseConfig from "../../vite.config";

export default defineConfig(({ mode }: { mode: string }) => {
  const env = loadEnv(mode, process.cwd(), "");

  const apiPrefix = env.VITE_API_PREFIX || "/api/v1";
  const apiBaseUrl =
    env.NODE_ENV === "production"
      ? env.VITE_API_BASE_URL
      : "http://localhost:8001";

  console.log(`🧩 Chrome Extension Vite Config [${mode}]:`, {
    apiPrefix,
    apiBaseUrl,
  });

  return mergeConfig(baseConfig, {
    root: __dirname,
    plugins: [tailwindcss(), crx({ manifest })],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      port: 5174,
      hmr: false,
      watch: {
        usePolling: true,
      },
      proxy: {
        [apiPrefix]: {
          target: apiBaseUrl,
          changeOrigin: true,
          secure: false,
        },
      },
    },
    build: {
      outDir: path.resolve(__dirname, "dist"),
    },
  });
});
