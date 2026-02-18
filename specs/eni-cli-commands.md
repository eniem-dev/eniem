# ENI CLI — New Utility Commands

## Overview

Add three utility commands to the `eni` CLI: `eni land` for session-close automation, `eni doctor` for environment health checks, and `eni status` for a project dashboard showing specs, epics, and tasks at a glance.

## Problem Statement

**Who:** Eniem boilerplate developers (internal) and customers
**Problem:** Session close is a 6-step manual ritual prone to forgetting steps (especially `bd sync` and `git push`). Environment issues are discovered late with cryptic errors. There's no single view of project state across specs, beads, and git.
**Impact:** Forgotten pushes leave work stranded locally. Missing tools cause confusing failures deep in the workflow. Developers context-switch to multiple tools (`bd list`, `ls specs/`, `git log`) to understand where they are.

## Scope

### Included
- `eni land` — automate session-close: beads sync, push, verify
- `eni doctor` — check all required tools, files, and config
- `eni status` — dashboard of specs, epics, tasks, branch, last push

### Excluded
- Changes to the loop engine (spec 1)
- Changes to `eni ai setup` (spec 3)
- Changes to beads itself
- Any CI/CD changes

### Constraints
- All three commands work without `.eni/` directory (they're project-level, not AI-specific)
- `eni doctor` must work even when tools are missing (that's what it checks)
- `eni status` reads from beads and git — no external API calls

## User Stories

### eni land

- [ ] As a developer, I can run `eni land` to close my session so that all work is synced and pushed in one command
- [ ] As a developer, I see a clear error if push fails so that I can fix it before walking away
- [ ] As a developer, I see confirmation that everything is up to date so that I can confidently close my terminal

### eni doctor

- [ ] As a developer, I can run `eni doctor` to check my environment so that I know if anything is missing before I start working
- [ ] As a new developer, I see fix suggestions for each failing check so that I can set up my environment without asking for help
- [ ] As a developer, I can run `eni doctor` after installation to verify everything is correctly set up

### eni status

- [ ] As a developer, I can run `eni status` to see the state of all specs and their beads epics so that I know what's planned, in progress, and done
- [ ] As a developer, I can see task counts (ready, blocked, open, closed) so that I know how much work remains
- [ ] As a developer, I can see my current branch and last push time so that I know my git state at a glance

## Business Rules

### eni land

- Run `bd sync full` — let beads handle its own sync with the branch (do NOT manually `git add .beads/`)
- Run `git push` — push all committed work
- If push fails, attempt `git pull --rebase` once, then `git push` again
- If second push fails, stop and report the error with actionable guidance
- Final step: run `git status` and verify "up to date with origin"
- Print success or failure clearly — no ambiguity about whether work was pushed
- Works from any directory within the git repo (finds repo root)

### eni doctor

**Checks performed (in order):**

| Check | How | Fix suggestion |
|-------|-----|----------------|
| Node.js installed | `node --version` | "Install Node.js: https://nodejs.org" |
| pnpm installed | `pnpm --version` | "Install pnpm: npm install -g pnpm" |
| Claude CLI installed | `claude --version` | "Install Claude Code: https://docs.anthropic.com/en/docs/claude-code" |
| bd (beads) installed | `bd --version` | "Install beads: see project README" |
| `.beads/` directory exists | Check filesystem | "Run: eni ai setup" |
| `.eni/` directory exists | Check filesystem | "Run: eni ai setup" |
| `.eni/PROMPT_plan.md` exists | Check filesystem | "Run: eni ai setup" |
| `.eni/PROMPT_build.md` exists | Check filesystem | "Run: eni ai setup" |
| `.claude/settings.json` exists | Check filesystem | "Run: eni ai setup" |
| `AGENTS.md` exists | Check filesystem | "Create AGENTS.md in project root" |
| `.env` file exists | Check filesystem | "Copy from .env.example: cp .env.example .env" |
| `specs/` directory exists | Check filesystem | "Run: eni ai setup" |

- Each check shows a green checkmark or red X
- Fix suggestions only shown for failing checks
- Exit code 0 if all pass, exit code 1 if any fail
- Doctor works even if `.eni/` is missing — it reports it as a failing check, not a crash
- Doctor does NOT require being in a project directory — if run outside a git repo, just report "Not in a git repository"

### eni status

**Data sources:**
- `specs/` directory — list all `.md` files (excluding `archive/`)
- `bd list --type=epic` — list all epics
- `bd list --status=open` — count open tasks
- `bd ready` — count ready tasks
- `bd blocked` — count blocked tasks
- `git branch --show-current` — current branch
- `git log -1 --format=%cr` — last commit relative time
- `git status --porcelain` — dirty/clean state
- `git rev-list --count HEAD..@{u}` / `git rev-list --count @{u}..HEAD` — ahead/behind remote

**Matching specs to epics:**
- Match by name: spec `specs/auth-flow.md` matches epic with "auth-flow" in the title
- Unmatched specs show as "no epic"
- Epics without matching specs still show (they may have been created manually)

**Task counts:**
- Ready: tasks that can be worked on now
- Blocked: tasks waiting on dependencies
- Open: all non-closed tasks
- Closed: completed tasks

- Exit code always 0 (informational command)
- Works without `.beads/` — just skips the beads sections and shows "beads not initialized"

## Data Model

### Entities

**DoctorCheck**
| Property | Type | Description |
|----------|------|-------------|
| name | string | What is being checked ("Claude CLI") |
| passed | boolean | Whether the check passed |
| version | string \| null | Version string if applicable |
| fix | string | Suggested fix if failed |

**ProjectStatus**
| Property | Type | Description |
|----------|------|-------------|
| specs | SpecStatus[] | All specs with their epic status |
| tasks | TaskCounts | Aggregated task counts |
| branch | string | Current git branch |
| lastPush | string | Relative time of last commit |
| dirty | boolean | Whether working tree has changes |
| ahead | number | Commits ahead of remote |
| behind | number | Commits behind remote |

**SpecStatus**
| Property | Type | Description |
|----------|------|-------------|
| name | string | Spec file name (without .md) |
| epicId | string \| null | Matching beads epic ID |
| tasksDone | number | Closed tasks in epic |
| tasksTotal | number | Total tasks in epic |
| archived | boolean | Whether in specs/archive/ |

**TaskCounts**
| Property | Type | Description |
|----------|------|-------------|
| ready | number | Available to work on |
| blocked | number | Waiting on dependencies |
| open | number | All non-closed |
| closed | number | Completed |

## UI/UX Specification

### eni land — Output

**Success:**
```
Syncing beads...
  ✓ bd sync full

Pushing...
  ✓ git push

✓ All work pushed. Branch is up to date with origin.
```

**Push fails, rebase succeeds:**
```
Syncing beads...
  ✓ bd sync full

Pushing...
  ✗ git push (rejected)
  ↻ git pull --rebase
  ✓ git push

✓ All work pushed. Branch is up to date with origin.
```

**Push fails after retry:**
```
Syncing beads...
  ✓ bd sync full

Pushing...
  ✗ git push (rejected)
  ↻ git pull --rebase
  ✗ git push (rejected)

✗ Push failed. Resolve conflicts and try again.
```

### eni doctor — Output

```
$ eni doctor

  ✓ Node.js 20.11.0
  ✓ pnpm 9.1.0
  ✓ Claude CLI 1.2.0
  ✓ bd (beads) 0.8.0
  ✓ .beads/ initialized
  ✓ .eni/ directory
  ✓ PROMPT_plan.md
  ✓ PROMPT_build.md
  ✓ .claude/settings.json
  ✓ AGENTS.md
  ✗ .env file missing — cp .env.example .env
  ✓ specs/ directory

  11/12 checks passed
```

### eni status — Output

```
$ eni status

Specs:
  auth-flow             epic: beads-001  (3/7 tasks done)
  pricing-page          epic: beads-008  (0/5 tasks done)
  onboarding            no epic

Tasks:  2 ready · 1 blocked · 5 open · 12 closed

Branch: feat/auth-flow  (3 ahead, 0 behind, clean)
Last commit: 2 hours ago
```

**Without beads:**
```
$ eni status

Specs:
  auth-flow
  pricing-page

Beads not initialized. Run: eni ai setup

Branch: main  (0 ahead, 0 behind, clean)
Last commit: 1 day ago
```

## Edge Cases

### Error Scenarios

| Scenario | Command | Expected Behavior |
|----------|---------|-------------------|
| Not in a git repo | land | "Not in a git repository" |
| Not in a git repo | doctor | Report it as a check, continue other checks |
| Not in a git repo | status | "Not in a git repository" |
| Nothing to push | land | `git push` succeeds (no-op), show success |
| Uncommitted changes | land | Warn: "You have uncommitted changes" but still sync and push what's committed |
| Rebase conflicts | land | Stop, print "Resolve conflicts and try again" |
| `bd` not installed | land | "bd not found. Install beads first" |
| `bd` not installed | status | Skip beads sections, show "beads not initialized" |
| `bd sync full` fails | land | Stop and report the error |
| No remote branch | land | `git push -u origin HEAD` to set upstream |
| specs/ doesn't exist | status | Show "No specs found" |
| No internet | land | Push fails, show error |

### Boundary Conditions

| Condition | Command | Expected Behavior |
|-----------|---------|-------------------|
| All doctor checks pass | doctor | Exit code 0, "12/12 checks passed" |
| All doctor checks fail | doctor | Exit code 1, list all fixes |
| 0 specs, 0 tasks | status | Show empty state for each section |
| 50+ specs | status | List all, no pagination |
| Spec name doesn't match any epic | status | Show "no epic" next to that spec |

## Acceptance Criteria

### eni land
- [ ] **Given** a project with committed changes, **when** I run `eni land`, **then** `bd sync full` runs, `git push` succeeds, and I see "All work pushed"
- [ ] **Given** push is rejected, **when** `eni land` retries, **then** it runs `git pull --rebase` and tries push again
- [ ] **Given** push fails after retry, **when** the command finishes, **then** I see a clear error with guidance
- [ ] **Given** uncommitted changes exist, **when** I run `eni land`, **then** I see a warning but sync and push proceed for committed work
- [ ] **Given** no remote tracking branch, **when** I run `eni land`, **then** it pushes with `-u origin HEAD` to set upstream

### eni doctor
- [ ] **Given** all tools are installed and config exists, **when** I run `eni doctor`, **then** all checks pass with green checkmarks and exit code 0
- [ ] **Given** claude CLI is missing, **when** I run `eni doctor`, **then** I see a red X with install link and exit code 1
- [ ] **Given** `.eni/` is missing, **when** I run `eni doctor`, **then** I see "Run: eni ai setup" as the fix
- [ ] **Given** I'm not in a git repo, **when** I run `eni doctor`, **then** it reports "Not in a git repository" and skips repo-specific checks

### eni status
- [ ] **Given** 3 specs exist and 2 have epics, **when** I run `eni status`, **then** I see all 3 specs with epic status and task progress
- [ ] **Given** beads has tasks, **when** I run `eni status`, **then** I see task counts (ready, blocked, open, closed)
- [ ] **Given** I'm on branch `feat/auth`, **when** I run `eni status`, **then** I see the branch name, ahead/behind counts, and last commit time
- [ ] **Given** beads is not initialized, **when** I run `eni status`, **then** beads sections are skipped with "beads not initialized"

## Open Questions

- [ ] Should `eni land` also run quality gates (`pnpm build && pnpm lint`) before pushing, or keep it simple?
