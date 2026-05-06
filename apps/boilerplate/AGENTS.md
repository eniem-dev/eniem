<!-- CLAUDE.md is a symlink to this file -->

# Eniem Boilerplate

Next.js 15 + BetterAuth + Polar + Prisma + shadcn/ui. Feature-based architecture.

## Commands

- `pnpm build` — Production build
- `pnpm test` — Run tests (bail on first failure)
- `pnpm lint` — Lint
- `pnpm typecheck` — Typecheck
- `pnpm dev` — Start dev server (Turbopack)
- `pnpm db:start` / `pnpm db:stop` — Start/stop PostgreSQL (Docker)
- `pnpm db:push` — Push schema changes (dev)
- `pnpm db:migrate` — Run migrations (deploy)
- `pnpm db:generate` — Generate Prisma client

Build/test/lint/typecheck scripts are wrapped in `./scripts/run_silent` internally — run them directly, you get concise output on success and full output on failure.

## Hard Rules

- Read `CODING_STANDARDS.md` before writing any code.
- NEVER use `console.log` — use `logger` from `@/lib/logger`.
- NEVER use PostHog directly — use `captureEvent` from `@/lib/tracking`.
- No `any`. No `as Type` assertions. Use type guards and narrowing.
- Never `throw new Error(string)`. Use typed errors / Result pattern (`{ success, data } | { success, error }`).
- No barrel files (`index.ts` re-exports) outside a feature's public API.
- Never mock your own code. Tests use public interfaces only.
- A feature imports zero other features. If a file needs data/UI from ≥2 features, it belongs inside the most relevant one or a dedicated orchestrator feature — cross-feature imports are a design smell, not a shortcut.

## Conventions

- Files: kebab-case. Components: PascalCase. Functions: camelCase. Constants: SCREAMING_SNAKE_CASE.
- Typed file suffixes: `.action.ts`, `.query.ts`, `.schema.ts`, `.service.ts`.

## Principles

1. Convention over Configuration — standardized patterns, feature-based architecture
2. DRY — abstract common patterns, reuse schemas and actions
3. Programmer Happiness — self-documenting code, intuitive naming
4. Conceptual Compression — simple abstractions, TypeScript-first

## Domain Knowledge

- Read `docs/feature-architecture.md` for feature structure, components, locales, metadata
- Read `docs/server-patterns.md` for queries, actions, API routes, error handling, email
- Read `docs/quick-reference.md` for import table, config, and database access

## Doctrine and ADRs

- `CODING_STANDARDS.md` — TDD doctrine plus eniem-specific Prisma/Polar/BetterAuth/Next.js rules. Read before writing code.
- `docs/CODE_REVIEW.md` — reviewer checklist (used by `/code-review`).
- `docs/CONTEXT.md` — domain glossary (maintained via `/grill-with-docs`).
- `docs/adr/` — architectural decisions; template at `docs/adr/0000-template.md`.

## Stack docs

Long-form integration references for stack pieces. Read the relevant one before touching that area.

- `docs/stack/auth-guide.md` — BetterAuth: providers, OAuth, Email OTP, SIWE, rate limits, email callbacks
- `docs/stack/payments-polar.md` — Polar: checkout, subscriptions, credits, webhooks, customer lifecycle
- `docs/stack/route-guard.md` — Request-time route protection (`authed.query`, `authed.route`, middleware)
- `docs/stack/feature-scaffold.md` — Conventions for adding a new feature module

## Plan Mode

- Make the plan extremely concise. Sacrifice grammar for the sake of concision.
- At the end of each plan, give me a list of unresolved questions to answer, if any.
