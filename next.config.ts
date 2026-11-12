import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    viewTransition: true,
  },
  // The old site lived at /home; send those visitors to the new home page.
  async redirects() {
    return [
      { source: "/home", destination: "/", permanent: true },
      { source: "/transformation", destination: "/fitness", permanent: true },
    ];
  },
};

export default nextConfig;
