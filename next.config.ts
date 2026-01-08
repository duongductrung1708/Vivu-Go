import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Disable static page generation to prevent SSR issues with AuthProvider
  output: 'standalone',
};

export default nextConfig;
