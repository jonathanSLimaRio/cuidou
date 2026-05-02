# Production Migration Reconciliation

The remote database had three migration records that were missing locally:

- `20260224010000_mobile_refresh_tokens`
- `20260226120000_add_user_instagram`
- `20260226143000_add_profile_address_fields`

Local placeholder migrations with the same names were added to make Prisma history auditable from the repository. Before production release:

1. Take a backup or provider snapshot of the production database.
2. Run `npx prisma migrate status` against production.
3. Confirm there are no migrations reported as "not found locally".
4. Apply pending local migrations with `npx prisma migrate deploy`.
5. Re-run `npx prisma migrate status` and keep the output with release evidence.
