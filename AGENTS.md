<!-- CLAUDE.md is a symlink to this file -->

# Eniem Monorepo

## Structure
- `apps/boilerplate` — Main product (Next.js 15, BetterAuth, Polar, Prisma)
- `apps/docs` — Documentation site (Next.js 16, Fumadocs)
- `packages/cli` — CLI scaffolding tool (Ink 5, React 18)

## Commands

Always use `./scripts/run_silent` for build/test/lint. Do NOT run these commands directly.

- `./scripts/run_silent "build" pnpm build` — Build all packages
- `./scripts/run_silent "test" pnpm test` — Run tests (bail on first failure)
- `./scripts/run_silent "lint" pnpm lint` — Lint
- `./scripts/run_silent "typecheck" pnpm typecheck` — Typecheck
- `pnpm dev:boilerplate` — Start boilerplate dev server
- `pnpm dev:docs` — Start docs dev server
- `pnpm dev:cli` — Start CLI in watch mode

## Per-Package Commands
Run with: `pnpm --filter @eniem/boilerplate <script>`

## Turborepo
Filter: `pnpm turbo build --filter=@eniem/boilerplate`

## Conventions
- Per-app coding standards live under each app (e.g. `apps/boilerplate/AGENTS.md` + `apps/boilerplate/.agents/skills/`). Read the target app's AGENTS.md before writing code there.
- Do NOT pipe command output to `head`, `tail`, or `/dev/null` — output management is handled by project tooling

## Dependencies
Each package manages its own dependency versions (React 18 in CLI, React 19 in apps).
Do NOT try to unify React/Zod versions across packages.

## Branching Strategy

This repo uses a **quality branch** as an integration gate before `main`.

- **Feature branches** → PR to `quality` (NOT `main`)
- **`quality` → `main`** → triggers releases

**When starting new work, ALWAYS branch from `quality`:**
```bash
git checkout quality && git pull
git checkout -b feat/<feature-name>
```

**NEVER create feature branches from `main`.**

## Release
- **CLI**: Conventional commits on `packages/cli/**` → auto-publish to npm (triggered on merge to `main`)
- **Boilerplate**: Auto-tagged on merge from `quality` to `main` via conventional commits → syncs to customer repo
- **Docs**: Push to main → deploy via Vercel/Netlify

## Agent skills

The doctrine, domain glossary, and ADRs live with the boilerplate (`apps/boilerplate/`), since that's the product surface. The root only carries workspace-level concerns.

### Doctrine

Engineering doctrine (TDD, tests, mocking, interface design, deep modules, plus eniem-specific Prisma/Polar/BetterAuth/Next.js rules) lives in `apps/boilerplate/CODING_STANDARDS.md`. Read it before writing code. The `/tdd` skill references it; `.looper/PROMPT_BUILD.md` reads it directly.

### Code review

Reviewer doctrine lives in `apps/boilerplate/docs/CODE_REVIEW.md`. The `/code-review` skill reads it before reviewing a PR.

### Domain

Shared domain language: `apps/boilerplate/docs/CONTEXT.md`. Maintained via `/grill-with-docs`.

### Architectural decisions

ADRs live under `apps/boilerplate/docs/adr/NNNN-*.md`. Template at `apps/boilerplate/docs/adr/0000-template.md`.

### Issue tracker

GitHub Issues. Triage labels: `bug`, `enhancement`, `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`.

### AFK loop

`.looper/PROMPT_BUILD.md` — implements PRD sub-issues one at a time. Trigger: `looper run --prompt .looper/PROMPT_BUILD.md --var PRD_ISSUE=<n>`.
