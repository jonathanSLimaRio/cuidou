# Push Validation Checklist (Sprint 1)

Date: 2026-04-08  
Scope: notification tap routing validation after Sprint 1 fixes.

## Preconditions

1. User is authenticated.
2. Push token is registered successfully.
3. Test notification payload contains `notificationType` and related IDs.

## Family Account

- [ ] Foreground tap on `APPLICATION_RECEIVED` opens `/(family)/pipeline`.
- [ ] Background tap on `APPLICATION_RECEIVED` opens `/(family)/pipeline`.
- [ ] Cold-start tap on `APPLICATION_RECEIVED` opens `/(family)/pipeline`.
- [ ] Foreground/background/cold-start on `INVITATION_STATUS_UPDATED` opens `/(family)/invitations`.

## Professional Account

- [ ] Foreground/background/cold-start on `INVITATION_STATUS_UPDATED` opens `/(professional)/invitations`.
- [ ] Foreground/background/cold-start on `APPLICATION_STATUS_UPDATED` opens `/(professional)/applications`.

## Family Account - application status

- [ ] Foreground/background/cold-start on `APPLICATION_STATUS_UPDATED` opens `/(family)/pipeline`.

## Cross-checks

- [ ] Same notification response is not handled twice (no duplicate navigation).
- [ ] Notification without required payload (`CHAT_MESSAGE` without `conversationId`) does not navigate.
- [ ] No crash in notification handling path.

## Evidence

- [ ] Screen recording or screenshots per scenario.
- [ ] Timestamp and tester name for each run.
- [ ] Final status summary attached to `SPRINT_1_EVIDENCIAS_EXECUCAO.md`.
