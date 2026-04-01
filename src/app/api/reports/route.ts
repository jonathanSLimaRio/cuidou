import { requireUser } from "@/lib/auth-guard";
import { ok } from "@/lib/http";
import { notifyMany } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { parseJsonBody } from "@/lib/request";
import { checkRateLimit, rateLimitHeaders, rateLimitKey } from "@/lib/rate-limiter";
import { reportSchema } from "@/lib/schemas";
import { NotificationType } from "@prisma/client";

const RATE_LIMIT = { max: 5, windowMs: 60 * 60 * 1000 }; // 5 per hour

export async function POST(request: Request) {
  const rlKey = rateLimitKey("reports-post", request);
  const rl = checkRateLimit(rlKey, RATE_LIMIT);
  if (!rl.allowed) {
    return new Response(JSON.stringify({ error: "Too many reports submitted. Please try again later." }), {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)),
        ...rateLimitHeaders(rl, RATE_LIMIT.max),
      },
    });
  }

  const authResult = await requireUser(undefined, request);
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
