import { requireUser } from "@/lib/auth-guard";
import { fail, ok } from "@/lib/http";
import { expirePendingInvitationsWithNotifications } from "@/lib/invitations";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";

type Params = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, { params }: Params) {
  const { id: jobId } = await params;

  const authResult = await requireUser([UserRole.FAMILY], request);
  if ("response" in authResult) {
    return authResult.response;
  }

  const job = await prisma.jobPost.findUnique({
    where: { id: jobId },
    select: { id: true, familyId: true },
  });

  if (!job) {
    return fail(404, "Job not found");
  }

  if (job.familyId !== authResult.user.id) {
    return fail(403, "You can only view invitations for your own jobs");
  }

  await expirePendingInvitationsWithNotifications({ jobId });

  const items = await prisma.jobInvitation.findMany({
    where: { jobId },
    orderBy: { createdAt: "desc" },
    include: {
      professional: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  return ok({ items });
}
