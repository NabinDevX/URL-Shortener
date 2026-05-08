const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

console.log("NEXT_PUBLIC_API_BASE_URL =", API_BASE_URL);

const nextConfig = {
  output: "export",
  trailingSlash: true,
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  env: {
    NEXT_PUBLIC_API_BASE_URL: API_BASE_URL,
    NEXT_PUBLIC_DOMAIN: process.env.NEXT_PUBLIC_DOMAIN,
  },
};

export default nextConfig;
