---
description: Post-merge cleanup — remove merged worktrees and branches, sync beads
---

# Cleanup After PR Merge

Automatically detect merged feature branches, remove their worktrees and local branches, and leave the repo in a clean state on main.

## Process

### Step 1: Switch to main and pull latest

```bash
git checkout main && git pull
```

If currently inside a worktree, exit to the repo root first.

### Step 2: Detect merged feature branches

List branches that have been merged into main:

```bash
git branch --merged main
```

Filter for branches matching the `feat/*` pattern. Ignore `main` itself and any other non-feature branches.

### Step 3: Identify all merged worktrees

Enumerate all active worktrees and cross-reference with merged branches:

```bash
git worktree list
```

Build a list of ALL worktrees under `.worktrees/feat/` whose branch appears in the merged branch list from Step 2. Only include worktrees in `.worktrees/feat/` — ignore any other worktree paths.

**Important:** Do NOT touch the beads-sync worktree at `.git/beads-worktrees/beads-sync`.

**Important:** Worktrees outside `.worktrees/feat/` (e.g., the main worktree) must be ignored.

### Step 4: Remove all merged worktrees and branches

If no merged worktrees were found in Step 3, report "Nothing to clean up — no merged worktrees detected." and continue to Step 5.

Otherwise, iterate over ALL matched worktrees and for each one:

1. Remove the worktree:
   ```bash
   git worktree remove .worktrees/feat/<epic-name>
   ```

2. Delete the corresponding local branch:
   ```bash
   git branch -d feat/<epic-name>
   ```

3. Report what was removed (worktree path and branch name).

If `git worktree remove` fails for a specific worktree (e.g., uncommitted changes), report the error, skip that worktree, and continue with the remaining ones.

After processing all matched worktrees, report the total count of worktrees removed and branches deleted.

### Step 5: Sync beads

```bash
bd sync
```

### Step 6: Confirm clean state

```bash
git status
```

Report what was cleaned up (worktrees removed, branches deleted) or that nothing needed cleanup.

## Guardrails

- Never remove worktrees whose branches have NOT been merged into main
- Never touch the `beads-sync` worktree in `.git/beads-worktrees/`
- If a worktree has uncommitted changes, skip it and report the issue
- This command is idempotent — running it twice is safe
- Do not prompt for confirmation — run fully automatically
