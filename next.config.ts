import type { NextConfig } from "next";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = dirname(fileURLToPath(import.meta.url));
const wordpressHostname =
  process.env.NEXT_PUBLIC_WORDPRESS_API_HOSTNAME ||
  "paulojuniorrosa1770257599139.0452147.meusitehostgator.com.br";

const nextConfig: NextConfig = {
  reactCompiler: true,
  turbopack: {
    root: projectRoot,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: wordpressHostname,
      },
    ],
  },
};

export default nextConfig;
