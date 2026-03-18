# Infrastructure

## Overview

Cross-cutting changes required to support the feedback board features: route config, middleware updates, and locale keys. These changes are prerequisites for all other board specs.

## Users & Problem

Not user-facing directly. This spec ensures the plumbing is in place so that board routes work correctly (public vs protected), navigation uses type-safe constants, and all UI text follows the locale convention.

## Scope

**In scope:**
- Add board-related route constants to `src/config/routes.ts`
- Update middleware to whitelist `/b/:slug` as public and protect `/boards/**`
- Add locale keys for all board feature UI text

**Out of scope:**
- Feature implementation (covered by individual specs)
- New middleware logic (existing patterns are reused)

## Route Config

Add to `src/config/routes.ts`:

```typescript
export const routes = {
  // ... existing routes

  boards: {
    list: "/boards",
    new: "/boards/new",
    manage: (id: string) => `/boards/${id}` as const,
  },
  publicBoard: (slug: string) => `/b/${slug}` as const,
};
```

## Middleware Updates

In `src/middleware.ts`:

### Public route prefixes

Add `/b` to `PUBLIC_ROUTE_PREFIXES` so all `/b/:slug` board pages are publicly accessible:

```typescript
const PUBLIC_ROUTE_PREFIXES = [routes.blog, "/b"];
```

### No subscription gate on boards

Board routes (`/boards`, `/boards/new`, `/boards/[id]`) require authentication but do NOT require an active subscription at the middleware level. Subscription checks happen inside individual server actions (`createBoard`, `updateIdeaStatus`, `setAdminResponse`) as defined in the Board Billing spec.

The existing middleware already handles this correctly — non-public routes require auth by default, and only routes in `REQUIRE_ACCESS_ROUTES` get the subscription gate.

## Locale Keys

Add to `src/locales/index.ts`. Organized by page/component following existing conventions:

```typescript
// Board Management
BoardsPage: {
  metadata: { title: "My Boards", description: "Manage your feedback boards" },
  emptyState: "You haven't created any boards yet.",
  emptyStateCta: "Create your first board",
  emptyStateNoSub: "Subscribe to create feedback boards.",
  deletedBadge: "Deleted",
},
CreateBoardPage: {
  metadata: { title: "Create Board", description: "Create a new feedback board" },
},
ManageBoardPage: {
  metadata: { title: "Manage Board", description: "Manage your feedback board" },
},
BoardForm: {
  nameLabel: "Board name",
  namePlaceholder: "My Product",
  slugLabel: "URL slug",
  slugPreviewPrefix: "yourdomain.com/b/",
  descriptionLabel: "Description",
  descriptionPlaceholder: "What kind of feedback are you collecting?",
  submitCreate: "Create Board",
  submitUpdate: "Save Changes",
},
BoardCard: {
  ideas: "ideas",
  votes: "votes",
  viewBoard: "View board",
  restore: "Restore",
},

// Ideas & Voting
IdeaForm: {
  titleLabel: "Title",
  titlePlaceholder: "What's your idea?",
  descriptionLabel: "Description",
  descriptionPlaceholder: "Add more details (optional)",
  submit: "Submit Idea",
},
IdeaCard: {
  edit: "Edit",
  delete: "Delete",
  adminResponse: "Admin",
},

// Public Board View
PublicBoardView: {
  submitIdea: "Submit Idea",
  signInToSubmit: "Sign in to submit an idea",
  signInToVote: "Sign in to vote",
  emptyBoard: "No ideas yet. Be the first to share your feedback!",
  emptyFilter: "No {status} ideas yet.",
  boardNotFound: "This board doesn't exist.",
  networkError: "Failed to load ideas. Try again.",
  statusAll: "All",
  statusOpen: "Open",
  statusPlanned: "Planned",
  statusDone: "Done",
},

// Admin
IdeaAdmin: {
  respond: "Respond",
  saveResponse: "Save Response",
  removeResponse: "Remove Response",
  deleteConfirm: "Delete this idea? This will also remove all votes. This cannot be undone.",
  subscriptionRequired: "Active subscription required to manage ideas.",
},

// Toasts
toasts: {
  ideaSubmitted: "Idea submitted",
  ideaUpdated: "Idea updated",
  ideaDeleted: "Idea deleted",
  boardCreated: "Board created",
  boardUpdated: "Board updated",
  boardDeleted: "Board deleted",
  boardRestored: "Board restored",
  responseAdded: "Response saved",
  responseRemoved: "Response removed",
},

// Errors (merge into existing errors object)
errors: {
  // ... existing errors
  slugTaken: "This slug is already taken.",
  subscriptionRequired: "Active subscription required.",
  boardNotFound: "Board not found.",
},
```

## Acceptance Criteria

1. **Given** the route config, **when** importing `routes.boards.list`, **then** it resolves to `"/boards"`.

2. **Given** an unauthenticated visitor, **when** they navigate to `/b/my-product`, **then** middleware allows access (public route).

3. **Given** an unauthenticated visitor, **when** they navigate to `/boards`, **then** middleware redirects to login.

4. **Given** an authenticated user without subscription, **when** they navigate to `/boards`, **then** middleware allows access (subscription check happens in actions, not middleware).

5. **Given** any UI component in the board features, **when** it displays text, **then** all strings come from `locales` — no hardcoded text.
