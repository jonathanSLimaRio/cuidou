import { fail, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, rateLimitHeaders, rateLimitKey } from "@/lib/rate-limiter";
import { parseJsonBody } from "@/lib/request";
import { ProductEventName, trackProductEvent } from "@/lib/product-events";
import { leadCaptureSchema } from "@/lib/schemas";
import { Prisma } from "@prisma/client";

const RATE_LIMIT = { max: 5, windowMs: 60 * 60 * 1000 };

export async function POST(request: Request) {
  const rateLimit = await checkRateLimit(rateLimitKey("lead-capture", request), RATE_LIMIT);
  const headers = rateLimitHeaders(rateLimit, RATE_LIMIT.max);

  if (!rateLimit.allowed) {
    return new Response(JSON.stringify({ error: "Muitas tentativas. Tente novamente mais tarde." }), {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)),
        ...headers,
      },
    });
  }

  const bodyResult = await parseJsonBody(request, leadCaptureSchema);
  if ("response" in bodyResult) {
    const response = bodyResult.response ?? fail(400, "Invalid JSON body");
    for (const [key, value] of Object.entries(headers)) response.headers.set(key, value);
    return response;
  }

  const payload = bodyResult.data;
  const existing = await prisma.waitlistLead.findUnique({ where: { email: payload.email } });
  if (existing) {
    return ok({ lead: { id: existing.id, email: existing.email }, alreadySubscribed: true }, 200);
  }

  let lead;
  try {
    lead = await prisma.waitlistLead.create({
      data: {
        email: payload.email,
        name: payload.name || null,
        role: payload.role,
        city: payload.city || null,
        source: payload.source,
        consentAt: new Date(),
      },
      select: { id: true, email: true, createdAt: true },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const concurrent = await prisma.waitlistLead.findUniqueOrThrow({
        where: { email: payload.email },
        select: { id: true, email: true },
      });
      return ok({ lead: concurrent, alreadySubscribed: true }, 200);
    }
    throw error;
  }

  trackProductEvent({
    name: ProductEventName.LEAD_CAPTURED,
    metadata: { source: payload.source, role: payload.role ?? null, city: payload.city ?? null },
  });

  const response = ok({ lead, alreadySubscribed: false }, 201);
  for (const [key, value] of Object.entries(headers)) response.headers.set(key, value);
  return response;
}

export async function GET() {
  return fail(405, "Method not allowed");
}
