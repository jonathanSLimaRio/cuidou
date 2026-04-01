import { requireUser } from "@/lib/auth-guard";
import { ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";

type Params = {
  params: Promise<{ id: string }>;
};

export async function PATCH(_: Request, { params }: Params) {
  const { id } = await params;

  const authResult = await requireUser();
  if ("response" in authResult) {
    return authResult.response;
  }

  await prisma.notification.updateMany({
    where: {
      id,
      userId: authResult.user.id,
      readAt: null,
    },
    data: { readAt: new Date() },
  });

  return ok({ success: true });
}
