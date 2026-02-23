import { requireUser } from "@/lib/auth-guard";
import { sendEmail } from "@/lib/email";
import { fail, ok } from "@/lib/http";
import { notifyUser } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { parseJsonBody } from "@/lib/request";
import { applicationDecisionSchema } from "@/lib/schemas";
import { ApplicationStatus, NotificationType, UserRole } from "@prisma/client";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(request: Request, { params }: Params) {
  const { id: applicationId } = await params;

  const authResult = await requireUser([UserRole.FAMILY]);
  if ("response" in authResult) {
    return authResult.response;
  }

  const bodyResult = await parseJsonBody(request, applicationDecisionSchema);
  if ("response" in bodyResult) {
    return bodyResult.response;
  }

  const application = await prisma.jobApplication.findUnique({
    where: { id: applicationId },
    include: {
      job: {
        select: {
          familyId: true,
          title: true,
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

  if (!application) {
    return fail(404, "Application not found");
  }

  if (application.job.familyId !== authResult.user.id) {
    return fail(403, "You can only reject applications from your own jobs");
  }

  if (application.status !== ApplicationStatus.SUBMITTED && application.status !== ApplicationStatus.SHORTLISTED) {
    return fail(400, "Application cannot be rejected in current status");
  }

  const updated = await prisma.jobApplication.update({
    where: { id: applicationId },
    data: {
      status: ApplicationStatus.REJECTED,
      rejectedAt: new Date(),
      isFavoriteByFamily: bodyResult.data.favorite ?? application.isFavoriteByFamily,
    },
  });

  await notifyUser({
    userId: application.professional.id,
    type: NotificationType.APPLICATION_STATUS_UPDATED,
    title: "Sua candidatura foi atualizada",
    body: `A candidatura para \"${application.job.title}\" foi recusada.`,
    data: {
      applicationId,
      status: ApplicationStatus.REJECTED,
    },
  });

  if (application.professional.email) {
    await sendEmail({
      to: application.professional.email,
      subject: "Atualização da sua candidatura",
      html: `<p>Sua candidatura para a vaga <strong>${application.job.title}</strong> foi recusada.</p>`,
    });
  }

  return ok({ application: updated });
}
