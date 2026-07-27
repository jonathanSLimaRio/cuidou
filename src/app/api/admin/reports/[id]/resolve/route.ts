import { requireUser } from "@/lib/auth-guard";
import { writeAuditLog } from "@/lib/audit";
import { fail, ok } from "@/lib/http";
import { notifyUser } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { parseJsonBody } from "@/lib/request";
import { adminReportResolveSchema } from "@/lib/schemas";
import {
  AuditAction,
  AuditTargetType,
  NotificationType,
  UserRole,
} from "@prisma/client";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(request: Request, { params }: Params) {
  const { id } = await params;

  const authResult = await requireUser([UserRole.ADMIN], request);
  if ("response" in authResult) {
    return authResult.response;
  }

  const bodyResult = await parseJsonBody(request, adminReportResolveSchema);
  if ("response" in bodyResult) {
    return bodyResult.response;
  }

  const data = bodyResult.data;

  const report = await prisma.report.findUnique({
    where: { id },
    select: {
      id: true,
      reporterId: true,
    },
  });

  if (!report) {
    return fail(404, "Report not found");
  }

  const updated = await prisma.report.update({
    where: { id },
    data: {
      status: data.status,
      reviewedById: authResult.user.id,
      resolvedAt: new Date(),
      resolutionNotes: data.resolutionNotes,
    },
  });

  await notifyUser({
    userId: report.reporterId,
    type: NotificationType.REPORT_STATUS_UPDATED,
    title: "Sua denúncia foi atualizada",
    body: `A denúncia foi marcada como ${data.status}.`,
    data: {
      reportId: report.id,
      status: data.status,
    },
  });

  await writeAuditLog({
    adminId: authResult.user.id,
    action:
      data.status === "RESOLVED"
        ? AuditAction.REPORT_RESOLVED
        : AuditAction.REPORT_DISMISSED,
    targetType: AuditTargetType.REPORT,
    targetId: report.id,
    metadata: {
      resolutionNotes: data.resolutionNotes,
    },
  });

  return ok({ report: updated });
}
