import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "3002",
        pathname: "/uploads/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "4000",
        pathname: "/uploads/**",
      },
    ],
    dangerouslyAllowLocalIP: true,
  },
  async rewrites() {
    // In Docker, the backend service is reachable at http://api:3002 or http://jeweltrack_api:3002.
    // In local development, it is http://localhost:3002.
    const backendTarget =
      process.env.INTERNAL_API_URL ||
      (process.env.NODE_ENV === 'production' ? 'http://api:3002' : 'http://localhost:3002');

    return [
      {
        source: '/backend-api/:path*',
        destination: `${backendTarget}/:path*`,
      },
    ];
  },
};

export default nextConfig;