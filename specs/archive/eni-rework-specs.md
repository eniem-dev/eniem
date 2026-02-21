# CLI Plan & Build Commands

## Overview

Replace the shell-based `loop.sh` script with native TypeScript commands in the `eni` CLI. Users run `eni plan` and `eni build` instead of `pnpm eni:plan` and `pnpm eni:build`. The commands provide a rich Ink UI with iteration progress, streaming Claude output, and automatic spec lifecycle management (unplanned → planned → archived).

## Problem Statement

**Who:** Developers using eniem (initially the maintainer, later end-users who scaffold projects)
**Problem:** The current `loop.sh` is a bash script that's hard to maintain, debug, extend, and distribute. It requires `pnpm` wrappers, doesn't work cross-platform, and has brittle string parsing.
**Impact:** Moving to TypeScript unifies the toolchain, enables rich UI feedback, simplifies distribution via npm, and makes the plan/build workflow extensible.

## Scope

### Included
- `eni plan` command — orchestrates Claude to create beads issues from a spec
- `eni build` command — orchestrates Claude to implement beads tasks one-per-iteration
- Interactive spec selection from the `specs/` folder structure
- Direct argument shortcut (`eni plan my-feature`)
- Rich Ink UI with iteration counter, spinner, and streaming output
- Two output verbosity modes: normal (text) and verbose (text + tool usage)
- Automatic spec file lifecycle: move specs between folders on completion
- Sentinel-based early exit (stop looping when Claude signals completion)
- Configurable max iteration count
- Ctrl+C kills Claude subprocess immediately and exits
- External prompt file loading with template substitution

### Excluded
- Removing the old `loop.sh` and `pnpm eni:*` scripts (separate cleanup task)
- Renaming the CLI binary to `eni` (separate prerequisite task)
- Interactive/TTY passthrough mode (dropped — non-interactive only)
- `plan-work` command (dropped)
- Dry-run flag
- Creating `specs/planned/` and `specs/archive/` folders (handled by `eni ai init`)
- Claude SDK/API integration (uses Claude CLI subprocess)

### Constraints
- Must work on macOS and Linux (Windows Ctrl+C equivalent supported)
- Claude CLI binary must be installed and accessible in PATH
- Beads (`bd` CLI) must be installed for plan/build to function
- External prompt files (`.eni/PROMPT_plan.md`, `.eni/PROMPT_build.md`) must exist in the project
- Ink 5 + React 18 (matching existing CLI stack)

## User Stories

### Primary Flow — Plan

- [ ] As a developer, I can run `eni plan` and select an unplanned spec from an interactive list so that I don't have to remember file names
- [ ] As a developer, I can run `eni plan --spec my-feature` to skip selection and start planning directly so that I can script or speed up the workflow
- [ ] As a developer, I can see a spinner with "Iteration 1/3" while Claude is working so that I know progress is being made
- [ ] As a developer, I can see Claude's text output streaming in real-time so that I can follow along
- [ ] As a developer, I can pass `--verbose` to also see tool usage in the output so that I can debug issues
- [ ] As a developer, I can pass `--iterations 5` to control how many refinement passes Claude makes
- [ ] As a developer, the loop stops early if Claude signals the plan is refined so that iterations aren't wasted
- [ ] As a developer, the spec is automatically moved to `specs/planned/` after planning completes so that the folder structure stays organized

### Primary Flow — Build

- [ ] As a developer, I can run `eni build` and select a planned spec from an interactive list so that I pick from specs that are ready to build
- [ ] As a developer, I can run `eni build --spec my-feature` to skip selection and start building directly
- [ ] As a developer, I can see iteration progress and streaming output while Claude implements tasks
- [ ] As a developer, the loop stops early if Claude signals all tasks are complete
- [ ] As a developer, the spec is automatically moved to `specs/archive/` after build completes (all tasks done + PR created)
- [ ] As a developer, I can pass `--iterations 15` to control how many build iterations Claude runs

