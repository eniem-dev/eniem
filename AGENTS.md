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

## Beads (Issue Tracking)
This project uses **bd** (beads) for issue tracking. Run `bd onboard` to get started.
See `apps/boilerplate/AGENTS.md` for beads quick reference.

## Quick Reference

```bash
bd ready              # Find available work
bd show <id>          # View issue details
bd update <id> --status in_progress  # Claim work
bd close <id>         # Complete work
bd sync               # Sync with git
```

## Landing the Plane (Session Completion)

**When ending a work session**, you MUST complete ALL steps below. Work is NOT complete until `git push` succeeds.

**MANDATORY WORKFLOW:**

1. **File issues for remaining work** - Create issues for anything that needs follow-up
2. **Run quality gates** (if code changed) - Tests, linters, builds
3. **Update issue status** - Close finished work, update in-progress items
4. **PUSH TO REMOTE** - This is MANDATORY:
   ```bash
   bd sync                            # export DB → issues.jsonl
   git add .beads/issues.jsonl .beads/interactions.jsonl
   git commit -m "chore: update beads"
   git pull --rebase
   git push
   git status  # MUST show "up to date with origin"
   ```
5. **Clean up** - Clear stashes, prune remote branches
6. **Verify** - All changes committed AND pushed
7. **Hand off** - Provide context for next session

**CRITICAL RULES:**
- Work is NOT complete until `git push` succeeds
- NEVER stop before pushing - that leaves work stranded locally
- NEVER say "ready to push when you are" - YOU must push
- If push fails, resolve and retry until it succeeds
