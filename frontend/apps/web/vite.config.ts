import { defineConfig, mergeConfig, loadEnv } from "vite";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";
import baseConfig from "../../vite.config";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  const apiPrefix = env.VITE_API_PREFIX || "/api/v1";
  const apiBaseUrl =
    env.NODE_ENV === "production"
      ? env.VITE_API_BASE_URL
      : "http://localhost:8001";

  console.log(`🔧 Web Vite Config [${mode}]:`, {
    apiPrefix,
    apiBaseUrl,
  });

  return mergeConfig(baseConfig, {
    root: __dirname,
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
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
          configure: (proxy: any) => {
            proxy.on("proxyReq", (_proxyReq: any, req: any) => {
              console.log(
                `🔄 Proxy: ${req.method} ${req.url} → ${apiBaseUrl}${req.url}`
              );
            });
            proxy.on("error", (err: any, req: any) => {
              console.error(
                `❌ Proxy Error: ${req.method} ${req.url}`,
                err.message
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
    },
    build: {
      outDir: path.resolve(__dirname, "dist"),
    },
  });
});
