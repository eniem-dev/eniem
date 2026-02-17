# Planning Mode

You are in PLANNING mode. Your task is to analyze specifications and generate a prioritized implementation plan.

## Phase 0: Orient

Use parallel Task tools (subagent_type=Explore) to study:

- `specs/*` — application specifications
- @.eni/IMPLEMENTATION_PLAN.md (if present) — current plan state
- `src/lib/*` — shared utilities and components
- @AGENTS.md — project conventions and patterns
- `src/*` — application source code (for reference)

## Phase 1: Gap Analysis

Study @.eni/IMPLEMENTATION_PLAN.md (if present; it may be incorrect) and use parallel Task tools to study existing source code in `src/*` and compare it against `specs/*`.

Analyze findings, prioritize tasks, and create/update @.eni/IMPLEMENTATION_PLAN.md as a bullet point list sorted in priority of items yet to be implemented.

Ultrathink. Consider searching for:

- TODO comments
- Minimal implementations
- Placeholders
- Skipped or flaky tests
- Inconsistent patterns

## Plan Format Requirements

Generate @.eni/IMPLEMENTATION_PLAN.md with this structure:

```markdown
# Implementation Plan: [Feature/Sprint Name]

## Session Context

- **Last:** [Task completed] ([commit hash])
- **Next:** [Next task to do]
- **Issues:** [Blockers or None]

## Scope

[One-line description of the work]

## Tasks

- [ ] **Task description**
  - Verify: `command that returns pass/fail`
  - Done: [commit hash when complete]

## Files to Modify

- `path/to/file.ts`

## Patterns to Follow

- Pattern reference from existing code
```

Requirements:

1. **Session Context** section at top (initialize as empty for new plans)
2. **Scope** one-liner
3. **Tasks** with:
   - `[ ]` checkbox
   - **Bold description**
   - `Verify:` command that returns pass/fail
4. **Files to Modify** list
5. **Patterns to Follow** section

Verification types:

- File changes: `grep -q "pattern" file && echo pass`
- Tests: `pnpm test -- [file]`
- Branch/PR: `git`/`gh` commands

Task status convention:

- `[ ]` Pending (not started)
- `[~]` In progress (started this session)
- `[x]` Complete (verification passed)
- `[!]` Blocked (issue documented in Session Context)

## Plan Structure

1. **First task**: Create git branch with semantic naming
   - Use prefix based on work type: `feat/`, `fix/`, `chore/`, `refactor/`, `docs/`, `test/`
   - Convert description to kebab-case
   - Example: "user authentication" → `feat/user-authentication`

2. **Middle tasks**: Implementation tasks in priority order

3. **Last task**: Create pull request
   - Push branch to remote
   - Create PR with summary of changes

## Guardrails

99999. When authoring documentation in the plan, capture the WHY, not just the what.
100000. Don't assume functionality is missing - confirm with code search first.
100001. Plan only. Do NOT implement anything.
100002. First task MUST be branch creation, last task MUST be PR creation.

## Exit

When the plan is complete, output the plan and exit. The loop will restart for the next phase.
