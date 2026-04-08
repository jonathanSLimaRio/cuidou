# Sprint 1 Final Report (Interim)

Date: 2026-04-08  
Scope: Sprint 1 Retomada - Release Readiness

## Summary

- Critical mobile push routing was implemented with test coverage.
- Mobile release readiness foundations were implemented (EAS + version/build + Sentry MVP).
- Documentation drift was reduced across baseline/readiness files.
- Regression/predeploy gates were executed and failed due pre-existing project issues.

## Delivered

1. Push routing contract and resolver extracted to pure function.
2. `APPLICATION_RECEIVED` routed to family pipeline.
3. `INVITATION_STATUS_UPDATED` routed by authenticated role.
4. Cold-start handling waits for auth hydration and deduplicates repeated notification responses.
5. Unit tests added for notification routing matrix.
6. `eas.json` added with `preview` and `production` profiles.
7. `ios.buildNumber` and `android.versionCode` configured.
8. Sentry MVP wired for init, user context, and error boundary capture.
9. `.env.exemple` aligned with runtime/spec (`LOCAL_UPLOAD_DIR`, `HOST`, `PORT`).

## Pending Gates

1. Fix root lint errors (`react-hooks/set-state-in-effect`, require imports, etc.).
2. Fix root typecheck/test blockers (`pushToken` prisma typing, test globals, `DATABASE_URL` for integration suites).
3. Install/enable Maestro and run the 3 mobile flows.
4. Fix EAS CLI module issue (`@expo/eas-build-job`) and rerun preview build dry-run.
5. Rerun `npm run predeploy` and `npm run check:health` on a running local stack.

## Gate Execution Snapshot

- `npm run lint` (root): FAIL
- `npm run typecheck` (root): FAIL
- `npm run test` (root): FAIL
- `npm run test:e2e` (root): FAIL
- `npm run predeploy`: FAIL
- `npm run check:health`: FAIL
- `npx vitest run src/lib/__tests__/notification-routing-mobile.test.ts`: PASS (8/8)
- `npm run lint` (CuidouApp): PASS
- `npx tsc --noEmit` (CuidouApp): FAIL
- `maestro --version`: BLOCKED (command not found)
- `npm exec eas-cli -- --version`: PASS
- `npm exec eas-cli -- build --platform android --profile preview --non-interactive --no-wait`: FAIL

## Decision

Current status: **CARRY-OVER (temporary)**  
Reason: gates were validated and currently fail (lint/typecheck/test/e2e/predeploy/health + mobile Maestro/EAS blockers).

Go criteria once environment is unblocked:

- All regression commands pass without blockers.
- Push smoke passes in foreground/background/cold-start for family and professional roles.
- EAS preview build succeeds and release checklist has attached evidence.
