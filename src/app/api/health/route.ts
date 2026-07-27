import { prisma } from "@/lib/prisma";
import { isWordPressConfigured } from "@/lib/wordpress-media";

const startedAt = Date.now();

export async function GET() {
  let dbStatus: "ok" | "error" = "ok";
  let dbLatencyMs: number | null = null;

  try {
    const dbStartedAt = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    dbLatencyMs = Date.now() - dbStartedAt;
  } catch {
    dbStatus = "error";
  }

  const checks = {
    ably: Boolean(process.env.ABLY_API_KEY),
    wordpress: isWordPressConfigured(),
    email: Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL),
    expoPush: true,
  };
  const requiredExternalServices = ["ably", "wordpress", "email"] as const;
  const missingExternalServices =
    process.env.NODE_ENV === "production"
      ? requiredExternalServices.filter((service) => !checks[service])
      : [];
  const status =
    dbStatus === "ok" && missingExternalServices.length === 0 ? "ok" : "degraded";
  const httpStatus = status === "ok" ? 200 : 503;

  return Response.json(
    {
      status,
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor((Date.now() - startedAt) / 1000),
      version: process.env.VERCEL_GIT_COMMIT_SHA ?? process.env.APP_VERSION ?? "development",
      environment: process.env.NODE_ENV ?? "development",
      db: dbStatus,
      dbLatencyMs,
      integrations: checks,
      missingIntegrations: missingExternalServices,
    },
    { status: httpStatus },
  );
}
