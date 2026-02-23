import { requireUser } from "@/lib/auth-guard";
import { ok } from "@/lib/http";
import { notifyMany } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { parseJsonBody } from "@/lib/request";
import { reportSchema } from "@/lib/schemas";
import { NotificationType } from "@prisma/client";

export async function POST(request: Request) {
  const authResult = await requireUser();
  if ("response" in authResult) {
    return authResult.response;
  }

  const bodyResult = await parseJsonBody(request, reportSchema);
  if ("response" in bodyResult) {
    return bodyResult.response;
  }

  const data = bodyResult.data;

  const report = await prisma.report.create({
    data: {
      reporterId: authResult.user.id,
      targetType: data.targetType,
      reason: data.reason,
      details: data.details,
      targetUserId: data.targetUserId,
      targetJobId: data.targetJobId,
      targetMessageId: data.targetMessageId,
      targetProfessionalProfileId: data.targetProfessionalProfileId,
      targetConversationId: data.targetConversationId,
    },
  });

  const admins = await prisma.user.findMany({
    where: {
      role: "ADMIN",
      status: "ACTIVE",
    },
    select: { id: true },
  });

  await notifyMany(
    admins.map((admin) => ({
      userId: admin.id,
      type: NotificationType.REPORT_STATUS_UPDATED,
      title: "Nova denúncia aberta",
      body: "Uma nova denúncia foi criada e aguarda moderação.",
      data: {
        reportId: report.id,
      },
    })),
  );

  return ok({ report }, 201);
}
