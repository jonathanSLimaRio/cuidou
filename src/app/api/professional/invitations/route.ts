import { requireUser } from "@/lib/auth-guard";
import { fail, ok } from "@/lib/http";
import { expirePendingInvitationsWithNotifications } from "@/lib/invitations";
import { prisma } from "@/lib/prisma";
import { JobInvitationStatus, UserRole } from "@prisma/client";

export async function GET(request: Request) {
  const authResult = await requireUser([UserRole.PROFESSIONAL], request);
  if ("response" in authResult) {
    return authResult.response;
  }

  const { searchParams } = new URL(request.url);
  const statusParam = searchParams.get("status");
  if (statusParam && !Object.values(JobInvitationStatus).includes(statusParam as JobInvitationStatus)) {
    return fail(422, "validation_error", {
      field: "status",
      accepted: Object.values(JobInvitationStatus),
    });
  }

  const status = statusParam as JobInvitationStatus | null;

  await expirePendingInvitationsWithNotifications({ professionalId: authResult.user.id });

  const items = await prisma.jobInvitation.findMany({
    where: {
      professionalId: authResult.user.id,
      ...(status ? { status } : {}),
    },
    orderBy: { createdAt: "desc" },
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
      family: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  return ok({ items });
}
