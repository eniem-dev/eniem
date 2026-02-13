# AGENTS and CLAUDE.md Refactoring

## Overview

Consolidate all `CLAUDE.md` and `AGENTS.md` files across the monorepo into a single `AGENTS.md` per directory, with `CLAUDE.md` as a symlink pointing to `AGENTS.md`. This prepares the project for multi-agent support while maintaining backward compatibility with tools that read `CLAUDE.md`.

## Job to Be Done

Establish `AGENTS.md` as the single source of truth for AI agent instructions, so the project is ready to support multi-agent workflows in the future without maintaining duplicate files.

## Target User

Eniem maintainers and AI agents (Claude, Codex, etc.) working across the monorepo.

## Requirements

### Must Have

#### 1. Root level — Merge and symlink
- [ ] Create new `AGENTS.md` at root with merged content: CLAUDE.md content first, then current AGENTS.md content appended below
- [ ] Delete existing `CLAUDE.md`
- [ ] Create symlink: `CLAUDE.md` → `AGENTS.md`

#### 2. apps/boilerplate — Replace and symlink
- [ ] Replace `apps/boilerplate/AGENTS.md` with the content of `apps/boilerplate/CLAUDE.md` (discard current AGENTS.md content)
- [ ] Delete `apps/boilerplate/CLAUDE.md`
- [ ] Create symlink: `apps/boilerplate/CLAUDE.md` → `AGENTS.md`

#### 3. apps/docs — Rename and symlink
- [ ] Rename `apps/docs/CLAUDE.md` → `apps/docs/AGENTS.md`
- [ ] Create symlink: `apps/docs/CLAUDE.md` → `AGENTS.md`

#### 4. packages/cli — Rename and symlink
- [ ] Rename `packages/cli/CLAUDE.md` → `packages/cli/AGENTS.md`
- [ ] Create symlink: `packages/cli/CLAUDE.md` → `AGENTS.md`

#### 5. apps/boilerplate/examples/eniem-polar-benefits-sample — Rename and symlink
- [ ] Rename `apps/boilerplate/examples/eniem-polar-benefits-sample/CLAUDE.md` → `apps/boilerplate/examples/eniem-polar-benefits-sample/AGENTS.md`
- [ ] Create symlink: `apps/boilerplate/examples/eniem-polar-benefits-sample/CLAUDE.md` → `AGENTS.md`

#### 6. Update internal references
- [ ] Update references from `CLAUDE.md` to `AGENTS.md` inside the merged/renamed files (e.g., root file references `apps/boilerplate/CLAUDE.md` → `apps/boilerplate/AGENTS.md`)
- [ ] Update `@CLAUDE.md` references in `.eni/PROMPT_*.md` files to `@AGENTS.md`
- [ ] Update `CLAUDE.md` references in `.claude/commands/fix-code-review.md` files to `AGENTS.md`

#### 7. Verify git symlink support
- [ ] Check `core.symlinks` git config before creating symlinks
- [ ] If not explicitly set, document that it defaults to `true` on Linux/macOS and may need enabling on Windows

### Nice to Have
- [ ] Add a comment at the top of each `AGENTS.md` noting that `CLAUDE.md` is a symlink to this file

## Constraints

- Symlinks must be relative (e.g., `ln -s AGENTS.md CLAUDE.md`) so they work across git clones
- Git must track the symlinks (verify `core.symlinks` is not set to `false`)
- All tools that currently read `CLAUDE.md` must continue to work via the symlink
- The content merge at root level must not lose any information from either file

## Acceptance Criteria

- [ ] Every directory that previously had a `CLAUDE.md` now has an `AGENTS.md` (regular file) and a `CLAUDE.md` (symlink to `AGENTS.md`)
- [ ] `CLAUDE.md` symlinks resolve correctly (reading `CLAUDE.md` returns `AGENTS.md` content)
- [ ] Root `AGENTS.md` contains all content from both the old `CLAUDE.md` and old `AGENTS.md`
- [ ] Boilerplate `AGENTS.md` contains the full dev guide (previously in `CLAUDE.md`)
- [ ] No file content references `CLAUDE.md` as a standalone file — all references point to `AGENTS.md`
- [ ] `pnpm build` succeeds after all changes
- [ ] `git status` shows symlinks are tracked correctly

## Edge Cases

