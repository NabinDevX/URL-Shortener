import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  // ✅ Set defaults if env vars not found
  const apiPrefix = env.VITE_API_PREFIX;
  const apiBaseUrl = env.VITE_API_BASE_URL;

  console.log(`🔧 Vite Config [${mode}]:`, {
    apiPrefix,
    apiBaseUrl,
  });

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    preview: {
      allowedHosts: ['urlshortner.app', 'localhost'],
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
            proxy.on('proxyReq', (proxyReq, req, res) => {
              console.log(`🔄 Proxy: ${req.method} ${req.url} → ${options.target}${req.url}`);
            });
          },
        },
      },
    },
  };
});
