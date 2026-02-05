import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: 'standalone', 
  compiler: {
    removeConsole: false,
  },
  turbopack: {
    root: 'C:\\Users\\verdes\\.gemini\\antigravity\\scratch\\vet-scribe-ai',
  }
} as any;

export default nextConfig;
