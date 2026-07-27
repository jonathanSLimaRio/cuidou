import { requireUser } from "@/lib/auth-guard";
import { fail, ok } from "@/lib/http";
import { notifyUser } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import {
  ApplicationStatus,
  AuditAction,
  AuditTargetType,
  NotificationType,
  UserRole,
} from "@prisma/client";

type Params = { params: Promise<{ id: string }> };

/** Allows a professional to withdraw an application before the family decides. */
export async function POST(request: Request, { params }: Params) {
  const { id } = await params;
  const authResult = await requireUser([UserRole.PROFESSIONAL], request);
  if ("response" in authResult) return authResult.response;

  const application = await prisma.jobApplication.findUnique({
    where: { id },
    include: {
      job: { select: { id: true, title: true, familyId: true } },
    },
  });

  if (!application) return fail(404, "Application not found");
  if (application.professionalId !== authResult.user.id) {
    return fail(403, "You can only withdraw your own applications");
  }

  if (application.status === ApplicationStatus.WITHDRAWN) {
    return ok({ application });
  }

  if (
    application.status !== ApplicationStatus.SUBMITTED &&
    application.status !== ApplicationStatus.SHORTLISTED
  ) {
    return fail(409, "Application cannot be withdrawn in current status");
  }

  const now = new Date();
  const updatedResult = await prisma.jobApplication.updateMany({
    where: {
      id,
      professionalId: authResult.user.id,
      status: { in: [ApplicationStatus.SUBMITTED, ApplicationStatus.SHORTLISTED] },
    },
    data: { status: ApplicationStatus.WITHDRAWN, withdrawnAt: now },
  });

  if (updatedResult.count === 0) {
    const current = await prisma.jobApplication.findUnique({ where: { id } });
    if (current?.status === ApplicationStatus.WITHDRAWN) return ok({ application: current });
    return fail(409, "Application changed while it was being withdrawn");
  }

  const updated = await prisma.jobApplication.findUniqueOrThrow({ where: { id } });
  await prisma.auditLog.create({
    data: {
      adminId: authResult.user.id,
      action: AuditAction.APPLICATION_WITHDRAWN,
      targetType: AuditTargetType.APPLICATION,
      targetId: id,
      metadata: { jobId: application.job.id, professionalId: authResult.user.id },
    },
  });
  await notifyUser({
    userId: application.job.familyId,
    type: NotificationType.APPLICATION_STATUS_UPDATED,
    title: "Candidatura retirada",
    body: "O profissional retirou a candidatura antes da decisão da família.",
    data: { applicationId: id, jobId: application.job.id, status: ApplicationStatus.WITHDRAWN },
  });

  return ok({ application: updated });
}
