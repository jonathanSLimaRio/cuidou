import { requireUser } from "@/lib/auth-guard";
import { ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { JobStatus, UserRole } from "@prisma/client";

export async function GET(request: Request) {
  const authResult = await requireUser([UserRole.ADMIN], request);
  if ("response" in authResult) {
    return authResult.response;
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") as JobStatus | null;

  const items = await prisma.jobPost.findMany({
    where: {
      ...(status ? { status } : {}),
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      family: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      _count: {
        select: {
          applications: true,
          reports: true,
        },
      },
    },
    take: 200,
  });

  return ok({ items });
}
