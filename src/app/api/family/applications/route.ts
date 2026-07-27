import { requireUser } from "@/lib/auth-guard";
import { fail, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { parsePagination } from "@/lib/request";
import { ApplicationStatus, JobInvitationStatus, UserRole } from "@prisma/client";

export async function GET(request: Request) {
  const authResult = await requireUser([UserRole.FAMILY], request);
  if ("response" in authResult) {
    return authResult.response;
  }

  const { searchParams } = new URL(request.url);
  const { page, pageSize } = parsePagination(searchParams, { defaultPageSize: 20, maxPageSize: 100 });
  const jobId = searchParams.get("jobId");
  const statusParam = searchParams.get("status");

  if (statusParam && !Object.values(ApplicationStatus).includes(statusParam as ApplicationStatus)) {
    return fail(422, "validation_error", {
      field: "status",
      accepted: Object.values(ApplicationStatus),
    });
  }

  if (jobId) {
    const job = await prisma.jobPost.findUnique({
      where: { id: jobId },
      select: { familyId: true },
    });

    if (!job) {
      return fail(404, "not_found");
    }

    if (job.familyId !== authResult.user.id) {
      return fail(403, "insufficient_permissions");
    }
  }

  const status = statusParam as ApplicationStatus | null;

  const where = {
    job: {
      familyId: authResult.user.id,
      ...(jobId ? { id: jobId } : {}),
    },
    ...(status ? { status } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.jobApplication.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        job: {
          select: {
            id: true,
            title: true,
            city: true,
            state: true,
            serviceType: true,
            status: true,
          },
        },
        professional: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            professionalProfile: {
              select: {
                id: true,
                city: true,
                state: true,
                verificationStatus: true,
                serviceTypes: true,
                experienceYears: true,
              },
            },
          },
        },
      },
    }),
    prisma.jobApplication.count({ where }),
  ]);

  const invitationPairs =
    items.length > 0
      ? await prisma.jobInvitation.findMany({
          where: {
            familyId: authResult.user.id,
            status: JobInvitationStatus.ACCEPTED,
            OR: items.map((item) => ({
              jobId: item.jobId,
              professionalId: item.professionalId,
            })),
          },
          select: {
            jobId: true,
            professionalId: true,
          },
        })
      : [];

  const invitationPairSet = new Set(
    invitationPairs.map((pair) => `${pair.jobId}:${pair.professionalId}`),
  );

  return ok({
    items: items.map((item) => ({
      ...item,
      fromInvitation: invitationPairSet.has(`${item.jobId}:${item.professionalId}`),
    })),
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize),
  });
}
