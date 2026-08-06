import type { Prisma, User } from "@prisma/client";
import { LegalConsentSource, LegalDocumentType } from "@prisma/client";

export const CURRENT_TERMS_VERSION = "2026-08-06";
export const CURRENT_PRIVACY_VERSION = "2026-08-06";

type ConsentState = Pick<
  User,
  "acceptedTermsAt" | "acceptedPrivacyAt" | "acceptedTermsVersion" | "acceptedPrivacyVersion"
>;

export function hasCurrentLegalConsent(user: ConsentState) {
  return Boolean(
    user.acceptedTermsAt &&
      user.acceptedPrivacyAt &&
      user.acceptedTermsVersion === CURRENT_TERMS_VERSION &&
      user.acceptedPrivacyVersion === CURRENT_PRIVACY_VERSION,
  );
}

export function currentLegalDocuments() {
  return {
    terms: { version: CURRENT_TERMS_VERSION, href: "/terms" },
    privacy: { version: CURRENT_PRIVACY_VERSION, href: "/privacy" },
  } as const;
}

export async function recordCurrentLegalConsent(
  tx: Prisma.TransactionClient,
  userId: string,
  source: LegalConsentSource,
) {
  const acceptedAt = new Date();

  await tx.user.update({
    where: { id: userId },
    data: {
      acceptedTermsAt: acceptedAt,
      acceptedPrivacyAt: acceptedAt,
      acceptedTermsVersion: CURRENT_TERMS_VERSION,
      acceptedPrivacyVersion: CURRENT_PRIVACY_VERSION,
    },
  });

  await tx.legalConsent.createMany({
    skipDuplicates: true,
    data: [
      {
        userId,
        document: LegalDocumentType.TERMS,
        version: CURRENT_TERMS_VERSION,
        source,
        acceptedAt,
      },
      {
        userId,
        document: LegalDocumentType.PRIVACY,
        version: CURRENT_PRIVACY_VERSION,
        source,
        acceptedAt,
      },
    ],
  });

  return acceptedAt;
}
