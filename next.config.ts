import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: 'standalone', // Re-enabled for deployment compatibility
  compiler: {
    // Keep logs for debugging issues with the user
    removeConsole: false,
  },
};

export default nextConfig;
