import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Remove output: "export" to enable SSR for real-time data fetching
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
