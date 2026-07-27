CREATE TABLE "MobileRefreshToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "replacedByTokenHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" TIMESTAMP(3),

    CONSTRAINT "MobileRefreshToken_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MobileRefreshToken_tokenHash_key" ON "MobileRefreshToken"("tokenHash");
CREATE INDEX "MobileRefreshToken_userId_revokedAt_idx" ON "MobileRefreshToken"("userId", "revokedAt");
CREATE INDEX "MobileRefreshToken_expiresAt_idx" ON "MobileRefreshToken"("expiresAt");

ALTER TABLE "MobileRefreshToken"
ADD CONSTRAINT "MobileRefreshToken_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
