# ENI CLI Engine + Restructure

## Overview

Replace the `eniem-cli` npm package with a new `eni` global CLI. Absorb the `loop.sh` bash script into a TypeScript loop engine, rename the binary from `eniem-cli` to `eni`, restructure all commands under the new command tree (`eni project`, `eni products`, `eni ai plan`, `eni ai build`), and provide clean terminal output with an animated spinner and optional debug mode.

## Problem Statement

**Who:** Eniem boilerplate developer (internal) and boilerplate customers
**Problem:** The AI coding workflow requires a bash script (`loop.sh`) copied into every project. This creates duplication, makes updates hard, and forces users to remember file paths (`./loop.sh plan`) instead of using a global CLI command.
**Impact:** Every project carries its own copy of orchestration logic. Bug fixes require re-running `ai init`. The developer experience is fragmented across `eniem-cli`, `./loop.sh`, and `bd`.

## Scope

### Included
- Rename binary from `eniem-cli` to `eni` with new `meow` command routing
- Wire up all existing commands under new names: `eni project` (scaffold), `eni products` (Polar manager)
- New loop engine in TypeScript replacing `loop.sh`: Claude process spawning, template substitution, sentinel detection, iteration management
- `eni ai plan [spec-name]` command with spec selector when no name given
- `eni ai build [epic-name]` command
- Text-only output by default with animated spinner between outputs
- Debug mode (`-d`) showing tool calls with key inputs
- Graceful SIGINT handling with summary
- Elapsed time per iteration
- Pre-flight checks (claude, bd, .eni/, .beads/, AGENTS.md, prompt files)

### Excluded
- `eni ai setup` (spec 3 — setup refactor)
- `eni land`, `eni doctor`, `eni status` (spec 2 — new commands)
- Changes to PROMPT_plan.md or PROMPT_build.md content
- Changes to .claude/ files
- Migration/deprecation notices for old `eniem-cli`
- Removing `loop.sh` from the boilerplate (happens after all specs ship)

### Constraints
- Must work on macOS and Linux
- Requires Node.js (distributed via npm)
- Requires `claude` CLI installed and accessible in PATH
- Requires `bd` (beads) CLI installed
- Requires `.eni/` directory with prompt files in the project

## User Stories

### Primary Flow — Plan a Single Spec

- [ ] As a developer, I can run `eni ai plan my-feature` to plan a single spec from `specs/my-feature.md` so that beads issues are created automatically
- [ ] As a developer, I can see an animated spinner while Claude is working so that I know the process hasn't frozen
- [ ] As a developer, I can see only Claude's text output by default so that the terminal stays clean and readable
- [ ] As a developer, I can see the current iteration number and elapsed time so that I know progress

### Primary Flow — Plan Without Spec Name

- [ ] As a developer, I can run `eni ai plan` without arguments to see a list of unplanned specs so that I can choose which one to plan
- [ ] As a developer, I only see specs that don't already have a beads epic so that I don't accidentally re-plan something

### Primary Flow — Build

- [ ] As a developer, I can run `eni ai build` to build all ready tasks so that Claude picks and implements them one at a time
- [ ] As a developer, I can run `eni ai build my-epic` to build only tasks from a specific epic
- [ ] As a developer, I see the PR URL when all tasks are complete and Claude creates a PR

### Secondary Flows

- [ ] As a developer, I can run `eni ai plan my-feature 5` to override the default iteration count
- [ ] As a developer, I can run `eni ai build 20` to override the default iteration count
- [ ] As a developer, I can add `-d` to any ai command to see tool calls with key inputs for debugging
- [ ] As a developer, I can press Ctrl+C to stop the loop and see a summary of what completed
- [ ] As a developer, I can run `eni project my-app` to scaffold a new project (same as old `eniem-cli my-app`)
- [ ] As a developer, I can run `eni products` to manage Polar products (same as old `eniem-cli products`)
- [ ] As a developer, I can run `eni version` to see the CLI version
- [ ] As a developer, I can run `eni help` to see available commands

## Business Rules

### Pre-flight Checks
- `eni ai plan` and `eni ai build` require `.eni/` directory to exist — fail with "run `eni ai setup` first"
- `eni ai plan` requires `specs/` directory and the specific spec file (if name given)
- Both require `claude` CLI in PATH — fail with install instructions if missing
- Both require `bd` CLI in PATH — fail with install instructions if missing
- Both require `.beads/` directory — fail with "run `eni ai setup` first"
- Both require `AGENTS.md` in project root — fail with clear error
- `eni ai plan` requires `.eni/PROMPT_plan.md` — fail if missing
- `eni ai build` requires `.eni/PROMPT_build.md` — fail if missing

### Spec Selection (plan without spec name)
- List all `.md` files in `specs/` excluding `specs/archive/`
- Filter out specs that already have a matching beads epic (use `bd list --type=epic` to check)
- If no unplanned specs remain, show message and exit: "No unplanned specs found."
- Present remaining specs as a selectable list
- User selects one spec, then plan proceeds for that spec

