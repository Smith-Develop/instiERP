import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@insti/ui",
    "@insti/auth",
    "@insti/database",
    "@insti/types",
    "@insti/utils",
    "@insti/config",
  ],
};

export default nextConfig;
