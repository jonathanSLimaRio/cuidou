import { requireUser } from "@/lib/auth-guard";
import { writeAuditLog } from "@/lib/audit";
import { sendEmail } from "@/lib/email";
import { fail, ok } from "@/lib/http";
import { notifyMany } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { AuditAction, AuditTargetType, JobInvitationStatus, NotificationType, UserRole } from "@prisma/client";

type Params = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, { params }: Params) {
  const { id: invitationId } = await params;

  const authResult = await requireUser([UserRole.FAMILY], request);
  if ("response" in authResult) {
    return authResult.response;
  }

  const invitation = await prisma.jobInvitation.findUnique({
    where: { id: invitationId },
    include: {
      job: {
        select: {
          id: true,
          title: true,
        },
      },
      family: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
      professional: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
    },
  });

  if (!invitation) {
    return fail(404, "Invitation not found");
  }

  if (invitation.familyId !== authResult.user.id) {
    return fail(403, "You can only cancel invitations from your own jobs");
  }

  if (invitation.status === JobInvitationStatus.CANCELED) {
    return ok({ invitation });
  }

  if (invitation.status === JobInvitationStatus.PENDING && invitation.expiresAt.getTime() < Date.now()) {
    const expired = await prisma.jobInvitation.update({
      where: { id: invitation.id },
      data: {
        status: JobInvitationStatus.EXPIRED,
        respondedAt: new Date(),
      },
    });

    await notifyMany([
      {
        userId: invitation.familyId,
        type: NotificationType.INVITATION_STATUS_UPDATED,
        title: "Convite expirado",
        body: `O convite para a vaga \"${invitation.job.title}\" expirou sem resposta.`,
        data: {
          invitationId: invitation.id,
          status: expired.status,
          jobId: invitation.job.id,
        },
      },
      {
        userId: invitation.professionalId,
        type: NotificationType.INVITATION_STATUS_UPDATED,
        title: "Convite expirado",
        body: `O convite para a vaga \"${invitation.job.title}\" foi marcado como expirado.`,
        data: {
          invitationId: invitation.id,
          status: expired.status,
          jobId: invitation.job.id,
        },
      },
    ]);

    if (invitation.professional.email) {
      await sendEmail({
        to: invitation.professional.email,
        subject: "Convite expirado na Cuidou",
        html: `<p>O convite para a vaga <strong>${invitation.job.title}</strong> expirou sem resposta.</p>`,
      });
    }

    await writeAuditLog({
      adminId: authResult.user.id,
      action: AuditAction.INVITATION_STATUS_UPDATED,
      targetType: AuditTargetType.INVITATION,
      targetId: invitation.id,
      metadata: { from: JobInvitationStatus.PENDING, to: JobInvitationStatus.EXPIRED, jobId: invitation.job.id },
    });

    return fail(409, "Invitation has expired");
  }

  if (invitation.status !== JobInvitationStatus.PENDING) {
    return fail(409, "Only pending invitations can be canceled");
  }

  const updateResult = await prisma.jobInvitation.updateMany({
    where: { id: invitation.id, status: JobInvitationStatus.PENDING },
    data: { status: JobInvitationStatus.CANCELED, respondedAt: new Date() },
  });

  if (updateResult.count === 0) {
    const current = await prisma.jobInvitation.findUnique({ where: { id: invitation.id } });
    if (current?.status === JobInvitationStatus.CANCELED) return ok({ invitation: current });
    return fail(409, "Invitation changed while it was being canceled");
  }

  const updated = await prisma.jobInvitation.findUniqueOrThrow({ where: { id: invitation.id } });

  await writeAuditLog({
    adminId: authResult.user.id,
    action: AuditAction.INVITATION_STATUS_UPDATED,
    targetType: AuditTargetType.INVITATION,
    targetId: invitation.id,
    metadata: { from: JobInvitationStatus.PENDING, to: JobInvitationStatus.CANCELED, jobId: invitation.job.id },
  });

  await notifyMany([
    {
      userId: invitation.familyId,
      type: NotificationType.INVITATION_STATUS_UPDATED,
      title: "Convite cancelado",
      body: `Você cancelou o convite da vaga \"${invitation.job.title}\".`,
      data: {
        invitationId: invitation.id,
        status: JobInvitationStatus.CANCELED,
        jobId: invitation.job.id,
      },
    },
    {
      userId: invitation.professionalId,
      type: NotificationType.INVITATION_STATUS_UPDATED,
      title: "Convite cancelado",
      body: `A família cancelou o convite da vaga \"${invitation.job.title}\".`,
      data: {
        invitationId: invitation.id,
        status: JobInvitationStatus.CANCELED,
        jobId: invitation.job.id,
      },
    },
  ]);

  if (invitation.professional.email) {
    await sendEmail({
      to: invitation.professional.email,
      subject: "Convite cancelado na Cuidou",
      html: `<p>A família cancelou o convite para a vaga <strong>${invitation.job.title}</strong>.</p>`,
    });
  }

  return ok({ invitation: updated });
}
