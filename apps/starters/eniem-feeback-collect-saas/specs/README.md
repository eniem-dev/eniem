# Specifications

## Project

**Feedback Board SaaS** — A mini Canny-like feedback collection tool. Users subscribe to create boards, visitors submit ideas and vote. Unified user model — board creators are admins of their boards.

## Tech Stack

- **Framework:** Next.js 15 + App Router
- **Auth:** BetterAuth (existing — email/password, GitHub, SIWE, Twitter/X, OTP)
- **Database:** PostgreSQL + Prisma
- **Payments:** Polar (existing integration)
- **UI:** shadcn/ui + Tailwind CSS
- **Actions:** NextSafeAction + Zod
- **Email:** Resend + React Email (existing)

## Specs

| # | Spec | Source Path | Description |
|---|------|------------|-------------|
| 1 | [Infrastructure](./01-infrastructure.md) | `config/`, `middleware.ts`, `locales/` | Route config, middleware updates, and locale keys for board features |
| 2 | [Board Management](./02-board-management.md) | `features/boards/` | Create, update, soft-delete boards; owner dashboard with stats |
| 3 | [Board Billing](./03-board-billing.md) | `features/subscription/` | Subscription gate for board creation; lapse behavior |
| 4 | [Idea Submission](./04-idea-submission.md) | `features/ideas/` | Submit, edit, delete feedback ideas on a board |
| 5 | [Voting](./05-voting.md) | `features/ideas/` | Toggle upvotes on ideas, one vote per user per idea |
| 6 | [Idea Administration](./06-idea-administration.md) | `features/ideas/` | Board owner manages statuses, responses, and moderation |
| 7 | [Public Board View](./07-public-board-view.md) | `app/b/[slug]/` | Public page to browse, filter, submit, and vote on ideas |

## Data Model Summary

```
User (existing) ──< Board ──< Idea ──< Vote
                                │
                                └── authorId → User
                                     Vote.userId → User
```

- **Board:** name, slug (unique), description, ownerId, deletedAt (soft delete)
- **Idea:** title, description, status (OPEN/PLANNED/DONE), adminResponse, boardId, authorId
- **Vote:** ideaId + userId (unique pair)

## Key Decisions

- **No free tier:** Subscription required to create boards
- **Unlimited boards** for subscribers
- **Auth required** for submitting ideas and voting
- **Simple upvote** only (no downvotes, no weighted votes)
- **Minimal statuses:** Open → Planned → Done
- **Soft delete** for boards, hard delete for ideas
- **Path-based URLs:** `/b/:slug`
- **Inline expansion** for idea details (not modal or separate page)
- **Single admin response** per idea (not a comments thread)
