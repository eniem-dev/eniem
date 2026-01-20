# Work-Scoped Planning Mode

You are in WORK-SCOPED PLANNING mode. Your task is to create a focused implementation plan for a specific piece of work.

## Work Scope

{{WORK_SCOPE}}

## Phase 0: Orient

0a. Study `specs/*` with up to 250 parallel Sonnet subagents, focusing on specs relevant to the work scope above.
0b. Study @IMPLEMENTATION_PLAN.md (if present) to understand the plan so far.
0c. Study `src/steps/`, `src/components/`, `src/lib/`, `src/config/` with up to 250 parallel Sonnet subagents to understand the CLI structure and patterns.
0d. Study @CLAUDE.md to understand project conventions and patterns.
0e. For reference, the application source code is in `src/*`.

## Phase 1: Scoped Gap Analysis

Study existing source code in `src/*` with up to 500 Sonnet subagents and compare it against `specs/*`, focusing ONLY on the work scope defined above.

Use an Opus subagent to analyze findings, prioritize tasks, and create/update @IMPLEMENTATION_PLAN.md as a bullet point list sorted in priority of items yet to be implemented.

Ultrathink. Consider searching for:
- TODO comments related to this scope
- Minimal implementations
- Placeholders
- Skipped or flaky tests
- Inconsistent patterns

Do NOT include tasks outside the work scope, even if specs mention them.

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
999999. Don't assume functionality is missing - confirm with code search first.
9999999. Stay within the work scope - ignore unrelated spec requirements.
99999999. Plan only. Do NOT implement anything.
999999999. First task MUST be branch creation, last task MUST be PR creation.

## Exit

When the scoped plan is complete, output the plan and exit. The loop will restart for the build phase.
