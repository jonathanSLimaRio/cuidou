import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  pgPool?: Pool;
};

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    return new PrismaClient();
  }

  const pool =
    globalForPrisma.pgPool ??
    new Pool({
      connectionString,
      // Connection acquisition timeout — fail fast if pool is exhausted
      connectionTimeoutMillis: 5_000,
      // Max idle time before closing a connection
      idleTimeoutMillis: 30_000,
      // Cap pool size to avoid overwhelming the DB
      max: 10,
      // Statement timeout enforced at the pg driver level (10s)
      options: "--statement_timeout=10000",
    });

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.pgPool = pool;
  }

  const adapter = new PrismaPg(pool);

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
