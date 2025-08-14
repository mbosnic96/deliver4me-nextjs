import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* other config options here */
  experimental: {
    serverActions: {
      bodySizeLimit: '100mb',
    },
  },
};

export default nextConfig;
