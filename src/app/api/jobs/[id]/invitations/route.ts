import { requireUser } from "@/lib/auth-guard";
import { sendEmail } from "@/lib/email";
import { fail, ok } from "@/lib/http";
import {
  buildInvitationExpiry,
  expirePendingInvitationsWithNotifications,
} from "@/lib/invitations";
import { getScheduleMatchWarning } from "@/lib/job-schedule";
import { notifyMany } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { parseJsonBody } from "@/lib/request";
import { createInvitationSchema } from "@/lib/schemas";
import { JobInvitationStatus, JobStatus, NotificationType, Prisma, UserRole, UserStatus } from "@prisma/client";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(request: Request, { params }: Params) {
  const { id: jobId } = await params;

  const authResult = await requireUser([UserRole.FAMILY], request);
  if ("response" in authResult) {
    return authResult.response;
  }

  const bodyResult = await parseJsonBody(request, createInvitationSchema);
  if ("response" in bodyResult) {
    return bodyResult.response;
  }

  const data = bodyResult.data;

  const job = await prisma.jobPost.findUnique({
    where: { id: jobId },
    include: {
      scheduleSlots: {
        select: {
          weekday: true,
          startTime: true,
          endTime: true,
        },
      },
    },
  });

  if (!job) {
    return fail(404, "Job not found");
  }

  if (job.familyId !== authResult.user.id) {
    return fail(403, "You can only invite professionals to your own jobs");
  }

  if (job.status !== JobStatus.OPEN) {
    return fail(409, "Only open jobs can receive invitations");
  }

  if (data.professionalId === authResult.user.id) {
    return fail(400, "You cannot invite your own account");
  }

  const professional = await prisma.user.findUnique({
    where: { id: data.professionalId },
    select: {
      id: true,
      role: true,
      status: true,
      email: true,
      name: true,
      professionalProfile: {
        select: {
          availabilitySlots: {
            select: {
              weekday: true,
              shift: true,
              isAvailable: true,
            },
          },
        },
      },
    },
  });

  if (!professional || professional.role !== UserRole.PROFESSIONAL) {
    return fail(404, "Professional not found");
  }

  if (professional.status !== UserStatus.ACTIVE) {
    return fail(409, "Professional account is not active");
  }

  await expirePendingInvitationsWithNotifications({
    jobId,
    professionalId: data.professionalId,
  });

  const existingApplication = await prisma.jobApplication.findFirst({
    where: {
      jobId,
      professionalId: data.professionalId,
    },
    select: { id: true },
  });

  if (existingApplication) {
    return fail(409, "This professional already has an application for the job");
  }

  const scheduleMatchWarning = getScheduleMatchWarning(
    job.scheduleSlots,
    professional.professionalProfile?.availabilitySlots ?? [],
  );

  let invitation: {
    id: string;
    status: JobInvitationStatus;
    expiresAt: Date;
  };

  try {
    invitation = await prisma.jobInvitation.create({
      data: {
        jobId,
        familyId: authResult.user.id,
        professionalId: data.professionalId,
        message: data.message,
        status: JobInvitationStatus.PENDING,
        expiresAt: buildInvitationExpiry(data.expiresInDays),
      },
      select: {
        id: true,
        status: true,
        expiresAt: true,
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return fail(409, "There is already a pending invitation for this professional in this job");
    }
    throw error;
  }

  await notifyMany([
    {
      userId: data.professionalId,
      type: NotificationType.INVITATION_RECEIVED,
      title: "Você recebeu um convite para se candidatar",
      body: `A família convidou você para a vaga \"${job.title}\".`,
      data: {
        invitationId: invitation.id,
        jobId,
      },
    },
    {
      userId: authResult.user.id,
      type: NotificationType.INVITATION_STATUS_UPDATED,
      title: "Convite enviado",
      body: `Convite enviado para ${professional.name ?? "profissional"}.`,
      data: {
        invitationId: invitation.id,
        status: invitation.status,
        jobId,
      },
    },
  ]);

  if (professional.email) {
    await sendEmail({
      to: professional.email,
      subject: "Convite para candidatura na Cuidou",
      html: `<p>Você recebeu um convite para se candidatar à vaga <strong>${job.title}</strong>.</p><p>Abra a área profissional para aceitar ou recusar.</p>`,
    });
  }

  return ok(
    {
      invitation,
      scheduleMatchWarning,
    },
    201,
  );
}
