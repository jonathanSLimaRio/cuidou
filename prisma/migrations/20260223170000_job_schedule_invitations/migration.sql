-- CreateEnum
CREATE TYPE "JobInvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'EXPIRED', 'CANCELED');

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'INVITATION_RECEIVED';
ALTER TYPE "NotificationType" ADD VALUE 'INVITATION_STATUS_UPDATED';

-- CreateTable
CREATE TABLE "JobScheduleSlot" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "weekday" "Weekday" NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobScheduleSlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobInvitation" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "status" "JobInvitationStatus" NOT NULL DEFAULT 'PENDING',
    "message" TEXT,
    "responseMessage" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "respondedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "JobScheduleSlot_jobId_idx" ON "JobScheduleSlot"("jobId");

-- CreateIndex
CREATE UNIQUE INDEX "JobScheduleSlot_jobId_weekday_startTime_endTime_key" ON "JobScheduleSlot"("jobId", "weekday", "startTime", "endTime");

-- CreateIndex
CREATE INDEX "JobInvitation_jobId_status_idx" ON "JobInvitation"("jobId", "status");

-- CreateIndex
CREATE INDEX "JobInvitation_familyId_createdAt_idx" ON "JobInvitation"("familyId", "createdAt");

-- CreateIndex
CREATE INDEX "JobInvitation_professionalId_createdAt_idx" ON "JobInvitation"("professionalId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "JobInvitation_pending_unique" ON "JobInvitation"("jobId", "professionalId")
WHERE "status" = 'PENDING';

-- AddForeignKey
ALTER TABLE "JobScheduleSlot" ADD CONSTRAINT "JobScheduleSlot_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "JobPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobInvitation" ADD CONSTRAINT "JobInvitation_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "JobPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobInvitation" ADD CONSTRAINT "JobInvitation_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobInvitation" ADD CONSTRAINT "JobInvitation_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
