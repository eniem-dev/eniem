# Usage-Based Credits

## References

- [Polar: Usage-Based Billing Introduction](https://polar.sh/docs/features/usage-based-billing/introduction)
- [Polar: Credits](https://polar.sh/docs/features/usage-based-billing/credits)
- [Polar: Credits Benefit](https://polar.sh/docs/features/benefits/credits)
- [Polar: LLM Ingestion Strategy](https://polar.sh/docs/features/usage-based-billing/ingestion-strategies/llm-strategy)
- [Polar: Event Ingestion](https://polar.sh/docs/features/usage-based-billing/event-ingestion)
- [AI SDK: Fal Provider](https://ai-sdk.dev/providers/ai-sdk-providers/fal)

## Overview

A credits system that integrates with Polar's usage-based billing to let SaaS builders offer pay-as-you-go or credit-based pricing for AI features (LLM, image generation, etc.). Users receive credits via subscription benefits, the system tracks consumption against Polar meters, and enforces usage limits since Polar doesn't block overage.

## Problem Statement

**Who:** Developers using eniem-boilerplate to build AI-powered SaaS products

**Problem:** Polar provides usage-based billing infrastructure (meters, credits, ingestion) but doesn't block usage when credits run out. Developers need to implement their own enforcement, balance display, and ingestion logic.

**Impact:** Without this, every boilerplate user must:
- Build their own credit balance fetching and display
- Implement server-side guards to prevent overage
- Wire up event ingestion to Polar
- Handle edge cases (API failures, no subscription, etc.)

## User Stories

### Primary Flow: Credit Consumption

- [ ] As a developer, I can check a user's credit balance so that I can show remaining credits in the UI
- [ ] As a developer, I can verify sufficient credits before an action so that I prevent usage when balance is zero
- [ ] As a developer, I can ingest usage events to Polar so that consumption is tracked against the user's meter
- [ ] As a developer, I can block actions when credits are depleted so that users don't exceed their allocation

### Secondary Flow: UI Display

- [ ] As a developer, I can use a balance display component so that users see their remaining credits
- [ ] As a developer, I can use a hook to fetch credits so that I can build custom UI
- [ ] As a developer, I can prompt users to upgrade when out of credits so that they can continue using the feature

### Secondary Flow: Enforcement

- [ ] As a developer, I can disable UI elements when credits are low so that users know they can't perform actions
- [ ] As a developer, I can guard server actions so that even if UI is bypassed, the server rejects the request

## Business Rules

### Permissions

- User must be authenticated to access credits system
- User must have a Polar customerId (from subscription/order) to have credits
- Credits are tied to specific Polar meters configured in Polar dashboard

### Validation

- `meterId`: Required for all balance/ingest operations. Must match a meter in Polar.
- `customerId`: Required. Fetched from user's Polar subscription data.
- `amount`: Required for ingestion. Positive number representing units consumed.

### Limits & Constraints

- Balance cannot go below 0 for blocking purposes (Polar allows negative)
- Server-side check is mandatory before any credit-consuming action
- If Polar API unavailable during balance check → block action (fail-safe)

### Time-based Rules

- Credits refresh at subscription period start (monthly/yearly) - managed by Polar
- No local expiration tracking - Polar is source of truth

## Data Model

### External Data (from Polar API)

**CreditBalance** (fetched from Polar Customer State API)
| Property | Type | Description |
|----------|------|-------------|
| meterId | string | Polar meter identifier |
| balance | number | Current available credits |
| customerId | string | Polar customer identifier |

**UsageEvent** (sent via `polar.events.ingest()`)
| Property | Type | Description |
|----------|------|-------------|
| name | string | Event type (matches meter filter) |
| customer_id | string | Polar customer identifier |
| metadata | object | Usage data (tokens, units, model, provider, etc.) |

Note: Events are immutable once ingested - cannot be changed or deleted.

### Local Data

No local database storage. All data fetched from Polar API.

The `customerId` is obtained from existing subscription data (already stored via BetterAuth Polar integration).

### Relationships

- User (app) → has one → Polar Customer (via subscription)
- Polar Customer → has many → Meter Balances
- Meter Balance → belongs to → Meter (configured in Polar dashboard)

## API Specification

### Service Functions

```typescript
// Get credit balance for a meter
getCreditsBalance(userId: string, meterId: string): Promise<CreditBalance>

// Check if user has sufficient credits
hasCredits(userId: string, meterId: string, requiredAmount: number): Promise<boolean>

// Ingest usage event to Polar via polar.events.ingest()
ingestUsage(userId: string, eventName: string, metadata: object): Promise<void>

// Get user's Polar customer ID (from subscription data)
getCustomerId(userId: string): Promise<string | null>
```

### Server-Side Guard

```typescript
// Throws error if insufficient credits
assertHasCredits(userId: string, meterId: string, requiredAmount: number): Promise<void>
```

### React Hooks

```typescript
// Fetch credit balance with SWR/React Query patterns
useCredits(meterId: string): { balance: number; isLoading: boolean; error: Error | null }
```

## UI/UX Specification

### Component: CreditBalance

**Purpose:** Display user's current credit balance in navbar/header

**Entry point:** Imported from `@/features/credits`

**Props:**
| Prop | Type | Required | Description |
|------|------|----------|-------------|
| meterId | string | Yes | Which meter to show balance for |
| showUpgradePrompt | boolean | No | Show CTA when balance is 0 |
| className | string | No | Additional styling |

**States:**
| State | Display |
|-------|---------|
| Loading | Skeleton/spinner |
| No customer | "Subscribe to get credits" with link |
| Has balance | Credit count (e.g., "150 credits") |
| Zero balance | "0 credits" + upgrade prompt if enabled |
| Error | Silent fail (log error, show nothing or "--") |

**Interactions:**
| Element | Action | Result |
|---------|--------|--------|
| Upgrade link | Click | Navigate to pricing/upgrade page |

### Navigation Flow

```
[Any page with credit-consuming feature]
  → [User clicks action button]
  → [Check credits client-side]
  → [If 0: show upgrade prompt, disable button]
  → [If >0: proceed to server action]
  → [Server validates again]
  → [Perform action]
  → [Ingest usage]
  → [UI refreshes balance]
```

## Edge Cases

### Error Scenarios

| Scenario | Expected Behavior |
|----------|-------------------|
| Polar API down on balance check | Block action, log error, show generic error to user |
| Polar API down on ingest | Log error. Action already completed - event lost (consider local queue for retry). |
| Invalid meterId | Throw error, log for developer debugging |
| No customerId (no subscription) | Block with "Subscribe to get credits" prompt |
| Negative balance in Polar | Treat as 0 for blocking purposes |

### Boundary Conditions

| Condition | Expected Behavior |
|-----------|-------------------|
| Exactly 0 credits | Block action, show upgrade prompt |
| Exactly required credits | Allow action (>=, not >) |
| Very large balance | Display normally (no upper limit UI) |
| Multiple meters | Each checked independently |

## Acceptance Criteria

### Get Credit Balance

- [ ] **Given** authenticated user with subscription, **when** calling getCreditsBalance, **then** return balance from Polar API
- [ ] **Given** user without subscription, **when** calling getCreditsBalance, **then** return null/error indicating no customer
- [ ] **Given** Polar API failure, **when** calling getCreditsBalance, **then** throw error (don't return stale data)

### Check Credits Before Action

- [ ] **Given** user with 100 credits, **when** action requires 50, **then** hasCredits returns true
- [ ] **Given** user with 0 credits, **when** action requires 1, **then** hasCredits returns false
- [ ] **Given** user with 50 credits, **when** action requires 50, **then** hasCredits returns true (edge: exactly enough)

### Ingest Usage

- [ ] **Given** completed action, **when** calling ingestUsage, **then** event sent to Polar via `polar.events.ingest()` with correct customer_id, name, metadata
- [ ] **Given** multiple events, **when** batch ingesting, **then** SDK accepts array of events in single call

### UI Display

- [ ] **Given** mounted CreditBalance, **when** loading, **then** show skeleton
- [ ] **Given** user with 150 credits, **when** loaded, **then** show "150 credits"
- [ ] **Given** user with 0 credits and showUpgradePrompt=true, **when** loaded, **then** show "0 credits" + upgrade link
- [ ] **Given** no subscription, **when** loaded, **then** show subscribe prompt

### Server Enforcement

- [ ] **Given** action guarded by assertHasCredits, **when** user has 0 credits, **then** throw UnauthorizedError
- [ ] **Given** action guarded by assertHasCredits, **when** Polar unreachable, **then** throw error (fail-safe)

## Out of Scope

- AI SDK wrapper/strategy pattern (users implement their own provider integration)
- Local caching of balance (always fetch from Polar)
- Low balance warnings/notifications
- Multiple display formats (just total balance, no breakdown)
- Anonymous/unauthenticated usage tracking
- Custom cost calculation (1:1 with Polar meter units)
- Local usage logging/audit trail
- Admin view of all users' credits

## Open Questions

- [ ] Should we implement a local retry queue for failed event ingestion? (Events are lost if API call fails)

## Implementation Notes

### File Structure

```
src/features/credits/
├── components/
│   └── credit-balance.tsx      # Balance display component
├── hooks/
│   └── use-credits.ts          # React hook for balance
├── services/
│   └── credits.service.ts      # Core service functions
├── models/
│   └── credits.model.ts        # TypeScript types
└── index.ts                    # Public exports
```

### Dependencies

- `@polar-sh/sdk` - For fetching customer state/balance AND ingesting events via `polar.events.ingest()`
- Existing BetterAuth Polar integration for customer ID

### Important Constraints

- Events are immutable once ingested (cannot be changed or deleted)
- Polar SDK supports batch ingestion (array of events in single call)

### Environment Variables

- Uses existing `POLAR_ACCESS_TOKEN` from config
- No new env vars required