### Iteration Management
- Plan mode: default 3 iterations, overridable via positional arg
- Build mode: default 10 iterations, overridable via positional arg
- 2-second pause between iterations
- Plan stops early on `:::ENI_PLAN_REFINED:::` sentinel
- Build stops early on `:::ENI_ALL_TASKS_COMPLETE:::` sentinel

### Sentinel Detection
- Check the text content of the last assistant message in the stream-json output
- A sentinel is detected only if it appears in the final text block from Claude

### Claude Process
- Spawn via `execa` with `--dangerously-skip-permissions -p --verbose --output-format stream-json`
- Pipe rendered prompt via stdin
- If Claude process exits with non-zero code, stop the loop and report the error
- No retry on crash — stop and report

### Template Substitution
- `{{SPEC_NAME}}` — replaced with spec file name (without .md extension)
- `{{ITERATION}}` — replaced with current iteration number (plan mode only)
- `{{EPIC_NAME}}` — replaced with epic name or empty string (build mode only)

### No-Tasks Check (build mode)
- Before spawning Claude, check `bd ready` (filtered by epic name if given)
- If no ready tasks exist, show message and exit: "No ready tasks. Run `eni ai plan` first or check: `bd blocked`"

## Data Model

### Entities

**LoopConfig**
| Property | Type | Description |
|----------|------|-------------|
| mode | "plan" \| "build" | Which loop to run |
| specName | string \| undefined | Spec name for plan mode |
| epicName | string \| undefined | Epic name for build mode |
| maxIterations | number | Max iterations (default 3 or 10) |
| debug | boolean | Show tool calls in output |
| projectDir | string | Resolved project root path |

**IterationResult**
| Property | Type | Description |
|----------|------|-------------|
| iteration | number | Which iteration (1-based) |
| elapsed | number | Duration in milliseconds |
| sentinel | "plan_refined" \| "all_complete" \| null | Detected sentinel |
| exitCode | number | Claude process exit code |

