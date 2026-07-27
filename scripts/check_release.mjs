const requiredInProduction = [
  "AUTH_SECRET",
  "DATABASE_URL",
  "NEXT_PUBLIC_APP_URL",
  "ABLY_API_KEY",
  "WORDPRESS_URL",
  "WP_USER",
  "WP_APP_PASS",
  "NEXT_PUBLIC_WORDPRESS_API_HOSTNAME",
  "RESEND_API_KEY",
  "RESEND_FROM_EMAIL",
  "UPSTASH_REDIS_REST_URL",
  "UPSTASH_REDIS_REST_TOKEN",
];

const healthUrl = process.env.HEALTHCHECK_URL ?? `http://127.0.0.1:${process.env.PLAYWRIGHT_PORT ?? "3000"}/api/health`;
const production = process.env.NODE_ENV === "production" || process.env.RELEASE_ENV === "production";
const missing = production ? requiredInProduction.filter((key) => !process.env[key]) : [];

let health = null;
let healthError = null;
try {
  const response = await fetch(healthUrl, { signal: AbortSignal.timeout(10_000) });
  health = { httpStatus: response.status, body: await response.json() };
} catch (error) {
  healthError = error instanceof Error ? error.message : String(error);
}

const healthy = health?.body?.status === "ok" && health?.body?.db === "ok";
const result = {
  timestamp: new Date().toISOString(),
  environment: production ? "production" : "non-production",
  healthUrl,
  health,
  healthError,
  missingRequiredEnvironment: missing,
  ok: missing.length === 0 && healthy,
};

console.log(JSON.stringify(result, null, 2));
if (!result.ok) process.exitCode = 1;
