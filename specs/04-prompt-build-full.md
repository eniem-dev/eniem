# PROMPT_build_full.md

## Overview

New prompt file `.eni/PROMPT_build_full.md` derived from `PROMPT_build.md`, adapted for multi-spec build sessions. The prompt operates in a shared worktree/branch and uses `{{IS_LAST_SPEC}}` to control PR creation.

## Users & Problem

**User:** The AI agent executing build tasks.

**Problem:** `PROMPT_build.md` assumes one spec per worktree/branch. In build-all mode, multiple specs share a single worktree. The prompt needs to: (1) not re-create the worktree for every spec, (2) scope commits to the current spec, (3) only create a PR on the last spec.

## Scope

**In scope:**
- New file: `.eni/PROMPT_build_full.md`
- Worktree setup: create once, reuse for subsequent specs
- Commit message format: `feat({{EPIC_NAME}}): [task description]` (EPIC_NAME = current spec name)
- PR creation: only when `{{IS_LAST_SPEC}}` is `"true"`
- Sentinel behavior: `:::ENI_DONE:::` signals spec completion to CLI

**Out of scope:**
- Changes to existing `PROMPT_build.md`
- Cross-spec dependency awareness within the prompt

## Differences from PROMPT_build.md

### Phase 0: Worktree Setup

**Same behavior** — the prompt creates the worktree if it doesn't exist, or `cd`s into it if it does. Since the CLI passes a session-level `{{BRANCH}}` and `{{WORKTREE}}`, the first spec creates the worktree and subsequent specs reuse it.

No change needed here — the existing logic handles both cases naturally.

### Phase 4: Commit & Close

**Change:** Commit message prefix uses the current spec name:

```bash
git commit -m "$(cat <<'EOF'
feat({{EPIC_NAME}}): [task description]

Progress: [what was completed this commit]
Next: [what remains for this spec, or "none" if last task]
EOF
)"
```

This is actually the same template as `PROMPT_build.md` since `{{EPIC_NAME}}` is already set to the spec name. No change needed.

### Phase 5: Create PR & Archive Specs

**Change:** Phase 5 is conditional on `{{IS_LAST_SPEC}}`:

```markdown
## Phase 5: Create PR & Archive Specs

**Only execute this phase if `{{IS_LAST_SPEC}}` is `true`.**

If `{{IS_LAST_SPEC}}` is `false`:
1. Output `:::ENI_DONE:::` to signal completion of this spec
2. Do NOT create a PR

If `{{IS_LAST_SPEC}}` is `true`:
1. Verify all tasks across all specs are closed
2. Create a single PR covering all specs built in this session
3. PR title: "feat: build session {{BRANCH}}"
4. PR body: list all completed specs and their tasks
5. Archive completed spec files
6. Output `:::ENI_DONE:::`
```

### Phase 1: Check Ready Tasks — Epic Filter

**Change:** The prompt always operates in epic mode, filtering tasks by `{{EPIC_NAME}}` (the current spec name). When all tasks for this spec are done and `{{IS_LAST_SPEC}}` is `false`, it outputs `:::ENI_DONE:::` instead of going to Phase 5.

## Template Variables

| Variable | Source | Example |
|----------|--------|---------|
| `{{SPEC_NAME}}` | Current spec being built | `02-board-management` |
| `{{EPIC_NAME}}` | Same as SPEC_NAME | `02-board-management` |
| `{{ITERATION}}` | Current iteration number | `3` |
| `{{BRANCH}}` | Session branch (shared) | `feat/build-session-20260314-1430` |
| `{{WORKTREE}}` | Session worktree path (shared) | `.worktrees/feat/build-session-20260314-1430` |
| `{{IS_LAST_SPEC}}` | Whether this is the final spec | `true` or `false` |
| `{{IS_EPIC}}` | Always true in build-all | `true` |

## Architecture

### Files to Create

- `.eni/PROMPT_build_full.md` — New prompt file

### Derivation from PROMPT_build.md

Start with a copy of `PROMPT_build.md` and apply these modifications:

1. **Header:** Change title to "Build Mode (Full Session)" and add note about shared worktree
2. **Phase 0:** No changes (worktree logic works as-is)
3. **Phase 1:** Add logic: when all tasks for `{{EPIC_NAME}}` are done AND `{{IS_LAST_SPEC}}` is `false` → output `:::ENI_DONE:::` (skip Phase 5)
4. **Phase 4:** No changes (commit format already uses `{{EPIC_NAME}}`)
5. **Phase 5:** Gate behind `{{IS_LAST_SPEC}} = true`. PR title becomes session-level. PR body lists all specs.
6. **Guardrails:** Add rule about `IS_LAST_SPEC` controlling PR creation

## Acceptance Criteria

- Given `{{IS_LAST_SPEC}}` is `false` and all tasks for the current spec are done, when Phase 1 detects no ready tasks, then the prompt outputs `:::ENI_DONE:::` without creating a PR.
- Given `{{IS_LAST_SPEC}}` is `true` and all tasks are done, when Phase 5 triggers, then a single PR is created covering all specs in the session.
- Given the prompt runs for the first spec, when Phase 0 executes, then the worktree is created with the session branch name.
- Given the prompt runs for a subsequent spec, when Phase 0 executes, then it `cd`s into the existing worktree.
- Given a commit is made, when the message is formatted, then it uses `feat({{EPIC_NAME}}):` where EPIC_NAME is the current spec name.

## Testing Strategy

- Manual verification: run `eni build --all` with 2+ specs and verify worktree reuse, commit scoping, and PR creation only on last spec.
- Review prompt file diff against `PROMPT_build.md` to ensure only intended changes.
