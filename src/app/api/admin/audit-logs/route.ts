import { requireUser } from "@/lib/auth-guard";
import { ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { AuditAction, AuditTargetType, Prisma, UserRole } from "@prisma/client";

export async function GET(request: Request) {
  const authResult = await requireUser([UserRole.ADMIN], request);
  if ("response" in authResult) {
    return authResult.response;
  }

  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action");
  const targetType = searchParams.get("targetType");
  const adminId = searchParams.get("adminId");
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") ?? "50", 10)));

  const where: Prisma.AuditLogWhereInput = {};

  if (action && Object.values(AuditAction).includes(action as AuditAction)) {
    where.action = action as AuditAction;
  }

  if (targetType && Object.values(AuditTargetType).includes(targetType as AuditTargetType)) {
    where.targetType = targetType as AuditTargetType;
  }

  if (adminId) {
    where.adminId = adminId;
  }

  if (from || to) {
    where.createdAt = {};
    if (from) {
      const fromDate = new Date(from);
      if (!isNaN(fromDate.getTime())) {
        where.createdAt.gte = fromDate;
      }
    }
    if (to) {
      const toDate = new Date(to);
      if (!isNaN(toDate.getTime())) {
        where.createdAt.lte = toDate;
      }
    }
  }

  const [total, items] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        admin: {
          select: { id: true, name: true, email: true },
        },
      },
    }),
  ]);

  return ok({ items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
}
