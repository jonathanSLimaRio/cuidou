-- New users must be approved before accessing protected journeys.
-- Existing users keep their current status; this only changes the default
-- used by adapters (including OAuth account creation).
ALTER TABLE "User" ALTER COLUMN "status" SET DEFAULT 'PENDING';
