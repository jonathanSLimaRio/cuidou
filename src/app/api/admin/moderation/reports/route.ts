import { requireUser } from "@/lib/auth-guard";
import { ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { ReportStatus, UserRole } from "@prisma/client";

export async function GET(request: Request) {
  const authResult = await requireUser([UserRole.ADMIN], request);
  if ("response" in authResult) {
    return authResult.response;
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") as ReportStatus | null;

  const items = await prisma.report.findMany({
    where: {
      ...(status ? { status } : { status: { in: [ReportStatus.OPEN, ReportStatus.IN_REVIEW] } }),
    },
    orderBy: {
      createdAt: "asc",
    },
    include: {
      reporter: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      reviewedBy: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    take: 200,
  });

  return ok({ items });
}
