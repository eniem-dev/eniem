# CI Release Process: Quality Branch & Auto-Tagging

## Overview

Introduce a long-lived `quality` branch as an integration gate between feature branches and `main`. CLI releases happen only on merge to `main`. Boilerplate tags are created automatically on merge from `quality` to `main` using conventional-commit analysis (same system as the CLI). Branch protection rules enforce that all feature work flows through `quality` first.

## Problem Statement

**Who:** Eniem maintainers managing releases across CLI and boilerplate packages
**Problem:** Today, feature branches merge directly to `main`, which immediately triggers CLI releases and requires manual tagging for boilerplate syncs. There is no staging area to batch and validate changes before release.
**Impact:** Without an intermediate branch, every merge to `main` is a release event. Boilerplate tagging is manual and error-prone. There is no way to accumulate and QA multiple features before shipping.

## Scope

### Included
- Long-lived `quality` branch as integration target for all feature branches
- CI workflow updates to run on PRs to both `quality` and `main`
- CLI release continues to trigger only on merge to `main` (unchanged trigger, but now gated by quality-to-main flow)
- Automatic boilerplate tagging on merge from `quality` to `main` using conventional commits
- Branch protection rules for both `quality` and `main`
- Merge commit strategy for `quality` to `main` merges (preserves full history)

### Excluded
- Automatic sync of `main` back into `quality` (manual responsibility)
- Changes to the docs deployment process (remains: push to main deploys)
- Changes to the boilerplate sync workflow itself (still triggered by `boilerplate@*` tags)
- Hotfix bypass paths (all work goes through `quality`)

### Constraints
- Must work with existing semantic-release setup for CLI
- Boilerplate auto-tagging must use conventional commit analysis scoped to `apps/boilerplate/**`
- Must not break existing `sync-boilerplate.yml` workflow (it still triggers on `boilerplate@*` tags)

## User Stories

### Primary Flow

- [ ] As a developer, I can merge my feature branch into `quality` so that my work is integrated and tested alongside other features before release
- [ ] As a maintainer, I can create a PR from `quality` to `main` so that a batch of validated changes is promoted to release
- [ ] As a maintainer, when I merge `quality` into `main`, the CLI is automatically released (if `packages/cli/**` changed) so that npm always reflects the latest main
- [ ] As a maintainer, when I merge `quality` into `main`, a `boilerplate@x.y.z` tag is automatically created (if `apps/boilerplate/**` changed) so that the customer-facing repo syncs without manual tagging

### Secondary Flows

- [ ] As a developer, I can see CI results on my PR to `quality` so that I know my changes pass all quality gates before integration
- [ ] As a maintainer, I can see CI results on the PR from `quality` to `main` so that I have confidence the batch is releasable

## Business Rules

### Branch Flow
- Rule 1: Feature branches merge into `quality` only (never directly into `main`)
- Rule 2: `quality` merges into `main` via merge commit (not squash, not rebase)
- Rule 3: `main` is synced back into `quality` manually by a maintainer when needed

### CLI Release
- Rule 4: CLI release triggers only on push to `main` with changes in `packages/cli/**` (unchanged from today)
- Rule 5: Merges to `quality` must NOT trigger CLI release

### Boilerplate Tagging
- Rule 6: On merge from `quality` to `main`, if `apps/boilerplate/**` files changed, automatically determine version bump using conventional commit analysis
- Rule 7: If no `apps/boilerplate/**` files changed in the merge, skip boilerplate tagging entirely
- Rule 8: The auto-created tag must follow the existing `boilerplate@x.y.z` format to trigger the existing `sync-boilerplate.yml` workflow

### Permissions
- Rule 9: Any maintainer (write access) can merge `quality` to `main`
- Rule 10: Direct pushes to `main` are blocked (all changes via PR)
- Rule 11: Direct pushes to `quality` are blocked (all changes via PR)

## Data Model

### State Transitions

```
Feature Branch → PR to quality → CI passes → Merge to quality
quality → PR to main → CI passes → Merge to main
Merge to main → CLI release (if packages/cli/** changed)
Merge to main → Boilerplate tag (if apps/boilerplate/** changed) → Sync workflow
```

### Version Determination (Boilerplate)

Uses conventional commit analysis on commits between the last `boilerplate@*` tag and HEAD, scoped to `apps/boilerplate/**`:
- `fix:` commits → patch bump
- `feat:` commits → minor bump
- `BREAKING CHANGE:` or `feat!:` / `fix!:` → major bump
- No relevant commits → no tag created

## Workflow Specifications

### Workflow 1: CI (updated)

**Trigger:** PR to `quality` OR PR to `main`
**Jobs:** build, lint, typecheck, test (same as today)
**Change from today:** Add `quality` to the branch list

