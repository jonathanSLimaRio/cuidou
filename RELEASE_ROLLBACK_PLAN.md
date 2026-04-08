# Release Rollback Plan

Version: Sprint 1 Retomada  
Date: 2026-04-08

## Trigger Conditions

Execute rollback if any of the following happens after deploy:

1. Login/onboarding failure rate spikes above baseline.
2. Push tap opens wrong route for critical notification flows.
3. Chat or application flow becomes unavailable for > 5 minutes.
4. Unhandled error spike detected in web or mobile monitoring.

## Rollback Execution

1. Freeze new deploys and announce incident in team channel.
2. Promote previous stable web deployment.
3. Disable current mobile rollout (if staged release) and keep last stable build.
4. Revert backend/mobile config flags introduced in current release.
5. Re-run health checks and smoke critical paths.

## Validation After Rollback

1. `GET /api/health` returns `200` with DB healthy.
2. Login (family/professional/admin) works.
3. Family can create job; professional can apply.
4. Chat route opens and sends message.
5. Push opens expected screen from notification tap.

## Evidence Required

1. Rollback start/end timestamps.
2. Deployment/build identifiers reverted.
3. Command outputs from post-rollback health and smoke checks.
4. Incident summary and next preventive action.
