# Remove Gemini CLI Support

## Overview

Remove Gemini CLI as a supported adapter from the eniem CLI tool. The CLI currently supports four adapters (claude, codex, gemini, opencode). Gemini will be removed entirely, leaving three supported CLIs: **claude, codex, opencode**. This is a clean removal — no migration path needed as there are no active users.

## Problem Statement

**Who:** Maintainers of the eniem CLI
**Problem:** The Gemini CLI adapter adds maintenance burden with zero usage and dilutes focus across too many adapters.
**Impact:** Removing it reduces surface area, simplifies the codebase, and lets the team focus on the three CLIs that matter.

## Scope

### Included

- Delete the Gemini adapter implementation and its tests
- Remove Gemini from the `SUPPORTED_CLIS` type and adapter registry
- Remove Gemini from all CLI selection UIs (config set, first-run prompt)
- Remove Gemini from error messages listing supported CLIs
- Remove Gemini references from command tests (plan, build, config)
- Remove Gemini references from component tests (FirstRunPrompt, MissingBinaryFallback)
- Remove any Gemini-related E2E spec files in `specs/`

### Excluded

- No migration logic for stale `.eni/config.json` — existing validation will surface an error if `gemini` is set, which is acceptable (no users)
- No changes to other adapters (claude, codex, opencode remain as-is)
- No adapter system refactoring — keep the same architecture, just fewer adapters

### Constraints

- Must not break existing tests for the remaining three adapters
- All existing tests must pass after removal
- The CLI build must succeed

## User Stories

### Primary Flow

- [ ] As a CLI user, I see only claude, codex, and opencode when selecting a CLI adapter (via `eni config set plan` or `eni config set build`)
- [ ] As a CLI user, I see only claude, codex, and opencode in the first-run prompt
- [ ] As a CLI user, error messages listing supported CLIs show only claude, codex, and opencode

## Business Rules

### Validation

- `SUPPORTED_CLIS` tuple becomes `["claude", "codex", "opencode"]`
- `CLIId` type derives from the updated tuple
- Config validation rejects `gemini` as an invalid CLI value (inherent from type change)

### Limits & Constraints

- Supported adapter count goes from 4 → 3
- No Gemini binary check needed anywhere

## Data Model

### Entities

**CLIAdapter registry**
| Before | After |
|--------|-------|
| claude, codex, gemini, opencode | claude, codex, opencode |

### State Transitions

No state changes — this is a deletion, not a behavior modification.

## Files to Modify

### Delete entirely

| File | Reason |
|------|--------|
| `packages/cli/src/lib/adapters/gemini.ts` | Adapter implementation |
| `packages/cli/src/lib/adapters/__tests__/gemini.test.ts` | Adapter tests |

### Modify (remove Gemini references)

| File | What to change |
|------|---------------|
| `packages/cli/src/lib/adapters/types.ts` | Remove `"gemini"` from `SUPPORTED_CLIS` |
| `packages/cli/src/lib/adapters/registry.ts` | Remove `gemini: geminiAdapter` entry and import |
| `packages/cli/src/lib/adapters/index.ts` | Remove Gemini re-export if present |
| `packages/cli/src/cli.tsx` | Remove Gemini from CLI flag choices/descriptions |
| `packages/cli/src/commands/config.tsx` | Remove Gemini from config UI options |
| `packages/cli/src/commands/build.tsx` | Remove Gemini from error messages |
| `packages/cli/src/commands/plan.tsx` | Remove Gemini from error messages |
| `packages/cli/src/cli-flags.test.ts` | Remove Gemini test cases |
| `packages/cli/src/commands/__tests__/config.test.tsx` | Remove Gemini test cases |
| `packages/cli/src/commands/__tests__/plan.test.tsx` | Remove Gemini test cases |
| `packages/cli/src/commands/__tests__/build.test.tsx` | Remove Gemini test cases |
| `packages/cli/src/commands/__tests__/ai.test.tsx` | Remove Gemini test cases |
| `packages/cli/src/components/__tests__/FirstRunPrompt.test.tsx` | Remove Gemini test cases |
| `packages/cli/src/components/__tests__/MissingBinaryFallback.test.tsx` | Remove Gemini test cases |
| `packages/cli/src/lib/__tests__/eni-config.test.ts` | Remove Gemini test cases |
| `packages/cli/src/lib/adapters/__tests__/registry.test.ts` | Remove Gemini test cases |
| `packages/cli/src/lib/adapters/__tests__/types.test.ts` | Remove Gemini test cases |

## Edge Cases

### Error Scenarios

| Scenario | Expected Behavior |
|----------|-------------------|
| User has `"gemini"` in `.eni/config.json` | Config validation rejects with error listing valid CLIs (claude, codex, opencode) |
| User passes `--cli gemini` flag | CLI flag validation rejects with error listing valid CLIs |

## Acceptance Criteria

### Gemini adapter is fully removed

- [ ] **Given** the codebase, **when** searching for "gemini" (case-insensitive), **then** zero results are found in `packages/cli/src/`
- [ ] **Given** the adapter registry, **when** listing all adapters, **then** only claude, codex, and opencode are returned

### Remaining adapters are unaffected

- [ ] **Given** the removal, **when** running `pnpm test` in packages/cli, **then** all tests pass
- [ ] **Given** the removal, **when** running `pnpm build`, **then** the build succeeds

### CLI UX is correct

- [ ] **Given** a user running `eni config set plan`, **when** selecting a CLI, **then** only claude, codex, and opencode are listed
- [ ] **Given** a user passing `--cli gemini`, **when** the CLI parses flags, **then** it rejects with a validation error
