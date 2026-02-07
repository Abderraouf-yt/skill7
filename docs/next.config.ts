import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/skill7",
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
};

export default nextConfig;
