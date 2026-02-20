# Stable Build Branch Naming

## Overview

The build loop (`loop.sh build`) currently generates branch names using `build-$(date +%Y%m%d)`, which causes divergent branches when the loop is restarted after midnight. This spec replaces the date-based naming with a required name argument that produces stable, resumable branch names.

## Problem Statement

**Who:** Developer running `./loop.sh build` for autonomous coding sessions
**Problem:** When a build session is interrupted (rate limits, crashes) and restarted after midnight, the date-based branch name changes, creating a new branch and worktree. Code from the first session is stranded on the old branch with no automatic way to resume.
**Impact:** Duplicate work (tasks re-implemented differently), divergent branches requiring manual reconciliation, beads marked done but code missing from the active branch. Real incident on Feb 19-20 resulted in two divergent branches with 18 overlapping files.

## Scope

### Included

- Make the `<name>` argument required for `./loop.sh build`
- Compute stable branch name and worktree path from the name in `loop.sh`
- Pass `{{BRANCH}}` and `{{WORKTREE}}` as template variables to `PROMPT_build.md`
- Auto-detect whether `<name>` matches an existing beads epic
- Epic mode: `feat/<name>` branch, filter tasks by epic
- Session mode: `build-<name>` branch, work all ready tasks
- Update prompt Phase 0 to use pre-computed `{{BRANCH}}` and `{{WORKTREE}}`
- Update prompt Phase 1 to handle epic vs session mode
- Update prompt Phase 5 to detect fully-closed epics and archive their specs
- Remove shell-side ready-count filtering by epic from `loop.sh`
- Update help text and usage examples

### Excluded

- Automatic worktree cleanup (user handles via `/cleanup`)
- Interactive prompts or confirmation flows
- Reconciling the existing divergent branches (`build-20260219`, `build-20260220`)
- Name validation (agent handles git branch creation)

### Constraints

- Must not break `plan` mode (only `build` mode changes)
- Must remain compatible with existing beads issue format

## User Stories

### Primary Flow

- [ ] As a developer, I can run `./loop.sh build my-session` so that the branch name is stable across restarts
- [ ] As a developer, I can restart a build session by name and resume on the same branch/worktree so that no work is stranded
- [ ] As a developer, I can run `./loop.sh build usage-pricing` where `usage-pricing` matches an epic, so that only that epic's tasks are worked

### Secondary Flows

- [ ] As a developer, I can run `./loop.sh build catch-up` (no matching epic) so that all ready tasks are worked in a session
- [ ] As a developer, I can see which specs were archived when a session completes multiple epics

## Business Rules

### Name Argument

- `<name>` is **required** for `build` mode
- Running `./loop.sh build` with no name shows usage error and exits
- Name is passed through as-is (no validation in loop.sh)

### Epic Detection (in loop.sh)

- loop.sh checks `bd list --type=epic` for an epic whose title contains `<name>`
- Match found: epic mode (`IS_EPIC=true`, `BRANCH=feat/<name>`, `WORKTREE=.worktrees/feat/<name>`)
- No match: session mode (`IS_EPIC=false`, `BRANCH=build-<name>`, `WORKTREE=.worktrees/build-<name>`)
- If a name collides with an epic name, epic takes priority (no warning needed)

### Template Variables (computed by loop.sh)

- `{{BRANCH}}` — the git branch name (e.g., `feat/usage-pricing` or `build-my-session`)
- `{{WORKTREE}}` — the worktree path (e.g., `.worktrees/feat/usage-pricing` or `.worktrees/build-my-session`)
- `{{IS_EPIC}}` — `true` or `false`
- `{{EPIC_NAME}}` — the name argument (always set, regardless of mode)

### Ready Count (loop.sh)

- loop.sh counts total ready tasks (`bd ready | grep -c "^beads-"`) regardless of epic filter
- No shell-side filtering by epic name
- The agent handles epic-specific filtering inside the prompt

### Worktree Behavior

- If worktree already exists for the computed path: just enter it (resume case)
- If worktree doesn't exist: create it with a new branch from current HEAD
- Agent handles `git worktree add` and `pnpm install`

### Commit Messages

- Epic mode: `feat(<epic-name>): [task description]`
- Session mode: `feat(<session-name>): [task description]`
- Both include `Progress:` and `Next:` lines

### Phase 5: PR & Spec Archiving

- PR title: `feat: <name>` (same format regardless of mode)
- After PR creation, the agent checks which epics are now fully closed:
  1. List all epics (`bd list --type=epic`)
  2. For each epic, check if all its child tasks are closed
  3. If an epic is fully closed and a matching spec file exists in `specs/`, archive it to `specs/archive/`
