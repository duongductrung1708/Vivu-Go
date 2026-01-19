import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Disable static page generation to prevent SSR issues with AuthProvider
  output: "standalone",
  // Image optimization domains (Supabase storage, etc.)
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "sibykjrokdeepxrmtumn.supabase.co",
      },
    ],
  },
  // Disable static optimization for all routes
  experimental: {
    optimizePackageImports: ["lucide-react", "@radix-ui/react-icons"],
  },
};

export default nextConfig;
