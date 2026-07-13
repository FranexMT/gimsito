import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "raw.githubusercontent.com",
        pathname: "/hasaneyldrm/exercises-dataset/**",
      },
    ],
  },
};

export default nextConfig;
