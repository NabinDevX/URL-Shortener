const stripTrailingSlash = (value) => value.replace(/\/+$/, "");
const normalizePrefix = (value) =>
  value.startsWith("/") ? value : `/${value}`;

const nodeEnv = process.env.NODE_ENV || "development";

const defaultProxyTarget =
  nodeEnv === "production" ? "http://localhost:8000" : "http://localhost:8000";

const apiPrefix = normalizePrefix(
  process.env.NEXT_PUBLIC_API_PREFIX || "/api/v1"
);
const proxyTarget = stripTrailingSlash(
  process.env.API_PROXY_TARGET ||
    process.env.NEXT_PUBLIC_API_URL ||
    defaultProxyTarget
);

const nextConfig = {
  reactStrictMode: true,
  rewrites: async () => {
    return {
      beforeFiles: [],
      afterFiles: [
        {
          source: `${apiPrefix}/:path*`,
          destination: `${proxyTarget}${apiPrefix}/:path*`,
        },
        {
          source: "/download/:path*",
          destination: `${proxyTarget}/download/:path*`,
        },
        {
          source: "/s/:shortId",
          destination: `${proxyTarget}/:shortId`,
        },
      ],
      fallback: [],
    };
  },
};

export default nextConfig;