- Worktree is NOT cleaned up automatically (user handles it)

## Data Model

### Template Variables (new/modified)

| Variable | Type | Source | Description |
|----------|------|--------|-------------|
| `{{BRANCH}}` | string | loop.sh | Git branch name |
| `{{WORKTREE}}` | string | loop.sh | Worktree directory path |
| `{{IS_EPIC}}` | boolean | loop.sh | Whether name matched an epic |
| `{{EPIC_NAME}}` | string | loop.sh | The name argument (always set) |
| `{{ITERATION}}` | number | loop.sh | Current iteration (unchanged) |

### State: Epic linkage in beads

Tasks are linked to epics via `--notes="Epic: [epic-id]"` (set by PROMPT_plan.md). Epics have spec name in their title (e.g., `"usage-based-pricing: One-line summary"`).

## Edge Cases

### Error Scenarios

| Scenario | Expected Behavior |
|----------|-------------------|
| `./loop.sh build` (no name) | Print usage error and exit with code 1 |
| Name contains spaces/special chars | Pass through — agent handles branch creation; git errors if invalid |
| Epic exists but has no ready tasks | Agent enters epic mode, finds no ready tasks, goes to Phase 5 or exits |
| Multiple epics match the name | First match wins (grep behavior) |

### Boundary Conditions

| Condition | Expected Behavior |
|-----------|-------------------|
| Worktree exists from previous session | Enter it and continue (resume) |
| Session spans multiple epics | Agent works all ready tasks; Phase 5 archives fully-closed epics |
| Epic partially complete at end of iterations | Loop stops normally; next run resumes |
| Name matches epic after later `plan` creates one | Epic mode activates on next run (detection happens each time) |

## Acceptance Criteria

### Required name argument

- [ ] **Given** a user runs `./loop.sh build` with no arguments, **when** the script executes, **then** it prints usage help and exits with code 1
- [ ] **Given** a user runs `./loop.sh build my-session`, **when** the script executes, **then** it passes `my-session` as the name and starts the build loop

### Stable branch naming

- [ ] **Given** a user runs `./loop.sh build my-session` at 23:00, **when** they restart it at 01:00 the next day, **then** the same branch (`build-my-session`) and worktree are used
- [ ] **Given** a name matching an existing epic, **when** the build starts, **then** the branch is `feat/<name>` not `build-<name>`

### Epic auto-detection

- [ ] **Given** a name that matches an epic title in beads, **when** loop.sh starts, **then** `{{IS_EPIC}}` is set to `true` and `{{BRANCH}}` uses `feat/` prefix
- [ ] **Given** a name that does NOT match any epic, **when** loop.sh starts, **then** `{{IS_EPIC}}` is set to `false` and `{{BRANCH}}` uses `build-` prefix

### Template variables

- [ ] **Given** loop.sh computes branch and worktree, **when** the prompt is rendered, **then** `{{BRANCH}}` and `{{WORKTREE}}` are substituted in the prompt content
- [ ] **Given** the prompt receives `{{BRANCH}}` and `{{WORKTREE}}`, **when** Phase 0 runs, **then** the agent uses these values directly (no date computation)

### Session mode behavior

- [ ] **Given** session mode (no epic match), **when** the agent selects tasks, **then** it works all ready tasks regardless of epic
- [ ] **Given** session mode completes and some epics are fully closed, **when** Phase 5 runs, **then** those epics' spec files are archived

### Ready count

- [ ] **Given** any build mode, **when** loop.sh counts ready tasks, **then** it counts ALL ready tasks (no epic filtering in shell)

### Help text

- [ ] **Given** a user runs `./loop.sh build --help` or `./loop.sh help`, **when** the help is displayed, **then** it shows `<name>` as required with a note about auto-detection

## Files

### Monorepo root
- `.eni/loop.sh` — lines 17-40 (usage), 213-282 (build command)
- `.eni/PROMPT_build.md` — Phase 0 (lines 12-36), Phase 1 (lines 57-68), Phase 4 (lines 124-146), Phase 5 (lines 148-203)
- `package.json` — scripts `eni:build`, `eni:build:auto` (lines 15-16)

### Boilerplate app
- `apps/boilerplate/.eni/loop.sh` — same structure as root, needs same changes
- `apps/boilerplate/.eni/PROMPT_build.md` — same structure as root, needs same changes
- `apps/boilerplate/package.json` — script `eni:build` (line 25)