### Secondary Flows

- [ ] As a developer, I can press Ctrl+C at any time to immediately kill Claude and exit the CLI
- [ ] As a developer, I see a clear error message if `claude` or `bd` commands are not found when needed
- [ ] As a developer, I see a clear message and the CLI exits if no specs are found in the relevant folder

## Business Rules

### Spec Folder Structure

- `specs/` (root) — unplanned specs, available for `eni plan`
- `specs/planned/` — planned specs (have beads issues), available for `eni build`
- `specs/archive/` — completed specs (built and PR'd), not shown in selection
- Only `.md` files in the relevant folder are shown in the selection list
- Spec files are identified by filename (without `.md` extension) as the spec name

### Template Placeholders (shared)

All placeholders are computed by the CLI and injected into the prompt file before passing to Claude:

| Placeholder | Source | Description |
|-------------|--------|-------------|
| `{{SPEC_NAME}}` | Spec filename without `.md` | Used in plan prompt to tell Claude which spec to read (e.g., `my-feature`) |
| `{{ITERATION}}` | Current loop counter (1-indexed) | Claude behaves differently on iteration 1 (create) vs 2+ (refine) |
| `{{EPIC_NAME}}` | Same as SPEC_NAME | Used in build prompt to filter beads tasks by epic |
| `{{BRANCH}}` | `feat/<spec-name>` | Git branch name — always `feat/` prefix, derived from spec name |
| `{{WORKTREE}}` | `.worktrees/feat/<spec-name>` | Git worktree path — always matches branch pattern |

`{{IS_EPIC}}` is **removed** — all specs are treated as epics. Branch and worktree naming follow a single convention.

### Plan Command Rules

- Default max iterations: **3**
- Iteration count can be overridden via `--iterations` flag
- Sentinel marker: `:::ENI_DONE:::` — stops the loop early
- Template file: `.eni/PROMPT_plan.md`
- After all iterations complete (or sentinel detected): move spec from `specs/<name>.md` to `specs/planned/<name>.md`

### Build Command Rules

- Default max iterations: **10**
- Iteration count can be overridden via `--iterations` flag
- Sentinel marker: `:::ENI_DONE:::` — stops the loop early
- Template file: `.eni/PROMPT_build.md`
- After sentinel detected (all tasks complete + PR created): move spec from `specs/planned/<name>.md` to `specs/archive/<name>.md`
- Auto-archive only happens when the sentinel is detected, not when max iterations are exhausted

### Claude Invocation

- Mode: non-interactive, `--output-format stream-json`
- CLI spawns Claude as a child process per iteration
- Each iteration gets a fresh Claude invocation with the resolved prompt
- The prompt is read from the external file and placeholders are replaced before passing to Claude

### Error Handling

- **Fail fast**: if a prerequisite is missing or Claude crashes, show error and exit immediately
- No retries on Claude failure
- Prerequisites are checked lazily (when the command/binary is actually needed), not upfront

## Data Model

### Entities

**Spec File**
| Property | Type | Description |
|----------|------|-------------|
| name | string | Filename without `.md` extension (e.g., `my-feature`) |
| path | string | Full filesystem path to the spec file |
| status | enum | `unplanned` (in specs/), `planned` (in specs/planned/), `archived` (in specs/archive/) |

**Loop Session**
| Property | Type | Description |
|----------|------|-------------|
| mode | enum | `plan` or `build` |
| specName | string | The selected spec name |
| maxIterations | number | Maximum number of Claude invocations |
| currentIteration | number | Current iteration (1-indexed) |
| verboseOutput | boolean | Whether to show tool usage |
| completed | boolean | Whether sentinel was detected |

**Claude Invocation**
| Property | Type | Description |
|----------|------|-------------|
| prompt | string | Resolved prompt text (template with substitutions applied) |
| outputStream | stream | JSON stream from Claude subprocess |
| exitCode | number | Process exit code |

### State Transitions

```
[Idle] → user runs `eni plan` → [Selecting Spec]
[Selecting Spec] → user picks spec → [Running Iteration]
[Running Iteration] → iteration completes → [Check Sentinel]
[Check Sentinel] → sentinel found → [Moving Spec] → [Summary] → [Exit]
[Check Sentinel] → no sentinel + iterations remaining → [Running Iteration]
[Check Sentinel] → no sentinel + max reached → [Moving Spec] → [Summary] → [Exit]
[Any State] → Ctrl+C → [Kill Process] → [Exit]
```

Note for build: spec is only moved to archive when sentinel is detected (all tasks complete). If max iterations are exhausted without sentinel, spec stays in `specs/planned/`.

## UI/UX Specification

### Screen: Spec Selection

**Entry point:** User runs `eni plan` or `eni build` without a spec name argument

**Layout:**
- Header: "Select a spec to plan:" or "Select a spec to build:"
- List of spec filenames (without .md extension), rendered as a selectable list (Ink Select component)

**States:**
| State | Display |
|-------|---------|
| Empty | "No unplanned specs found in specs/. Create a spec file first." (plan) or "No planned specs found in specs/planned/. Run eni plan first." (build) → exit |
| Loaded | Selectable list of spec names |

**Interactions:**
| Element | Action | Result |
|---------|--------|--------|
| Spec list | Arrow keys + Enter | Select spec, proceed to loop |
| Any | Ctrl+C | Exit immediately |

### Screen: Loop Execution

**Entry point:** Spec selected (or provided via argument)

**Layout:**
- Iteration indicator: `Iteration 1/3` with an animated spinner (e.g., `⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏`) that runs continuously while Claude is processing. The spinner must keep animating between JSON output chunks so the user can tell the CLI is alive and not frozen.
- Streaming output area: Claude's text output displayed line-by-line in real-time
- In verbose mode: tool usage lines prefixed/styled differently (e.g., dimmed or colored)

**States:**
| State | Display |
|-------|---------|
| Running | Spinner + iteration label + streaming output |
| Between iterations | Brief pause, increment counter, start next |
| Sentinel detected | Stop loop, proceed to summary |
| Error | Error message + exit |

**Interactions:**
| Element | Action | Result |
|---------|--------|--------|
| Any | Ctrl+C | Kill Claude subprocess, exit immediately |

### Screen: Summary

**Entry point:** Loop completes (sentinel or max iterations reached)

**Layout:**
- Completion message: "Plan complete — spec moved to planned." or "Build complete — spec archived."
- For plan: number of iterations run, whether sentinel was detected
- For build: number of iterations run, whether all tasks were completed

**States:**
| State | Display |
|-------|---------|
| Completed (sentinel) | Success message + spec moved |
| Max iterations (plan) | "Completed 3/3 iterations. Spec moved to planned." |
| Max iterations (build) | "Completed 10/10 iterations. Some tasks may remain — spec stays in planned." |

### Navigation Flow

```
[CLI Entry] → no arg → [Spec Selection] → pick spec → [Loop Execution] → done → [Summary] → exit
[CLI Entry] → with arg → [Loop Execution] → done → [Summary] → exit
```

## CLI Interface

### eni plan

```
Usage: eni plan [options]

Options:
  --spec <name>        Name of the spec file (without .md). If omitted, shows interactive selection.
  --iterations <n>     Max iterations (default: 3)
  --verbose, -v        Show tool usage in addition to text output
```

### eni build

```
Usage: eni build [options]

Options:
  --spec <name>        Name of the spec file (without .md). If omitted, shows interactive selection.
  --iterations <n>     Max iterations (default: 10)
  --verbose, -v        Show tool usage in addition to text output
```

## Edge Cases

### Error Scenarios

| Scenario | Expected Behavior |
|----------|-------------------|
| `claude` not in PATH | Show "Claude CLI not found. Install it first: ..." and exit with code 1 |
| `bd` not in PATH | Show "Beads CLI not found. Install it with: ..." and exit with code 1 |
| Prompt file missing | Show "Prompt file not found: .eni/PROMPT_plan.md" and exit with code 1 |
| Spec file not found (`--spec` flag) | Show "Spec not found: specs/my-feature.md" and exit with code 1 |
| Claude process crashes (non-zero exit) | Show "Claude exited with code N" and exit with code 1 |
| `specs/planned/` doesn't exist on move | Create the directory silently, then move the spec |
| Ctrl+C during Claude execution | Kill Claude subprocess (SIGTERM), exit CLI immediately with code 130 |
| Ctrl+C during spec selection | Exit immediately |

### Boundary Conditions

| Condition | Expected Behavior |
|-----------|-------------------|
| No specs in folder | Show appropriate "no specs" message and exit |
| Only 1 spec in folder | Still show selection list (always show the list for consistency) |
| Spec name with spaces | Handled correctly (filename-based, not shell-parsed) |
| Max iterations = 0 | Invalid, show error "Iterations must be at least 1" |
| Sentinel on first iteration | Move spec after just 1 iteration — valid behavior |
| Claude produces no output | Iteration completes normally, proceed to next |
| Very large Claude output | Stream in real-time, no buffering limit |

## Acceptance Criteria

### Plan — Interactive Selection

- [ ] **Given** there are 3 `.md` files in `specs/`, **when** I run `eni plan`, **then** I see a list of 3 specs to choose from
- [ ] **Given** I select a spec from the list, **when** I press Enter, **then** the plan loop starts with that spec
- [ ] **Given** there are no `.md` files in `specs/`, **when** I run `eni plan`, **then** I see "No unplanned specs found" and the CLI exits

### Plan — Direct Argument

- [ ] **Given** `specs/my-feature.md` exists, **when** I run `eni plan --spec my-feature`, **then** the plan loop starts without showing selection
- [ ] **Given** `specs/my-feature.md` does not exist, **when** I run `eni plan --spec my-feature`, **then** I see an error and the CLI exits

### Plan — Loop Execution

- [ ] **Given** the plan loop is running, **when** an iteration completes, **then** the iteration counter increments and the next iteration starts
- [ ] **Given** Claude outputs `:::ENI_DONE:::`, **when** the output is parsed, **then** the loop stops early
- [ ] **Given** max iterations (3) are reached, **when** the last iteration completes, **then** the loop stops
- [ ] **Given** the loop completes, **when** summary is shown, **then** the spec is moved from `specs/` to `specs/planned/`

### Plan — Output Modes

- [ ] **Given** default mode, **when** Claude produces output, **then** only text content is streamed to the terminal
- [ ] **Given** `--verbose` flag, **when** Claude produces output, **then** both text and tool usage are streamed

### Build — Interactive Selection

- [ ] **Given** there are 2 `.md` files in `specs/planned/`, **when** I run `eni build`, **then** I see a list of 2 specs to choose from
- [ ] **Given** there are no `.md` files in `specs/planned/`, **when** I run `eni build`, **then** I see "No planned specs found" and the CLI exits

### Build — Loop Execution

- [ ] **Given** the build loop is running, **when** Claude outputs `:::ENI_DONE:::`, **then** the loop stops and the spec is moved to `specs/archive/`
- [ ] **Given** max iterations are reached without sentinel, **when** the loop stops, **then** the spec stays in `specs/planned/` (not archived)

### Ctrl+C Handling

- [ ] **Given** Claude is running, **when** I press Ctrl+C, **then** the Claude subprocess is killed immediately and the CLI exits
- [ ] **Given** the spec selection is shown, **when** I press Ctrl+C, **then** the CLI exits immediately

## Resolved Questions

- Always show the selection list, even with 1 spec (consistency)
- Template placeholders are opaque — CLI does blind find-and-replace, no validation
- CLI silently creates `specs/planned/` and `specs/archive/` if they don't exist when moving specs
