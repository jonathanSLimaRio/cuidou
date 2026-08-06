-- Version legal acceptance without inferring consent for users who never gave it.
ALTER TABLE "User"
  ADD COLUMN "acceptedTermsVersion" TEXT,
  ADD COLUMN "acceptedPrivacyVersion" TEXT;

CREATE TYPE "LegalDocumentType" AS ENUM ('TERMS', 'PRIVACY');
CREATE TYPE "LegalConsentSource" AS ENUM ('WEB', 'MOBILE', 'LEGACY');

CREATE TABLE "LegalConsent" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "document" "LegalDocumentType" NOT NULL,
  "version" TEXT NOT NULL,
  "source" "LegalConsentSource" NOT NULL,
  "acceptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LegalConsent_pkey" PRIMARY KEY ("id")
);

UPDATE "User"
SET "acceptedTermsVersion" = 'legacy'
WHERE "acceptedTermsAt" IS NOT NULL;

UPDATE "User"
SET "acceptedPrivacyVersion" = 'legacy'
WHERE "acceptedPrivacyAt" IS NOT NULL;

INSERT INTO "LegalConsent" ("id", "userId", "document", "version", "source", "acceptedAt")
SELECT CONCAT('legacy_terms_', "id"), "id", 'TERMS', 'legacy', 'LEGACY', "acceptedTermsAt"
FROM "User"
WHERE "acceptedTermsAt" IS NOT NULL;

INSERT INTO "LegalConsent" ("id", "userId", "document", "version", "source", "acceptedAt")
SELECT CONCAT('legacy_privacy_', "id"), "id", 'PRIVACY', 'legacy', 'LEGACY', "acceptedPrivacyAt"
FROM "User"
WHERE "acceptedPrivacyAt" IS NOT NULL;

CREATE UNIQUE INDEX "LegalConsent_userId_document_version_key"
  ON "LegalConsent"("userId", "document", "version");
CREATE INDEX "LegalConsent_userId_acceptedAt_idx"
  ON "LegalConsent"("userId", "acceptedAt");
CREATE INDEX "LegalConsent_document_version_acceptedAt_idx"
  ON "LegalConsent"("document", "version", "acceptedAt");

ALTER TABLE "LegalConsent"
  ADD CONSTRAINT "LegalConsent_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Consent evidence is append-only. Deletion remains possible only through the
-- user's ON DELETE CASCADE so LGPD erasure is not blocked.
CREATE FUNCTION prevent_legal_consent_update()
RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'LegalConsent records are immutable';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "LegalConsent_prevent_update"
BEFORE UPDATE ON "LegalConsent"
FOR EACH ROW EXECUTE FUNCTION prevent_legal_consent_update();
