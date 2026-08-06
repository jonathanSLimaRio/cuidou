import { requireUser } from "@/lib/auth-guard";
import { fail, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { parseJsonBody } from "@/lib/request";
import { onboardingRoleSchema } from "@/lib/schemas";
import { recordCurrentLegalConsent } from "@/lib/legal-consent";
import { LegalConsentSource, UserRole } from "@prisma/client";

export async function POST(request: Request) {
  const authResult = await requireUser(undefined, request);
  if ("response" in authResult) {
    return authResult.response;
  }

  const { user } = authResult;

  if (user.role) {
    return fail(409, "Role already defined for this account");
  }

  const bodyResult = await parseJsonBody(request, onboardingRoleSchema);
  if ("response" in bodyResult) {
    return bodyResult.response;
  }

  const { role } = bodyResult.data;

  const updatedUser = await prisma.$transaction(async (tx) => {
    const updated = await tx.user.update({
      where: { id: user.id },
      data: {
        role,
      },
      select: {
        id: true,
        role: true,
      },
    });

    const consentSource = request.headers.get("x-cuidou-client") === "mobile"
      ? LegalConsentSource.MOBILE
      : LegalConsentSource.WEB;
    await recordCurrentLegalConsent(tx, user.id, consentSource);

    if (role === UserRole.FAMILY) {
      await tx.familyProfile.upsert({
        where: { userId: user.id },
        update: {},
        create: {
          userId: user.id,
        },
      });
    }

    if (role === UserRole.PROFESSIONAL) {
      await tx.professionalProfile.upsert({
        where: { userId: user.id },
        update: {},
        create: {
          userId: user.id,
          serviceTypes: [],
        },
      });
    }

    return updated;
  });

  return ok({
    user: updatedUser,
    nextPath: role === UserRole.FAMILY ? "/family" : "/professional",
  });
}
