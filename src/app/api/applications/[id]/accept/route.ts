import { requireUser } from "@/lib/auth-guard";
import { sendEmail } from "@/lib/email";
import { fail, ok } from "@/lib/http";
import { notifyMany } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { ApplicationStatus, NotificationType, UserRole } from "@prisma/client";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(_: Request, { params }: Params) {
  const { id: applicationId } = await params;

  const authResult = await requireUser([UserRole.FAMILY]);
  if ("response" in authResult) {
    return authResult.response;
  }

  const now = new Date();

  const application = await prisma.jobApplication.findUnique({
    where: { id: applicationId },
    include: {
      job: {
        include: {
          family: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
        },
      },
      professional: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
    },
  });

  if (!application) {
    return fail(404, "Application not found");
  }

  if (application.job.familyId !== authResult.user.id) {
    return fail(403, "You can only accept applications from your own jobs");
  }

  if (
    application.status !== ApplicationStatus.SUBMITTED &&
    application.status !== ApplicationStatus.SHORTLISTED
  ) {
    return fail(400, "This application can no longer be accepted");
  }

  const result = await prisma.$transaction(async (tx) => {
    const updatedApplication = await tx.jobApplication.update({
      where: { id: applicationId },
      data: {
        status: ApplicationStatus.ACCEPTED,
        acceptedAt: now,
        contactUnlockedAt: now,
      },
    });

    const conversation = await tx.conversation.upsert({
      where: {
        applicationId,
      },
      update: {},
      create: {
        jobId: application.jobId,
        applicationId,
        familyId: application.job.familyId,
        professionalId: application.professionalId,
      },
    });

    return {
      updatedApplication,
      conversation,
    };
  });

  await notifyMany([
    {
      userId: application.professionalId,
      type: NotificationType.APPLICATION_STATUS_UPDATED,
      title: "Sua candidatura foi aprovada",
      body: `A família aprovou sua candidatura para a vaga \"${application.job.title}\".`,
      data: {
        applicationId,
        conversationId: result.conversation.id,
      },
    },
    {
      userId: application.job.familyId,
      type: NotificationType.APPLICATION_STATUS_UPDATED,
      title: "Candidatura aprovada",
      body: `Você aprovou ${application.professional.name ?? "um profissional"}.`,
      data: {
        applicationId,
      },
    },
  ]);

  if (application.professional.email) {
    await sendEmail({
      to: application.professional.email,
      subject: "Sua candidatura foi aprovada",
      html: `<p>Sua candidatura para a vaga <strong>${application.job.title}</strong> foi aprovada. Você já pode conversar com a família na plataforma.</p>`,
    });
  }

  return ok({
    application: result.updatedApplication,
    conversation: result.conversation,
    unlockedContact: {
      professional: {
        name: application.professional.name,
        email: application.professional.email,
        phone: application.professional.phone,
      },
      family: {
        name: application.job.family.name,
        email: application.job.family.email,
        phone: application.job.family.phone,
      },
    },
  });
}
