import { requireUser } from "@/lib/auth-guard";
import { ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";

export async function GET(request: Request) {
  const authResult = await requireUser([UserRole.ADMIN], request);
  if ("response" in authResult) return authResult.response;

  const { searchParams } = new URL(request.url);
  const parsedPage = Number.parseInt(searchParams.get("page") ?? "1", 10);
  const parsedPageSize = Number.parseInt(searchParams.get("pageSize") ?? "50", 10);
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const pageSize = Number.isFinite(parsedPageSize) && parsedPageSize > 0 ? Math.min(parsedPageSize, 100) : 50;
  const role = searchParams.get("role") as UserRole | null;
  const city = searchParams.get("city")?.trim() || undefined;

  const where = {
    ...(role === UserRole.FAMILY || role === UserRole.PROFESSIONAL ? { role } : {}),
    ...(city ? { city: { contains: city, mode: "insensitive" as const } } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.waitlistLead.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: { id: true, email: true, name: true, role: true, city: true, source: true, consentAt: true, createdAt: true },
    }),
    prisma.waitlistLead.count({ where }),
  ]);

  return ok({ items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
}
