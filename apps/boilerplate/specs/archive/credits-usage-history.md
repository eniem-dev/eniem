# Credits Usage History

## Overview

Add a Credits Usage History section to the billing page showing recent credit consumption events, with a dedicated full-page view for browsing all history with pagination.

## Job to Be Done

Users want to **audit their credit spending** — see what they used credits on, when, and how much — to understand and control their usage.

## Target User

Authenticated users with an active subscription that includes usage-based credits.

## Requirements

### Must Have

- [ ] Service function to fetch usage events from Polar (`polarClient.events.list()`) by customer ID
- [ ] Usage event type model (`UsageHistoryEvent`) with: name, timestamp, amount/credits consumed, metadata
- [ ] Server query (`getCreditsUsageQuery`) wrapping the service, returning last 20 events
- [ ] `CreditsUsageHistoryCard` component for billing page — shows last 20 events in a card (follows `OrderHistoryCard` pattern: desktop table + mobile cards)
- [ ] Each event row shows: event name, timestamp, credits consumed as primary info
- [ ] Metadata displayed as secondary info via tooltip with info icon (circle-i)
- [ ] Empty state: simple "No usage yet" text message (same pattern as `OrderHistoryCard.noOrders`)
- [ ] Loading skeleton state
- [ ] "Show more" link at bottom of card, linking to `/account/billing/usage`
- [ ] Dedicated `/account/billing/usage` page with full usage history
- [ ] "Load more" button pagination on the dedicated page (cursor-based via Polar API)
- [ ] Add `CreditsUsageHistoryCard` to `BillingOverview` component (below `OrderHistoryCard`)
- [ ] All user-facing text in `locales/index.ts`

### Nice to Have

- [ ] Date range filtering (presets: last 7 days, 30 days, all time)
- [ ] Per-meter filtering when multiple meters exist

## Constraints

- All events from all meters shown in a single combined list (no per-meter separation)
- Credit balance display is out of scope (already exists as separate component)
- Follow existing `OrderHistoryCard` responsive pattern (desktop table / mobile cards)
- Use `createAuthenticatedQuery` pattern for server-side data fetching
- Polar SDK `events.list()` is the data source

## Acceptance Criteria

- [ ] Billing page shows a "Credits Usage History" card below order history
- [ ] Card displays up to 20 most recent usage events with name, timestamp, credits consumed
- [ ] Each event row has an info icon tooltip showing metadata when metadata exists
- [ ] Empty state shows "No usage yet" when no events exist
- [ ] Loading state shows skeleton placeholders
- [ ] "Show more" link navigates to `/account/billing/usage`
- [ ] Dedicated usage page loads initial batch and supports "Load more" to fetch next page
- [ ] Component is responsive: table on desktop, stacked cards on mobile
- [ ] Users without a Polar customer ID see the empty state (no errors)

## Edge Cases

- **No Polar customer**: Return empty list, show "No usage yet" — no error thrown
- **Polar API error**: Log error, show error state in card (similar to `ErrorCard` pattern)
- **Events with no metadata**: Hide info icon tooltip entirely for that row
- **Events with empty metadata object**: Treat same as no metadata
- **Zero events returned**: Show empty state message
- **Rapid "Load more" clicks**: Disable button while loading next page

## Out of Scope

- Credit balance display on billing page
- Date range filtering (nice-to-have for later)
- Per-meter filtering
- Real-time / WebSocket updates
- CSV/PDF export of usage history

## Technical Hints

- **Files to modify**:
  - `src/features/credits/models/credits.model.ts` — add `UsageHistoryEvent` type
  - `src/features/credits/index.ts` — export new service, query, component
  - `src/features/billing/components/billing-overview.tsx` — add `CreditsUsageHistoryCard`
  - `src/locales/index.ts` — add usage history labels
- **Files to create**:
  - `src/features/credits/services/credits-usage.service.ts` — `getUsageHistory()` using `polarClient.events.list()`
  - `src/features/credits/queries/credits-usage.query.ts` — `getCreditsUsageQuery()`
  - `src/features/credits/components/credits-usage-history-card.tsx` — billing page card (last 20)
  - `src/app/(protected)/account/billing/usage/page.tsx` — dedicated full history page
- **Patterns to follow**:
  - `OrderHistoryCard` (`src/features/billing/components/order-history-card.tsx`) — desktop table + mobile cards, empty state, locales pattern
  - `credits.query.ts` — `createAuthenticatedQuery` wrapper pattern
  - `credits.service.ts` — Polar SDK error handling with logger
- **Dependencies**: Existing credits feature (`src/features/credits/`), Polar SDK `events.list()` API

## Verification Commands

| Criterion | Command |
|-----------|---------|
| Service file exists | `test -f src/features/credits/services/credits-usage.service.ts && echo pass` |
| Query file exists | `test -f src/features/credits/queries/credits-usage.query.ts && echo pass` |
| Component file exists | `test -f src/features/credits/components/credits-usage-history-card.tsx && echo pass` |
| Usage page exists | `test -f "src/app/(protected)/account/billing/usage/page.tsx" && echo pass` |
| BillingOverview imports component | `grep -q "CreditsUsageHistoryCard" src/features/billing/components/billing-overview.tsx && echo pass` |
| Locales updated | `grep -q "creditsUsageHistoryCard" src/locales/index.ts && echo pass` |
| Exports updated | `grep -q "CreditsUsageHistoryCard" src/features/credits/index.ts && echo pass` |
| Build passes | `pnpm build` |

## Test Requirements

- [ ] Test: `getUsageHistory` returns formatted events from Polar API
- [ ] Test: `getUsageHistory` returns empty array when no customer exists
- [ ] Test: `getUsageHistory` handles Polar API errors gracefully
- [ ] Test: `CreditsUsageHistoryCard` renders event rows with name, timestamp, credits
- [ ] Test: `CreditsUsageHistoryCard` shows empty state when no events
- [ ] Test: `CreditsUsageHistoryCard` shows tooltip only when metadata exists
- [ ] Test: Usage page "Load more" fetches and appends next page of results
