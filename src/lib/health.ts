import { prisma } from "@/lib/prisma";
import { isWordPressConfigured } from "@/lib/wordpress-media";

const startedAt = Date.now();

export async function getReadiness() {
  let db: "ok" | "error" = "ok";
  let dbLatencyMs: number | null = null;
  try {
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    dbLatencyMs = Date.now() - start;
  } catch {
    db = "error";
  }

  const integrations = {
    ably: Boolean(process.env.ABLY_API_KEY),
    wordpress: isWordPressConfigured(),
    email: Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL),
    redis: Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN),
    expoPush: true,
  };
  const required = process.env.NODE_ENV === "production"
    ? (["ably", "wordpress", "email", "redis"] as const)
    : ([] as const);
  const missingIntegrations = required.filter((name) => !integrations[name]);
  const status = db === "ok" && missingIntegrations.length === 0 ? "ok" : "degraded";

  return {
    status,
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor((Date.now() - startedAt) / 1000),
    version: process.env.VERCEL_GIT_COMMIT_SHA ?? process.env.APP_VERSION ?? "development",
    environment: process.env.NODE_ENV ?? "development",
    db,
    dbLatencyMs,
    integrations,
    missingIntegrations,
  } as const;
}

export function getLiveness() {
  return {
    status: "ok",
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor((Date.now() - startedAt) / 1000),
  } as const;
}
