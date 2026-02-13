# Build Mode

You are in BUILD mode. Implement one task from beads, validate, and commit.

**Epic filter:** `{{EPIC_NAME}}` (empty = all ready tasks)

## Phase 0: Worktree Setup

Before any work, create or enter a git worktree for isolation.

**Set worktree path based on epic:**
```bash
if [ -n "{{EPIC_NAME}}" ]; then
  BRANCH="feat/{{EPIC_NAME}}"
  WORKTREE=".worktrees/feat/{{EPIC_NAME}}"
else
  BRANCH="build-$(date +%Y%m%d)"
  WORKTREE=".worktrees/$BRANCH"
fi
```

**Create worktree if it doesn't exist:**
```bash
if [ ! -d "$WORKTREE" ]; then
  # Create worktree with new branch (or existing branch if it exists)
  git worktree add "$WORKTREE" -b "$BRANCH" 2>/dev/null || git worktree add "$WORKTREE" "$BRANCH"
  cd "$WORKTREE"
  pnpm install
else
  cd "$WORKTREE"
fi
```

**IMPORTANT:** All work happens inside the worktree directory. Stay in `$WORKTREE` for the entire build session.

## Phase 0.5: Blocked Task Pre-Check

Before claiming any work, check for blockers:

```bash
blocked=$(bd blocked 2>/dev/null)
if [ -n "$blocked" ]; then
  echo "BLOCKED TASKS EXIST:"
  echo "$blocked"
  echo "Resolve blockers before continuing."
  exit 1
fi
```

If blocked tasks exist, **STOP** and report. Do not waste cycles on dependent work.

## Phase 1: Check Ready Tasks

```bash
bd ready
```

**If epic specified:** Only consider tasks matching `{{EPIC_NAME}}` in their title or notes.

If no ready tasks:
1. Run `bd blocked` to see what's waiting
2. If ALL tasks for this epic/scope are complete → go to **Phase 5: Create PR**
3. Otherwise, output `:::ENI_ALL_TASKS_COMPLETE:::` and exit

## Phase 2: Select & Claim Task

Pick the highest priority ready task (filtered by epic if specified):

```bash
bd show <task-id>
bd update <task-id> --status=in_progress
```

Read the task's description, design, and notes fields.

Before making changes, search the codebase to:
- Verify functionality doesn't already exist
- Understand existing patterns
- Identify files to modify

## Phase 3: Implement & Validate

### Tracer Bullet Mindset

Don't outrun your headlights. Build small, validate early, expand from working code.

- Build the **minimum** that satisfies acceptance criteria
- Test **immediately** after each small piece
- Get feedback before expanding
- Never build complete layers in isolation

If the task is a `[Tracer]` task, it MUST touch all layers end-to-end before moving on.

### Implementation

Follow:
- The design field in the bead
- Patterns in `AGENTS.md`
- Existing code conventions

**Test requirement:** Each implementation must include colocated `.test.ts` files.
- Exception: config/schema/static-data-only changes can skip test creation
- `pnpm test` always runs regardless of exception

After implementing, validate:
1. Run `Verify:` command from task notes - must pass
2. Run `pnpm build` - must pass
3. Run `pnpm lint` - must pass
4. Run `pnpm test` - must pass

If validation fails, fix and re-validate. Do NOT proceed until passing.

## Phase 4: Commit & Close

When validation passes:

```bash
git add -A
git commit -m "$(cat <<'EOF'
feat({{EPIC_NAME}}): [task description]

Progress: [what was completed this commit]
Next: [what remains for this epic, or "none" if last task]
EOF
)"
bd close <task-id>
git push -u origin HEAD
```

**Commit message format is REQUIRED:**
- Line 1: `feat(epic): short description`
- Line 3: `Progress:` what this commit achieved
- Line 4: `Next:` remaining work (enables context recovery)

Exit - the loop will restart for the next task.

## Phase 5: Create PR & Archive Spec

When no ready tasks remain for this epic/scope:

1. Verify all tasks are closed:
   ```bash
   bd list --status=open  # Should show no tasks for this epic
   ```

2. Get completed tasks for PR body:
   ```bash
   bd list --status=done  # Filter for this epic's tasks
   ```

3. Create pull request with structured description:
   ```bash
   gh pr create --title "feat: {{EPIC_NAME}}" --body "$(cat <<'EOF'
   ## Summary
   Implements {{EPIC_NAME}} per specs/{{EPIC_NAME}}.md

   ### Completed Tasks
   [List beads closed for this epic - from bd list --status=done]

   ### Testing
   - `pnpm build && pnpm lint` passing
   - Manual: [describe what was manually tested]
   EOF
   )"
   ```

4. Archive the spec:
   ```bash
   mkdir -p specs/archive
   mv specs/{{EPIC_NAME}}.md specs/archive/
   git add specs/
   git commit -m "chore: archive specs/{{EPIC_NAME}}.md"
   git push
   ```

5. Clean up worktree:
   ```bash
   cd ..  # Exit worktree directory
   git worktree remove "$WORKTREE"
   ```

6. Output completion signal:
   ```
   :::ENI_ALL_TASKS_COMPLETE:::
   ```

## Error Recovery

If validation fails:
1. First attempt: Targeted fix based on error
2. Second attempt: Alternative approach
3. Third attempt:
   - Create blocking bug: `bd create --type=bug --title="Fix: [error]"`
   - Do NOT commit broken code
   - Exit

## Guardrails

1. **Tracer bullets** — build small, test immediately, expand from working code
2. **Branch first** — ensure correct branch before any work
3. **Single task** — implement ONE task per iteration
4. **Epic filter** — only work on tasks matching epic if specified
5. **Validate before commit** — never commit failing code
6. **Close beads** — always `bd close` after committing
7. **PR at end** — create PR when no tasks remain
8. **Tests required** — create colocated `.test.ts` files for implementation code

## Command Reference

```bash
# Find work
bd ready              # Show unblocked tasks
bd blocked            # Show blocked tasks
bd show <id>          # Task details

# Claim work
bd update <id> --status=in_progress

# Complete work
bd close <id>         # Mark done

# Git (worktree)
git worktree add .worktrees/feat/<epic-name> -b feat/<epic-name>
gh pr create --title "..." --body "..."
```
