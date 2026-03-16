# Public Board View

## Overview

The public-facing page at `/b/:slug` where visitors browse, filter, and interact with a feedback board. This is the primary interface for end users — they see ideas sorted by votes, filter by status, submit new ideas, and vote. Ideas expand inline to show full details.

## Users & Problem

**Primary user:** End users of a SaaS product visiting the feedback board to browse existing ideas, vote on ones they care about, and submit their own.

**Secondary user:** Anonymous visitors evaluating the product (can browse but must sign in to interact).

**Problem:** Users need a clean, intuitive interface to quickly find relevant ideas, see what's popular, and contribute their own feedback.

## Scope

**In scope:**
- Public board page at `/b/:slug`
- Idea list sorted by vote count (default)
- Status filter tabs: All / Open / Planned / Done
- Inline idea expansion (click to expand full details)
- Submit idea form (for authenticated users)
- Vote interaction (for authenticated users)
- Board metadata display (name, description)
- Author name + avatar on ideas

**Out of scope:**
- Search within ideas — future phase
- Sorting options beyond "most votes" — future phase
- Pagination (load all ideas for v1, paginate when needed)
- RSS/webhook feeds

## User Stories

1. **As a visitor**, I can view a board's name, description, and list of ideas so that I understand what feedback is being collected.
2. **As a visitor**, I can see ideas sorted by most votes so that I know which ideas are most popular.
3. **As a visitor**, I can filter ideas by status (All/Open/Planned/Done) so that I can see what's been planned or completed.
4. **As a visitor**, I can click an idea to expand it inline and see the full description and admin response.
5. **As an authenticated visitor**, I can submit a new idea directly from the board page.
6. **As an authenticated visitor**, I can vote on ideas directly from the board page.

## Business Rules

- **Public access:** No authentication needed to view the board and browse ideas.
- **Auth for interaction:** Submitting ideas and voting requires authentication.
- **Sort order:** Ideas sorted by vote count descending, then by creation date descending (as tiebreaker).
- **Status filter:** "All" shows all statuses. Individual tabs show only that status. "All" is the default tab.
- **Soft-deleted boards:** Return 404 for soft-deleted boards.
- **Author display:** Show author's `name` and `image` (avatar) from the User model.
- **Admin response display:** If present, shown below the idea description with a distinct visual treatment (e.g., highlighted background, "Admin" label).
- **Vote state:** If the user is authenticated, each idea's vote button reflects whether they have voted.

## UI/UX Flows

### Board Page Layout (`/b/:slug`)

```
┌─────────────────────────────────────────┐
│  Board Name                             │
│  Board description text here...         │
├─────────────────────────────────────────┤
│  [Submit Idea] button                   │
│                                         │
│  ┌─ Submit idea form (when open) ─────┐ │
│  │ Title: [____________]              │ │
│  │ Description: [________________]    │ │
│  │            [Cancel] [Submit]       │ │
│  └────────────────────────────────────┘ │
│                                         │
│  [All] [Open] [Planned] [Done]  ← tabs  │
│                                         │
│  ┌──────────────────────────────────┐   │
│  │ ▲  │ Idea title                  │   │
│  │ 12 │ by Author Name • 2 days ago │   │
│  └──────────────────────────────────┘   │
│                                         │
│  ┌──────────────────────────────────┐   │
│  │ ▲  │ Another idea title          │   │
│  │ 8  │ by Author • 1 week ago      │   │
│  │    │                              │   │
│  │    │ Full description shown here  │   │
│  │    │ when expanded inline...      │   │
│  │    │                              │   │
│  │    │ ┌── Admin Response ────────┐ │   │
│  │    │ │ Thanks! We're planning   │ │   │
│  │    │ │ this for Q2.             │ │   │
│  │    │ └──────────────────────────┘ │   │
│  │    │ [PLANNED]           [Edit] │   │
│  └──────────────────────────────────┘   │
│                                         │
│  ┌──────────────────────────────────┐   │
│  │ ▲  │ Third idea                  │   │
│  │ 3  │ by Author • 3 weeks ago     │   │
│  └──────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

### Idea Card (collapsed)

- **Left:** Vote button (arrow + count)
- **Right:** Title, author name + avatar, relative timestamp, status badge (if not OPEN)
- **Click area:** Entire card is clickable to expand

### Idea Card (expanded inline)

- **Expands below the card header** to show:
  - Full description (if present)
  - Admin response (if present), with "Admin" badge and distinct styling
  - Status badge
  - Edit/Delete buttons (if current user is author)
- **Click header again** to collapse

### States

- **Empty board:** "No ideas yet. Be the first to share your feedback!" + Submit CTA.
- **Empty filter:** "No [status] ideas yet." (e.g., "No planned ideas yet.")
- **Loading:** Skeleton cards while data loads.
- **Board not found:** 404 page: "This board doesn't exist."
- **Network error:** Show inline error message with retry button: "Failed to load ideas. Try again."

## Edge Cases

- **Board with 0 ideas:** Empty state with submit CTA.
- **Very long title:** Truncate with ellipsis in collapsed view, show full in expanded.
- **Very long description:** Show full text in expanded view (no truncation). Consider max-height with scroll for extremely long descriptions.
- **Deleted user's ideas:** If the author's account is deleted, ideas are cascade-deleted (per Prisma `onDelete: Cascade`).
- **Board slug doesn't exist:** Return Next.js `notFound()`.
- **Rapid tab switching:** Cancel in-flight queries on tab change.

## API / Interface

### Route

```
app/b/[slug]/page.tsx — Public board view (Server Component)
```

### Query

```typescript
// features/boards/queries/board.query.ts

