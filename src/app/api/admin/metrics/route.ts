import { requireUser } from "@/lib/auth-guard";
import { getAdminMetrics } from "@/lib/admin-metrics";
import { ok } from "@/lib/http";
import { adminMetricsQuerySchema } from "@/lib/schemas";
import { UserRole } from "@prisma/client";

export async function GET(request: Request) {
  const authResult = await requireUser([UserRole.ADMIN], request);
  if ("response" in authResult) {
    return authResult.response;
  }

  const { searchParams } = new URL(request.url);

  const parsed = adminMetricsQuerySchema.safeParse({
    window: searchParams.get("window") ?? undefined,
  });

  const windowDays = parsed.success ? Number(parsed.data.window) : 30;
  const metrics = await getAdminMetrics(windowDays as 7 | 30 | 90);

  return ok(metrics);
}
