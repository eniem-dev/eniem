# Voting

## Overview

Authenticated users upvote ideas to signal priority. Each user gets one vote per idea (toggle on/off). Vote counts are visible to everyone and determine the default sort order on the public board.

## Users & Problem

**Primary user:** End users browsing a feedback board who want to show support for ideas they care about.

**Problem:** Without voting, the product team has no data-driven way to prioritize which ideas matter most to their users.

## Scope

**In scope:**
- Toggle upvote on an idea (create or remove vote)
- Display vote count on each idea
- Vote count determines default sort order

**Out of scope:**
- Downvotes — upvotes only
- Weighted votes / vote tokens
- Viewing who voted (voter list) — future phase
- Vote notifications to idea author

## User Stories

1. **As an authenticated user**, I can upvote an idea so that the product team knows I want this feature.
2. **As an authenticated user**, I can remove my upvote so that I can change my mind.
3. **As any user**, I can see the vote count on each idea so that I know which ideas are most popular.

## Business Rules

- **Auth required:** Must be signed in to vote.
- **One vote per user per idea:** Enforced by `@@unique([ideaId, userId])` database constraint.
- **Toggle behavior:** If the user has voted, clicking again removes the vote. If they haven't, it creates one.
- **Self-voting:** Idea authors can vote on their own ideas (counts as +1).
- **Vote count:** Displayed as integer. Minimum is 0.

## UI/UX Flows

### Vote Button (on IdeaCard)

- **Position:** Left side of the idea card, vertically centered.
- **Display:** Upward arrow/chevron + vote count number.
- **States:**
  - **Not voted:** Outline style, muted color.
  - **Voted:** Filled/solid style, primary color. Arrow and count highlighted.
  - **Not signed in:** Outline style. Clicking redirects to login.
  - **Loading:** Disabled, subtle pulse animation during toggle.
- **Interaction:** Click toggles vote. Optimistic UI update (count changes immediately, reverts on error).

## Edge Cases

- **Double-click:** Debounce vote toggle to prevent rapid fire. Disable button during pending request.
- **Voting on deleted idea:** Server returns error (idea cascade-deleted or board soft-deleted). Handle gracefully — remove idea from UI.
- **Concurrent votes:** Database unique constraint prevents duplicates. If toggle fails due to constraint, treat as "already voted" and allow removal.
- **Optimistic rollback:** If the server action fails, revert the vote count and voted state in the UI.

## Data Model

```prisma
model Vote {
  id        String   @id @default(cuid())
  createdAt DateTime @default(now())
  ideaId    String
  idea      Idea     @relation(fields: [ideaId], references: [id], onDelete: Cascade)
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([ideaId, userId])
  @@map("vote")
}
```

## API / Interface

### Schemas

```typescript
// features/ideas/schemas/vote.schema.ts
import { z } from "zod";

export const toggleVoteSchema = z.object({
  ideaId: z.string().cuid(),
});
```

### Server Actions

```typescript
// features/ideas/actions/vote.action.ts
"use server";

// toggleVote — auth required
// If vote exists for (ideaId, userId): delete it, return { voted: false, count }
// If vote doesn't exist: create it, return { voted: true, count }
// count = total votes on the idea after the toggle
// Throws: UnauthorizedError
```

### Query Integration

Vote state is loaded as part of the board query — for each idea, include:
- `_count.votes` — total vote count
- `votes.some(v => v.userId === currentUserId)` — whether current user has voted (when authenticated)

## Architecture

The vote action lives in `features/ideas/actions/vote.action.ts` since votes are tightly coupled to ideas. The Vote model is a join table with no standalone feature directory.

## Accessibility

- Vote button uses `role="button"` with `aria-pressed` reflecting voted state (`true`/`false`).
- Vote count is announced via `aria-label`: e.g., "Upvote, 12 votes" or "Remove upvote, 12 votes".
- Loading/disabled state uses `aria-disabled="true"`.

## Acceptance Criteria

1. **Given** an authenticated user who has not voted on an idea, **when** they click the vote button, **then** their vote is recorded and the count increments by 1.

2. **Given** an authenticated user who has already voted on an idea, **when** they click the vote button again, **then** their vote is removed and the count decrements by 1.

3. **Given** an unauthenticated user, **when** they click the vote button, **then** they are redirected to login.

4. **Given** an idea with 5 votes, **when** viewing the board, **then** the vote count "5" is displayed on the idea card.

5. **Given** a user who has voted on an idea, **when** they view the board, **then** the vote button appears in its "voted" (highlighted) state.

6. **Given** a vote toggle in progress, **when** the user clicks the button again, **then** the click is ignored (debounced).
