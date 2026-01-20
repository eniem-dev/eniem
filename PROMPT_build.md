# Build Mode

You are in BUILD mode. Your task is to implement functionality from the plan, validate it, and commit.

## Phase 0: Orient

0a. Study `specs/*` with up to 500 parallel Sonnet subagents to learn the application specifications.
0b. Study @IMPLEMENTATION_PLAN.md to understand the current task list.
0c. Study @CLAUDE.md to understand project conventions and patterns.
0d. For reference, the application source code is in `src/*` and documentation content is in `content/*`.

## Phase 1: Select & Implement

Your task is to implement functionality per the specifications using parallel subagents.

Follow @IMPLEMENTATION_PLAN.md and choose the most important item to address.

Before making changes, search the codebase (don't assume not implemented) using Sonnet subagents to:
- Verify the functionality doesn't already exist
- Understand existing patterns in related code
- Identify all files that need creation/modification

Implement using up to 500 parallel Sonnet subagents for file reads and searches. Use only 1 subagent for running build/tests (backpressure control).

## Phase 2: Validate

After implementing functionality, run validation using only 1 subagent:
- Run `pnpm types:check && pnpm build` - must pass
- Run `pnpm lint` - must pass

If validation fails, fix the issues and re-validate. Do NOT proceed until validation passes.

## Phase 3: Update Plan

When you discover issues or complete work, immediately update @IMPLEMENTATION_PLAN.md:
- Mark completed items
- Add newly discovered tasks
- Note any blockers for future tasks

## Phase 4: Commit & Exit

When the tests pass:
1. Update @IMPLEMENTATION_PLAN.md to mark the task complete
2. Run `git add -A`
3. Run `git commit -m "feat: [descriptive message]"`
4. Run `git push`
5. Exit

The loop will restart with fresh context for the next task.

## Guardrails

99999. When authoring documentation, capture the WHY, not just the what.
999999. Single sources of truth - no migrations or adapters for backwards compatibility.
9999999. Don't assume not implemented - always search the codebase first.
99999999. Only 1 subagent for build/tests (backpressure control).
999999999. NEVER commit code that fails validation.
9999999999. NEVER implement more than ONE task per iteration.
99999999999. NEVER modify unrelated code.
999999999999. Follow existing patterns in @CLAUDE.md over introducing new ones.
9999999999999. Exit after committing - fresh context for next iteration.

## Exit Conditions

- Task completed and committed → Exit normally
- Validation failing after 3 attempts → Exit with error, do NOT commit
- No tasks remaining in plan → Output `<complete>DONE</complete>` and exit

IMPORTANT: When ALL tasks in the plan are complete, you MUST output exactly:
```
<complete>DONE</complete>
```
This signals the loop to stop. Do NOT continue iterating when there's nothing left to do.
