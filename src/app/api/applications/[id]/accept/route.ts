import { requireUser } from "@/lib/auth-guard";
import { sendEmail } from "@/lib/email";
import { fail, ok } from "@/lib/http";
import { notifyMany } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { ProductEventName, trackProductEvent } from "@/lib/product-events";
import {
  ApplicationStatus,
  ContractStatus,
  JobStatus,
  NotificationType,
  Prisma,
  UserRole,
} from "@prisma/client";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(request: Request, { params }: Params) {
  const { id: applicationId } = await params;

  const authResult = await requireUser([UserRole.FAMILY], request);
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
      contract: {
        select: {
          id: true,
          status: true,
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

  if (application.job.status !== JobStatus.OPEN) {
    return fail(409, "Only applications for open jobs can be accepted");
  }

  if (
    application.status !== ApplicationStatus.SUBMITTED &&
    application.status !== ApplicationStatus.SHORTLISTED
  ) {
    return fail(400, "This application can no longer be accepted");
  }

  const activeContract = await prisma.contract.findFirst({
    where: {
      jobId: application.jobId,
      status: ContractStatus.IN_PROGRESS,
    },
    select: {
      id: true,
    },
  });

  if (activeContract) {
    return fail(409, "This job already has an in-progress contract");
  }

  if (application.contract) {
    return fail(409, "This application already has an associated contract");
  }

  const runAcceptanceTransaction = () =>
    prisma.$transaction(async (tx) => {
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

      const contract = await tx.contract.create({
        data: {
          jobId: application.jobId,
          applicationId,
          familyId: application.job.familyId,
          professionalId: application.professionalId,
          status: ContractStatus.IN_PROGRESS,
          startedAt: now,
        },
      });

      await tx.jobPost.update({
        where: { id: application.jobId },
        data: {
          status: JobStatus.PAUSED,
        },
      });

      return {
        updatedApplication,
        conversation,
        contract,
      };
    });

  let result: Awaited<ReturnType<typeof runAcceptanceTransaction>>;

  try {
    result = await runAcceptanceTransaction();
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return fail(409, "This job already has an in-progress contract");
    }
    throw error;
  }

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
    {
      userId: application.job.familyId,
      type: NotificationType.CONTRACT_STATUS_UPDATED,
      title: "Contrato iniciado",
      body: `O contrato da vaga \"${application.job.title}\" está em andamento.`,
      data: {
        contractId: result.contract.id,
        status: ContractStatus.IN_PROGRESS,
      },
    },
    {
      userId: application.professionalId,
      type: NotificationType.CONTRACT_STATUS_UPDATED,
      title: "Contrato iniciado",
      body: `Seu contrato para a vaga \"${application.job.title}\" está em andamento.`,
      data: {
        contractId: result.contract.id,
        status: ContractStatus.IN_PROGRESS,
      },
    },
  ]);

  if (application.professional.email) {
    await sendEmail({
      to: application.professional.email,
      subject: "Sua candidatura foi aprovada",
      html: `<p>Sua candidatura para a vaga <strong>${application.job.title}</strong> foi aprovada. O contrato foi iniciado e você já pode conversar com a família na plataforma.</p>`,
    });
  }

  trackProductEvent({
    name: ProductEventName.APPLICATION_ACCEPTED,
    userId: authResult.user.id,
    metadata: { applicationId, jobId: application.jobId, contractId: result.contract.id },
  });

  return ok({
    application: result.updatedApplication,
    conversation: result.conversation,
    contract: result.contract,
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
