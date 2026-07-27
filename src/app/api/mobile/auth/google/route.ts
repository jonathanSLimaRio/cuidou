import { fail, ok } from "@/lib/http";
import {
  createMobileSession,
  mobileAuthErrorResponse,
  MobileAuthError,
} from "@/lib/mobile-auth";
import { parseJsonBody } from "@/lib/request";
import { mobileGoogleSchema } from "@/lib/schemas";
import { prisma } from "@/lib/prisma";
import { UserStatus } from "@prisma/client";

type GoogleTokenInfo = {
  aud?: string;
  email?: string;
  email_verified?: string;
  name?: string;
  picture?: string;
};

export async function POST(request: Request) {
  const bodyResult = await parseJsonBody(request, mobileGoogleSchema);
  if ("response" in bodyResult) {
    return bodyResult.response ?? fail(422, "Invalid payload");
  }

  const acceptedClientIds = [
    process.env.AUTH_GOOGLE_ID,
    process.env.GOOGLE_CLIENT_ID,
    ...(process.env.MOBILE_GOOGLE_CLIENT_IDS?.split(",") ?? []),
  ]
    .map((value) => value?.trim())
    .filter((value): value is string => Boolean(value));

  if (acceptedClientIds.length === 0) {
    return mobileAuthErrorResponse(
      new MobileAuthError(
        503,
        "google_not_configured",
        "Google login is not configured for this environment.",
      ),
    );
  }

  try {
    const verification = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(bodyResult.data.idToken)}`,
      { signal: AbortSignal.timeout(5_000) },
    );

    if (!verification.ok) {
      throw new MobileAuthError(401, "google_token_invalid", "Token Google inválido.");
    }

    const claims = (await verification.json()) as GoogleTokenInfo;
    if (
      !claims.aud ||
      !acceptedClientIds.includes(claims.aud) ||
      !claims.email ||
      claims.email_verified !== "true"
    ) {
      throw new MobileAuthError(401, "google_token_invalid", "Token Google inválido.");
    }

    const user = await prisma.user.upsert({
      where: { email: claims.email.toLowerCase() },
      update: {
        name: claims.name ?? undefined,
        image: claims.picture ?? undefined,
        emailVerified: new Date(),
      },
      create: {
        email: claims.email.toLowerCase(),
        name: claims.name ?? null,
        image: claims.picture ?? null,
        emailVerified: new Date(),
        // New OAuth accounts follow the same approval policy as password signups.
        status: UserStatus.PENDING,
      },
      select: { id: true, email: true, name: true, role: true, status: true },
    });

    if (user.status === UserStatus.PENDING) {
      throw new MobileAuthError(403, "pending_approval", "Sua conta está pendente de aprovação.");
    }
    if (user.status === UserStatus.SUSPENDED) {
      throw new MobileAuthError(403, "account_suspended", "Sua conta está suspensa.");
    }
    if (user.status === UserStatus.BANNED) {
      throw new MobileAuthError(403, "account_banned", "Sua conta foi banida.");
    }

    return ok(await createMobileSession(user));
  } catch (error) {
    return mobileAuthErrorResponse(error);
  }
}
