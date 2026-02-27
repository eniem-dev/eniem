# Fix OpenCode Adapter Iteration 2+ Hang

## Overview

The opencode adapter hangs indefinitely on iteration 2+ of `eni plan` (and likely `eni build`). Iteration 1 completes successfully with full output, but iteration 2 produces zero stdout — no text events, no tool events, no errors — even in verbose mode. The subprocess appears alive but unresponsive, requiring Ctrl+C after 10+ minutes.

## Problem Statement

**Who:** Developers using `eni plan --cli=opencode` or `eni build --cli=opencode`
**Problem:** After iteration 1 completes, iteration 2 starts but the opencode subprocess produces no output. The CLI spinner turns indefinitely with no activity visible, even in `--verbose` mode. Users cannot tell if the CLI is working or broken.
**Impact:** opencode is completely unusable for multi-iteration plan/build workflows. Users must Ctrl+C and lose the iteration 2 refinement pass, or switch to Claude adapter.

## Scope

### Included
- Diagnose why the opencode subprocess produces no stdout on iteration 2+
- Fix the root cause so iteration 2+ works correctly with opencode
- Verify the fix works for both `plan` and `build` commands
- Add a test covering the multi-iteration scenario

### Excluded
- Adding sentinel support to iteration 1 (separate concern)
- Adding inactivity timeout mechanism (separate feature)
- Fixing other adapters (codex, gemini) — only opencode is affected
- Changes to prompt templates (`.eni/PROMPT_plan.md`)

### Constraints
- Fix must be entirely in `packages/cli`
- Must not break existing Claude, Codex, or Gemini adapter behavior
- Must preserve the existing opencode adapter interface (`CLIAdapter`)

## User Stories

### Primary Flow

- [ ] As a developer, I can run `eni plan --cli=opencode` and have all iterations complete with visible output, so that the plan refinement loop works end-to-end
- [ ] As a developer, I can run `eni build --cli=opencode` and have all iterations complete with visible output, so that the build loop works end-to-end

## Investigation Hypotheses

These are ordered by likelihood. The implementation should investigate and confirm the actual root cause before fixing.

### Hypothesis 1: Prompt-as-CLI-argument issue

The opencode adapter passes the full prompt as a CLI argument:
```typescript
execa("opencode", ["run", prompt, "--format", "json", ...args])
```

The plan prompt template (`PROMPT_plan.md`) is ~280 lines of markdown. When resolved with template variables, this becomes a very long string passed as a single shell argument. Possible issues:
- Shell argument length limits (ARG_MAX) — unlikely on macOS (262KB limit) but prompt could still be problematic
- opencode CLI may have trouble parsing very long inline arguments
- Special characters in the prompt (backticks, quotes, braces) may cause argument parsing failures

**Why iteration 2 specifically?** The prompt content is identical across iterations except for `{{ITERATION}}` changing from "1" to "2". If this were purely a length issue, iteration 1 should fail too. However, iteration 2 follows immediately after iteration 1's completion — there may be a timing/state issue.

### Hypothesis 2: opencode process state leak

opencode may maintain state between invocations (config files, lock files, session state). After iteration 1 creates a subprocess that completes, iteration 2 creates a new subprocess that could:
- Hit a lock file from the previous run
- Reuse a cached session that's now stale
- Conflict with opencode's internal state management

### Hypothesis 3: stdout buffering / pipe state

After the first subprocess completes and its stdout pipe closes, the second subprocess's stdout may not stream correctly. The Node.js `execa` library creates new pipes per subprocess, but there could be:
- A race condition where the old pipe's cleanup interferes
- A buffering issue specific to opencode's `--format json` output mode
- opencode buffering stdout when it detects it's not a TTY (common for CLI tools)

### Hypothesis 4: opencode silently failing

opencode may be crashing or erroring on iteration 2 but:
- Writing the error to stderr (which is captured but only shown if exitCode !== 0)
- Exiting with code 0 despite failure
- Hanging waiting for user input (even though stdin is "ignore")

## Diagnosis Plan

The implementation should add temporary debug logging (can be behind `--verbose`) to confirm:

1. **Is the subprocess actually spawned?** Log the PID of the opencode process for iteration 2
2. **Is any stdout received?** Log raw chunks before JSON parsing
3. **Is any stderr received?** Log stderr in real-time, not just on error
4. **Does the process exit?** Log when the subprocess promise resolves/rejects
5. **What's the exit code?** Log even for code 0

This diagnostic data will confirm which hypothesis is correct and guide the fix.

## Business Rules

### Adapter Contract
- Each call to `adapter.run()` must be independent — no shared state between iterations
- The `result` promise must eventually resolve (no infinite hang)
- stdout events must stream in real-time via `onText` and `onToolUse` callbacks

### Error Reporting
- If the subprocess produces no output, the error should be surfaced to the user (not a silent hang)
- stderr from the subprocess should be visible in verbose mode regardless of exit code

## Edge Cases

### Error Scenarios

| Scenario | Expected Behavior |
|----------|-------------------|
| opencode hangs on iteration 2 | Should either work correctly or surface a clear error |
| opencode exits with code 0 but no output | Should be treated as suspicious and logged in verbose mode |
| opencode writes to stderr but not stdout | stderr should be visible in verbose mode |
| Prompt exceeds CLI arg limits | Should gracefully handle (e.g., use temp file or stdin) |

### Boundary Conditions

| Condition | Expected Behavior |
|-----------|-------------------|
| 1 iteration only (`--iterations 1`) | Works today, must continue working |
| 3+ iterations all with opencode | Each iteration should produce output |
| Mixed: iteration 1 succeeds, iteration 2 has opencode error | Error surfaced cleanly, not a hang |

## Acceptance Criteria

### Iteration 2+ works with opencode

- [ ] **Given** a spec exists in `specs/`, **when** running `eni plan --cli=opencode`, **then** iteration 2 produces visible output (text events and/or tool events)
- [ ] **Given** verbose mode is enabled, **when** iteration 2 runs, **then** tool activity is shown just like iteration 1

### No regression for other adapters

- [ ] **Given** the fix is applied, **when** running `eni plan --cli=claude`, **then** behavior is identical to before
- [ ] **Given** the fix is applied, **when** running `eni plan --cli=codex`, **then** behavior is identical to before
- [ ] **Given** the fix is applied, **when** running `eni plan --cli=gemini`, **then** behavior is identical to before

### Build command also works

- [ ] **Given** a planned spec exists, **when** running `eni build --cli=opencode`, **then** iteration 2+ produces visible output

### Diagnostic output in verbose mode

- [ ] **Given** verbose mode, **when** a new iteration starts, **then** subprocess spawn is logged (confirms the process started)
