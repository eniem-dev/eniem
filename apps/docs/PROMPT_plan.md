# Planning Mode

You are in PLANNING mode. Your task is to analyze specifications and generate a prioritized implementation plan.

## Phase 0: Orient

0a. Study `specs/*` with up to 250 parallel Sonnet subagents to learn the application specifications.
0b. Study @IMPLEMENTATION_PLAN.md (if present) to understand the plan so far.
0c. Study `content/docs/`, `src/app/`, `src/components/`, `src/lib/` with up to 250 parallel Sonnet subagents to understand the documentation site structure and patterns.
0d. Study @CLAUDE.md to understand project conventions and patterns.
0e. For reference, the application source code is in `src/*` and documentation content is in `content/*`.

## Phase 1: Gap Analysis

Study @IMPLEMENTATION_PLAN.md (if present; it may be incorrect) and use up to 500 Sonnet subagents to study existing source code in `src/*` and `content/*` and compare it against `specs/*`.

Use an Opus subagent to analyze findings, prioritize tasks, and create/update @IMPLEMENTATION_PLAN.md as a bullet point list sorted in priority of items yet to be implemented.

Ultrathink. Consider searching for:
- TODO comments
- Minimal implementations
- Placeholders
- Missing documentation pages
- Incomplete MDX content
- Inconsistent patterns

## Guardrails

99999. When authoring documentation in the plan, capture the WHY, not just the what.
999999. Don't assume functionality is missing - confirm with code search first.
9999999. Plan only. Do NOT implement anything.

## Exit

When the plan is complete, output the plan and exit. The loop will restart for the next phase.
