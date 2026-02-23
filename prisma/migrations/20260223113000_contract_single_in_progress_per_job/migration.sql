-- Enforce only one in-progress contract per job at database level.
CREATE UNIQUE INDEX "Contract_jobId_in_progress_unique"
ON "Contract" ("jobId")
WHERE "status" = 'IN_PROGRESS';
