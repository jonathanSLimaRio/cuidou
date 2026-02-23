import { requireUser } from "@/lib/auth-guard";
import { sendEmail } from "@/lib/email";
import { fail, ok } from "@/lib/http";
import { notifyUser } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { parseJsonBody } from "@/lib/request";
import { applicationSchema } from "@/lib/schemas";
import { JobStatus, NotificationType, UserRole } from "@prisma/client";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(request: Request, { params }: Params) {
  const { id: jobId } = await params;

  const authResult = await requireUser([UserRole.PROFESSIONAL]);
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

  const application = await prisma.jobApplication.create({
    data: {
      jobId,
      professionalId: authResult.user.id,
      coverMessage: bodyResult.data.coverMessage,
    },
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

  return ok({ application }, 201);
}
