# Move Starters Outside Monorepo

## Overview
Move `apps/boilerplate/examples/eniem-polar-benefits-sample/` into a new `apps/starters/` workspace in the monorepo and sync the entire `apps/starters/` folder to a private GitHub repo `eniem-dev/eniem-starters` via CI, mirroring the existing boilerplate sync pipeline.

## Job to Be Done
Customers need access to example/starter projects that demonstrate specific eniem use cases (e.g. Polar benefits). These starters should live in their own synced repo — separate from the boilerplate — so customers can browse and clone them independently.

## Requirements

### Must Have
- [ ] Create `apps/starters/` directory in the monorepo
- [ ] Move `apps/boilerplate/examples/eniem-polar-benefits-sample/` to `apps/starters/eniem-polar-benefits-sample/`
- [ ] Delete `apps/boilerplate/examples/` after the move (nothing left there)
- [ ] Rename the starter's package name from `@eniem/boilerplate` to `@eniem/starter-polar-benefits` in its `package.json`
- [ ] Create a root `apps/starters/README.md` — an index listing each starter with a brief description
- [ ] Create private GitHub repo `eniem-dev/eniem-starters`
- [ ] Create `.github/workflows/auto-tag-starters.yml` — auto-tag on push to main when `apps/starters/` changes
- [ ] Create `.github/workflows/sync-starters.yml` — sync `apps/starters/` to `eniem-dev/eniem-starters` on `starters@*` tags
- [ ] Sync must strip dev artifacts: `specs/`, `.claude/`, `.beads/`, `node_modules/`, `.next/`, `.worktrees/`
- [ ] Sync must regenerate each starter's lockfile so it works standalone
- [ ] Only commit to customer repo if there are actual changes

### Nice to Have
- [ ] CI workflow included inside each starter (`.github/workflows/ci.yml`) for customers who clone them — but this is the starter's own CI, not the monorepo sync CI

### Out of Scope
- Polar benefit access configuration (will be handled manually)
- Starter content changes (just move as-is, fix package name)
- Adding new starters beyond `eniem-polar-benefits-sample`

## Users

**Primary:** Eniem customers who purchased the boilerplate and want reference implementations for specific features (Polar benefits, etc.)

**Secondary:** Eniem maintainers who add/update starters in the monorepo and expect them to sync automatically.

## User Stories

1. **As a customer**, I can clone `eniem-dev/eniem-starters` and find an index of available starters so I can pick one that matches my use case.
2. **As a customer**, I can `cd` into a starter subdirectory, run `pnpm install`, and have a working standalone project (no monorepo dependencies).
3. **As a maintainer**, I can push changes to `apps/starters/` on main and have the starters repo update automatically via CI.
4. **As a maintainer**, I can add a new starter by creating a subfolder in `apps/starters/` — no CI changes needed.

## Monorepo Structure (After)

```
apps/
  boilerplate/          # existing, unchanged (examples/ removed)
  starters/
    README.md           # index of starters
    eniem-polar-benefits-sample/
      package.json      # name: @eniem/starter-polar-benefits
      src/
      ...
```

## CI Pipeline

### Auto-Tag Workflow (`auto-tag-starters.yml`)

Mirror of `auto-tag-boilerplate.yml` with these differences:

| Parameter | Boilerplate | Starters |
|---|---|---|
| Tag prefix | `boilerplate@` | `starters@` |
| Watch path | `apps/boilerplate/` | `apps/starters/` |
| Tag list filter | `boilerplate@*` | `starters@*` |

- Triggers on push to `main`
- Detects file changes in `apps/starters/`
- Reads conventional commits touching `apps/starters/` since last `starters@*` tag
- Determines semver bump (major/minor/patch) from commit prefixes
- Creates and pushes annotated tag `starters@x.y.z`

### Sync Workflow (`sync-starters.yml`)

Mirror of `sync-boilerplate.yml` with these differences:

| Parameter | Boilerplate | Starters |
|---|---|---|
| Tag trigger | `boilerplate@*` | `starters@*` |
| Source path | `apps/boilerplate/` | `apps/starters/` |
| Rsync excludes | `node_modules`, `.next`, `.worktrees`, `.beads` | Same + `specs/`, `.claude/` |
| Package rename | `@eniem/boilerplate` → `eniem` | No global rename (each starter already has its own name) |
| Lockfile regen | Single `pnpm install --lockfile-only` at root | `pnpm install --lockfile-only` in each starter subdirectory |
| Target repo | `eniem-dev/eniem-boilerplate` | `eniem-dev/eniem-starters` |
| Deploy key secret | `BOILERPLATE_DEPLOY_KEY` | `STARTERS_DEPLOY_KEY` |

**Sync steps:**
1. Extract version from `starters@x.y.z` tag
2. Build changelog from commits touching `apps/starters/`
3. Rsync `apps/starters/` to temp dir (with excludes)
4. For each starter subdirectory: run `pnpm install --lockfile-only` to regenerate standalone lockfile
5. Clone `eniem-dev/eniem-starters` via deploy key
6. Swap `.git` directory
7. Commit + tag + push (only if changes exist)

## Business Rules

- **Versioning is collective:** All starters share one version (`starters@x.y.z`). A change to any starter bumps the version for the whole collection.
- **Dev artifacts are stripped:** `specs/`, `.claude/`, `.beads/` directories inside starters are excluded from sync. Customers get clean projects.
- **Standalone lockfiles:** Each starter must have its own `pnpm-lock.yaml` generated without workspace context, so `pnpm install` works when cloned standalone.
- **Starters README stays in sync:** The root `apps/starters/README.md` is synced as-is. When a new starter is added, the maintainer must update this README.

## Edge Cases

- **No conventional commits:** If commits touch `apps/starters/` but none are `feat:` or `fix:`, no tag is created (same as boilerplate behavior).
- **Empty diff on sync:** If rsync + strip produces no changes vs the customer repo, skip the commit (same as boilerplate behavior).
- **New starter added:** Just a new subdirectory — the auto-tag workflow picks up any `apps/starters/` change, and rsync copies everything.
- **Starter removed:** Rsync with git-swap means deleted starters disappear from the customer repo on next sync.
- **Lockfile regen fails:** If a starter has broken dependencies, the sync workflow fails and no partial push happens.

## Acceptance Criteria

- [ ] `apps/boilerplate/examples/` no longer exists
- [ ] `apps/starters/eniem-polar-benefits-sample/package.json` has name `@eniem/starter-polar-benefits`
- [ ] `apps/starters/README.md` lists available starters
- [ ] `eniem-dev/eniem-starters` private repo exists on GitHub
- [ ] `.github/workflows/auto-tag-starters.yml` exists and is valid YAML
- [ ] `.github/workflows/sync-starters.yml` exists and is valid YAML
- [ ] Pushing a `feat:` commit touching `apps/starters/` to main creates a `starters@0.1.0` tag
- [ ] The `starters@0.1.0` tag triggers sync and the starters repo receives the commit
- [ ] Synced repo does NOT contain `specs/`, `.claude/`, `.beads/`, `node_modules/`, `.next/`
- [ ] Each starter in the synced repo has a working `pnpm-lock.yaml` (standalone, no workspace refs)
- [ ] `STARTERS_DEPLOY_KEY` secret is configured on the monorepo

## Dependencies

- GitHub repo `eniem-dev/eniem-starters` must be created (with deploy key) before the sync workflow can run
- `STARTERS_DEPLOY_KEY` secret must be added to the monorepo's GitHub settings
