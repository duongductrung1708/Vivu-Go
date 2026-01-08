import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Disable static page generation to prevent SSR issues with AuthProvider
  output: 'standalone',
  // Skip static optimization for routes that use AuthProvider
  experimental: {
    missingSuspenseWithCSRBailout: false,
  },
  // Disable static page optimization
  generateBuildId: async () => {
    // Force new build ID to prevent caching
    return 'build-' + Date.now();
  },
};

export default nextConfig;
