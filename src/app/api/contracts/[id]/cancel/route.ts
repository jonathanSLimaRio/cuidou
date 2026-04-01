import { requireUser } from "@/lib/auth-guard";
import { writeAuditLog } from "@/lib/audit";
import { sendEmail } from "@/lib/email";
import { fail, ok } from "@/lib/http";
import { notifyMany } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { parseJsonBody } from "@/lib/request";
import { cancelContractSchema } from "@/lib/schemas";
import {
  AuditAction,
  AuditTargetType,
  ContractStatus,
  JobStatus,
  NotificationType,
  UserRole,
} from "@prisma/client";

type Params = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, { params }: Params) {
  const { id: contractId } = await params;

  const authResult = await requireUser([UserRole.FAMILY, UserRole.PROFESSIONAL], request);
  if ("response" in authResult) {
    return authResult.response;
  }

  const bodyResult = await parseJsonBody(request, cancelContractSchema);
  if ("response" in bodyResult) {
    return bodyResult.response;
  }

  const contract = await prisma.contract.findUnique({
    where: { id: contractId },
    include: {
      job: {
        select: { id: true, title: true },
      },
      family: {
        select: { id: true, email: true, name: true },
      },
      professional: {
        select: { id: true, email: true, name: true },
      },
    },
  });

  if (!contract) {
    return fail(404, "Contract not found");
  }

  if (
    authResult.user.id !== contract.familyId &&
    authResult.user.id !== contract.professionalId
  ) {
    return fail(403, "You are not allowed to cancel this contract");
  }

  if (contract.status !== ContractStatus.IN_PROGRESS) {
    return fail(400, "Only in-progress contracts can be canceled");
  }

  const canceledAt = new Date();

  const updated = await prisma.$transaction(async (tx) => {
    const updatedContract = await tx.contract.update({
      where: { id: contractId },
      data: {
        status: ContractStatus.CANCELED,
        canceledAt,
        canceledById: authResult.user.id,
        cancelReason: bodyResult.data.reason,
      },
    });

    await tx.jobPost.update({
      where: { id: contract.jobId },
      data: {
        status: JobStatus.PAUSED,
      },
    });

    return updatedContract;
  });

  await notifyMany([
    {
      userId: contract.familyId,
      type: NotificationType.CONTRACT_STATUS_UPDATED,
      title: "Contrato cancelado",
      body: `O contrato da vaga \"${contract.job.title}\" foi cancelado.`,
      data: {
        contractId,
        status: ContractStatus.CANCELED,
      },
    },
    {
      userId: contract.professionalId,
      type: NotificationType.CONTRACT_STATUS_UPDATED,
      title: "Contrato cancelado",
      body: `O contrato da vaga \"${contract.job.title}\" foi cancelado.`,
      data: {
        contractId,
        status: ContractStatus.CANCELED,
      },
    },
  ]);

  const recipientEmail =
    authResult.user.id === contract.familyId
      ? contract.professional.email
      : contract.family.email;

  if (recipientEmail) {
    await sendEmail({
      to: recipientEmail,
      subject: "Contrato cancelado na Cuidou",
      html: `<p>O contrato da vaga <strong>${contract.job.title}</strong> foi cancelado.</p><p>Motivo: ${bodyResult.data.reason}</p>`,
    });
  }

  await writeAuditLog({
    adminId: authResult.user.id,
    action: AuditAction.CONTRACT_CANCELED,
    targetType: AuditTargetType.CONTRACT,
    targetId: contractId,
    metadata: {
      reason: bodyResult.data.reason,
      canceledBy: authResult.user.id,
      jobId: contract.jobId,
      applicationId: contract.applicationId,
    },
  });

  return ok({ contract: updated });
}
