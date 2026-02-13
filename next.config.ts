import path from 'path';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  // Stop Next.js from scanning parent directories or native folders
  outputFileTracingRoot: path.resolve(__dirname),
  outputFileTracingExcludes: {
    '*': [
      'node_modules/@capacitor/**',
      'node_modules/@capacitor-community/**',
      'node_modules/@capacitor-firebase/**',
      'android/**',
      'ios/**',
      'electron/**',
      'dist-electron/**',
      'vet-scribe-avimark-connector/**',
      'build/**',
      'www/**',
      '.next/cache/**',
    ],
  },
  images: {
    unoptimized: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  serverExternalPackages: ['firebase-admin'],
};

export default nextConfig;
