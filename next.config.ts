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

const connectSrc = [
  "'self'",
  "https://*.ably.io",
  "https://*.ably-realtime.com",
  "wss://*.ably.io",
  "wss://*.ably-realtime.com",
];

const imgSrc = ["'self'", "data:", "blob:"];
if (wordpressHostname) {
  imgSrc.push(`https://${wordpressHostname}`);
}

const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  `img-src ${imgSrc.join(" ")}`,
  "font-src 'self' data:",
  `connect-src ${connectSrc.join(" ")}`,
  "form-action 'self'",
  "upgrade-insecure-requests",
].join("; ");

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
            key: "Content-Security-Policy",
            value: contentSecurityPolicy,
          },
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

export default nextConfig;
