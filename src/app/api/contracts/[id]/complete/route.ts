import { requireUser } from "@/lib/auth-guard";
import { writeAuditLog } from "@/lib/audit";
import { sendEmail } from "@/lib/email";
import { fail, ok } from "@/lib/http";
import { notifyMany } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { parseJsonBody } from "@/lib/request";
import { completeContractSchema } from "@/lib/schemas";
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

  const authResult = await requireUser([UserRole.FAMILY]);
  if ("response" in authResult) {
    return authResult.response;
  }

  const bodyResult = await parseJsonBody(request, completeContractSchema);
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

  if (contract.familyId !== authResult.user.id) {
    return fail(403, "Only the family owner can complete this contract");
  }

  if (contract.status !== ContractStatus.IN_PROGRESS) {
    return fail(400, "Only in-progress contracts can be completed");
  }

  const completedAt = new Date();

  const updated = await prisma.$transaction(async (tx) => {
    const updatedContract = await tx.contract.update({
      where: { id: contractId },
      data: {
        status: ContractStatus.COMPLETED,
        completedAt,
      },
    });

    await tx.jobPost.update({
      where: { id: contract.jobId },
      data: {
        status: JobStatus.CLOSED,
      },
    });

    return updatedContract;
  });

  await notifyMany([
    {
      userId: contract.familyId,
      type: NotificationType.CONTRACT_STATUS_UPDATED,
      title: "Contrato concluído",
      body: `Você concluiu o contrato da vaga \"${contract.job.title}\".`,
      data: {
        contractId,
        status: ContractStatus.COMPLETED,
      },
    },
    {
      userId: contract.professionalId,
      type: NotificationType.CONTRACT_STATUS_UPDATED,
      title: "Contrato concluído",
      body: `A família marcou como concluído o contrato da vaga \"${contract.job.title}\".`,
      data: {
        contractId,
        status: ContractStatus.COMPLETED,
      },
    },
  ]);

  if (contract.professional.email) {
    await sendEmail({
      to: contract.professional.email,
      subject: "Contrato concluído na Cuidou",
      html: `<p>O contrato da vaga <strong>${contract.job.title}</strong> foi concluído. Você já pode registrar sua avaliação.</p>`,
    });
  }

  await writeAuditLog({
    adminId: authResult.user.id,
    action: AuditAction.CONTRACT_COMPLETED,
    targetType: AuditTargetType.CONTRACT,
    targetId: contractId,
    metadata: {
      note: bodyResult.data.note ?? null,
      jobId: contract.jobId,
      applicationId: contract.applicationId,
    },
  });

  return ok({ contract: updated });
}
