import { prisma } from "@/lib/prisma";
import { AuditAction, AuditTargetType, Prisma } from "@prisma/client";

export async function writeAuditLog(params: {
  adminId: string;
  action: AuditAction;
  targetType: AuditTargetType;
  targetId?: string;
  metadata?: Prisma.InputJsonValue;
}) {
  return prisma.auditLog.create({
    data: {
      adminId: params.adminId,
      action: params.action,
      targetType: params.targetType,
      targetId: params.targetId,
      metadata: params.metadata,
    },
  });
}
