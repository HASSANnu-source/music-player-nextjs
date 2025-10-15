import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  output: "export",
  basePath: isProd ? "/music-player-nextjs" : "",
  assetPrefix: isProd ? "/music-player-nextjs/" : "",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
