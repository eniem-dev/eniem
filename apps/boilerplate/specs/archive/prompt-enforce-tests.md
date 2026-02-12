# Prompt Enforce Tests

## Overview

Update the `.eni/PROMPT_build.md` and `.eni/PROMPT_plan.md` prompts to enforce unit test creation and validation, and use git worktrees for parallel build isolation. Currently, the build loop validates with `pnpm build` and `pnpm lint` but never writes or runs tests. The plan prompt creates beads without test expectations. The build prompt also works directly in the main checkout, preventing parallel epic builds. This spec closes those gaps.

## Job to Be Done

When the autonomous build loop implements a feature, it should always produce tests alongside the implementation code — so that every commit is self-verifying and regressions are caught automatically. Multiple epics should be buildable in parallel without interfering with each other or the main checkout.

## Target User

AI agents running through the `.eni/loop.sh` build and plan workflows.

## Requirements

### Must Have

- [ ] `PROMPT_build.md` Phase 3 validation gate includes `pnpm test` (must pass before commit)
- [ ] `PROMPT_build.md` Phase 3 requires creating colocated `.test.ts` files for implementation code
- [ ] `PROMPT_build.md` includes a test exception clause for config/schema/static-data-only changes
- [ ] `PROMPT_plan.md` Step 4 design field template includes a `## Tests` section listing expected test cases
- [ ] `PROMPT_plan.md` refinement checklist (Iteration 2+) includes "Tests section present in design field?"
- [ ] `PROMPT_build.md` Phase 0 creates a git worktree in `.worktrees/<branch-name>` instead of switching branches in the main checkout
- [ ] `PROMPT_build.md` Phase 0 runs `pnpm install` in the worktree after creation
- [ ] `PROMPT_build.md` instructs the agent to work entirely within the worktree directory
- [ ] `.gitignore` includes `.worktrees/` entry

### Nice to Have

- [ ] Example test snippet in `PROMPT_build.md` showing the project's colocated test pattern
- [ ] `PROMPT_build.md` Phase 5 (or completion) cleans up the worktree after PR creation

## Constraints

- No coverage threshold enforcement — just require tests exist and pass
- Test files colocated next to source (e.g., `service.ts` → `service.test.ts`), matching existing vitest config
- Do not change the PR template in Phase 5
- Do not create separate test beads — tests are part of each implementation bead
- Worktrees live in `.worktrees/` at repo root (gitignored)
- Worktree path: `.worktrees/feat/<epic-name>` (mirrors branch name)
- Agent must `cd` into worktree and work entirely from there

## Acceptance Criteria

- [ ] `PROMPT_build.md` Phase 3 validation runs `pnpm test` after `pnpm build` and `pnpm lint`
- [ ] `PROMPT_build.md` Phase 3 states that implementation must include `.test.ts` files unless the task is config/schema/static-data only
- [ ] `PROMPT_build.md` Guardrails section includes a test-related guardrail
- [ ] `PROMPT_plan.md` design field template has a `## Tests` section with expected test cases
- [ ] `PROMPT_plan.md` refinement checklist includes a test coverage check
- [ ] `PROMPT_build.md` Phase 0 creates/reuses a worktree at `.worktrees/feat/<epic-name>` and works from there
- [ ] `PROMPT_build.md` Phase 0 installs dependencies in worktree (`pnpm install`)
- [ ] `.gitignore` has `.worktrees/` entry
- [ ] Existing prompt structure and flow is preserved (no rewrite, only additions)

## Edge Cases

- Config-only task (e.g., updating `products.json`): agent skips test creation but still runs `pnpm test` to ensure nothing broke
- Task with no testable logic (e.g., Prisma schema migration): agent skips test creation, documents why in commit
- Bead design field already has acceptance criteria: `## Tests` section derives test cases from those criteria
- Worktree already exists for this branch: reuse it, don't recreate
- No epic specified (building all): use `.worktrees/build-<date>` as worktree path

## Out of Scope

- Adding testing guidance to `CLAUDE.md` (separate concern)
- Coverage thresholds or coverage reporting
- Integration/e2e test enforcement
- Changes to `loop.sh` (worktree logic is in the prompt, not the shell script)
- Changes to PR template (Phase 5)

## Technical Hints

- **Files to modify**: `.eni/PROMPT_build.md`, `.eni/PROMPT_plan.md`, `.gitignore`
- **Patterns to follow**: See existing validation gate in `PROMPT_build.md` lines 99-104; extend with `pnpm test`
- **Patterns to follow**: See existing design field template in `PROMPT_plan.md` lines 51-67; add `## Tests` section
- **Existing test examples**: `src/lib/errors.test.ts`, `src/lib/utils.test.ts` (colocated, vitest, describe/it/expect)

## Verification Commands

| Criterion | Command |
|-----------|---------|
| Build prompt has `pnpm test` in validation | `grep -q "pnpm test" .eni/PROMPT_build.md && echo pass` |
| Build prompt mentions .test.ts requirement | `grep -q "\.test\.ts" .eni/PROMPT_build.md && echo pass` |
| Build prompt has config/schema exception | `grep -qi "config\|schema" .eni/PROMPT_build.md && echo pass` |
| Plan prompt design field has Tests section | `grep -q "## Tests" .eni/PROMPT_plan.md && echo pass` |
| Plan prompt refinement checklist has test check | `grep -qi "test" .eni/PROMPT_plan.md && echo pass` |
| Guardrails updated | `grep -qi "test" .eni/PROMPT_build.md && echo pass` |
| Build prompt has worktree setup | `grep -q "git worktree" .eni/PROMPT_build.md && echo pass` |
| Build prompt has pnpm install in worktree | `grep -q "pnpm install" .eni/PROMPT_build.md && echo pass` |
| .worktrees/ is gitignored | `grep -q ".worktrees" .gitignore && echo pass` |

## Test Requirements

- N/A — this spec modifies prompt files (markdown), not application code. Verification is via grep commands above.
