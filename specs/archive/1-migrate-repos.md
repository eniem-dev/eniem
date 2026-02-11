# Migrate Repos via Git Subtree

## Overview
Import all 3 existing repos into the monorepo using git subtree, preserving full commit history.

## Job to Be Done
Bring boilerplate, CLI, and docs source code into the monorepo structure so all development happens in one place.

## Requirements

### Must Have
- [ ] `git subtree add --prefix=apps/boilerplate git@0xtiby:eniem-dev/eniem-boilerplate.git main`
- [ ] `git subtree add --prefix=packages/cli git@0xtiby:eniem-dev/eniem-cli.git main`
- [ ] `git subtree add --prefix=apps/docs git@0xtiby:eniem-dev/eniem-doc.git main`
- [ ] Verify git log shows preserved history for each package
- [ ] `pnpm install` succeeds at root (isolated deps per package)
- [ ] `pnpm build` succeeds for all packages

## Constraints
- Run subtree commands from monorepo root
- Do NOT normalize dependency versions — React 18 in CLI, React 19 in apps, Zod 3 in CLI, Zod 4 in boilerplate
- Each package keeps its own lock file handling via pnpm workspaces

## Acceptance Criteria
- [ ] `apps/boilerplate/` contains full boilerplate source with git history
- [ ] `packages/cli/` contains full CLI source with git history
- [ ] `apps/docs/` contains full docs source with git history
- [ ] `git log --oneline apps/boilerplate/` shows boilerplate commit history
- [ ] `pnpm install` works without version conflicts
- [ ] `pnpm build` succeeds

## Edge Cases
- Subtree merge conflicts: unlikely on empty monorepo, but resolve if they occur
- Large repo size from combined histories: acceptable trade-off for history preservation

## Out of Scope
- Updating package names (separate spec)
- Removing sub-package workflows (separate spec)
- Setting up CI/CD (separate spec)

## Technical Hints
- Git remotes use `git@0xtiby:` prefix
- Boilerplate needs `.env` copied from `.env.example` for build
- CLI builds with tsup, docs with Next.js, boilerplate with Next.js

## Test Requirements
- [ ] Test: `git log --oneline --follow apps/boilerplate/src/app/layout.tsx` shows history
- [ ] Test: `pnpm install` exits 0
- [ ] Test: `pnpm turbo build` exits 0
