# Local Credit Balance Caching

## Overview

Prevent credit overconsumption by maintaining a local credit balance in Postgres that is atomically deducted on each consumption. The local balance syncs with Polar on every read (taking the lower value) and is invalidated on purchase/renewal via webhook.

## Job to Be Done

Prevent users from consuming more credits than they've paid for when making rapid concurrent requests, which is possible today because Polar's balance updates are eventually consistent.

## Target User

Any authenticated user consuming credits. This is an infrastructure-level protection, not a user-facing feature.

## Requirements

### Must Have

- [ ] `CreditBalance` Prisma model: `userId + meterId` (unique), `balance` (Int), `updatedAt`
- [ ] Relation: `User` has many `CreditBalance` entries (one per meter)
- [ ] **Atomic deduction**: `UPDATE credit_balance SET balance = balance - $amount WHERE userId = $userId AND meterId = $meterId AND balance >= $amount` — returns 0 rows if insufficient
- [ ] **Sync on read**: `getCreditsBalance` fetches from Polar, upserts local row with `min(local, polar)` balance
- [ ] **Initial state**: If no local row exists, create one from Polar's balance
- [ ] **Webhook invalidation**: On `onCustomerStateChanged` or `onOrderPaid`, delete local `CreditBalance` rows for that user — forces fresh Polar fetch on next check
- [ ] **Strict local check**: If local balance is 0, deny immediately (no Polar fallback)
- [ ] Refactor `assertHasCredits` to deduct locally instead of just checking Polar
- [ ] Refactor `ingestUsage` to still fire-and-forget to Polar (no change to ingestion flow)
- [ ] `hasCredits` reads from local balance (after sync-on-read)

### Nice to Have

- [ ] Polar fallback when local balance is 0 (manual refresh endpoint)
- [ ] Admin endpoint to force-sync a user's balance
- [ ] Metrics/logging for sync discrepancies

## Constraints

- Postgres only — no Redis or in-memory state (Next.js serverless-compatible)
- Polar remains the source of truth for actual balance; local is a pessimistic cache
- Conflict resolution: `min(local, polar)` — always take the lower value to prevent overconsumption
- `ingestUsage` remains fire-and-forget (action already completed when called)
- All existing callers of `assertHasCredits` / `hasCredits` / `getCreditsBalance` must work without changes

## Acceptance Criteria

- [ ] Concurrent requests from same user cannot double-spend credits (atomic deduction prevents race condition)
- [ ] First credit check for a user creates a local `CreditBalance` row from Polar
- [ ] Subsequent credit checks sync local balance with Polar using `min(local, polar)`
- [ ] When a user purchases credits or subscription renews, webhook deletes local row
- [ ] Next credit check after purchase creates fresh row from Polar (reflecting new balance)
- [ ] If local balance is 0, request is denied immediately without Polar API call
- [ ] Existing `assertHasCredits` / `hasCredits` / `getCreditsBalance` API unchanged (backward compatible)
- [ ] `ingestUsage` behavior unchanged (still fire-and-forget to Polar)
- [ ] Prisma migration runs cleanly on existing database

## Edge Cases

- **No Polar customer**: Return null/0 balance as today — no local row created
- **Polar API error during sync**: Use existing local balance if available; if no local row, throw error (fail-safe, same as today)
- **Webhook fires before any local row exists**: Delete is a no-op, next check creates fresh from Polar
- **Negative Polar balance**: Treat as 0 (existing behavior), local row stores 0
- **Concurrent sync + deduction**: Use `SELECT FOR UPDATE` or atomic UPDATE to prevent race between sync and deduction
- **Multiple meters**: Each meter has its own local row (`userId + meterId` unique constraint)
- **User deletes account**: `CreditBalance` rows cascade-deleted via User relation

## Out of Scope

- Redis caching layer
- Transaction/audit log of individual deductions
- Date-range filtering or historical balance tracking
- Admin UI for balance management
- Real-time balance notifications
- Retry queue for failed `ingestUsage` calls

## Technical Hints

- **Files to modify**:
  - `prisma/schema.prisma` — add `CreditBalance` model with `userId + meterId` unique constraint
  - `src/features/credits/services/credits.service.ts` — refactor `getCreditsBalance`, `hasCredits`, `assertHasCredits` to use local balance
  - `src/features/credits/models/credits.model.ts` — update types if needed
  - `src/lib/auth.ts` — add local row deletion in `onCustomerStateChanged` and `onOrderPaid` handlers
- **Files to create**:
  - `prisma/migrations/XXXXXX_add_credit_balance/migration.sql` — via `pnpm db:migrate`
- **Patterns to follow**:
  - `Subscription` model in `schema.prisma` — similar user relation with `@unique` and `onDelete: Cascade`
  - `syncSubscription` in billing service — webhook-triggered DB update pattern
  - `getCreditsBalance` existing error handling — `ResourceNotFound` catch, logger usage
- **Key Prisma pattern for atomic deduction**:
  ```prisma
  // Atomic: only succeeds if balance >= amount
  const result = await prisma.creditBalance.updateMany({
    where: { userId, meterId, balance: { gte: amount } },
    data: { balance: { decrement: amount } },
  });
  // result.count === 0 means insufficient balance
  ```
- **Dependencies**: Existing credits feature, Polar webhooks in `src/lib/auth.ts`

## Verification Commands

| Criterion | Command |
|-----------|---------|
| Prisma model exists | `grep -q "model CreditBalance" prisma/schema.prisma && echo pass` |
| Unique constraint on userId+meterId | `grep -A5 "model CreditBalance" prisma/schema.prisma \| grep -q "@@unique" && echo pass` |
| Webhook deletes local rows | `grep -q "creditBalance" src/lib/auth.ts && echo pass` |
| Atomic deduction pattern | `grep -q "decrement" src/features/credits/services/credits.service.ts && echo pass` |
| Migration exists | `ls prisma/migrations/*credit_balance* && echo pass` |
| Build passes | `pnpm build` |
| DB migration runs | `pnpm db:push` |

## Test Requirements

- [ ] Test: Atomic deduction returns success when balance >= amount
- [ ] Test: Atomic deduction returns failure when balance < amount (no partial deduction)
- [ ] Test: Concurrent deductions on same user cannot exceed balance (race condition test)
- [ ] Test: First `getCreditsBalance` call creates local row from Polar
- [ ] Test: Subsequent `getCreditsBalance` syncs with `min(local, polar)`
- [ ] Test: Webhook handler deletes local `CreditBalance` rows for user
- [ ] Test: Next check after row deletion creates fresh row from Polar
- [ ] Test: No Polar customer returns null (no local row created)
- [ ] Test: Polar API error with existing local row uses local balance
- [ ] Test: Polar API error with no local row throws error (fail-safe)
