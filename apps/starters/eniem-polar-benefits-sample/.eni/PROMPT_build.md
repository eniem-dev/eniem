# Build Mode

You are in BUILD mode. Your task is to implement functionality from the plan, validate it, and commit.

## Phase 0: Startup

Before any work:

1. Read @.eni/IMPLEMENTATION_PLAN.md "Session Context" section
2. Check git branch matches plan
3. If uncommitted changes exist, abort with error (auto mode cannot proceed with dirty state)
4. Run `pnpm build` to verify clean state

## Phase 0.5: Orient

Use parallel Task tools (subagent_type=Explore) to study:

- `specs/*` — application specifications
- @.eni/IMPLEMENTATION_PLAN.md — current task list
- @AGENTS.md — project conventions and patterns
- `src/*` — application source code (for reference)

## Phase 1: Select & Implement

Your task is to implement functionality per the specifications.

Follow @.eni/IMPLEMENTATION_PLAN.md and choose the most important item to address.

Before making changes, search the codebase (don't assume not implemented) to:

- Verify the functionality doesn't already exist
- Understand existing patterns in related code
- Identify all files that need creation/modification

Use parallel Task tools for file reads and searches. Run build/test commands directly (not via subagent) to maintain output visibility.

## Phase 2: Validate

After implementing:

1. Run the `Verify:` command from the task in @.eni/IMPLEMENTATION_PLAN.md - must pass
2. Run `pnpm build` - must pass
3. Run `pnpm lint` - must pass

Only mark task `[x]` when verification passes.

If validation fails, fix the issues and re-validate. Do NOT proceed until validation passes.

## Phase 3: Update Plan

When you discover issues or complete work, immediately update @.eni/IMPLEMENTATION_PLAN.md:

- Mark completed items
- Add newly discovered tasks
- Note any blockers for future tasks

## Phase 4: Commit & Exit

When the tests pass:

1. Mark task `[x]` with `Done: [commit-hash]`
2. Update "Session Context":
   - **Last:** [completed task] ([hash])
   - **Next:** [next pending task]
   - **Issues:** [any blockers found]
3. Run `git add -A && git commit -m "feat: ..."`
4. Run `git push`
5. Exit

The loop will restart with fresh context for the next task.

## Error Recovery

If verification fails:

1. First attempt: Targeted fix based on error
2. Second attempt: Alternative approach
3. Third attempt:
   - Mark task `[!]` (blocked)
   - Update Session Context Issues
   - Add new task: "Fix: [error description]"
   - Exit (don't commit broken code)

## Guardrails

99999. When authoring documentation, capture the WHY, not just the what.
100000. Single sources of truth - no migrations or adapters for backwards compatibility.
100001. Don't assume not implemented - always search the codebase first.
100002. Run build/tests directly, not via subagent (maintain output visibility).
100003. NEVER commit code that fails validation.
100004. NEVER implement more than ONE task per iteration.
100005. NEVER modify unrelated code.
100006. Follow existing patterns in @AGENTS.md over introducing new ones.
100007. Exit after committing - fresh context for next iteration.

## Exit Conditions

- Task completed and committed → Exit normally
- Validation failing after 3 attempts → Exit with error, do NOT commit
- No `[ ]` (unchecked) tasks remaining in plan → Output completion signal and exit

IMPORTANT: When ALL tasks in the plan are marked `[x]` (complete), you MUST output exactly:

```
:::ENI_ALL_TASKS_COMPLETE:::
```

This signals the loop to stop. Do NOT output this signal if ANY `[ ]` tasks remain.
