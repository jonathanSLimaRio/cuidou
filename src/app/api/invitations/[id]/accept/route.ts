import { requireUser } from "@/lib/auth-guard";
import { sendEmail } from "@/lib/email";
import { fail, ok } from "@/lib/http";
import { notifyMany } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { parseJsonBody } from "@/lib/request";
import { acceptInvitationSchema } from "@/lib/schemas";
import { ApplicationStatus, JobInvitationStatus, JobStatus, NotificationType, UserRole } from "@prisma/client";

type Params = {
  params: Promise<{ id: string }>;
};

async function markInvitationExpired(invitationId: string) {
  return prisma.jobInvitation.update({
    where: { id: invitationId },
    data: {
      status: JobInvitationStatus.EXPIRED,
      respondedAt: new Date(),
    },
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
        },
      },
      professional: {
        select: {
          id: true,
          email: true,
        },
      },
    },
  });
}

export async function POST(request: Request, { params }: Params) {
  const { id: invitationId } = await params;

  const authResult = await requireUser([UserRole.PROFESSIONAL], request);
  if ("response" in authResult) {
    return authResult.response;
  }

  const bodyResult = await parseJsonBody(request, acceptInvitationSchema);
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
          familyId: true,
          status: true,
          isVisible: true,
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

  if (
    invitation.status === JobInvitationStatus.PENDING &&
    invitation.expiresAt.getTime() < Date.now()
  ) {
    const expired = await markInvitationExpired(invitation.id);

    await notifyMany([
      {
        userId: expired.family.id,
        type: NotificationType.INVITATION_STATUS_UPDATED,
        title: "Convite expirado",
        body: `O convite para a vaga \"${expired.job.title}\" expirou sem resposta.`,
        data: {
          invitationId: expired.id,
          status: expired.status,
          jobId: expired.job.id,
        },
      },
      {
        userId: expired.professional.id,
        type: NotificationType.INVITATION_STATUS_UPDATED,
        title: "Convite expirado",
        body: `O convite para a vaga \"${expired.job.title}\" foi marcado como expirado.`,
        data: {
          invitationId: expired.id,
          status: expired.status,
          jobId: expired.job.id,
        },
      },
    ]);

    if (expired.family.email) {
      await sendEmail({
        to: expired.family.email,
        subject: "Convite expirado na Cuidou",
        html: `<p>O convite para a vaga <strong>${expired.job.title}</strong> expirou sem resposta.</p>`,
      });
    }

    return fail(409, "Invitation has expired");
  }

  if (invitation.status !== JobInvitationStatus.PENDING) {
    return fail(409, "This invitation is no longer pending");
  }

  if (!invitation.job.isVisible || invitation.job.status !== JobStatus.OPEN) {
    return fail(409, "The job is no longer open for new applications");
  }

  const existingApplication = await prisma.jobApplication.findUnique({
    where: {
      jobId_professionalId: {
        jobId: invitation.jobId,
        professionalId: invitation.professionalId,
      },
    },
    select: {
      id: true,
      status: true,
    },
  });

  if (existingApplication) {
    return fail(409, "You already have an application for this job");
  }

  const now = new Date();

  const result = await prisma.$transaction(async (tx) => {
    const application = await tx.jobApplication.create({
      data: {
        jobId: invitation.jobId,
        professionalId: invitation.professionalId,
        coverMessage: bodyResult.data.coverMessage,
        status: ApplicationStatus.SUBMITTED,
      },
    });

    const updatedInvitation = await tx.jobInvitation.update({
      where: { id: invitation.id },
      data: {
        status: JobInvitationStatus.ACCEPTED,
        respondedAt: now,
        responseMessage: bodyResult.data.coverMessage,
      },
    });

    return {
      application,
      invitation: updatedInvitation,
    };
  });

  await notifyMany([
    {
      userId: invitation.familyId,
      type: NotificationType.INVITATION_STATUS_UPDATED,
      title: "Convite aceito",
      body: `${invitation.professional.name ?? "Profissional"} aceitou o convite para a vaga \"${invitation.job.title}\".`,
      data: {
        invitationId: invitation.id,
        status: JobInvitationStatus.ACCEPTED,
        jobId: invitation.jobId,
      },
    },
    {
      userId: invitation.familyId,
      type: NotificationType.APPLICATION_RECEIVED,
      title: "Nova candidatura recebida",
      body: `Você recebeu uma candidatura para a vaga \"${invitation.job.title}\" via convite.`,
      data: {
        applicationId: result.application.id,
        jobId: invitation.jobId,
      },
    },
    {
      userId: invitation.professionalId,
      type: NotificationType.INVITATION_STATUS_UPDATED,
      title: "Convite aceito",
      body: `Sua candidatura para a vaga \"${invitation.job.title}\" foi enviada.`,
      data: {
        invitationId: invitation.id,
        status: JobInvitationStatus.ACCEPTED,
        applicationId: result.application.id,
      },
    },
  ]);

  if (invitation.family.email) {
    await sendEmail({
      to: invitation.family.email,
      subject: "Convite aceito e candidatura recebida",
      html: `<p>${invitation.professional.name ?? "O profissional"} aceitou seu convite e enviou candidatura para a vaga <strong>${invitation.job.title}</strong>.</p>`,
    });
  }

  return ok({
    invitation: result.invitation,
    application: result.application,
  });
}
