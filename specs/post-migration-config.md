# Post-Migration Configuration

## Overview
Update package names, remove duplicate workflows from sub-packages, and configure semantic-release for monorepo context.

## Job to Be Done
Make all packages work correctly within the monorepo structure — proper naming for turborepo filtering, centralized CI, and CLI releases that don't false-trigger on other packages' commits.

## Requirements

### Must Have
- [ ] Update `apps/boilerplate/package.json` name from `"eniem"` to `"@eniem/boilerplate"`
- [ ] Update `apps/docs/package.json` name from `"enim-docs"` to `"@eniem/docs"`
- [ ] Keep `packages/cli/package.json` name as `"eniem-cli"` (npm-published)
- [ ] Delete `apps/boilerplate/.github/workflows/` directory
- [ ] Delete `packages/cli/.github/workflows/` directory
- [ ] Install `semantic-release-monorepo` in CLI: `cd packages/cli && pnpm add -D semantic-release-monorepo`
- [ ] Update `packages/cli/.releaserc.json` to add `"extends": "semantic-release-monorepo"`
- [ ] Verify turborepo filtering works: `pnpm turbo build --filter=@eniem/boilerplate`
- [ ] Verify turborepo filtering works: `pnpm turbo build --filter=eniem-cli`

## Constraints
- Do NOT change CLI npm package name — it's published as `eniem-cli`
- Keep existing `.releaserc.json` plugins, only add `extends` field
- Do NOT modify tsconfig, eslint, or other per-package configs

## Acceptance Criteria
- [ ] `pnpm turbo build --filter=@eniem/boilerplate` builds only boilerplate
- [ ] `pnpm turbo build --filter=@eniem/docs` builds only docs
- [ ] `pnpm turbo build --filter=eniem-cli` builds only CLI
- [ ] No `.github/workflows/` directories in sub-packages
- [ ] `packages/cli/.releaserc.json` has `"extends": "semantic-release-monorepo"`
- [ ] `pnpm build` still passes for all packages

## Edge Cases
- If `apps/docs/.github/workflows/` doesn't exist, skip deletion (it doesn't have one)

## Out of Scope
- Creating new GitHub Actions workflows (separate spec)
- AI workflow changes (separate spec)

## Technical Hints
- **Files to modify**:
  - `apps/boilerplate/package.json` — change name field
  - `apps/docs/package.json` — change name field
  - `packages/cli/.releaserc.json` — add extends field
- **Directories to delete**:
  - `apps/boilerplate/.github/`
  - `packages/cli/.github/`
- **Install command**: `pnpm add -D semantic-release-monorepo --filter=eniem-cli`
- `semantic-release-monorepo` handles:
  - Commit filtering: only analyzes commits touching `packages/cli/`
  - Tag namespacing: auto-sets `tagFormat` to `eniem-cli@${version}`
  - Asset paths: resolves correctly from subdirectory

## Test Requirements
- [ ] Test: `pnpm turbo build` succeeds
- [ ] Test: `pnpm turbo build --filter=@eniem/boilerplate` builds only boilerplate
- [ ] Test: `pnpm turbo build --filter=eniem-cli` builds only CLI
- [ ] Test: No `.github/workflows` in `apps/` or `packages/` subdirectories
