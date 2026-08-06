import { describe, expect, it, vi } from "vitest";
import { currentLegalDocuments, hasCurrentLegalConsent, recordCurrentLegalConsent } from "../legal-consent";

describe("legal consent", () => {
  it("requires timestamps and both current versions", () => {
    const accepted = {
      acceptedTermsAt: new Date(),
      acceptedPrivacyAt: new Date(),
      acceptedTermsVersion: "2026-08-06",
      acceptedPrivacyVersion: "2026-08-06",
    };
    expect(hasCurrentLegalConsent(accepted)).toBe(true);
    expect(hasCurrentLegalConsent({ ...accepted, acceptedPrivacyVersion: "legacy" })).toBe(false);
    expect(currentLegalDocuments()).toEqual({
      terms: { version: "2026-08-06", href: "/terms" },
      privacy: { version: "2026-08-06", href: "/privacy" },
    });
  });

  it("updates the fast lookup and appends immutable document records", async () => {
    const tx = {
      user: { update: vi.fn().mockResolvedValue({}) },
      legalConsent: { createMany: vi.fn().mockResolvedValue({ count: 2 }) },
    };
    await recordCurrentLegalConsent(tx as never, "user-1", "WEB");
    expect(tx.user.update).toHaveBeenCalledOnce();
    expect(tx.legalConsent.createMany).toHaveBeenCalledWith(
      expect.objectContaining({ skipDuplicates: true, data: expect.arrayContaining([expect.objectContaining({ userId: "user-1" })]) }),
    );
  });
});
