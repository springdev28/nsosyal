import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // The prototype ships its own synthetic media under /public/demo, so no remote
  // image hosts are configured on purpose: the live demo must not depend on a CDN.
  images: {
    remotePatterns: [],
  },
  eslint: {
    dirs: ['src', 'tests'],
  },
};

export default nextConfig;
