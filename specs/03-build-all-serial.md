# Build-All Serial Execution with Shared Worktree

## Overview

When "Run all" is selected or `--all` is passed to `eni build`, process every planned spec serially in a single shared worktree named `feat/build-session-YYYYMMDD-HHmm`. Each spec gets its full iteration budget. The prompt creates a PR only on the last spec.

## Users & Problem

**User:** Developer building multiple planned features at once.

**Problem:** Building 7 features requires 7 manual invocations, each creating a separate worktree and branch. For a full product build-out, a single session with one worktree and one PR is more efficient.

## Scope

**In scope:**
- Serial processing of all planned specs in numeric prefix order
- Shared worktree and branch: `feat/build-session-YYYYMMDD-HHmm`
- New `PROMPT_build_full.md` used instead of `PROMPT_build.md`
- `IS_LAST_SPEC` template variable for PR control
- Per-spec iteration budget
- Stop on failure
- Progress display showing current spec position
- Single PR created by the prompt on the last spec

**Out of scope:**
- Parallel spec building
- Per-spec worktrees in all mode
- CLI-side PR creation

## User Stories

- As a developer, I can run `eni build --all` so that all planned specs are built serially in a shared worktree.
- As a developer, the shared worktree is named with a session timestamp so that I can identify build sessions.
- As a developer, commits within the session use `feat(<spec-name>):` so that I can see which spec each commit belongs to.
- As a developer, a single PR is created at the end covering all specs so that review is consolidated.
- As a developer, if a spec fails, the run stops so that I can investigate.

## Business Rules

- Specs are sorted by numeric prefix (same as plan-all).
- Each spec gets its full iteration budget (e.g., 10 iterations per spec by default).
- The worktree branch is `feat/build-session-YYYYMMDD-HHmm` (e.g., `feat/build-session-20260314-1430`).
- The worktree path is `.worktrees/feat/build-session-YYYYMMDD-HHmm`.
- The prompt file used is `.eni/PROMPT_build_full.md` (not `PROMPT_build.md`).
- Template variable `IS_LAST_SPEC` is `"true"` only for the last spec, `"false"` for all others.
- When sentinel `:::ENI_DONE:::` is detected for a non-last spec, the CLI moves to the next spec.
- When sentinel is detected for the last spec (after PR creation), the run completes.
- If the CLI exits non-zero for any spec, the entire run stops.
- Specs are archived (moved to `specs/archive/`) only by the prompt when it detects task completion (same as single-spec mode).

## UI/UX Flows

### Running State

```
── Build ── Run all (Spec 3/7: board-billing)

Using claude for build
Worktree: feat/build-session-20260314-1430

[iteration output...]
Iteration 2/10 (1m23s) ⠋
```

### Summary State

```
✓ Build complete — 7/7 specs built.

  Worktree: .worktrees/feat/build-session-20260314-1430
  Branch: feat/build-session-20260314-1430

  01-infrastructure ✓ (5/10 iterations)
  02-board-management ✓ (8/10 iterations)
  ...
  07-public-board-view ✓ (3/10 iterations, PR created)
```

### Error State

```
✗ Build failed on spec 4/7: idea-submission

  CLI exited with code 1:
  [error details]

  3/7 specs completed before failure.
  Worktree preserved: .worktrees/feat/build-session-20260314-1430
```

## Data Model

```typescript
// Session ID generator
function buildSessionId(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`;
}

// Extended template vars for build-all
function buildFullTemplateVars(
  specName: string,
  iteration: number,
  sessionBranch: string,
  sessionWorktree: string,
  isLastSpec: boolean,
): TemplateVars {
  return {
    SPEC_NAME: specName,
    ITERATION: String(iteration),
    EPIC_NAME: specName,
    BRANCH: sessionBranch,
    WORKTREE: sessionWorktree,
    IS_LAST_SPEC: String(isLastSpec),
    IS_EPIC: "true",
  };
}

// Per-spec result tracking (same as plan-all)
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

- `packages/cli/src/commands/build.tsx` — Add all-specs loop logic with shared worktree, use `PROMPT_build_full.md`, pass `IS_LAST_SPEC`
- `packages/cli/src/lib/template.ts` — Add `buildFullTemplateVars` and `buildSessionId` functions
- `packages/cli/src/cli.tsx` — Pass `promptFile` as `PROMPT_build_full.md` when `--all` is used

### Flow

```
BuildCommand (all mode)
  ├─ Generate session ID: "20260314-1430"
  ├─ Set branch: "feat/build-session-20260314-1430"
  ├─ Set worktree: ".worktrees/feat/build-session-20260314-1430"
  ├─ Load PROMPT_build_full.md
  ├─ Load all planned specs, sort by numeric prefix
  ├─ For each spec (index i):
  │   ├─ Compute IS_LAST_SPEC = (i === specs.length - 1)
  │   ├─ Build template vars with session branch/worktree
  │   ├─ Run iteration loop
  │   ├─ If sentinel → move to next spec (or finish if last)
  │   └─ If error → stop, show failure summary
  └─ Show summary of all results
```

### Prompt File Selection

```
cli.tsx:
  if (allFlag) {
    promptFile = join(projectDir, ".eni", "PROMPT_build_full.md")
  } else {
    promptFile = join(projectDir, ".eni", "PROMPT_build.md")
  }
```

## Acceptance Criteria

- Given `eni build --all` is run, when planned specs exist, then a shared worktree `feat/build-session-YYYYMMDD-HHmm` is used for all specs.
- Given 7 planned specs, when spec 7 is reached, then `IS_LAST_SPEC` is `"true"` and the prompt creates a PR.
- Given spec 3/7 fails, when the error occurs, then the run stops, the worktree is preserved, and the failure summary shows.
- Given all specs complete, when the summary is shown, then it displays the worktree path, branch name, and per-spec results.
- Given `PROMPT_build_full.md` is missing, when `--all` is used, then the error says "Prompt file not found: .eni/PROMPT_build_full.md".
- Given the session timestamp is generated, when the branch is created, then it follows format `feat/build-session-YYYYMMDD-HHmm`.

## Testing Strategy

- Unit test: `buildSessionId()` returns correct format
- Unit test: `buildFullTemplateVars` sets `IS_LAST_SPEC` correctly for last vs non-last spec
- Unit test: all-specs mode uses `PROMPT_build_full.md` instead of `PROMPT_build.md`
- Unit test: failure stops execution and preserves worktree
