import { requireUser } from "@/lib/auth-guard";
import { currentLegalDocuments, hasCurrentLegalConsent, recordCurrentLegalConsent } from "@/lib/legal-consent";
import { ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { parseJsonBody } from "@/lib/request";
import { legalConsentSchema } from "@/lib/schemas";
import { LegalConsentSource } from "@prisma/client";

export async function GET(request: Request) {
  const authResult = await requireUser(undefined, request);
  if ("response" in authResult) return authResult.response;

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: authResult.user.id },
    select: {
      acceptedTermsAt: true,
      acceptedPrivacyAt: true,
      acceptedTermsVersion: true,
      acceptedPrivacyVersion: true,
    },
  });

  return ok({
    documents: currentLegalDocuments(),
    hasCurrentConsent: hasCurrentLegalConsent(user),
  });
}

export async function POST(request: Request) {
  const authResult = await requireUser(undefined, request);
  if ("response" in authResult) return authResult.response;

  const bodyResult = await parseJsonBody(request, legalConsentSchema);
  if ("response" in bodyResult) return bodyResult.response;

  await prisma.$transaction((tx) =>
    recordCurrentLegalConsent(
      tx,
      authResult.user.id,
      request.headers.get("authorization") ? LegalConsentSource.MOBILE : LegalConsentSource.WEB,
    ),
  );

  return ok({ documents: currentLegalDocuments(), hasCurrentConsent: true });
}
