<!-- CLAUDE.md is a symlink to this file -->

# Eniem Monorepo

## Structure
- `apps/boilerplate` — Main product (Next.js 15, BetterAuth, Polar, Prisma)
- `apps/docs` — Documentation site (Next.js 16, Fumadocs)
- `packages/cli` — CLI scaffolding tool (Ink 5, React 18)

## Commands
- `pnpm dev:boilerplate` — Start boilerplate dev server
- `pnpm dev:docs` — Start docs dev server
- `pnpm dev:cli` — Start CLI in watch mode
- `pnpm build` — Build all packages
- `pnpm test` — Run all tests

## Per-Package Commands
Run with: `pnpm --filter @eniem/boilerplate <script>`

## Turborepo
Filter: `pnpm turbo build --filter=@eniem/boilerplate`

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
