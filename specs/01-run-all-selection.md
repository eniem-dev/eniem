# CLI "Run All" Selection & Routing

## Overview

Add a "Run all" option to the spec selector in both `eni plan` and `eni build` commands, plus a `--all` CLI flag for non-interactive usage. This enables users to process all specs serially without manually selecting each one.

## Users & Problem

**User:** Developer using `eni plan` or `eni build` to process specs.

**Problem:** Currently, the user must select one spec at a time. When there are many specs (e.g., 7 feature specs for a new product), this requires running the command 7 times with manual selection each time.

## Scope

**In scope:**
- `--all` flag on `eni plan` and `eni build`
- "Run all" option appended to the bottom of the spec selector
- Mutual exclusion validation: `--all` + `--spec` is an error
- Routing to the appropriate all-specs flow in plan/build commands

**Out of scope:**
- The actual serial execution logic (topics 02 and 03)
- Multi-select (pick specific subset of specs)

## User Stories

- As a developer, I can pass `--all` to `eni plan` so that all specs are planned without interactive selection.
- As a developer, I can pass `--all` to `eni build` so that all planned specs are built without interactive selection.
- As a developer, I can select "Run all" from the spec picker so that all specs are processed serially.
- As a developer, I see an error if I pass both `--all` and `--spec` so that I know the flags are mutually exclusive.

## Business Rules

- `--all` and `--spec` are mutually exclusive; combining them exits with an error.
- "Run all" appears as the **last** option in the spec selector, visually separated from individual specs.
- When `--all` is passed, the selecting step is skipped entirely.
- `--all` works with `--list`: `eni plan --list` already prints spec names — no change needed, `--all` is irrelevant with `--list`.

## UI/UX Flows

### Spec Selector with "Run all"

```
Select a spec to plan:
  01-infrastructure
  02-board-management
  03-board-billing
  ...
> Run all
```

The "Run all" item uses the sentinel value `__all__` internally.

### Error State

```
$ eni build --all --spec=foo
✗ Cannot use --all with --spec. Pick one.
```

## Edge Cases

- No specs available + `--all`: show the existing "no specs found" error (same as today).
- Only one spec + "Run all" selected: works fine, processes the single spec.

## Data Model

```typescript
// cli.tsx — new flag definition
flags: {
  all: { type: "boolean", default: false },
  // ... existing flags
}

// Command props — extended with all mode
export interface PlanCommandProps {
  spec?: string;
  all?: boolean;
  iterations: number;
  verbose: boolean;
  specsDir: string;
  promptFile: string;
  cli?: string;
  narration?: Narration;
}

export interface BuildCommandProps {
  spec?: string;
  all?: boolean;
  iterations: number;
  verbose: boolean;
  specsDir: string;
  promptFile: string;
  cli?: string;
  narration?: Narration;
}
```

## Architecture

### Files to Modify

- `packages/cli/src/cli.tsx` — Add `--all` flag, validation, pass to commands
- `packages/cli/src/commands/plan.tsx` — Accept `all` prop, add "Run all" to selector
- `packages/cli/src/commands/build.tsx` — Accept `all` prop, add "Run all" to selector

### Flow

```
cli.tsx
  ├─ Validates --all + --spec mutual exclusion
  ├─ Passes all={true} to PlanCommand or BuildCommand
  │
PlanCommand / BuildCommand
  ├─ If all=true → skip selecting, set specName="__all__"
  ├─ If interactive → append "Run all" to spec list
  └─ When "__all__" detected → enter all-specs flow (topic 02/03)
```

## Acceptance Criteria

- Given `--all` and `--spec` are both passed, when the CLI starts, then it exits with error "Cannot use --all with --spec. Pick one."
- Given `--all` is passed to `eni plan`, when specs exist, then planning starts immediately without interactive selection.
- Given `--all` is passed to `eni build`, when planned specs exist, then building starts immediately without interactive selection.
- Given the interactive spec selector is shown, when specs are loaded, then "Run all" appears as the last option.
- Given "Run all" is selected, when the handler fires, then the all-specs flow is triggered.

## Testing Strategy

- Unit test: validate `--all` + `--spec` mutual exclusion logic
- Unit test: "Run all" option is appended to spec list
- Unit test: `all=true` prop skips the selecting step
