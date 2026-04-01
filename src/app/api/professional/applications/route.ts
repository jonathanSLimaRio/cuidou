import { requireUser } from "@/lib/auth-guard";
import { fail, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { ApplicationStatus, UserRole } from "@prisma/client";

export async function GET(request: Request) {
  const authResult = await requireUser([UserRole.PROFESSIONAL], request);
  if ("response" in authResult) {
    return authResult.response;
  }

  const { searchParams } = new URL(request.url);
  const page = Math.max(Number(searchParams.get("page") ?? "1"), 1);
  const pageSize = Math.min(Math.max(Number(searchParams.get("pageSize") ?? "20"), 1), 100);
  const statusParam = searchParams.get("status");
  if (statusParam && !Object.values(ApplicationStatus).includes(statusParam as ApplicationStatus)) {
    return fail(422, "validation_error", {
      field: "status",
      accepted: Object.values(ApplicationStatus),
    });
  }

  const status = statusParam as ApplicationStatus | null;

  const where = {
    professionalId: authResult.user.id,
    ...(status ? { status } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.jobApplication.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        coverMessage: true,
        job: {
          select: {
            id: true,
            title: true,
            city: true,
            state: true,
          },
        },
      },
    }),
    prisma.jobApplication.count({ where }),
  ]);

  return ok({
    items,
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize),
  });
}
