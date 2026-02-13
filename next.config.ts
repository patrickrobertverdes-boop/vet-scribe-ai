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
    // Use indexing to avoid property access errors if types are missing
    removeConsole: process['env']['NODE_ENV'] === 'production',
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  serverExternalPackages: ['firebase-admin'],
  turbopack: {
    // Ensure turbopack is also pinned to this project root
    root: path.join(process.cwd()),
  },
};

export default nextConfig;
