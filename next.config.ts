import path from 'path';

const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  // Explicitly lock tracing to this project directory only.
  // This prevents Next.js from scanning C:\Users\verdes\ and finding duplicate android folders.
  outputFileTracingRoot: path.join(process.cwd()),
  outputFileTracingExcludes: {
    '/**/*': [
      '**/android/**/*',
      '**/ios/**/*',
      '**/electron/**/*',
      '**/dist-electron/**/*',
      '**/vet-scribe-avimark-connector/**/*',
      '**/build/**/*',
      '**/www/**/*',
      '**/out/**/*',
    ],
  },
  images: {
    unoptimized: true,
  },
  compiler: {
    removeConsole: (process as any).env?.NODE_ENV === 'production',
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  serverExternalPackages: ['firebase-admin'],
  // Root detection fix for Next.js 16 / Turbopack
  experimental: {
    turbo: {
      root: path.join(process.cwd()),
    },
  },
};

export default nextConfig;
