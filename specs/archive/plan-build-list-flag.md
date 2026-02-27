# Plan/Build --list Flag

## Overview

Add a `--list` flag to the `eni plan` and `eni build` commands that prints available spec names to stdout and exits immediately. This enables agent-to-agent workflows where an orchestrator needs to discover what specs are available for planning or building without entering the interactive selection UI.

## Problem Statement

**Who:** Orchestrator agents and scripts that call `eni plan` / `eni build`
**Problem:** There is no programmatic way to discover which specs are available to plan or build. An agent must either hardcode spec names or enter the interactive Ink-based selection flow, which is not machine-friendly.
**Impact:** Agents cannot dynamically choose what to work on next. This blocks automation of the plan→build pipeline.

## Scope

### Included
- `--list` boolean flag on `eni plan` command — lists specs from `specs/`
- `--list` boolean flag on `eni build` command — lists specs from `specs/planned/`
- Plain text output (one spec name per line, alphabetically sorted)
- Immediate exit after printing (no Ink UI rendered)
- Stderr message when no specs are available

### Excluded
- No `eni list` standalone command — flag only
- No JSON output format — plain text is sufficient for v1
- No metadata (paths, sizes, dates) — just spec names
- No filtering or search within `--list`
- No `--list` for archive or other directories

### Constraints
- Must bypass all Ink rendering — pure stdout/stderr for clean piping
- Exit code 0 in all cases (empty or not)
- Must not trigger CLI adapter resolution, config loading, or bd checks

## User Stories

### Primary Flow

- [ ] As an orchestrator agent, I can run `eni plan --list` to get a list of unplanned spec names so that I can decide which spec to plan next
- [ ] As an orchestrator agent, I can run `eni build --list` to get a list of planned spec names so that I can decide which spec to build next

### Secondary Flows

- [ ] As an agent, I can check if the output of `--list` is empty to determine whether there's any work available

## Business Rules

### Flag Behavior
- `--list` is mutually exclusive with all other flags: when present, `--spec`, `--iterations`, `--cli`, and `--verbose` are silently ignored
- `--list` short-circuits the command before any CLI adapter resolution, config file reading, or prerequisite checks (no bd check, no prompt file check)

### Output Rules
- Each line contains exactly one spec name (basename without `.md` extension)
- Output is sorted alphabetically (A-Z)
- No trailing newline after the last entry
- No decoration, color codes, or formatting — raw text only

### Empty State
- When no specs exist in the target directory, print a human-readable message to stderr (e.g., `No specs to plan` or `No planned specs to build`) and print nothing to stdout
- Exit code is 0 regardless

## Data Model

No new entities. Reuses existing `listSpecs()` from `packages/cli/src/lib/specs.ts` which returns `SpecFile[]` with `name` and `path` properties.

## UI/UX Specification

No UI. This feature deliberately bypasses Ink rendering entirely.

**stdout:** Newline-separated spec names (or empty)
**stderr:** Message when no specs available

### Examples

```
$ eni plan --list
docs-ai-workflow-rename
hello-world-startup-log
prompt-composability

$ eni build --list
(no stdout — specs/planned/ is empty)
stderr: No planned specs to build

$ eni plan --list --iterations=5 --verbose
docs-ai-workflow-rename
hello-world-startup-log
prompt-composability
(--iterations and --verbose silently ignored)
```

## Edge Cases

### Error Scenarios

| Scenario | Expected Behavior |
|----------|-------------------|
| specs/ directory doesn't exist | stderr message "No specs to plan", exit 0 |
| specs/planned/ directory doesn't exist | stderr message "No planned specs to build", exit 0 |
| --list combined with --spec | --spec is ignored, list all specs |
| --list combined with --iterations | --iterations is ignored, list and exit |

### Boundary Conditions

| Condition | Expected Behavior |
|-----------|-------------------|
| Single spec available | Print one line |
| Many specs (50+) | Print all, alphabetically sorted |
| Spec names with special characters | Print as-is (filenames are already kebab-case by convention) |

## Acceptance Criteria

### List unplanned specs

- [ ] **Given** specs/ contains `a-spec.md` and `b-spec.md`, **when** I run `eni plan --list`, **then** stdout contains `a-spec\nb-spec` and exit code is 0
- [ ] **Given** specs/ is empty, **when** I run `eni plan --list`, **then** stdout is empty, stderr contains "No specs to plan", and exit code is 0

### List planned specs

- [ ] **Given** specs/planned/ contains `x-spec.md`, **when** I run `eni build --list`, **then** stdout contains `x-spec` and exit code is 0
- [ ] **Given** specs/planned/ does not exist, **when** I run `eni build --list`, **then** stdout is empty, stderr contains "No planned specs to build", and exit code is 0

### Flag isolation

- [ ] **Given** `--list` is passed, **when** combined with any other flags, **then** other flags are ignored and only the list is printed
- [ ] **Given** `--list` is passed, **when** no CLI adapter is installed, **then** the command still succeeds (no adapter resolution occurs)
- [ ] **Given** `--list` is passed, **when** no `.eni/PROMPT_plan.md` exists, **then** the command still succeeds (no prompt file is loaded)

### Output format

- [ ] **Given** multiple specs exist, **when** `--list` is used, **then** output is alphabetically sorted
- [ ] **Given** any specs exist, **when** output is piped (e.g., `eni plan --list | wc -l`), **then** output contains no ANSI escape codes or Ink artifacts
