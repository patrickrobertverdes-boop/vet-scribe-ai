import path from 'path';

const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  outputFileTracingRoot: path.resolve(__dirname),
  outputFileTracingExcludes: {
    '/**/*': [
      '**/android/**',
      '**/ios/**',
      '**/electron/**',
      '**/dist-electron/**',
      '**/vet-scribe-avimark-connector/**',
      '**/build/**',
      '**/www/**',
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
