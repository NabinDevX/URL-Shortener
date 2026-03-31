import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { crx } from "@crxjs/vite-plugin";
import manifest from "./manifest.json";
import path from "node:path";

export default defineConfig(({ mode }: { mode: string }) => {
  const env = loadEnv(mode, process.cwd(), "");

  const apiPrefix = env.VITE_API_PREFIX || "/api/v1";
  const apiBaseUrl =
    env.NODE_ENV === "production"
      ? env.VITE_API_BASE_URL
      : "http://localhost:8000";

  console.log(`🧩 Chrome Extension Vite Config [${mode}]:`, {
    apiPrefix,
    apiBaseUrl,
  });

  return defineConfig({
    root: __dirname,
    plugins: [react(), tailwindcss(), crx({ manifest })],
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
        "/api/v1": {
          target: apiBaseUrl,
          changeOrigin: true,
          rewrite: (path) => path,
          ws: true,
        },
      },
    },
    build: {
      sourcemap: true,
      minify: "esbuild",
    },
  });
});
