import { requireUser } from "@/lib/auth-guard";
import { ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { parsePagination } from "@/lib/request";

export async function GET(request: Request) {
  const authResult = await requireUser(undefined, request);
  if ("response" in authResult) {
    return authResult.response;
  }

  const { searchParams } = new URL(request.url);
  const unreadOnly = searchParams.get("unreadOnly") === "true";
  const { page, pageSize } = parsePagination(searchParams, { defaultPageSize: 20, maxPageSize: 100 });

  const where = {
    userId: authResult.user.id,
    ...(unreadOnly ? { readAt: null } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.notification.count({ where }),
  ]);

  return ok({
    items,
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize),
  });
}

export async function PATCH(request: Request) {
  const authResult = await requireUser(undefined, request);
  if ("response" in authResult) {
    return authResult.response;
  }

  await prisma.notification.updateMany({
    where: {
      userId: authResult.user.id,
      readAt: null,
    },
    data: {
      readAt: new Date(),
    },
  });

  return ok({ success: true });
}
