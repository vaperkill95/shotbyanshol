import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    // Cloudflare R2 public bucket hostname gets added here in Phase 3
    remotePatterns: [],
  },
};

export default nextConfig;
