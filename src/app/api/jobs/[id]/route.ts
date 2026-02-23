import { auth } from "@/auth";
import { requireUser } from "@/lib/auth-guard";
import { fail, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { parseJsonBody } from "@/lib/request";
import { updateJobSchema } from "@/lib/schemas";
import { UserRole } from "@prisma/client";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_: Request, { params }: Params) {
  const { id } = await params;

  const session = await auth();
  const user = session?.user;

  const job = await prisma.jobPost.findUnique({
    where: { id },
    include: {
      family: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
      _count: {
        select: {
          applications: true,
        },
      },
    },
  });

  if (!job) {
    return fail(404, "Job not found");
  }

  const canAccessPrivate =
    user &&
    (user.role === UserRole.ADMIN ||
      (user.role === UserRole.FAMILY && user.id === job.familyId));

  if (!job.isVisible && !canAccessPrivate) {
    return fail(404, "Job not found");
  }

  return ok({ job });
}

export async function PUT(request: Request, { params }: Params) {
  const { id } = await params;

  const authResult = await requireUser([UserRole.FAMILY, UserRole.ADMIN]);
  if ("response" in authResult) {
    return authResult.response;
  }

  const bodyResult = await parseJsonBody(request, updateJobSchema);
  if ("response" in bodyResult) {
    return bodyResult.response;
  }

  const existing = await prisma.jobPost.findUnique({
    where: { id },
    select: { familyId: true },
  });

  if (!existing) {
    return fail(404, "Job not found");
  }

  if (
    authResult.user.role === UserRole.FAMILY &&
    existing.familyId !== authResult.user.id
  ) {
    return fail(403, "You can only update your own jobs");
  }

  const job = await prisma.jobPost.update({
    where: { id },
    data: bodyResult.data,
  });

  return ok({ job });
}
