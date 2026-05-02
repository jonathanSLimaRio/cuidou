import { requireUser } from "@/lib/auth-guard";
import { fail, ok } from "@/lib/http";
import { notifyUser } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { parseJsonBody } from "@/lib/request";
import { checkRateLimit, rateLimitHeaders, rateLimitKey } from "@/lib/rate-limiter";
import { reviewSchema } from "@/lib/schemas";
import {
  ApplicationStatus,
  ContractStatus,
  NotificationType,
  Prisma,
  UserRole,
} from "@prisma/client";

const POST_RATE_LIMIT = { max: 3, windowMs: 60 * 60 * 1000 }; // 3 per hour

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const revieweeId = searchParams.get("revieweeId") ?? undefined;
  const reviewerId = searchParams.get("reviewerId") ?? undefined;
  const jobId = searchParams.get("jobId") ?? undefined;
  const page = Math.max(Number(searchParams.get("page") ?? "1"), 1);
  const pageSize = Math.min(Math.max(Number(searchParams.get("pageSize") ?? "10"), 1), 50);

  if (!revieweeId && !reviewerId && !jobId) {
    return fail(400, "At least one of revieweeId, reviewerId or jobId is required");
  }

  const where: Prisma.ReviewWhereInput = {};
  if (revieweeId) where.revieweeId = revieweeId;
  if (reviewerId) where.reviewerId = reviewerId;
  if (jobId) where.jobId = jobId;

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        rating: true,
        comment: true,
        createdAt: true,
        reviewer: {
          select: { id: true, name: true, image: true },
        },
        job: {
          select: { id: true, title: true },
        },
      },
    }),
    prisma.review.count({ where }),
  ]);

  return ok({
    items: reviews.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })),
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize),
  });
}

export async function POST(request: Request) {
  const rlKey = rateLimitKey("reviews-post", request);
    const rl = await checkRateLimit(rlKey, POST_RATE_LIMIT);
  if (!rl.allowed) {
    return new Response(JSON.stringify({ error: "Too many review submissions. Please try again later." }), {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)),
        ...rateLimitHeaders(rl, POST_RATE_LIMIT.max),
      },
    });
  }

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
