import { requireUser } from "@/lib/auth-guard";
import { ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const authResult = await requireUser();
  if ("response" in authResult) {
    return authResult.response;
  }

  const { searchParams } = new URL(request.url);
  const unreadOnly = searchParams.get("unreadOnly") === "true";
  const page = Math.max(Number(searchParams.get("page") ?? "1"), 1);
  const pageSize = Math.min(Math.max(Number(searchParams.get("pageSize") ?? "20"), 1), 100);

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

export async function PATCH() {
  const authResult = await requireUser();
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
