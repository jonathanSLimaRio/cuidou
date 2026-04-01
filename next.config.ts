import type { NextConfig } from "next";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = dirname(fileURLToPath(import.meta.url));

// Require explicit WordPress hostname in all environments
const wordpressHostname = process.env.NEXT_PUBLIC_WORDPRESS_API_HOSTNAME;

if (!wordpressHostname && process.env.NODE_ENV === "production") {
  throw new Error(
    "NEXT_PUBLIC_WORDPRESS_API_HOSTNAME environment variable is required in production.",
  );
}

const remotePatterns = wordpressHostname
  ? [{ protocol: "https" as const, hostname: wordpressHostname }]
  : [];

const nextConfig: NextConfig = {
  reactCompiler: true,
  turbopack: {
    root: projectRoot,
  },
  images: {
    remotePatterns,
  },
};

export default nextConfig;
