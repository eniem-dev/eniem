# Cleanup After PR Merge

## Overview
A Claude Code slash command (`/cleanup`) that automatically detects merged feature branches, removes their worktrees and branches, syncs beads, and leaves the repository in a clean state on main. This eliminates the manual post-merge cleanup steps that currently must be done by hand.

## Job to Be Done
After a PR is merged on GitHub, the developer needs to clean up local state (worktrees, branches, beads) to get back to a clean working environment. This process is repetitive and error-prone when done manually.

## Target User
Eniem developers using the worktree-based feature branch workflow with beads issue tracking.

## Requirements

### Must Have
- [ ] Create a Claude Code slash command at `.claude/commands/cleanup.md`
- [ ] Switch to `main` branch and pull latest changes (`git checkout main && git pull`)
- [ ] Auto-detect worktrees in `.worktrees/feat/` whose branches have been merged into main
- [ ] Remove each merged worktree (`git worktree remove <path>`)
- [ ] Delete each merged local branch (`git branch -d <branch>`)
- [ ] Delete remote branch if it still exists on origin (`git push origin --delete <branch>`)
- [ ] Run full beads sync (`bd sync`) to push to the `beads-sync` branch
- [ ] Show `git status` at the end to confirm clean state
- [ ] Fully automatic — no confirmation prompts, no interactive selection

### Nice to Have
- [ ] Report a summary of what was cleaned up (e.g., "Removed 2 worktrees: feat/21-..., feat/22-...")

## Constraints
- Must work from the main eniem repo root (`/home/tiby/eniem`)
- Must not delete worktrees whose branches have NOT been merged
- Must handle the case where remote branch was already deleted by GitHub's auto-delete on merge
- Must not interfere with the `beads-sync` worktree in `.git/beads-worktrees/`

## Acceptance Criteria
- [ ] Running `/cleanup` in Claude Code switches to main and pulls latest
- [ ] Worktrees for merged branches are removed from `.worktrees/feat/`
- [ ] Local branches for merged PRs are deleted
- [ ] Remote branches are deleted if they still exist (no error if already gone)
- [ ] `bd sync` runs successfully after cleanup
- [ ] `git status` shows clean state at the end
- [ ] Unmerged worktrees/branches are left untouched
- [ ] Command works idempotently (running twice is safe)

## Edge Cases
- No merged branches found: command completes successfully with a message saying nothing to clean up
- Remote branch already deleted by GitHub: `git push origin --delete` failure is ignored gracefully
- Worktree has uncommitted changes: `git worktree remove` may fail — report the error and skip that worktree
- Currently on a feature branch (not main): command switches to main first
- Main branch has diverged: `git pull` handles merge/rebase as configured

## Out of Scope
- Closing beads issues (only `bd sync` is run, not `bd close`)
- Modifying specs or moving specs to archive
- Creating PRs or any GitHub interaction beyond branch deletion
- Running `pnpm install` or build/lint after cleanup

## Technical Hints
- **Files to create**: `.claude/commands/cleanup.md` (at project root level)
- **Patterns to follow**: See `.claude/commands/spec-interview.md` for slash command format (YAML frontmatter + markdown instructions)
- **Worktree location**: `.worktrees/feat/<epic-name>/` with branches named `feat/<epic-name>`
- **Beads sync branch**: `beads-sync` (configured in `.beads/config.yaml`)
- **Detect merged branches**: `git branch --merged main` lists branches merged into main
- **List worktrees**: `git worktree list` shows all active worktrees
- **Remove worktree**: `git worktree remove <path>` (may fail if dirty)
- **Beads sync worktree**: Located at `.git/beads-worktrees/beads-sync` — must NOT be touched

## Verification Commands

| Criterion | Command |
|-----------|---------|
| Slash command file exists | `test -f .claude/commands/cleanup.md && echo pass` |
| On main after cleanup | `git branch --show-current` should output `main` |
| No merged worktrees remain | `git worktree list` should only show main and beads-sync |
| Merged branches deleted locally | `git branch --merged main` should not list feat/* branches |
| git status is clean | `git status` shows up to date |

## Test Requirements
- [ ] Test: Slash command file exists with correct YAML frontmatter
- [ ] Test: Merged worktrees are detected and removed
- [ ] Test: Unmerged worktrees are preserved
- [ ] Test: Remote branch deletion is attempted but failures are handled gracefully
- [ ] Test: `bd sync` is called after worktree cleanup
- [ ] Test: Command is idempotent (safe to run multiple times)

## Post-Completion

- [ ] Close GitHub issue: https://github.com/eniem-dev/eniem/issues/2
- [ ] PR description includes: Closes #2