- Windows users with `core.symlinks=false`: symlinks will be checked out as plain text files containing the path. Document this limitation.
- If any CI/CD reads `CLAUDE.md` directly (not via git): symlinks should still resolve on Linux/macOS CI runners
- `.eni/PROMPT_*.md` files use `@CLAUDE.md` syntax — verify this still works after the rename (it should, since the symlink preserves the filename)

## Out of Scope

- Multi-agent configuration or role definitions (future work)
- Changes to `.claude/settings.json` or other tool configs
- Modifying content/instructions within the files (beyond reference updates)

## Technical Hints

- **Files to modify (content merge)**:
  - `AGENTS.md` (root) — merge with `CLAUDE.md` content
  - `apps/boilerplate/AGENTS.md` — replace with `CLAUDE.md` content
- **Files to rename**:
  - `apps/docs/CLAUDE.md` → `apps/docs/AGENTS.md`
  - `packages/cli/CLAUDE.md` → `packages/cli/AGENTS.md`
  - `apps/boilerplate/examples/eniem-polar-benefits-sample/CLAUDE.md` → `...AGENTS.md`
- **Symlinks to create** (5 total):
  - `CLAUDE.md` → `AGENTS.md` in each of the 5 directories
- **Files with references to update**:
  - `AGENTS.md` (root, after merge) — `apps/boilerplate/CLAUDE.md` → `apps/boilerplate/AGENTS.md`
  - `apps/boilerplate/AGENTS.md` — remove "Read CLAUDE.md" self-reference
  - `.eni/PROMPT_build.md` — `@CLAUDE.md` → `@AGENTS.md`
  - `packages/cli/.eni/PROMPT_*.md` — `@CLAUDE.md` → `@AGENTS.md`
  - `apps/docs/PROMPT_*.md` — `@CLAUDE.md` → `@AGENTS.md`
  - `apps/boilerplate/.eni/PROMPT_build.md` — `CLAUDE.md` → `AGENTS.md`
  - `apps/boilerplate/examples/eniem-polar-benefits-sample/.eni/PROMPT_*.md` — `@CLAUDE.md` → `@AGENTS.md`
  - `.claude/commands/fix-code-review.md` files (boilerplate, docs, cli, example) — `CLAUDE.md` → `AGENTS.md`
- **Dependencies**: Spec #21 (cleanup sub-projects) removes some of these files. If #21 runs first, fewer reference updates needed in docs/cli.
- **Git operations**: Use `git mv` for renames to preserve history, then create symlinks

## Verification Commands

| Criterion | Command |
|-----------|---------|
| Root CLAUDE.md is symlink | `test -L CLAUDE.md && echo pass` |
| Root symlink target correct | `readlink CLAUDE.md \| grep -q AGENTS.md && echo pass` |
| Boilerplate CLAUDE.md is symlink | `test -L apps/boilerplate/CLAUDE.md && echo pass` |
| Docs CLAUDE.md is symlink | `test -L apps/docs/CLAUDE.md && echo pass` |
| CLI CLAUDE.md is symlink | `test -L packages/cli/CLAUDE.md && echo pass` |
| Example CLAUDE.md is symlink | `test -L apps/boilerplate/examples/eniem-polar-benefits-sample/CLAUDE.md && echo pass` |
| All AGENTS.md are regular files | `for f in AGENTS.md apps/boilerplate/AGENTS.md apps/docs/AGENTS.md packages/cli/AGENTS.md; do test -f "$f" && ! test -L "$f" && echo "pass: $f"; done` |
| Symlinks resolve | `diff <(cat CLAUDE.md) <(cat AGENTS.md) && echo pass` |
| No stale CLAUDE.md references | `grep -r "CLAUDE\.md" AGENTS.md apps/*/AGENTS.md packages/*/AGENTS.md \| grep -v symlink \| wc -l` (should be 0) |
| Build succeeds | `pnpm build` |

## Test Requirements

- [ ] Test: All 5 `CLAUDE.md` files are symlinks pointing to `AGENTS.md`
- [ ] Test: All 5 `AGENTS.md` files are regular files (not symlinks)
- [ ] Test: Reading `CLAUDE.md` returns identical content to `AGENTS.md` in each directory
- [ ] Test: Root `AGENTS.md` contains content from both original files
- [ ] Test: No file in the repo references `CLAUDE.md` as a standalone file (grep check)
- [ ] Test: `pnpm build` completes without errors
- [ ] Test: `git status` shows symlinks tracked (not as modified/untracked after clean checkout)

## Post-Completion

- [ ] Close GitHub issue: https://github.com/eniem-dev/eniem/issues/22