// getBoardBySlug(slug: string, options?: { status?: IdeaStatus }) — public query
// Returns: Board & {
//   ideas: (Idea & {
//     author: { name: string, image: string | null },
//     _count: { votes: number },
//     hasVoted?: boolean  // only if session exists
//   })[]
// } | null
//
// Ideas sorted by _count.votes desc, createdAt desc
// Filtered by status if provided
// Excludes soft-deleted boards (deletedAt is not null)
```

### Client-Side State

```typescript
// Status filter: managed via URL search params (?status=PLANNED)
//   - Use router.replace() (not push) to avoid polluting browser history
//   - "All" tab removes the ?status param entirely
//   - Filter persists on page reload (read from searchParams on mount)
// Expanded idea: local React state (Set<ideaId>)
// Vote toggle: optimistic update via useOptimistic or state
```

## Architecture

```
app/
  b/
    [slug]/
      page.tsx          — RSC: fetches board data, renders PublicBoardView
      not-found.tsx     — 404 for invalid slugs
      loading.tsx       — Skeleton loading state

components/ (or features/boards/components/)
  PublicBoardView.tsx   — Main board layout (client component)
  IdeaCard.tsx          — Individual idea with vote button
  IdeaDetail.tsx        — Expanded inline content
  StatusTabs.tsx        — Filter tabs
  SubmitIdeaForm.tsx    — Inline idea submission form
```

The page is a Server Component that fetches data and passes it to client components for interactivity (voting, filtering, expanding).

## Accessibility

- **Status tabs:** Use `role="tablist"` / `role="tab"` / `role="tabpanel"` pattern. Active tab has `aria-selected="true"`.
- **Idea expansion:** Clickable card header uses `role="button"` with `aria-expanded` (`true`/`false`). Expanded content region uses `role="region"`.
- **Submit form:** Labels associated with inputs. Submit button disabled state uses `aria-disabled`.

## SEO

- **Page title:** `{board.name} — Feedback Board`
- **Meta description:** Board description or fallback
- **OG image:** Default app OG image (no per-board custom images in v1)

## Acceptance Criteria

1. **Given** a valid board slug, **when** a visitor navigates to `/b/:slug`, **then** they see the board name, description, and a list of ideas sorted by vote count.

2. **Given** a board with ideas in multiple statuses, **when** a visitor clicks the "Planned" tab, **then** only ideas with status PLANNED are shown.

3. **Given** an authenticated visitor, **when** they click an idea card, **then** the idea expands inline showing the full description, admin response, and vote button.

4. **Given** an idea with an admin response, **when** expanded, **then** the admin response is displayed with distinct styling and an "Admin" label.

5. **Given** a board with no ideas, **when** a visitor views the board, **then** they see an empty state message with a prompt to submit the first idea.

6. **Given** an invalid slug, **when** a visitor navigates to `/b/nonexistent`, **then** they see a 404 page.

7. **Given** ideas by different authors, **when** viewing the board, **then** each idea shows the author's name and avatar.

8. **Given** an authenticated user who has voted on some ideas, **when** they view the board, **then** voted ideas show the vote button in its "voted" (highlighted) state.
