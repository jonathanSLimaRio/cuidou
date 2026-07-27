import { requireUser } from "@/lib/auth-guard";
import { writeAuditLog } from "@/lib/audit";
import { fail, ok } from "@/lib/http";
import { notifyUser } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { parseJsonBody } from "@/lib/request";
import { adminUserStatusSchema } from "@/lib/schemas";
import {
  AuditAction,
  AuditTargetType,
  NotificationType,
  UserRole,
} from "@prisma/client";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(request: Request, { params }: Params) {
  const { id } = await params;

  const authResult = await requireUser([UserRole.ADMIN], request);
  if ("response" in authResult) {
    return authResult.response;
  }

  const bodyResult = await parseJsonBody(request, adminUserStatusSchema);
  if ("response" in bodyResult) {
    return bodyResult.response;
  }

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      role: true,
      status: true,
    },
  });

  if (!user) {
    return fail(404, "User not found");
  }

  if (user.status === bodyResult.data.status) {
    return ok({ user });
  }

  const updated = await prisma.user.update({
    where: { id },
    data: {
      status: bodyResult.data.status,
    },
  });

  await notifyUser({
    userId: user.id,
    type: NotificationType.SYSTEM,
    title: "Status da conta atualizado",
    body: `Sua conta teve o status alterado para ${bodyResult.data.status}.`,
  });

  await writeAuditLog({
    adminId: authResult.user.id,
    action: AuditAction.USER_STATUS_UPDATED,
    targetType: AuditTargetType.USER,
    targetId: user.id,
    metadata: {
      status: bodyResult.data.status,
    },
  });

  return ok({ user: updated });
}
