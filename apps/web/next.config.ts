import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
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
