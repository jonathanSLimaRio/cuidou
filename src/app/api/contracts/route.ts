import { requireUser } from "@/lib/auth-guard";
import { ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";

export async function GET() {
  const authResult = await requireUser([UserRole.FAMILY, UserRole.PROFESSIONAL, UserRole.ADMIN]);
  if ("response" in authResult) {
    return authResult.response;
  }

  const where =
    authResult.user.role === UserRole.ADMIN
      ? {}
      : authResult.user.role === UserRole.FAMILY
        ? { familyId: authResult.user.id }
        : { professionalId: authResult.user.id };

  const contracts = await prisma.contract.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      job: {
        select: {
          id: true,
          title: true,
          status: true,
          city: true,
          state: true,
        },
      },
      family: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
      professional: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
      canceledBy: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    take: authResult.user.role === UserRole.ADMIN ? 300 : 200,
  });

  return ok({ items: contracts });
}
