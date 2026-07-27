import { fail, ok } from "@/lib/http";
import {
  authenticateMobilePassword,
  createMobileSession,
  mobileAuthErrorResponse,
} from "@/lib/mobile-auth";
import { parseJsonBody } from "@/lib/request";
import { mobileLoginSchema } from "@/lib/schemas";
import { checkRateLimit, rateLimitHeaders, rateLimitKey } from "@/lib/rate-limiter";
import { ProductEventName, trackProductEvent } from "@/lib/product-events";

const RATE_LIMIT = { max: 10, windowMs: 15 * 60 * 1000 };

export async function POST(request: Request) {
  const rateLimit = await checkRateLimit(rateLimitKey("mobile-login", request), RATE_LIMIT);
  if (!rateLimit.allowed) {
    return new Response(JSON.stringify({ error: "Too many login attempts. Please try again later." }), {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)),
        ...rateLimitHeaders(rateLimit, RATE_LIMIT.max),
      },
    });
  }

  const bodyResult = await parseJsonBody(request, mobileLoginSchema);
  if ("response" in bodyResult) {
    return bodyResult.response ?? fail(422, "Invalid payload");
  }

  try {
    const user = await authenticateMobilePassword(bodyResult.data.email, bodyResult.data.password);
    trackProductEvent({ name: ProductEventName.LOGIN_COMPLETED, userId: user.id, metadata: { channel: "mobile" } });
    const response = ok(await createMobileSession(user));

    for (const [key, value] of Object.entries(rateLimitHeaders(rateLimit, RATE_LIMIT.max))) {
      response.headers.set(key, value);
    }

    return response;
  } catch (error) {
    return mobileAuthErrorResponse(error);
  }
}
