import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";
const projectRoot = process.cwd();

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
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
        ],
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  silent: true,
  widenClientFileUpload: true,
});
