import { fail, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { parseJsonBody } from "@/lib/request";
import { checkRateLimit, rateLimitHeaders, rateLimitKey } from "@/lib/rate-limiter";
import { localSignupSchema } from "@/lib/schemas";
import { UserStatus } from "@prisma/client";
import { hash } from "bcryptjs";

const RATE_LIMIT = { max: 5, windowMs: 60 * 60 * 1000 }; // 5 per hour

function withSignupRateLimitHeaders(
  response: Response,
  rl: Awaited<ReturnType<typeof checkRateLimit>>,
) {
  for (const [key, value] of Object.entries(rateLimitHeaders(rl, RATE_LIMIT.max))) {
    response.headers.set(key, value);
  }
  return response;
}

export async function POST(request: Request) {
  const rlKey = rateLimitKey("signup", request);
  const rl = await checkRateLimit(rlKey, RATE_LIMIT);
  if (!rl.allowed) {
    return new Response(JSON.stringify({ error: "Too many signup attempts. Please try again later." }), {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)),
        ...rateLimitHeaders(rl, RATE_LIMIT.max),
      },
    });
  }

  const bodyResult = await parseJsonBody(request, localSignupSchema);
  if ("response" in bodyResult) {
    return withSignupRateLimitHeaders(bodyResult.response ?? fail(400, "Invalid JSON body"), rl);
  }

  const payload = bodyResult.data;
  const email = payload.email.trim().toLowerCase();

  const existing = await prisma.user.findFirst({
    where: {
      email: {
        equals: email,
        mode: "insensitive",
      },
    },
    select: { id: true },
  });

  if (existing) {
    return fail(409, "Já existe uma conta com este e-mail.");
  }

  const passwordHash = await hash(payload.password, 12);

  await prisma.user.create({
    data: {
      name: payload.name.trim(),
      email,
      passwordHash,
      status: UserStatus.PENDING,
      // If the user selected a role at signup, store it so onboarding can skip the picker.
      role: payload.role ?? null,
    },
  });

  const roleLabel =
    payload.role === "FAMILY"
      ? "família"
      : payload.role === "PROFESSIONAL"
        ? "profissional"
        : null;

  const message = roleLabel
    ? `Cadastro enviado como ${roleLabel}. Sua conta está pendente de aprovação da equipe administrativa.`
    : "Cadastro enviado. Sua conta está pendente de aprovação da equipe administrativa.";

  return withSignupRateLimitHeaders(ok({ message }, 201), rl);
}
