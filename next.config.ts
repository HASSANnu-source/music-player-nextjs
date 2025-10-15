import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  output: "export", // برای GitHub Pages ضروریه
  basePath: isProd ? "/music-player-nextjs" : "", // اسم ریپوی توی GitHub
  assetPrefix: isProd ? "/music-player-nextjs/" : "",
  images: {
    unoptimized: true, // چون GitHub Pages از Image Optimization پشتیبانی نمی‌کنه
  },
};

export default nextConfig;
