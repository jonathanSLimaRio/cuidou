import { requireUser } from "@/lib/auth-guard";
import { sendEmail } from "@/lib/email";
import { fail, ok } from "@/lib/http";
import { notifyMany } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { parseJsonBody } from "@/lib/request";
import { declineInvitationSchema } from "@/lib/schemas";
import { JobInvitationStatus, NotificationType, UserRole } from "@prisma/client";

type Params = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, { params }: Params) {
  const { id: invitationId } = await params;

  const authResult = await requireUser([UserRole.PROFESSIONAL]);
  if ("response" in authResult) {
    return authResult.response;
  }

  const bodyResult = await parseJsonBody(request, declineInvitationSchema);
  if ("response" in bodyResult) {
    return bodyResult.response;
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

  if (invitation.professionalId !== authResult.user.id) {
    return fail(403, "You can only respond to your own invitations");
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
        },
      },
    ]);

    if (invitation.family.email) {
      await sendEmail({
        to: invitation.family.email,
        subject: "Convite expirado na Cuidou",
        html: `<p>O convite para a vaga <strong>${invitation.job.title}</strong> expirou sem resposta.</p>`,
      });
    }

    return fail(409, "Invitation has expired");
  }

  if (invitation.status !== JobInvitationStatus.PENDING) {
    return fail(409, "This invitation is no longer pending");
  }

  const updated = await prisma.jobInvitation.update({
    where: { id: invitation.id },
    data: {
      status: JobInvitationStatus.DECLINED,
      responseMessage: bodyResult.data.reason,
      respondedAt: new Date(),
    },
  });

  await notifyMany([
    {
      userId: invitation.familyId,
      type: NotificationType.INVITATION_STATUS_UPDATED,
      title: "Convite recusado",
      body: `${invitation.professional.name ?? "O profissional"} recusou o convite para a vaga \"${invitation.job.title}\".`,
      data: {
        invitationId: invitation.id,
        status: JobInvitationStatus.DECLINED,
        jobId: invitation.job.id,
      },
    },
    {
      userId: invitation.professionalId,
      type: NotificationType.INVITATION_STATUS_UPDATED,
      title: "Convite recusado",
      body: `Você recusou o convite para a vaga \"${invitation.job.title}\".`,
      data: {
        invitationId: invitation.id,
        status: JobInvitationStatus.DECLINED,
        jobId: invitation.job.id,
      },
    },
  ]);

  if (invitation.family.email) {
    await sendEmail({
      to: invitation.family.email,
      subject: "Convite recusado na Cuidou",
      html: `<p>${invitation.professional.name ?? "O profissional"} recusou o convite para a vaga <strong>${invitation.job.title}</strong>.</p>`,
    });
  }

  return ok({ invitation: updated });
}
