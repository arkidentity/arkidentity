import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ['shared'],
  async redirects() {
    return [
      // Printed in the Daily DNA Journal (3 refill QR codes). Keep this path forever; change only the destination.
      { source: '/journal', destination: 'https://www.amazon.com/dp/B0HR72GG16', permanent: false },
    ];
  },
};

export default nextConfig;
