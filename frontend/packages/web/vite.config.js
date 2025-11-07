import { defineConfig, mergeConfig, loadEnv } from "vite";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import baseConfig from "../../vite.config.js";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  const apiPrefix = env.VITE_API_PREFIX || "/api";
  const apiBaseUrl =
    env.NODE_ENV === "production"
      ? env.VITE_API_BASE_URL
      : "http://localhost:8001";

  console.log(`🔧 Web Vite Config [${mode}]:`, {
    apiPrefix,
    apiBaseUrl,
  });

  // Merge root (shared) and web-specific settings
  return mergeConfig(baseConfig, {
    root: __dirname,
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
        "@myorg/common": path.resolve(__dirname, "../common/src"),
      },
    },
    server: {
      host: true,
      port: 5173,
      watch: {
        usePolling: true,
      },
      proxy: {
        [apiPrefix]: {
          target: apiBaseUrl,
          changeOrigin: true,
          secure: false,
          configure: (proxy, options) => {
            proxy.on("proxyReq", (proxyReq, req) => {
              console.log(
                `🔄 Proxy: ${req.method} ${req.url} → ${options.target}${req.url}`
              );
            });
          },
        },
      },
    },
    preview: {
      allowedHosts: ["urlshortner.app", "localhost"],
      host: true,
      port: 5173,
      watch: {
        usePolling: true,
      },
    },
    build: {
      outDir: path.resolve(__dirname, "dist"),
    },
  });
});
