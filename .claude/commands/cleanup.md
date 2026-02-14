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

### Step 3: Identify merged worktrees

Cross-reference merged feature branches with active worktrees in `.worktrees/feat/`:

```bash
git worktree list
```

For each worktree in `.worktrees/feat/`, check if its branch appears in the merged branch list from Step 2. Collect matched worktrees for removal.

**Important:** Do NOT touch the beads-sync worktree at `.git/beads-worktrees/beads-sync`.

### Step 4: Remove merged worktrees and branches

For each merged worktree found:

1. Remove the worktree:
   ```bash
   git worktree remove .worktrees/feat/<epic-name>
   ```

2. Delete the local branch:
   ```bash
   git branch -d feat/<epic-name>
   ```

If `git worktree remove` fails (e.g., uncommitted changes), report the error and skip that worktree.

If no merged worktrees are found, report "Nothing to clean up — no merged worktrees detected." and continue to Step 5.

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
