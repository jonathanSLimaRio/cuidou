import { requireUser } from "@/lib/auth-guard";
import { writeAuditLog } from "@/lib/audit";
import { fail, ok } from "@/lib/http";
import { notifyUser } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { parseJsonBody } from "@/lib/request";
import { adminJobStatusSchema } from "@/lib/schemas";
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

  const authResult = await requireUser([UserRole.ADMIN]);
  if ("response" in authResult) {
    return authResult.response;
  }

  const bodyResult = await parseJsonBody(request, adminJobStatusSchema);
  if ("response" in bodyResult) {
    return bodyResult.response;
  }

  const data = bodyResult.data;

  const job = await prisma.jobPost.findUnique({
    where: { id },
    select: {
      id: true,
      familyId: true,
      title: true,
    },
  });

  if (!job) {
    return fail(404, "Job not found");
  }

  const updated = await prisma.jobPost.update({
    where: { id },
    data: {
      status: data.status,
      isVisible: data.isVisible,
    },
  });

  await notifyUser({
    userId: job.familyId,
    type: NotificationType.SYSTEM,
    title: "Status da vaga atualizado",
    body: `A vaga \"${job.title}\" teve o status alterado para ${data.status}.`,
    data: {
      jobId: job.id,
      status: data.status,
    },
  });

  await writeAuditLog({
    adminId: authResult.user.id,
    action: AuditAction.JOB_STATUS_UPDATED,
    targetType: AuditTargetType.JOB,
    targetId: job.id,
    metadata: {
      status: data.status,
      isVisible: data.isVisible,
    },
  });

  return ok({ job: updated });
}
