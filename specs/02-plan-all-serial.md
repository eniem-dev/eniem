# Plan-All Serial Execution

## Overview

When "Run all" is selected or `--all` is passed to `eni plan`, process every spec in `specs/` serially in numeric prefix order, calling the existing `PROMPT_plan.md` for each one. Each spec goes through its full iteration budget before the next starts.

## Users & Problem

**User:** Developer planning multiple feature specs at once.

**Problem:** Planning 7 specs requires 7 manual invocations of `eni plan`. The serial execution automates this into a single command.

## Scope

**In scope:**
- Serial processing of all specs in numeric prefix order
- Reuse of existing `PROMPT_plan.md` (no new prompt file)
- Per-spec iteration budget (each spec gets the full `--iterations` count)
- Progress display showing current spec position (e.g., "Spec 2/7: board-management")
- Move each spec to `planned/` on completion
- Stop on failure (abort the whole run if any spec fails)

**Out of scope:**
- New prompt file for plan
- Parallel execution
- Cross-spec dependency awareness in the prompt

## User Stories

- As a developer, I can run `eni plan --all` so that all specs are planned one after another without intervention.
- As a developer, I can see which spec is currently being planned and my position in the queue so that I know overall progress.
- As a developer, if a spec fails to plan, the run stops so that I can investigate before continuing.

## Business Rules

- Specs are sorted by numeric prefix: `01-foo.md` before `02-bar.md`. Specs without a numeric prefix sort after numbered ones.
- Each spec gets its full iteration budget (e.g., 3 iterations per spec by default).
- When a spec's planning completes (sentinel detected or iterations exhausted), it is moved to `specs/planned/` before the next spec starts.
- If the CLI exits non-zero for any spec, the entire run stops with an error showing which spec failed.
- If all specs complete, show a summary of all planned specs.

## UI/UX Flows

### Running State

```
── Plan ── Run all (Spec 2/7: board-management)

Using claude for plan

[iteration output...]
Iteration 1/3 (42s) ⠋
```

The section header shows "Run all" with the current spec progress in parentheses.

### Summary State

```
✓ Plan complete — 7/7 specs planned.

  01-infrastructure ✓ (2/3 iterations)
  02-board-management ✓ (3/3 iterations)
  03-board-billing ✓ (1/3 iterations, early exit)
  ...
```

### Error State

```
✗ Plan failed on spec 3/7: board-billing

  CLI exited with code 1:
  [error details]

  2/7 specs completed before failure.
```

## Edge Cases

- All specs already planned (empty `specs/` dir): show existing "no specs found" error.
- Single spec in `specs/`: works fine, processes it and shows "Spec 1/1".
- Spec moved to `planned/` mid-run doesn't affect the queue (queue is built once at start).

## Data Model

```typescript
// Spec sort utility
function sortByNumericPrefix(specs: SpecFile[]): SpecFile[] {
  return [...specs].sort((a, b) => {
    const numA = parseInt(a.name.match(/^(\d+)/)?.[1] ?? "999", 10);
    const numB = parseInt(b.name.match(/^(\d+)/)?.[1] ?? "999", 10);
    return numA - numB;
  });
}

// Per-spec result tracking
interface SpecResult {
  name: string;
  success: boolean;
  iterationsUsed: number;
  totalIterations: number;
  earlyExit: boolean;
}
```

## Architecture

### Files to Modify

- `packages/cli/src/commands/plan.tsx` — Add all-specs loop logic, progress tracking, summary display
- `packages/cli/src/lib/specs.ts` — Add `sortByNumericPrefix` utility (or inline in plan.tsx)

### Flow

```
PlanCommand (all mode)
  ├─ Load all specs from specs/
  ├─ Sort by numeric prefix
  ├─ For each spec:
  │   ├─ Update UI: "Spec N/M: spec-name"
  │   ├─ Run iteration loop (same as single-spec mode)
  │   ├─ Move to planned/ on completion
  │   └─ If error → stop, show failure summary
  └─ Show summary of all results
```

## Acceptance Criteria

- Given 7 specs in `specs/`, when `eni plan --all` runs, then specs are processed in numeric prefix order (01, 02, ..., 07).
- Given spec 3/7 fails, when the error occurs, then the run stops and shows "Plan failed on spec 3/7" with 2 specs completed.
- Given all specs complete, when the summary is shown, then it lists each spec with its iteration count and early-exit status.
- Given specs `01-foo.md`, `bar.md`, `02-baz.md`, when sorted, then order is `01-foo`, `02-baz`, `bar` (unnumbered last).
- Given the run is in progress, when viewing the UI, then the section header shows "Spec N/M: spec-name".

## Testing Strategy

- Unit test: `sortByNumericPrefix` correctly orders specs (numbered first, then unnumbered)
- Unit test: all-specs mode processes specs in order and tracks results
- Unit test: failure on one spec stops the entire run
