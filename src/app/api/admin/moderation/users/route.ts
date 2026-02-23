import { requireUser } from "@/lib/auth-guard";
import { ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { UserRole, UserStatus } from "@prisma/client";

export async function GET(request: Request) {
  const authResult = await requireUser([UserRole.ADMIN]);
  if ("response" in authResult) {
    return authResult.response;
  }

  const { searchParams } = new URL(request.url);
  const role = searchParams.get("role") as UserRole | null;
  const status = searchParams.get("status") as UserStatus | null;

  const items = await prisma.user.findMany({
    where: {
      ...(role ? { role } : {}),
      ...(status ? { status } : {}),
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      _count: {
        select: {
          reportsSubmitted: true,
          reportsAgainstUser: true,
        },
      },
    },
    take: 300,
  });

  return ok({ items });
}
