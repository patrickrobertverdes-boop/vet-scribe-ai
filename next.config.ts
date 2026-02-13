const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  outputFileTracingExcludes: {
    '/**/*': [
      'node_modules/@swc/core-linux-x64-gnu',
      'node_modules/@swc/core-linux-x64-musl',
      'node_modules/@esbuild/linux-x64',
      '**/android/**/*',
      '**/ios/**/*',
      '**/electron/**/*',
      '**/dist-electron/**/*',
      '**/vet-scribe-avimark-connector/**/*',
      '**/build/**/*',
      '**/www/**/*',
      '**/out/**/*',
      '**/.netlify/**/*',
    ],
  },
  images: {
    unoptimized: true,
  },
  compiler: {
    removeConsole: process.env['NODE_ENV'] === 'production',
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  serverExternalPackages: ['firebase-admin'],
  // Top-level turbopack for Next.js 15/16 dev/build warnings
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
