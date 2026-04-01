import { requireUser } from "@/lib/auth-guard";
import { fail, ok } from "@/lib/http";
import { expirePendingInvitationsWithNotifications } from "@/lib/invitations";
import { prisma } from "@/lib/prisma";
import { JobInvitationStatus, UserRole } from "@prisma/client";

export async function GET(request: Request) {
  const authResult = await requireUser([UserRole.FAMILY], request);
  if ("response" in authResult) {
    return authResult.response;
  }

  const { searchParams } = new URL(request.url);
  const page = Math.max(Number(searchParams.get("page") ?? "1"), 1);
  const pageSize = Math.min(Math.max(Number(searchParams.get("pageSize") ?? "20"), 1), 100);
  const jobId = searchParams.get("jobId");
  const statusParam = searchParams.get("status");

  if (
    statusParam &&
    !Object.values(JobInvitationStatus).includes(statusParam as JobInvitationStatus)
  ) {
    return fail(422, "validation_error", {
      field: "status",
      accepted: Object.values(JobInvitationStatus),
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

  await expirePendingInvitationsWithNotifications({
    familyId: authResult.user.id,
    ...(jobId ? { jobId } : {}),
  });

  const status = statusParam as JobInvitationStatus | null;

  const where = {
    familyId: authResult.user.id,
    ...(jobId ? { jobId } : {}),
    ...(status ? { status } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.jobInvitation.findMany({
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
          },
        },
      },
    }),
    prisma.jobInvitation.count({ where }),
  ]);

  return ok({
    items,
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize),
  });
}

