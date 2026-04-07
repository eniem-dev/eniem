<!-- CLAUDE.md is a symlink to this file -->

# Eniem Boilerplate

Next.js 15 + BetterAuth + Polar + Prisma + shadcn/ui. Feature-based architecture.

NEVER COMMENT IN FRENCH. Even if the user talks in French.

## Commands

Always use `./scripts/run_silent` for build/test/lint. Do NOT run these commands directly.

- `./scripts/run_silent "build" pnpm build` — Production build
- `./scripts/run_silent "test" pnpm test` — Run tests (bail on first failure)
- `./scripts/run_silent "lint" pnpm lint` — Lint
- `./scripts/run_silent "typecheck" pnpm typecheck` — Typecheck
- `pnpm dev` — Start dev server (Turbopack)
- `pnpm db:start` / `pnpm db:stop` — Start/stop PostgreSQL (Docker)
- `pnpm db:push` — Push schema changes (dev)
- `pnpm db:migrate` — Run migrations (deploy)
- `pnpm db:generate` — Generate Prisma client

## Conventions

- Read `docs/coding-standard.md` before writing any code
- Do NOT pipe command output to `head`, `tail`, or `/dev/null` — output management is handled by project tooling
- NEVER use `console.log` — use `logger` from `@/lib/logger`
- NEVER use PostHog directly — use `captureEvent` from `@/lib/tracking`
- Files: kebab-case. Components: PascalCase. Functions: camelCase. Constants: SCREAMING_SNAKE_CASE
- Typed file suffixes: `.action.ts`, `.query.ts`, `.schema.ts`, `.service.ts`

## Principles

1. Convention over Configuration — standardized patterns, feature-based architecture
2. DRY — abstract common patterns, reuse schemas and actions
3. Programmer Happiness — self-documenting code, intuitive naming
4. Conceptual Compression — simple abstractions, TypeScript-first

## Domain Knowledge

- Read `docs/feature-architecture.md` for feature structure, components, locales, metadata
- Read `docs/server-patterns.md` for queries, actions, API routes, error handling, email
- Read `docs/auth-guide.md` for route protection and middleware
- Read `docs/quick-reference.md` for import table, config, and database access

## Plan Mode

- Make the plan extremely concise. Sacrifice grammar for the sake of concision.
- At the end of each plan, give me a list of unresolved questions to answer, if any.
