import { spawnSync } from "node:child_process";

const required = ["DATABASE_URL", "STAGING_BASE_URL", "STAGING_SNAPSHOT_ID"];
const missing = required.filter((name) => !process.env[name]);
if (missing.length) throw new Error(`Missing staging configuration: ${missing.join(", ")}`);
if (process.env.RELEASE_ENV !== "staging") throw new Error("RELEASE_ENV must be staging.");
if (process.env.STAGING_CONFIRMATION !== "cuidou-staging") {
  throw new Error("Set STAGING_CONFIRMATION=cuidou-staging after confirming the target.");
}

const databaseUrl = new URL(process.env.DATABASE_URL);
const baseUrl = new URL(process.env.STAGING_BASE_URL);
if (databaseUrl.searchParams.get("sslmode") !== "verify-full") {
  throw new Error("Staging DATABASE_URL must use sslmode=verify-full.");
}
if (baseUrl.protocol !== "https:" || /localhost|127\.0\.0\.1/i.test(baseUrl.hostname)) {
  throw new Error("STAGING_BASE_URL must be a non-local HTTPS URL.");
}
if (/prod|production/i.test(databaseUrl.hostname) || /prod|production/i.test(baseUrl.hostname)) {
  throw new Error("Target looks like production; staging release was blocked.");
}

const migration = spawnSync(process.platform === "win32" ? "npx.cmd" : "npx", ["prisma", "migrate", "deploy"], {
  stdio: "inherit",
  env: process.env,
});
if (migration.status !== 0) throw new Error("Migration failed; readiness was not attempted.");

const response = await fetch(new URL("/api/health/ready", baseUrl), {
  signal: AbortSignal.timeout(15_000),
  headers: { "user-agent": "cuidou-staging-release-check/1.0" },
});
const health = await response.json().catch(() => null);
if (!response.ok || health?.status !== "ok") {
  throw new Error(`Staging readiness failed (${response.status}): ${JSON.stringify(health)}`);
}
process.stdout.write(`Staging ready after snapshot ${process.env.STAGING_SNAPSHOT_ID}.\n`);
