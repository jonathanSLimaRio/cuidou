import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, UserRole, UserStatus, VerificationStatus } from "@prisma/client";
import { hash } from "bcryptjs";
import { Pool } from "pg";

const databaseUrl = process.env.DATABASE_URL;
const runId = process.env.E2E_RUN_ID?.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 32);

if (!databaseUrl) throw new Error("DATABASE_URL is required for E2E fixtures.");
if (!runId) throw new Error("E2E_RUN_ID is required so fixtures remain isolated.");

const pool = new Pool({ connectionString: databaseUrl });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });
const password = process.env.E2E_PASSWORD ?? "Cuidou-E2E-2026!";
const emails = {
  admin: `admin+${runId}@e2e.cuidou.local`,
  family: `family+${runId}@e2e.cuidou.local`,
  professional: `professional+${runId}@e2e.cuidou.local`,
};

async function cleanup() {
  await prisma.user.deleteMany({ where: { email: { in: Object.values(emails) } } });
}

async function upsertUser(email: string, name: string, role: UserRole) {
  const passwordHash = await hash(password, 12);
  const acceptedAt = new Date();
  const user = await prisma.user.upsert({
    where: { email },
    update: {
      name,
      role,
      status: UserStatus.ACTIVE,
      passwordHash,
      acceptedTermsAt: acceptedAt,
      acceptedPrivacyAt: acceptedAt,
      acceptedTermsVersion: "2026-08-06",
      acceptedPrivacyVersion: "2026-08-06",
    },
    create: {
      email,
      name,
      role,
      status: UserStatus.ACTIVE,
      passwordHash,
      acceptedTermsAt: acceptedAt,
      acceptedPrivacyAt: acceptedAt,
      acceptedTermsVersion: "2026-08-06",
      acceptedPrivacyVersion: "2026-08-06",
    },
  });

  await prisma.legalConsent.createMany({
    skipDuplicates: true,
    data: (["TERMS", "PRIVACY"] as const).map((document) => ({
      userId: user.id,
      document,
      version: "2026-08-06",
      source: "WEB" as const,
    })),
  });
  return user;
}

async function seed() {
  const admin = await upsertUser(emails.admin, `Admin E2E ${runId}`, UserRole.ADMIN);
  const family = await upsertUser(emails.family, `Família E2E ${runId}`, UserRole.FAMILY);
  const professional = await upsertUser(
    emails.professional,
    `Profissional E2E ${runId}`,
    UserRole.PROFESSIONAL,
  );
  await prisma.familyProfile.upsert({
    where: { userId: family.id },
    update: {},
    create: { userId: family.id, contactName: family.name, state: "SP", city: "Campinas" },
  });
  await prisma.professionalProfile.upsert({
    where: { userId: professional.id },
    update: { verificationStatus: VerificationStatus.VERIFIED },
    create: {
      userId: professional.id,
      serviceTypes: ["BABYSITTER"],
      state: "SP",
      city: "Campinas",
      verificationStatus: VerificationStatus.VERIFIED,
    },
  });
  process.stdout.write(JSON.stringify({ runId, emails, password, adminId: admin.id }));
}

try {
  if (process.env.E2E_FIXTURE_ACTION === "cleanup") await cleanup();
  else await seed();
} finally {
  await prisma.$disconnect();
  await pool.end();
}
