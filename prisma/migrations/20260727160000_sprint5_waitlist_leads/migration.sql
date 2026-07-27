CREATE TABLE "WaitlistLead" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "role" "UserRole",
    "city" TEXT,
    "source" TEXT NOT NULL DEFAULT 'landing',
    "consentAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "WaitlistLead_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "WaitlistLead_email_key" ON "WaitlistLead"("email");
CREATE INDEX "WaitlistLead_createdAt_idx" ON "WaitlistLead"("createdAt");
CREATE INDEX "WaitlistLead_role_city_idx" ON "WaitlistLead"("role", "city");
