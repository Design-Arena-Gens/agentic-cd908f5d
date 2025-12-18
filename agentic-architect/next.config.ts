import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    externalDir: true,
    optimizePackageImports: ["lucide-react"],
  },
};

export default nextConfig;
