import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [360, 480, 640, 828, 1080, 1440, 1920, 2560],
    imageSizes: [96, 160, 256, 384],
    localPatterns: [{ pathname: "/images/**" }],
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },
  poweredByHeader: false,
};

export default nextConfig;
