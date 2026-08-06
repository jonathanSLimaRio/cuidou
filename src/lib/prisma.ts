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
    throw new Error(
      "DATABASE_URL environment variable is not set. " +
        "Add it to your .env.local file. Example:\n" +
        "DATABASE_URL=postgresql://user:password@localhost:5432/cuidou_dev",
    );
  }

  if (process.env.RELEASE_ENV === "production") {
    const databaseUrl = new URL(connectionString);
    if (databaseUrl.searchParams.get("sslmode") !== "verify-full") {
      throw new Error("Production DATABASE_URL must explicitly use sslmode=verify-full.");
    }
  }

  const pool =
    globalForPrisma.pgPool ??
    new Pool({
      connectionString,
      connectionTimeoutMillis: 5_000,
      idleTimeoutMillis: 30_000,
      max: 10,
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
