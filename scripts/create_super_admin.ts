/**
 * Create or promote the super admin account.
 *
 * Idempotent bootstrap:
 *   - If no ADMIN exists, creates one using SUPER_ADMIN_EMAIL / SUPER_ADMIN_PASSWORD.
 *   - If the user already exists with that email, promotes to ADMIN and
 *     (optionally) resets the password when --reset-password is passed.
 *   - Exits 0 silently if an ADMIN already exists and nothing needs to change.
 *
 * Environment:
 *   SUPER_ADMIN_EMAIL    (required)
 *   SUPER_ADMIN_PASSWORD (required; min 12 chars recommended)
 *   SUPER_ADMIN_NAME     (optional; defaults to "Super Admin")
 *
 * Usage:
 *   yarn super-admin
 *   yarn super-admin --reset-password
 *
 * Production safety:
 *   - No-ops when an ADMIN already exists, unless explicitly promoting a new
 *     email. Passwords are only overwritten with --reset-password.
 *   - This is a CLI bootstrap run with DB credentials; the audit trail lives
 *     in the deployment/DB logs rather than the AuditLog table (which
 *     requires an `adminId` and an action enum value).
 */
import "../src/lib/load-env";
import { PrismaClient, UserRole, UserStatus } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SUPER_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.SUPER_ADMIN_PASSWORD;
  const name = process.env.SUPER_ADMIN_NAME?.trim() || "Super Admin";
  const resetPassword = process.argv.includes("--reset-password");

  if (!email || !password) {
    console.error(
      "[super-admin] SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD must be set in your env.",
    );
    process.exit(1);
  }

  if (password.length < 12) {
    console.warn(
      "[super-admin] Warning: password is shorter than 12 characters. Consider a stronger one.",
    );
  }

  const existingAdminCount = await prisma.user.count({
    where: { role: UserRole.ADMIN },
  });

  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true, role: true, status: true },
  });

  // Case 1: there is already an admin AND this email is not being bootstrapped
  // as one → no-op unless --reset-password is explicitly requested.
  if (
    existingAdminCount > 0 &&
    existingUser?.role === UserRole.ADMIN &&
    !resetPassword
  ) {
    console.log(
      `[super-admin] An ADMIN already exists for ${email}. Nothing to do. (Use --reset-password to rotate.)`,
    );
    await prisma.$disconnect();
    return;
  }

  const passwordHash = await hash(password, 12);

  if (!existingUser) {
    const created = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash,
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
        acceptedTermsAt: new Date(),
        acceptedPrivacyAt: new Date(),
      },
      select: { id: true, email: true },
    });

    console.log(`[super-admin] Created admin ${created.email} (${created.id}).`);
    await prisma.$disconnect();
    return;
  }

  // Case 2: user exists but is not admin yet → promote.
  // Case 3: user exists and --reset-password was passed → rotate password.
  const shouldRotate = resetPassword || existingUser.role !== UserRole.ADMIN;
  if (!shouldRotate) {
    console.log(
      `[super-admin] User ${email} already exists with role ${existingUser.role}. Nothing to do.`,
    );
    await prisma.$disconnect();
    return;
  }

  const updated = await prisma.user.update({
    where: { email },
    data: {
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      name,
      ...(resetPassword || existingUser.role !== UserRole.ADMIN
        ? { passwordHash }
        : {}),
    },
    select: { id: true, email: true },
  });

  console.log(
    `[super-admin] ${
      existingUser.role === UserRole.ADMIN
        ? "Rotated password for admin"
        : "Promoted user to ADMIN"
    }: ${updated.email}`,
  );
  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error("[super-admin] Failed:", error);
  await prisma.$disconnect();
  process.exit(1);
});
