import { requireUser } from "@/lib/auth-guard";
import { fail, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(request: Request, { params }: Params) {
  const { id: jobId } = await params;

  const authResult = await requireUser([UserRole.FAMILY, UserRole.ADMIN], request);
  if ("response" in authResult) {
    return authResult.response;
  }

  const job = await prisma.jobPost.findUnique({
    where: { id: jobId },
    select: { familyId: true },
  });

  if (!job) {
    return fail(404, "Job not found");
  }

  if (
    authResult.user.role === UserRole.FAMILY &&
    job.familyId !== authResult.user.id
  ) {
    return fail(403, "You can only view applications for your jobs");
  }

  const applications = await prisma.jobApplication.findMany({
    where: { jobId },
    orderBy: { createdAt: "desc" },
    include: {
      professional: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          phone: true,
          professionalProfile: true,
        },
      },
      conversation: {
        select: {
          id: true,
        },
      },
    },
  });

  return ok({ applications });
}
