import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Disable Turbopack for Windows compatibility (symlink permission issues)
  experimental: {
    turbo: false,
  },
};

export default nextConfig;
