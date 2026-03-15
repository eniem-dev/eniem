# Board Management

## Overview

Board owners create, configure, and manage feedback boards. Each board has a unique slug for its public URL (`/b/:slug`). Creating a board requires an active Polar subscription. Boards can be soft-deleted (hidden but data preserved).

## Users & Problem

**Primary user:** SaaS founders and product managers who want a simple, dedicated place to collect user feedback for their product.

**Problem:** Without a feedback board, founders rely on scattered channels (email, Slack, Twitter) to gather feature requests. Ideas get lost, there's no way to gauge demand, and users don't feel heard.

## Scope

**In scope:**
- Create board (name, slug, description)
- Update board settings
- Soft-delete / restore board
- Dashboard listing user's boards with basic stats (total ideas, total votes)

**Out of scope:**
- Custom branding (logo, colors, custom domain) — future phase
- Team members / multi-admin — future phase
- Board-level settings (who can post, moderation rules) — future phase

**Constraints:**
- Slug must be unique, URL-safe (lowercase alphanumeric + hyphens)
- Board creation gated by active subscription
- Soft-deleted boards are excluded from public view but restorable by owner

## User Stories

1. **As a subscribed user**, I can create a new feedback board so that I have a place to collect user ideas.
2. **As a board owner**, I can update my board's name and description so that the board reflects my product accurately.
3. **As a board owner**, I can delete my board so that it's no longer publicly accessible.
4. **As a board owner**, I can restore a deleted board so that I don't lose my data permanently.
5. **As a subscribed user**, I can view a dashboard of all my boards with idea and vote counts so that I can see activity at a glance.

## Business Rules

- **Subscription required:** `createBoard` checks that the user has an active subscription (`subscription.status === "active"`). If the subscription has lapsed, board creation is blocked.
- **Slug uniqueness:** Slugs are globally unique. Validated on the client (format check) and enforced by the database (unique constraint).
- **Slug format:** 3-50 characters, lowercase `[a-z0-9-]`, cannot start or end with a hyphen.
- **Slug immutability:** Slugs cannot be changed after board creation. This prevents broken public URLs.
- **Ownership:** Only the board's `ownerId` can update, delete, or restore the board.
- **Soft delete:** Sets `deletedAt` timestamp. Soft-deleted boards are excluded from public queries but visible in the owner's dashboard (marked as deleted).
- **Lapsed subscription:** Admin features are restricted — owner can't create new boards, change idea statuses, or add admin responses. Owner can still update board name/description, soft-delete/restore boards, and delete ideas. Public users can still submit ideas and vote. See Board Billing spec for full lapse behavior.

## UI/UX Flows

### Dashboard (`/boards`)

- **Empty state:** "You haven't created any boards yet" + CTA to create one (or subscribe if no active subscription).
- **Board list:** Cards showing board name, slug, description preview, idea count, vote count, created date. Deleted boards shown with a "Deleted" badge and "Restore" action.
- **Actions per card:** Edit, Delete (or Restore if deleted), View public board link.

### Create Board (`/boards/new`)

- **Form fields:** Name (required), Slug (required, auto-generated from name, editable), Description (optional, textarea).
- **Slug preview:** Shows the full URL as the user types: `yourdomain.com/b/my-product`.
- **Validation:** Real-time slug format validation. On submit, check uniqueness.
- **Error states:** "Slug already taken", "Active subscription required".
- **Success:** Redirect to the board management page (`/boards/:id`).

### Manage Board (`/boards/[id]`)

- **Header:** Board name, slug (as link to public board), edit button.
- **Stats bar:** Total ideas, total votes.
- **Ideas list:** All ideas on this board (see Idea Administration spec).
- **Settings section:** Update name/description, delete board.

## Edge Cases

- **Duplicate slug:** Return validation error "This slug is already taken" — do not auto-suffix.
- **Delete board with ideas:** Soft delete preserves all ideas and votes. They become inaccessible publicly.
- **Subscription expires with existing boards:** Boards remain visible publicly. Owner can view dashboard but cannot create new boards. Show banner: "Your subscription has expired. Renew to create new boards."
- **Concurrent slug creation:** Database unique constraint prevents race conditions.

## Data Model

```prisma
model Board {
  id          String    @id @default(cuid())
  name        String
  slug        String    @unique
  description String?   @db.Text
  deletedAt   DateTime?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  ownerId     String
  owner       User      @relation(fields: [ownerId], references: [id], onDelete: Cascade)
  ideas       Idea[]

  @@map("board")
}
```

User model additions:
```prisma
model User {
  // ... existing fields
  boards Board[]
  ideas  Idea[]
  votes  Vote[]
}
```

## API / Interface

### Schemas

```typescript
// features/boards/schemas/board.schema.ts
import { z } from "zod";

export const createBoardSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(3).max(50).regex(/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/),
  description: z.string().max(500).optional(),
});

export const updateBoardSchema = z.object({
  boardId: z.string().cuid(),
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
});

export const deleteBoardSchema = z.object({
  boardId: z.string().cuid(),
});

export const restoreBoardSchema = z.object({
  boardId: z.string().cuid(),
});
```

### Server Actions

```typescript
// features/boards/actions/board.action.ts
"use server";

// createBoard — auth + active subscription required
// Returns: { id, slug } on success
// Throws: UnauthorizedError, ValidationError("Active subscription required"), ValidationError("Slug already taken")

// updateBoard — auth + board owner required
// Returns: { success: true }
// Throws: UnauthorizedError, NotFoundError

// deleteBoard — auth + board owner, sets deletedAt
// Returns: { success: true }

// restoreBoard — auth + board owner, clears deletedAt
// Returns: { success: true }
```

### Queries

```typescript
// features/boards/queries/board.query.ts

// getUserBoards() — authenticated query
// Returns: Board[] with _count { ideas, votes (sum across ideas) }
// Includes soft-deleted boards (marked with deletedAt)

// getBoardBySlug(slug) — public query
// Returns: Board with ideas (sorted by vote count desc) or null
// Excludes soft-deleted boards
```

## Architecture

```
features/boards/
  components/
    BoardForm.tsx        — Create/edit board form with slug preview
    BoardCard.tsx        — Dashboard card with stats
    BoardList.tsx        — Dashboard grid of BoardCards
    BoardSettings.tsx    — Settings section on manage page
  schemas/
    board.schema.ts      — Zod schemas
  actions/
    board.action.ts      — Server actions
  queries/
    board.query.ts       — RSC queries
  index.ts               — Public exports

app/(protected)/boards/
  page.tsx               — Dashboard (BoardList)
  new/page.tsx           — Create board (BoardForm)
  [id]/page.tsx          — Manage board (ideas list + settings)
```

## Acceptance Criteria

1. **Given** a user with an active subscription, **when** they submit the create board form with a valid name and unique slug, **then** the board is created and they are redirected to `/boards/:id`.

2. **Given** a user without an active subscription, **when** they try to create a board, **then** they see an error "Active subscription required" and the board is not created.

3. **Given** a board owner, **when** they update the board name or description, **then** the changes are persisted and reflected on the public board view.

4. **Given** a board owner, **when** they delete a board, **then** the board is soft-deleted, no longer appears on `/b/:slug`, but still appears in their dashboard marked as deleted.

5. **Given** a board owner viewing a deleted board, **when** they click "Restore", **then** the board is restored and accessible publicly again.

6. **Given** a user on the dashboard, **when** they view their boards, **then** each board shows the total idea count and total vote count.

7. **Given** a slug that already exists, **when** a user tries to create a board with that slug, **then** they see a validation error "This slug is already taken".
