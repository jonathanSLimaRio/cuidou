import { requireUser } from "@/lib/auth-guard";
import { writeAuditLog } from "@/lib/audit";
import { fail, ok } from "@/lib/http";
import { notifyUser } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { parseJsonBody } from "@/lib/request";
import { adminDocumentReviewSchema } from "@/lib/schemas";
import {
  AuditAction,
  AuditTargetType,
  NotificationType,
  UserRole,
  VerificationStatus,
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

  const bodyResult = await parseJsonBody(request, adminDocumentReviewSchema);
  if ("response" in bodyResult) {
    return bodyResult.response;
  }

  const data = bodyResult.data;

  const doc = await prisma.professionalDocument.findUnique({
    where: { id },
    include: {
      professionalProfile: {
        include: {
          user: {
            select: {
              id: true,
            },
          },
        },
      },
    },
  });

  if (!doc) {
    return fail(404, "Document not found");
  }

  const status =
    data.action === "APPROVE"
      ? VerificationStatus.VERIFIED
      : VerificationStatus.REJECTED;

  const updated = await prisma.$transaction(async (tx) => {
    const document = await tx.professionalDocument.update({
      where: { id },
      data: {
        status,
        reviewedById: authResult.user.id,
        reviewedAt: new Date(),
        rejectionReason: data.action === "REJECT" ? data.reason : null,
      },
    });

    await tx.professionalProfile.update({
      where: { id: doc.professionalProfileId },
      data: {
        verificationStatus: status,
        verificationNotes: data.reason,
      },
    });

    return document;
  });

  await notifyUser({
    userId: doc.professionalProfile.user.id,
    type: NotificationType.DOCUMENT_STATUS_UPDATED,
    title:
      data.action === "APPROVE"
        ? "Documento aprovado"
        : "Documento rejeitado",
    body:
      data.action === "APPROVE"
        ? "Seu documento foi aprovado pela equipe."
        : `Seu documento foi rejeitado. ${data.reason ?? "Revise e envie novamente."}`,
    data: {
      documentId: id,
      status,
    },
  });

  await writeAuditLog({
    adminId: authResult.user.id,
    action:
      data.action === "APPROVE"
        ? AuditAction.DOCUMENT_APPROVED
        : AuditAction.DOCUMENT_REJECTED,
    targetType: AuditTargetType.DOCUMENT,
    targetId: id,
    metadata: {
      reason: data.reason,
    },
  });

  return ok({ document: updated });
}
