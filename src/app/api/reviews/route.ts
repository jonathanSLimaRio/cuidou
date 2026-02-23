import { requireUser } from "@/lib/auth-guard";
import { fail, ok } from "@/lib/http";
import { notifyUser } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { parseJsonBody } from "@/lib/request";
import { reviewSchema } from "@/lib/schemas";
import {
  ApplicationStatus,
  ContractStatus,
  NotificationType,
  UserRole,
} from "@prisma/client";

export async function POST(request: Request) {
  const authResult = await requireUser([UserRole.FAMILY, UserRole.PROFESSIONAL]);
  if ("response" in authResult) {
    return authResult.response;
  }

  const bodyResult = await parseJsonBody(request, reviewSchema);
  if ("response" in bodyResult) {
    return bodyResult.response;
  }

  const data = bodyResult.data;

  const application = await prisma.jobApplication.findUnique({
    where: { id: data.applicationId },
    include: {
      job: {
        select: {
          id: true,
          familyId: true,
          title: true,
        },
      },
      professional: {
        select: {
          id: true,
          name: true,
        },
      },
      contract: {
        select: {
          status: true,
        },
      },
    },
  });

  if (!application) {
    return fail(404, "Application not found");
  }

  if (application.status !== ApplicationStatus.ACCEPTED) {
    return fail(400, "Only accepted applications can be reviewed");
  }

  if (!application.contract || application.contract.status !== ContractStatus.COMPLETED) {
    return fail(400, "Only completed contracts can be reviewed");
  }

  const reviewerId = authResult.user.id;

  if (reviewerId !== application.job.familyId && reviewerId !== application.professionalId) {
    return fail(403, "You cannot review this application");
  }

  const revieweeId =
    reviewerId === application.job.familyId ? application.professionalId : application.job.familyId;

  if (reviewerId === revieweeId) {
    return fail(400, "Invalid review target");
  }

  const existingReview = await prisma.review.findUnique({
    where: {
      applicationId_reviewerId: {
        applicationId: data.applicationId,
        reviewerId,
      },
    },
    select: { id: true },
  });

  if (existingReview) {
    return fail(409, "You already reviewed this application");
  }

  const review = await prisma.review.create({
    data: {
      applicationId: data.applicationId,
      jobId: application.jobId,
      reviewerId,
      revieweeId,
      rating: data.rating,
      comment: data.comment,
    },
  });

  await notifyUser({
    userId: revieweeId,
    type: NotificationType.SYSTEM,
    title: "Nova avaliação recebida",
    body: `Você recebeu uma nova avaliação para a vaga \"${application.job.title}\".`,
    data: {
      reviewId: review.id,
      applicationId: data.applicationId,
    },
  });

  return ok({ review }, 201);
}