**StreamEvent** (from Claude's stream-json)
| Property | Type | Description |
|----------|------|-------------|
| type | string | Event type ("assistant", "tool_use", etc.) |
| message.content | array | Content blocks with text or tool_use |

### State Transitions

```
idle → preflight_check → (fail → error_exit)
preflight_check → spec_select (plan, no spec name)
preflight_check → ready_check (build)
preflight_check → running (plan, with spec name)
spec_select → running
ready_check → running | no_tasks_exit
running → iteration_complete → (sentinel_detected → done | next_iteration → running)
running → crash → error_exit
running → sigint → interrupted_exit
```

## UI/UX Specification

### Terminal Output: Default Mode

**Iteration header:**
```
--- Iteration 1 of 3 ---
```

**While Claude is working (no text output):**
An animated spinner (blinking/moving characters) visible at the cursor position. No text label needed — just visual motion to prove liveness.

**When Claude produces text:**
Spinner stops. Text prints. Spinner resumes.

```
⠋
Here's my analysis of the spec. I've identified 5 key user stories...
⠋
I've created the epic "auth-flow" with 7 tasks:
  - beads-014: Set up auth schema
  - beads-015: Create login endpoint
  ...
```

**Iteration complete:**
```
--- Iteration 1 of 3 (2m 14s) ---
```
The elapsed time is appended to the iteration header line (or printed after).

**Loop complete:**
```
=== Plan Complete ===
```
or
```
=== All Tasks Complete ===
```

### Terminal Output: Debug Mode (`-d`)

Same as default, plus tool call lines between text:

```
⠋
Here's my analysis...
  → Read: specs/auth-flow.md (lines 1-45)
  → Grep: "authentication" in src/**/*.ts (3 matches)
  → Bash: bd create --type=epic --title="Auth flow" (exit 0)
I've created the epic...
```

Tool call format: `  → ToolName: key_input (extra_info)`

Key input is the most useful field from the tool input:
- Read: file_path (+ line range if specified)
- Grep: pattern in path (match count)
- Bash: command truncated to 60 chars (exit code)
- Write/Edit: file_path
- Other: first input field value

### Terminal Output: SIGINT

```
^C
Interrupted after iteration 2 of 10 (4m 31s elapsed).
```

### Terminal Output: Error

```
Error: Claude process exited with code 1

  Iteration 3 of 10 failed.
  Check Claude Code logs for details.
```

### Terminal Output: Pre-flight Failure

```
Error: claude CLI not found

  Install Claude Code: https://docs.anthropic.com/en/docs/claude-code
  Then try again: eni ai plan my-feature
```

### Spec Selector (plan without spec name)

```
? Which spec do you want to plan?
❯ auth-flow
  pricing-page
  onboarding-wizard
```

Uses `ink-select-input` or similar list selector. Only shows unplanned specs.

### Help Output

```
$ eni help

  eni project <name>          Scaffold a new project
  eni products                Manage Polar products
  eni ai plan [spec] [N]      Plan a spec into beads issues
  eni ai build [epic] [N]     Build ready tasks autonomously
  eni version                 Show version
  eni help                    Show this help

Options:
  -d, --debug                 Show tool calls in ai commands
```

## Edge Cases

### Error Scenarios

| Scenario | Expected Behavior |
|----------|-------------------|
| `claude` not in PATH | Pre-flight error with install link |
| `bd` not in PATH | Pre-flight error with install instructions |
| `.eni/` missing | "Run `eni ai setup` first" |
| `.beads/` missing | "Run `eni ai setup` first" |
| `AGENTS.md` missing | "AGENTS.md not found in project root" |
| Spec file not found | "specs/foo.md not found" + list available specs |
| PROMPT file missing | ".eni/PROMPT_plan.md not found. Run `eni ai setup`" |
| Claude crashes (non-zero exit) | Stop loop, print error with iteration info |
| No unplanned specs | "No unplanned specs found." and exit |
| No ready tasks (build) | "No ready tasks." with suggestions and exit |
| Ctrl+C during iteration | Kill Claude process, print interruption summary |

### Boundary Conditions

| Condition | Expected Behavior |
|-----------|-------------------|
| specs/ is empty | "No unplanned specs found." |
| All specs already planned | "No unplanned specs found." |
| 0 iterations requested | Error: iteration count must be at least 1 |
| Sentinel on first iteration | Complete after 1 iteration (normal) |
| Very long Claude output | Stream normally, no truncation |
| Claude produces no text (only tool calls) | Spinner runs, debug mode shows tools, default mode shows spinner only |

## Acceptance Criteria

### CLI Restructure
- [ ] **Given** `eni` is installed globally, **when** I run `eni version`, **then** I see the version number
- [ ] **Given** `eni` is installed, **when** I run `eni help`, **then** I see all available commands
- [ ] **Given** `eni` is installed, **when** I run `eni project my-app`, **then** the scaffold wizard starts (same behavior as old `eniem-cli my-app`)
- [ ] **Given** `eni` is installed, **when** I run `eni products`, **then** the products manager starts (same behavior as old `eniem-cli products`)
- [ ] **Given** `eni` is installed, **when** I run `eni` with no arguments, **then** I see the help output

### Plan — Single Spec
- [ ] **Given** a project with `.eni/PROMPT_plan.md` and `specs/my-feature.md`, **when** I run `eni ai plan my-feature`, **then** Claude is spawned with the rendered prompt and the loop runs up to 3 iterations
- [ ] **Given** Claude outputs `:::ENI_PLAN_REFINED:::`, **when** iteration completes, **then** the loop stops early and prints "Plan Complete"
- [ ] **Given** I run `eni ai plan my-feature 5`, **when** the loop starts, **then** it runs up to 5 iterations instead of 3

### Plan — Spec Selector
- [ ] **Given** `specs/` has 3 specs and 1 already has a beads epic, **when** I run `eni ai plan`, **then** I see a selector with only the 2 unplanned specs
- [ ] **Given** all specs have beads epics, **when** I run `eni ai plan`, **then** I see "No unplanned specs found." and the CLI exits

### Build
- [ ] **Given** beads has ready tasks, **when** I run `eni ai build`, **then** Claude is spawned with PROMPT_build.md and the loop runs up to 10 iterations
- [ ] **Given** no ready tasks exist, **when** I run `eni ai build`, **then** I see "No ready tasks" with suggestions and the CLI exits
- [ ] **Given** Claude outputs `:::ENI_ALL_TASKS_COMPLETE:::`, **when** iteration completes, **then** the loop stops and prints the PR URL if present

### Output
- [ ] **Given** the loop is running, **when** Claude is working between text outputs, **then** an animated spinner is visible in the terminal
- [ ] **Given** Claude produces text, **when** the text streams, **then** the spinner stops and text is printed
- [ ] **Given** I use `-d` flag, **when** Claude uses a tool, **then** I see a one-liner like `→ Read: src/auth.ts (lines 1-50)`
- [ ] **Given** I don't use `-d` flag, **when** Claude uses a tool, **then** I see nothing (just the spinner)
- [ ] **Given** an iteration completes, **when** the next iteration header prints, **then** it includes elapsed time for the previous iteration

### Error Handling
- [ ] **Given** `claude` is not in PATH, **when** I run `eni ai plan`, **then** I see an error with install instructions
- [ ] **Given** Claude exits with code 1, **when** the iteration fails, **then** the loop stops and prints the error
- [ ] **Given** I press Ctrl+C during a loop, **when** the signal is caught, **then** the Claude process is killed and a summary is printed

## Open Questions

- [ ] Should the npm package name be `eni` or `eniem` with `bin: { eni: ... }`? (depends on npm availability)
