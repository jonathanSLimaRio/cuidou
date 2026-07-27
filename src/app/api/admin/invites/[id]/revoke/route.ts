import { requireUser } from "@/lib/auth-guard";
import { writeAuditLog } from "@/lib/audit";
import { fail, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { AuditAction, AuditTargetType, UserRole } from "@prisma/client";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const { id } = await params;

  const authResult = await requireUser([UserRole.ADMIN], request);
  if ("response" in authResult) {
    return authResult.response;
  }

  const invite = await prisma.adminInvite.findUnique({ where: { id } });

  if (!invite) {
    return fail(404, "Invite not found");
  }

  if (invite.acceptedAt) {
    return fail(409, "Invite has already been accepted and cannot be revoked");
  }

  // Mark as expired (set expiresAt to now)
  await prisma.adminInvite.update({
    where: { id },
    data: { expiresAt: new Date() },
  });

  await writeAuditLog({
    adminId: authResult.user.id,
    action: AuditAction.ADMIN_INVITE_CREATED,
    targetType: AuditTargetType.ADMIN_INVITE,
    targetId: invite.id,
    metadata: { revokedBy: authResult.user.id, email: invite.email, action: "REVOKED" },
  });

  return ok({ success: true });
}
