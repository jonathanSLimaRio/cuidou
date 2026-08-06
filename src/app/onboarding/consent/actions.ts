"use server";

import { auth, unstable_update } from "@/auth";
import { hasCurrentLegalConsent } from "@/lib/legal-consent";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export async function refreshLegalConsentSession() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      acceptedTermsAt: true,
      acceptedPrivacyAt: true,
      acceptedTermsVersion: true,
      acceptedPrivacyVersion: true,
    },
  });

  if (!user || !hasCurrentLegalConsent(user)) {
    throw new Error("Current legal consent has not been recorded.");
  }

  // The `trigger: update` JWT callback re-reads the user from the database;
  // no client-controlled consent version or status is trusted here.
  await unstable_update({ user: { needsLegalConsent: false } });
  redirect("/dashboard");
}
