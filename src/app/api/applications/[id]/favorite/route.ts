import { requireUser } from "@/lib/auth-guard";
import { fail, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { parseJsonBody } from "@/lib/request";
import { applicationDecisionSchema } from "@/lib/schemas";
import { UserRole } from "@prisma/client";

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
        },
      },
    },
  });

  if (!application) {
    return fail(404, "Application not found");
  }

  if (application.job.familyId !== authResult.user.id) {
    return fail(403, "You can only favorite applications from your jobs");
  }

  const updated = await prisma.jobApplication.update({
    where: { id: applicationId },
    data: {
      isFavoriteByFamily: bodyResult.data.favorite ?? true,
    },
  });

  return ok({ application: updated });
}
