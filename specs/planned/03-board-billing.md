# Board Billing

## Overview

Users must have an active Polar subscription to create feedback boards. The existing subscription and Polar integration in the boilerplate is reused. This spec defines the billing gates and behavior when subscriptions lapse.

## Users & Problem

**Primary user:** SaaS founders who want to create feedback boards for their products.

**Problem:** The SaaS needs a monetization model. Board creation is the value gate — anyone can browse, submit, and vote for free, but creating and managing a board requires a subscription.

## Scope

**In scope:**
- Gate board creation behind active subscription check
- Handle subscription lapse (boards become read-only for admin)
- Monthly and yearly subscription options via Polar
- UI messaging for subscription states

**Out of scope:**
- Board-level pricing tiers (all subscribers get unlimited boards)
- Per-board billing
- Free trial / free tier
- Usage-based billing (per idea, per vote)

**Dependency:** Uses the existing `Subscription` model and Polar integration already in the boilerplate. No new payment infrastructure needed.

## User Stories

1. **As a new user**, I can subscribe to a plan so that I can create feedback boards.
2. **As a subscriber**, I can create unlimited boards without additional charges.
3. **As a user whose subscription has lapsed**, I can still see my boards but I cannot create new ones or manage idea statuses.
4. **As a lapsed user**, I can renew my subscription to regain full access.

## Business Rules

- **Subscription check:** `createBoard`, `updateIdeaStatus`, and `setAdminResponse` actions check `subscription.status === "active"`.
- **No free tier:** Users must subscribe before creating their first board.
- **Lapse behavior:**
  - Boards remain publicly visible.
  - Users can still submit ideas and vote on lapsed boards.
  - Board owner cannot: create boards, change idea statuses, add admin responses.
  - Board owner can still: delete ideas (spam control), update board name/description, soft-delete boards.
- **Plans:** Monthly and yearly options. Yearly at a discount (configured in Polar).
- **Cancellation:** Polar handles cancellation flow. Subscription remains active until `currentPeriodEnd`.

## UI/UX Flows

### Subscription Gate

- **No subscription:** When user navigates to `/boards/new`, show pricing card with Subscribe CTA. Redirect to Polar checkout.
- **Active subscription:** Board creation form shown normally.
- **Lapsed subscription:**
  - Dashboard banner: "Your subscription has expired. [Renew] to create new boards and manage ideas."
  - "Create Board" button disabled with tooltip: "Active subscription required".
  - Manage page: Status dropdowns and response buttons disabled with tooltip.

### Pricing / Subscribe

- **Location:** `/pricing` page (existing) + inline on `/boards/new` when not subscribed.
- **Plans displayed:** Monthly ($X/mo) and Yearly ($X/yr, save Y%).
- **Flow:** Click Subscribe → Polar checkout → redirect back to `/boards/new` on success.

## Edge Cases

- **Subscribe mid-session:** After returning from Polar checkout, the subscription status should be immediately reflected (revalidate via webhook or page reload).
- **Subscription expires exactly now:** Check `currentPeriodEnd` — if past, treat as lapsed even if `status` hasn't been updated by webhook yet.
- **Multiple subscriptions:** Not possible — `userId` is unique on Subscription model.
- **Downgrade/upgrade:** Not applicable — single tier.

## API / Interface

### Subscription Check

Reuse the existing `hasActiveSubscription(userId)` from `features/subscription/services/subscription.service.ts`. No new helper needed.

### Integration Points

The subscription check is called in:
- `createBoard` action — blocks board creation
- `updateIdeaStatus` action — blocks status changes
- `setAdminResponse` action — blocks admin responses

These are imported and called within each action, not middleware.

## Architecture

No new feature directory needed. The existing `features/subscription/services/subscription.service.ts` provides `hasActiveSubscription()`. The existing `features/subscription/` and `features/billing/` handle the Polar checkout flow and webhook processing.

The billing spec adds behavioral gates to the board and idea administration actions, not new payment infrastructure.

## Acceptance Criteria

1. **Given** a user without a subscription, **when** they navigate to create a board, **then** they see pricing options and cannot access the creation form.

2. **Given** a user with an active subscription, **when** they create a board, **then** the board is created successfully.

3. **Given** a user whose subscription has lapsed, **when** they try to create a board, **then** they see "Active subscription required" and the action is blocked.

4. **Given** a user whose subscription has lapsed, **when** they view their dashboard, **then** they see a renewal banner and their existing boards are still listed.

5. **Given** a lapsed board owner, **when** a visitor submits an idea or votes on their board, **then** the submission/vote succeeds (lapse only affects the owner).

6. **Given** a lapsed board owner, **when** they try to change an idea's status, **then** the action is blocked with "Active subscription required".
