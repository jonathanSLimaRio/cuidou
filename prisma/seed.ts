import { PrismaClient, UserRole, UserStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL;

  if (!superAdminEmail) {
    console.log("SUPER_ADMIN_EMAIL not set. Skipping admin seed.");
    return;
  }

  const existing = await prisma.user.findUnique({
    where: { email: superAdminEmail },
    select: { id: true },
  });

  if (existing) {
    await prisma.user.update({
      where: { id: existing.id },
      data: {
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
        acceptedTermsAt: new Date(),
        acceptedPrivacyAt: new Date(),
      },
    });

    console.log(`Updated existing super admin: ${superAdminEmail}`);
    return;
  }

  await prisma.user.create({
    data: {
      email: superAdminEmail,
      name: "Super Admin",
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      acceptedTermsAt: new Date(),
      acceptedPrivacyAt: new Date(),
    },
  });

  console.log(`Created super admin: ${superAdminEmail}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
