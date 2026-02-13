import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  outputFileTracingExcludes: {
    '*': [
      'node_modules/@swc/core-linux-x64-gnu',
      'node_modules/@swc/core-linux-x64-musl',
      'node_modules/@esbuild/linux-x64',
      'android',
      'android/**/*',
      'ios',
      'ios/**/*',
      'electron',
      'electron/**/*',
      'dist-electron',
      'dist-electron/**/*',
      'vet-scribe-avimark-connector',
      'vet-scribe-avimark-connector/**/*',
      'build',
      'build/**/*',
      'www',
      'www/**/*',
      'out',
      'out/**/*',
      '.netlify',
      '.netlify/**/*',
    ],
  },
  // outputFileTracingRoot: process.cwd(),
  images: {
    unoptimized: true,
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  serverExternalPackages: ['firebase-admin'],
  turbopack: {
    root: process.cwd(),
  },
} as any;

export default nextConfig;
