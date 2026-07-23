import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Vercel's serverless functions hard-cap request bodies at 4.5mb
      // regardless of this setting, so there's no benefit going higher.
      bodySizeLimit: "4.5mb",
    },
  },
};

export default nextConfig;
