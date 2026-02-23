# Scoped Build Quality Gates

## Overview

Replace full-monorepo quality gates in the AI build loop with package-scoped validation. When a task only touches CLI files, the agent should only run CLI build/lint/test — not boilerplate, not docs. This dramatically reduces iteration time for small, single-package tasks.

## Problem Statement

**Who:** AI build agent (and the developer waiting for it)
**Problem:** The build loop (PROMPT_build.md Phase 3) runs `pnpm turbo build`, `pnpm turbo typecheck`, `pnpm turbo lint`, `pnpm test` on every task — rebuilding and retesting the entire monorepo even when changes are confined to a single package.
**Impact:** A 10-task epic on CLI-only changes takes 10x the time it should. Each iteration wastes ~2 minutes on unrelated boilerplate/docs builds instead of ~10 seconds for scoped CLI gates.

## Scope

### Included

- Update root `.eni/PROMPT_build.md` Phase 3 to use scoped quality gates
- Update `apps/boilerplate/.eni/PROMPT_build.md` Phase 3 with the same scoped validation logic
- Use the task's verify command (from design field) as the primary validation
- Fall back to git diff-based package detection when no verify command exists
- Fall back to full monorepo gates when root config files are changed
- Ensure PROMPT_plan.md continues to generate proper verify commands per task

### Excluded

- CI pipeline changes (ci.yml continues running full monorepo gates on PRs)
- Turbo.json or caching configuration changes
- Helper scripts — this is prompt-only changes
- `apps/docs/PROMPT_build.md` — uses a different orchestration model (Ralph Workflow) and already runs scoped commands
- Full monorepo gates at end of build loop — CI handles that

### Constraints

- Must not miss real failures: CI is the safety net, but scoped gates should still catch issues within the affected package
- Agent must be able to determine scope without external tooling (git diff + path matching)
- Solution must work within the existing PROMPT_build.md structure (no new files, no scripts)

## User Stories

### Primary Flow

- [ ] As a build agent, I can read the current task's verify command from its design field and run only that command as my quality gate, so that I validate exactly what the task requires
- [ ] As a build agent, when a task has no verify command, I can detect affected packages from `git diff` and run scoped turbo filters, so that I only validate what changed

### Fallback Flows

- [ ] As a build agent, when I detect changes to root-level config files, I run full monorepo quality gates, so that cross-package regressions are caught
- [ ] As a build agent, when changes span multiple packages, I run scoped gates for each affected package (not the full monorepo), so that validation is thorough but not wasteful

## Business Rules

### Package Detection

The monorepo has exactly 3 packages:

| Path prefix | Turbo filter | Package |
|-------------|-------------|---------|
| `packages/cli/` | `--filter=eniem-cli` | CLI |
| `apps/boilerplate/` | `--filter=@eniem/boilerplate` | Boilerplate |
| `apps/docs/` | `--filter=@eniem/docs` | Docs |

### Validation Priority (waterfall)

1. **Task verify command exists** → Run only that command
2. **No verify command, git diff maps to package(s)** → Run `pnpm turbo build lint typecheck test --filter=<package>` for each affected package
3. **Git diff includes root files** (turbo.json, package.json, pnpm-workspace.yaml, pnpm-lock.yaml, tsconfig.json) → Run full `pnpm turbo build lint typecheck test` (all packages)
4. **Git diff shows no changes** → Skip validation (nothing to validate)

### Root Files That Trigger Full Gates

Any changed file matching these patterns triggers full monorepo validation:

- `package.json` (root only)
- `pnpm-workspace.yaml`
- `pnpm-lock.yaml`
- `turbo.json`
- `tsconfig.json` (root only)

### Multi-Package Changes

When git diff shows changes in multiple packages (e.g., both `packages/cli/` and `apps/boilerplate/`), run scoped gates for each affected package independently:

```
pnpm turbo build lint typecheck test --filter=eniem-cli --filter=@eniem/boilerplate
```

### Verify Command Format

The PROMPT_plan.md already generates verify commands in task design fields. Standard format:

```
**Verify**: `pnpm turbo build lint typecheck test --filter=eniem-cli`
```

## Edge Cases

### Error Scenarios

| Scenario | Expected Behavior |
|----------|-------------------|
| Task has no design field | Fall back to git diff detection |
| Task has design field but no verify command | Fall back to git diff detection |
| Verify command fails | Same as today: fix and retry |
| Git diff fails or returns unexpected output | Fall back to full monorepo gates (safe default) |
| Changes only in non-package paths (specs/, .eni/, .github/) | Skip build/test gates entirely — these are docs/config, not code |

### Boundary Conditions

| Condition | Expected Behavior |
|-----------|-------------------|
| First task (no prior commits on branch) | Diff against base branch (`quality`) instead of last commit |
| Task touches only test files | Still run full package gates (tests depend on build) |
| Task touches only markdown/docs within a package | Run only lint for that package (skip build/test) |
| Worktree has uncommitted changes | Diff includes uncommitted changes (use `git diff HEAD`) |

## Acceptance Criteria

### Task with verify command

- [ ] **Given** a task whose design field contains a verify command, **when** the agent reaches Phase 3 validation, **then** it runs only the verify command (not full monorepo gates)
- [ ] **Given** a task whose verify command is `pnpm turbo build lint typecheck test --filter=eniem-cli`, **when** the agent validates, **then** only CLI build/lint/typecheck/test runs — boilerplate and docs are untouched

### Task without verify command (git diff fallback)

- [ ] **Given** a task with no verify command that only changed files in `packages/cli/`, **when** the agent validates, **then** it runs `pnpm turbo build lint typecheck test --filter=eniem-cli`
- [ ] **Given** a task that changed files in both `packages/cli/` and `apps/boilerplate/`, **when** the agent validates, **then** it runs scoped gates for both packages

### Root file changes

- [ ] **Given** a task that modified `turbo.json`, **when** the agent validates, **then** it runs full `pnpm turbo build lint typecheck test` (all packages)
- [ ] **Given** a task that modified `pnpm-lock.yaml` alongside `packages/cli/` files, **when** the agent validates, **then** it runs full monorepo gates (root file takes precedence)

### Non-code changes

- [ ] **Given** a task that only changed files in `specs/` or `.eni/`, **when** the agent validates, **then** it skips build/test gates entirely

### Speed improvement

- [ ] **Given** a CLI-only task, **when** the agent runs scoped validation, **then** the validation completes significantly faster than a full monorepo build

## Open Questions

- [x] Should PROMPT_plan.md be updated to ensure all new tasks always have verify commands? → Yes, this is already the standard but should be reinforced in the plan prompt
