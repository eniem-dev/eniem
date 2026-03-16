# Idea Administration

## Overview

Board owners manage ideas on their boards by changing statuses (Open/Planned/Done), deleting inappropriate ideas, and providing official admin responses. This gives board owners the tools to curate and communicate on their feedback board.

## Users & Problem

**Primary user:** Board owners (SaaS founders/PMs) who need to triage and respond to feedback.

**Problem:** Without admin tools, feedback boards become noisy and unmanaged. Users don't know if their idea was seen, and there's no way to signal what's been planned or completed.

## Scope

**In scope:**
- Change idea status (Open → Planned → Done, any direction)
- Delete any idea on own board
- Add/edit/remove admin response on an idea
- View all ideas on own board (in manage view)

**Out of scope:**
- Email notifications on status change — future phase
- Bulk status changes — future phase
- Merging duplicate ideas — future phase
- Pinning ideas — future phase

## User Stories

1. **As a board owner**, I can change an idea's status to Planned or Done so that users know I've acknowledged their feedback.
2. **As a board owner**, I can delete any idea on my board so that I can remove spam or inappropriate content.
3. **As a board owner**, I can add an official response to an idea so that I can communicate directly with the idea's author and voters.
4. **As a board owner**, I can edit or remove my admin response so that I can update my communication.

## Business Rules

- **Owner-only actions:** Only the board's `ownerId` can change statuses, add admin responses, or delete other users' ideas.
- **Status transitions:** Any status can transition to any other status (no enforced flow). The three statuses are: `OPEN`, `PLANNED`, `DONE`.
- **Admin response:** One per idea. Stored as `adminResponse` field on the Idea model. Setting to `null` removes it.
- **Delete by admin:** Hard delete (same as author delete). Cascade-deletes votes.
- **Lapsed subscription:** If the owner's subscription is inactive, status changes and admin responses are blocked. Deletion still allowed (to handle spam).

## UI/UX Flows

### Board Management View (`/boards/[id]`)

- **Idea list:** Table or card list of all ideas, showing title, status badge, vote count, author, date.
- **Status dropdown:** Inline dropdown on each idea to change status. Color-coded badges: Open (gray), Planned (blue), Done (green).
- **Actions:** Each idea row has: status dropdown, "Respond" button, "Delete" button.
- **Delete confirmation:** Dialog: "Delete this idea? This will also remove all votes. This cannot be undone."

### Admin Response (inline on idea)

- **Entry point:** "Respond" button on idea row → expands a textarea below the idea.
- **Form:** Textarea with "Save Response" and "Cancel" buttons. If response exists, pre-filled for editing.
- **Remove response:** "Remove Response" button appears when a response exists.
- **Display on public board:** Admin response shown below the idea description, visually distinct (highlighted background, "Admin" badge).

## Edge Cases

- **Changing status on soft-deleted board:** Technically the owner could access the manage page. Allow status changes — they apply when the board is restored.
- **Admin response on deleted idea:** Not possible — the idea is hard-deleted.
- **Lapsed subscription + status change:** Return error "Active subscription required to manage ideas". Show banner on manage page.
- **Board owner deletes their own idea:** Allowed (they are both author and admin).

## API / Interface

### Schemas

```typescript
// features/ideas/schemas/admin.schema.ts
import { z } from "zod";

const IdeaStatus = z.enum(["OPEN", "PLANNED", "DONE"]);

export const updateIdeaStatusSchema = z.object({
  ideaId: z.string().cuid(),
  status: IdeaStatus,
});

export const setAdminResponseSchema = z.object({
  ideaId: z.string().cuid(),
  response: z.string().max(2000).nullable(),
});
```

### Server Actions

```typescript
// features/ideas/actions/admin.action.ts
"use server";

// updateIdeaStatus — auth + board owner + active subscription
// Sets idea.status to the new value
// Returns: { success: true }
// Throws: UnauthorizedError, ValidationError("Active subscription required")

// setAdminResponse — auth + board owner + active subscription
// Sets idea.adminResponse (or null to remove)
// Returns: { success: true }
// Throws: UnauthorizedError, ValidationError("Active subscription required")

// Note: deleteIdea is in idea.action.ts — it checks for author OR board owner
```

## Architecture

Admin actions live in `features/ideas/actions/admin.action.ts` to separate admin concerns from user-facing idea actions. The board management page at `app/(protected)/boards/[id]/page.tsx` uses these actions.

Authorization check pattern:
```typescript
// In admin actions, verify board ownership:
const idea = await prisma.idea.findUnique({
  where: { id: ideaId },
  include: { board: { select: { ownerId: true } } },
});
if (idea.board.ownerId !== user.id) throw new UnauthorizedError();
```

## Acceptance Criteria

1. **Given** a board owner, **when** they change an idea's status from Open to Planned, **then** the status is updated and the badge reflects "Planned" on both the manage view and public board.

2. **Given** a board owner, **when** they add an admin response, **then** the response is saved and visible on the public board under the idea.

3. **Given** a board owner, **when** they remove the admin response, **then** the response is cleared and no longer visible publicly.

4. **Given** a board owner with a lapsed subscription, **when** they try to change a status, **then** they see an error "Active subscription required to manage ideas".

5. **Given** a board owner, **when** they delete another user's idea, **then** the idea and its votes are permanently removed.

6. **Given** a user who is not the board owner, **when** they view the manage page, **then** they are redirected (they cannot access admin actions).
