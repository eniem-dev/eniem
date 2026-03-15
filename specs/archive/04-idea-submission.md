# Idea Submission

## Overview

Authenticated users submit feedback ideas (title + optional description) to any public board. Authors can edit or delete their own ideas. Ideas are the core content unit of the feedback board.

## Users & Problem

**Primary user:** End users of a SaaS product who have feature requests, bug reports, or improvement suggestions.

**Problem:** Users have no structured way to share ideas with the product team and see what others have suggested. Feedback gets lost in support channels.

## Scope

**In scope:**
- Submit an idea to a board (title + description)
- Edit own idea (title, description)
- Delete own idea
- View own ideas across boards (implicit via board view)

**Out of scope:**
- Categories/tags on ideas — future phase
- File attachments — future phase
- Duplicate detection — admin handles manually
- Rich text / markdown in description — plain text only for v1

## User Stories

1. **As an authenticated user**, I can submit an idea to a board so that the product team sees my feedback.
2. **As an idea author**, I can edit my idea's title and description so that I can clarify or improve my suggestion.
3. **As an idea author**, I can delete my idea so that I can remove feedback I no longer want visible.

## Business Rules

- **Auth required:** User must be signed in to submit an idea.
- **Board must exist:** The target board must exist and not be soft-deleted.
- **Title required:** Title is required, 1-200 characters.
- **Description optional:** Plain text, max 2000 characters.
- **Author-only edits:** Only the idea's `authorId` can edit the idea's title or description (board owner can also delete — see Idea Administration spec).
- **No status edit by author:** Authors cannot change the idea's status (only the board owner can).

## UI/UX Flows

### Submit Idea (on public board view `/b/:slug`)

- **Entry point:** "Submit Idea" button at the top of the board.
- **Form:** Inline form that appears above the idea list (or as a card). Title input (required) + Description textarea (optional).
- **If not signed in:** "Submit Idea" button redirects to login, with return URL back to the board.
- **Loading state:** Button shows spinner, form disabled during submission.
- **Success:** Idea appears in the list (sorted by newest temporarily or by votes). Form resets. Toast: "Idea submitted".
- **Error:** Inline error message below the form.
- **Toast dependency:** Success and error feedback uses the shadcn `toast` component (already in `components/ui/`).

### Edit Idea (expand inline on board view)

- **Entry point:** "Edit" button visible only to the idea author (shown when idea is expanded inline).
- **Behavior:** Title and description become editable in-place. "Save" and "Cancel" buttons appear.
- **Validation:** Same as creation (title required, max lengths).
- **Success:** Idea updates in-place. Toast: "Idea updated".

### Delete Idea (by author)

- **Entry point:** "Delete" button visible to idea author (in expanded view).
- **Confirmation:** Dialog: "Are you sure you want to delete this idea? This cannot be undone."
- **Success:** Idea removed from list. Toast: "Idea deleted".

## Edge Cases

- **Submitting to a soft-deleted board:** Server rejects with "Board not found".
- **Author deletes idea that has votes:** Votes are cascade-deleted with the idea.
- **Editing while another user is viewing:** No conflict handling needed — last write wins, acceptable for v1.
- **Empty description:** Stored as `null`, not empty string.
- **XSS in title/description:** Sanitize on output (React handles this by default). Store raw input.

## Data Model

```prisma
model Idea {
  id            String     @id @default(cuid())
  title         String     @db.VarChar(200)
  description   String?    @db.Text
  status        IdeaStatus @default(OPEN)
  adminResponse String?    @db.Text
  createdAt     DateTime   @default(now())
  updatedAt     DateTime   @updatedAt
  boardId       String
  board         Board      @relation(fields: [boardId], references: [id], onDelete: Cascade)
  authorId      String
  author        User       @relation(fields: [authorId], references: [id], onDelete: Cascade)
  votes         Vote[]

  @@map("idea")
}

enum IdeaStatus {
  OPEN
  PLANNED
  DONE
}
```

## API / Interface

### Schemas

```typescript
// features/ideas/schemas/idea.schema.ts
import { z } from "zod";

export const createIdeaSchema = z.object({
  boardId: z.string().cuid(),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
});

export const updateIdeaSchema = z.object({
  ideaId: z.string().cuid(),
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
});

export const deleteIdeaSchema = z.object({
  ideaId: z.string().cuid(),
});
```

### Server Actions

```typescript
// features/ideas/actions/idea.action.ts
"use server";

// createIdea — auth required
// Validates board exists and is not soft-deleted
// Returns: { id } on success
// Throws: UnauthorizedError, ValidationError("Board not found")

// updateIdea — auth + author only
// Returns: { success: true }
// Throws: UnauthorizedError, NotFoundError

// deleteIdea — auth + (author OR board owner)
// Hard deletes the idea and cascade-deletes votes
// Returns: { success: true }
// Throws: UnauthorizedError, NotFoundError
```

## Architecture

```
features/ideas/
  components/
    IdeaForm.tsx        — Create idea form (inline on board)
    IdeaCard.tsx        — Idea summary card with vote button
    IdeaDetail.tsx      — Expanded inline view with edit/delete
    IdeaList.tsx        — List of IdeaCards
  schemas/
    idea.schema.ts      — Zod schemas
  actions/
    idea.action.ts      — Submit, edit, delete actions
    vote.action.ts      — Toggle vote action (see Voting spec)
  queries/
    idea.query.ts       — Idea queries
  index.ts              — Public exports
```

## Acceptance Criteria

1. **Given** an authenticated user on a public board, **when** they submit an idea with a title, **then** the idea is created with status OPEN and appears in the board's idea list.

2. **Given** an unauthenticated user, **when** they click "Submit Idea", **then** they are redirected to login with a return URL to the board.

3. **Given** an idea author, **when** they edit the title and description, **then** the changes are saved and reflected immediately.

4. **Given** an idea author, **when** they delete their idea, **then** the idea and all its votes are permanently removed.

5. **Given** a user who is not the idea author, **when** they view an idea, **then** they do not see "Edit" or "Delete" buttons.

6. **Given** an idea submitted to a soft-deleted board, **when** the server processes the request, **then** it returns a "Board not found" error.
