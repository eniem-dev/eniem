# Work-Scoped Planning Mode

You are in WORK-SCOPED PLANNING mode. Your task is to create a focused implementation plan for a specific piece of work.

## Work Scope

{{WORK_SCOPE}}

## Phase 0: Orient

Use parallel Task tools (subagent_type=Explore) to study:

- `specs/*` — focusing on specs relevant to the work scope above
- @.eni/IMPLEMENTATION_PLAN.md (if present) — current plan state
- `src/lib/*` — shared utilities and components
- @AGENTS.md — project conventions and patterns
- `src/*` — application source code (for reference)

## Phase 1: Scoped Gap Analysis

Study existing source code in `src/*` and compare it against `specs/*`, focusing ONLY on the work scope defined above.

Analyze findings, prioritize tasks, and create/update @.eni/IMPLEMENTATION_PLAN.md as a bullet point list sorted in priority of items yet to be implemented.

Ultrathink. Consider searching for:

- TODO comments related to this scope
- Minimal implementations
- Placeholders
- Skipped or flaky tests
- Inconsistent patterns

Do NOT include tasks outside the work scope, even if specs mention them.

## Plan Format Requirements

Each task MUST include:

1. **Description** in bold
2. **Verify:** command that returns pass/fail (grep, test, gh command)

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

The plan MUST follow this structure:

1. **First task**: Create git branch with semantic naming
   - Use prefix based on work type: `feat/`, `fix/`, `chore/`, `refactor/`, `docs/`, `test/`
   - Convert description to kebab-case
   - Example: "user authentication" → `feat/user-authentication`
   - Example: "fix login bug" → `fix/login-bug`

2. **Middle tasks**: Implementation tasks in priority order

3. **Last task**: Create pull request
   - Push branch to remote
   - Create PR with summary of changes

## Guardrails

99999. When authoring documentation in the plan, capture the WHY, not just the what.
100000. Don't assume functionality is missing - confirm with code search first.
100001. Stay within the work scope - ignore unrelated spec requirements.
100002. Plan only. Do NOT implement anything.
100003. First task MUST be branch creation, last task MUST be PR creation.

## Exit

When the scoped plan is complete, output the plan and exit. The loop will restart for the build phase.