### Workflow 2: Release CLI (unchanged trigger)

**Trigger:** Push to `main` with changes in `packages/cli/**`
**Jobs:** Build CLI, run semantic-release
**No change needed:** Already only triggers on `main`. The `quality` branch naturally prevents premature releases.

### Workflow 3: Auto-Tag Boilerplate (new)

**Trigger:** Push to `main` (merge commit from `quality`)
**Conditions:**
1. Check if `apps/boilerplate/**` files changed compared to previous `boilerplate@*` tag
2. If no changes, exit early
**Actions:**
1. Analyze conventional commits since last `boilerplate@*` tag, scoped to `apps/boilerplate/**`
2. Determine semver bump (patch/minor/major)
3. Create and push `boilerplate@x.y.z` tag
4. This triggers existing `sync-boilerplate.yml` automatically

### Workflow 4: Sync Boilerplate (unchanged)

**Trigger:** Push of `boilerplate@*` tag
**No change needed:** Continues to work exactly as today.

## Edge Cases

### Error Scenarios

| Scenario | Expected Behavior |
|----------|-------------------|
| No boilerplate changes in quality-to-main merge | Boilerplate auto-tag workflow exits early with success, no tag created |
| No conventional commits found for boilerplate | No tag created, workflow exits cleanly |
| Tag already exists for computed version | Workflow fails visibly — maintainer must investigate |
| CI fails on PR to quality | PR cannot be merged (branch protection) |
| CI fails on PR from quality to main | PR cannot be merged (branch protection) |
| Maintainer pushes directly to main | Blocked by branch protection rules |
| quality branch gets out of sync with main | Maintainer manually merges main into quality; merge conflicts resolved locally |

### Boundary Conditions

| Condition | Expected Behavior |
|-----------|-------------------|
| First ever boilerplate tag (no previous tag exists) | Analyze all commits on main for apps/boilerplate/** changes, create initial tag (e.g., boilerplate@1.0.0 or boilerplate@0.1.0) |
| Both CLI and boilerplate changed in same merge | Both workflows run independently — CLI release AND boilerplate tag are created |
| Only docs changed (no CLI, no boilerplate) | No release, no tag — only the Vercel/Netlify deploy triggers |
| quality branch has no new commits vs main | PR from quality to main has no diff — nothing to merge |

## Branch Protection Rules

### `main` branch
- Require PR before merging (no direct pushes)
- Require status checks to pass (CI workflow)
- Require merge commit (no squash, no rebase) for PRs from `quality`
- Do not allow bypassing the above settings

### `quality` branch
- Require PR before merging (no direct pushes)
- Require status checks to pass (CI workflow)
- Allow squash merges for feature PRs (individual feature commits collapsed)

## Acceptance Criteria

### Quality branch as integration gate
- [ ] **Given** a feature branch with changes, **when** a developer opens a PR to `quality`, **then** CI runs and the PR can be merged when checks pass
- [ ] **Given** a feature branch, **when** a developer tries to open a PR directly to `main`, **then** branch protection prevents the merge

### CI on both branches
- [ ] **Given** a PR targeting `quality`, **when** it is opened, **then** CI (build, lint, typecheck, test) runs
- [ ] **Given** a PR targeting `main` (from `quality`), **when** it is opened, **then** CI runs

### CLI release only on main
- [ ] **Given** a feature branch merged into `quality` with CLI changes, **when** the merge completes, **then** no CLI release is triggered
- [ ] **Given** `quality` merged into `main` with CLI changes, **when** the merge completes, **then** semantic-release publishes a new CLI version

### Boilerplate auto-tagging
- [ ] **Given** `quality` merged into `main` with boilerplate changes, **when** the merge completes, **then** a `boilerplate@x.y.z` tag is automatically created based on conventional commits
- [ ] **Given** `quality` merged into `main` with only CLI changes (no boilerplate changes), **when** the merge completes, **then** no boilerplate tag is created
- [ ] **Given** a `boilerplate@x.y.z` tag is created, **then** the existing `sync-boilerplate.yml` workflow triggers and syncs to the customer repo

### Merge strategy
- [ ] **Given** a PR from `quality` to `main`, **when** it is merged, **then** it uses a merge commit (not squash)

## Resolved Decisions

- **Initial boilerplate version:** Continue from existing tags (latest is `boilerplate@0.2.1`). The auto-tagger finds the most recent `boilerplate@*` tag and increments from there.
- **Tagging tooling:** Custom shell script in the workflow (not semantic-release). Reads conventional commits since last `boilerplate@*` tag, determines semver bump, creates and pushes the tag. Lightweight, no extra dependencies.
- **PR from quality to main:** Always manual. Maintainer decides when `quality` is ready and creates the PR themselves.
