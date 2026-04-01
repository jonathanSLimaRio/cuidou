import { requireUser } from "@/lib/auth-guard";
import { sendEmail } from "@/lib/email";
import { fail, ok } from "@/lib/http";
import { getScheduleMatchWarning } from "@/lib/job-schedule";
import { notifyMany, notifyUser } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { parseJsonBody } from "@/lib/request";
import { applicationSchema } from "@/lib/schemas";
import { JobInvitationStatus, JobStatus, NotificationType, UserRole } from "@prisma/client";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(request: Request, { params }: Params) {
  const { id: jobId } = await params;

  const authResult = await requireUser([UserRole.PROFESSIONAL], request);
  if ("response" in authResult) {
    return authResult.response;
  }

  const bodyResult = await parseJsonBody(request, applicationSchema);
  if ("response" in bodyResult) {
    return bodyResult.response;
  }

  const job = await prisma.jobPost.findUnique({
    where: { id: jobId },
    include: {
      family: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      scheduleSlots: {
        select: {
          weekday: true,
          startTime: true,
          endTime: true,
        },
        orderBy: [{ weekday: "asc" }, { startTime: "asc" }],
      },
    },
  });

  if (!job || !job.isVisible || job.status !== JobStatus.OPEN) {
    return fail(404, "Job is not available");
  }

  if (job.familyId === authResult.user.id) {
    return fail(400, "You cannot apply to your own job");
  }

  const existing = await prisma.jobApplication.findUnique({
    where: {
      jobId_professionalId: {
        jobId,
        professionalId: authResult.user.id,
      },
    },
    select: { id: true },
  });

  if (existing) {
    return fail(409, "You have already applied to this job");
  }

  await prisma.jobInvitation.updateMany({
    where: {
      jobId,
      professionalId: authResult.user.id,
      status: JobInvitationStatus.PENDING,
      expiresAt: {
        lt: new Date(),
      },
    },
    data: {
      status: JobInvitationStatus.EXPIRED,
      respondedAt: new Date(),
    },
  });

  const professionalProfile = await prisma.professionalProfile.findUnique({
    where: { userId: authResult.user.id },
    select: {
      availabilitySlots: {
        select: {
          weekday: true,
          shift: true,
          isAvailable: true,
        },
      },
    },
  });

  const scheduleMatchWarning = getScheduleMatchWarning(
    job.scheduleSlots,
    professionalProfile?.availabilitySlots ?? [],
  );

  const now = new Date();

  const { application, autoAcceptedInvitation } = await prisma.$transaction(async (tx) => {
    const createdApplication = await tx.jobApplication.create({
      data: {
        jobId,
        professionalId: authResult.user.id,
        coverMessage: bodyResult.data.coverMessage,
      },
    });

    const pendingInvitation = await tx.jobInvitation.findFirst({
      where: {
        jobId,
        professionalId: authResult.user.id,
        status: JobInvitationStatus.PENDING,
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
      },
    });

    if (pendingInvitation) {
      await tx.jobInvitation.update({
        where: { id: pendingInvitation.id },
        data: {
          status: JobInvitationStatus.ACCEPTED,
          respondedAt: now,
          responseMessage: `Candidatura manual enviada em ${now.toISOString()}`,
        },
      });
    }

    return {
      application: createdApplication,
      autoAcceptedInvitation: pendingInvitation?.id ?? null,
    };
  });

  await notifyUser({
    userId: job.familyId,
    type: NotificationType.APPLICATION_RECEIVED,
    title: "Nova candidatura recebida",
    body: `Uma nova candidatura foi enviada para a vaga \"${job.title}\".`,
    data: {
      jobId,
      applicationId: application.id,
    },
  });

  if (job.family.email) {
    await sendEmail({
      to: job.family.email,
      subject: "Nova candidatura recebida na Cuidou",
      html: `<p>Você recebeu uma nova candidatura para a vaga <strong>${job.title}</strong>.</p>`,
    });
  }

  if (autoAcceptedInvitation) {
    await notifyMany([
      {
        userId: job.familyId,
        type: NotificationType.INVITATION_STATUS_UPDATED,
        title: "Convite convertido em candidatura",
        body: "A profissional se candidatou diretamente à vaga e o convite pendente foi marcado como aceito.",
        data: {
          invitationId: autoAcceptedInvitation,
          status: JobInvitationStatus.ACCEPTED,
          applicationId: application.id,
          jobId,
        },
      },
      {
        userId: authResult.user.id,
        type: NotificationType.INVITATION_STATUS_UPDATED,
        title: "Convite marcado como aceito",
        body: "Sua candidatura manual atualizou automaticamente o convite pendente.",
        data: {
          invitationId: autoAcceptedInvitation,
          status: JobInvitationStatus.ACCEPTED,
          applicationId: application.id,
          jobId,
        },
      },
    ]);
  }

  return ok(
    {
      application,
      scheduleMatchWarning,
      invitationAutoAccepted: autoAcceptedInvitation,
    },
    201,
  );
}
