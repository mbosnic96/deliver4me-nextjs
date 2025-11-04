import type { NextConfig } from "next";

const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  sw: '/sw.js', 
});


const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '100mb',
    },
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  logging: {
    fetches: {
      fullUrl: true,
      hmrRefreshes: true,
    },
    incomingRequests: {
      ignore: [/^\/_next\//], 
    },
  },
};

export default nextConfig;
