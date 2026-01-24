# Planning Mode

You are in PLANNING mode. Your task is to analyze specifications and generate a prioritized implementation plan.

## Phase 0: Orient

Use parallel Task tools (subagent_type=Explore) to study:
- `specs/*` — application specifications
- @IMPLEMENTATION_PLAN.md (if present) — current plan state
- `src/lib/*` — shared utilities and components
- @CLAUDE.md — project conventions and patterns
- `src/*` — application source code (for reference)

## Phase 1: Gap Analysis

Study @IMPLEMENTATION_PLAN.md (if present; it may be incorrect) and use parallel Task tools to study existing source code in `src/*` and compare it against `specs/*`.

Analyze findings, prioritize tasks, and create/update @IMPLEMENTATION_PLAN.md as a bullet point list sorted in priority of items yet to be implemented.

Ultrathink. Consider searching for:
- TODO comments
- Minimal implementations
- Placeholders
- Skipped or flaky tests
- Inconsistent patterns

## Guardrails

99999. When authoring documentation in the plan, capture the WHY, not just the what.
999999. Don't assume functionality is missing - confirm with code search first.
9999999. Plan only. Do NOT implement anything.

## Exit

When the plan is complete, output the plan and exit. The loop will restart for the next phase.
