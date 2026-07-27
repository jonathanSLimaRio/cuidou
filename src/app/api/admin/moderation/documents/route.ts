import { requireUser } from "@/lib/auth-guard";
import { ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { UserRole, VerificationStatus } from "@prisma/client";

export async function GET(request: Request) {
  const authResult = await requireUser([UserRole.ADMIN], request);
  if ("response" in authResult) {
    return authResult.response;
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") as VerificationStatus | null;

  const items = await prisma.professionalDocument.findMany({
    where: {
      ...(status ? { status } : { status: VerificationStatus.UNDER_REVIEW }),
    },
    orderBy: {
      createdAt: "asc",
    },
    include: {
      professionalProfile: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
    },
    take: 200,
  });

  return ok({ items });
}
