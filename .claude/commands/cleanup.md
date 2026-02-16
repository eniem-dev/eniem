---
description: Post-merge cleanup — remove merged worktrees and branches, sync beads
---

# Cleanup After PR Merge

Automatically detect merged feature branches, remove their worktrees and local branches, and leave the repo in a clean state on main.

## Process

### Step 1: Switch to main and pull latest

If currently on a feature branch (not main), switch to main first. If currently inside a worktree directory, navigate to the main repo root before switching.

```bash
git checkout main && git pull
```

### Step 2: Detect merged feature branches

First, prune stale remote-tracking references:

```bash
git fetch --prune origin
```

Then detect merged branches using **two methods** (union of both results):

**Method A — Git merge detection** (catches regular merges):

```bash
git branch --merged main
```

Filter for branches matching the `feat/*` pattern. Ignore `main` itself and any other non-feature branches.

**Method B — GitHub PR detection** (catches squash merges and rebase merges):

```bash
gh pr list --state merged --limit 50 --json headRefName
```

Cross-reference with local `feat/*` branches. A local branch is considered merged if a merged PR exists with the same `headRefName`.

The final list of merged branches is the **union** of both methods.

### Step 3: Identify all merged worktrees

Enumerate all active worktrees and cross-reference with merged branches:

```bash
git worktree list
```

Build a list of ALL worktrees under `.worktrees/feat/` whose branch appears in the merged branch list from Step 2. Only include worktrees in `.worktrees/feat/` — ignore any other worktree paths.

**Important:** Do NOT touch the beads-sync worktree at `.git/beads-worktrees/beads-sync`.

**Important:** Worktrees outside `.worktrees/feat/` (e.g., the main worktree) must be ignored.

### Step 4: Remove all merged worktrees and branches

If no merged branches were found in Step 2, report "Nothing to clean up — no merged branches detected." and continue to Step 6.

Otherwise, process ALL merged branches:

**For branches with worktrees** (identified in Step 3):

1. Remove the worktree:
   ```bash
   git worktree remove .worktrees/feat/<epic-name>
   ```

2. Delete the corresponding local branch:
   ```bash
   git branch -D feat/<epic-name>
   ```

3. Report what was removed (worktree path and branch name).

If `git worktree remove` fails for a specific worktree (e.g., uncommitted changes), report the error, skip that worktree, and continue with the remaining ones.

**For branches without worktrees** (merged but only exist as local branches):

1. Delete the local branch:
   ```bash
   git branch -D feat/<branch-name>
   ```

2. Report what was removed (branch name).

Use `git branch -D` (force delete) instead of `git branch -d` because squash-merged branches are not recognized as merged by git.

After processing all matched branches, report the total count of worktrees removed and branches deleted.

### Step 5: Delete remote branches

For each branch that was deleted locally in Step 4, also delete it from the remote:

```bash
git push origin --delete feat/<epic-name>
```

If the remote branch has already been deleted (e.g., GitHub auto-deleted it on PR merge), the push will fail. Ignore this gracefully — it simply means the remote is already clean. Do not show error output to the user for already-deleted remote branches.

### Step 6: Sync beads

```bash
bd sync
```

### Step 7: Confirm clean state and print summary

```bash
git status
```

Print a final summary of all actions taken:

- If worktrees were removed: `Removed N worktrees: feat/epic-a, feat/epic-b, ...`
- If remote branches were deleted: `Deleted N remote branches`
- If some worktrees were skipped due to errors: `Skipped M worktrees (uncommitted changes)`
- If nothing was cleaned: `Nothing to clean up — no merged worktrees detected.`

The summary should be fully automatic with no confirmation prompts or interactive selection at any point during execution.

## Edge Cases

- **Squash/rebase merges:** PRs merged via squash or rebase on GitHub are NOT detected by `git branch --merged`. The `gh pr list --state merged` method (Method B in Step 2) catches these. Use `git branch -D` (force delete) for these branches since git doesn't recognize them as merged.
- **Branches without worktrees:** Some merged branches may exist as local branches without a corresponding worktree (e.g., created with `git checkout -b` instead of `git worktree add`). These should still be deleted.
- **Dirty worktrees:** If `git worktree remove` fails because a worktree has uncommitted changes, report the failure with the worktree path and error message, skip it, and continue with remaining worktrees
- **beads-sync worktree:** The worktree at `.git/beads-worktrees/beads-sync` must NEVER be touched — it is managed by the beads daemon. Only worktrees under `.worktrees/feat/` are candidates for cleanup
- **No merged branches:** If no merged feature branches are found, output "Nothing to clean up — no merged branches detected." and skip to the sync/status steps
- **Idempotent:** Running this command twice in a row is safe — the second run will find nothing to clean up since worktrees and branches were already removed
- **Starting from feature branch:** The command works regardless of the current branch — Step 1 switches to main before scanning
- **gh CLI unavailable:** If `gh` is not installed or not authenticated, fall back to Method A only (`git branch --merged`) and warn that squash-merged branches may not be detected

## Guardrails

- Never remove worktrees whose branches have NOT been merged into main
- Never touch the `beads-sync` worktree in `.git/beads-worktrees/`
- If a worktree has uncommitted changes, skip it and report the issue
- This command is idempotent — running it twice is safe
- Do not prompt for confirmation — run fully automatically
