# Cleanup Inside Sub Projects

## Overview

Clean up AI workflow artifacts (.claude, specs, .eni) from docs and CLI sub-projects, clear beads tasks from boilerplate, and add a minimal root README. This consolidates AI workflow configuration at the root level and prepares the boilerplate for customer-facing repo syncs.

## Job to Be Done

Remove scattered AI workflow files from sub-projects so the monorepo has a single source of truth for AI configuration at the root level, and ensure the boilerplate syncs cleanly to customer repos without leftover internal tasks.

## Target User

Eniem maintainers and customers receiving boilerplate syncs.

## Requirements

### Must Have

#### 1. Remove `.claude` folders (docs + CLI)
- [ ] Delete `apps/docs/.claude/` entirely (contains `commands/spec-interview.md`, `commands/fix-code-review.md`)
- [ ] Delete `packages/cli/.claude/` entirely (contains `commands/spec-interview.md`, `commands/fix-code-review.md`, `commands/app-interview.md`)

#### 2. Process and remove `specs/` folders (docs + CLI)
- [ ] Move implemented specs to `specs/archive/`:
  - `apps/docs/specs/cli-documentation.md` → `specs/archive/cli-documentation.md`
  - `apps/docs/specs/docs-updates-jan-2026.md` → `specs/archive/docs-updates-jan-2026.md`
  - `packages/cli/specs/polar-products-command.md` → `specs/archive/polar-products-command.md`
  - `packages/cli/specs/products-command-improvements.md` → `specs/archive/products-command-improvements.md`
  - `packages/cli/specs/ai-init.md` → `specs/archive/ai-init.md`
- [ ] Move unimplemented specs to `specs/`:
  - `apps/docs/specs/products-generated-documentation.md` → `specs/products-generated-documentation.md`
- [ ] Delete `apps/docs/specs/` folder (including `.gitkeep`)
- [ ] Delete `packages/cli/specs/` folder

#### 3. Remove `.eni` folder and package.json commands (CLI only)
- [ ] Delete `packages/cli/.eni/` entirely (contains `loop.sh`, `PROMPT_plan.md`, `PROMPT_build.md`, `PROMPT_plan_work.md`)
- [ ] Remove 4 eni scripts from `packages/cli/package.json`:
  - `eni:plan`
  - `eni:plan-work`
  - `eni:build`
  - `eni:build:auto`

#### 4. Clean up beads in boilerplate
- [ ] Clear `apps/boilerplate/.beads/issues.jsonl` (empty the file, keep it)
- [ ] Clear `apps/boilerplate/.beads/interactions.jsonl` (empty the file, keep it)
- [ ] Keep all other `.beads/` files intact (config.yaml, README.md, metadata.json, .gitignore, .jsonl.lock)

#### 5. Add root README
- [ ] Create `README.md` at monorepo root with minimal content:
  - Project name and one-liner description
  - Monorepo structure (apps/boilerplate, apps/docs, packages/cli)
  - Basic commands (dev, build, test)

### Explicitly NOT in scope
- **Do NOT touch `apps/boilerplate/.eni/`** — boilerplate keeps its own AI workflow
- **Do NOT touch `apps/boilerplate/.claude/`** if it exists
- **Do NOT modify any CLAUDE.md files**
- **Do NOT touch root `.eni/` folder** — root AI workflow stays

## Constraints

- The boilerplate app must not have its AI workflow modified (issue explicitly states this)
- Beads setup in boilerplate must remain functional — only tasks are cleared
- Root `specs/` folder structure (with `archive/` subfolder) must be maintained

## Acceptance Criteria

- [ ] No `.claude/` folder exists in `apps/docs/` or `packages/cli/`
- [ ] No `specs/` folder exists in `apps/docs/` or `packages/cli/`
- [ ] 5 implemented specs are in `specs/archive/`
- [ ] 1 unimplemented spec (`products-generated-documentation.md`) is in `specs/`
- [ ] No `.eni/` folder exists in `packages/cli/`
- [ ] No `eni:*` scripts in `packages/cli/package.json`
- [ ] `apps/boilerplate/.beads/issues.jsonl` is empty
- [ ] `apps/boilerplate/.beads/interactions.jsonl` is empty
- [ ] `apps/boilerplate/.beads/config.yaml` and other config files are unchanged
- [ ] `README.md` exists at monorepo root
- [ ] `pnpm build` succeeds after all changes

## Edge Cases

- If any spec file has the same name as an existing archived spec: unlikely but check before overwriting
- If `packages/cli/package.json` has other scripts depending on eni scripts: verify no cross-references

## Out of Scope

- Updating CLAUDE.md files to remove references to deleted workflows
- Modifying boilerplate AI workflow (.eni, .claude)
- Restructuring root-level AI workflow
- Any code changes — this is purely file/folder cleanup

## Technical Hints

- **Folders to delete**:
  - `apps/docs/.claude/`
  - `packages/cli/.claude/`
  - `apps/docs/specs/`
  - `packages/cli/specs/`
  - `packages/cli/.eni/`
- **Files to modify**:
  - `packages/cli/package.json` — remove 4 `eni:*` scripts
  - `apps/boilerplate/.beads/issues.jsonl` — clear contents
  - `apps/boilerplate/.beads/interactions.jsonl` — clear contents
- **Files to create**:
  - `README.md` at monorepo root
- **Files to move** (to `specs/archive/`):
  - 5 implemented spec files (see Requirements §2)
- **Files to move** (to `specs/`):
  - 1 unimplemented spec file (see Requirements §2)

## Verification Commands

| Criterion | Command |
|-----------|---------|
| No .claude in docs | `test ! -d apps/docs/.claude && echo pass` |
| No .claude in CLI | `test ! -d packages/cli/.claude && echo pass` |
| No specs in docs | `test ! -d apps/docs/specs && echo pass` |
| No specs in CLI | `test ! -d packages/cli/specs && echo pass` |
| No .eni in CLI | `test ! -d packages/cli/.eni && echo pass` |
| Archived specs exist | `ls specs/archive/cli-documentation.md specs/archive/ai-init.md` |
| Unimplemented spec moved | `test -f specs/products-generated-documentation.md && echo pass` |
| No eni scripts in CLI pkg | `! grep -q "eni:" packages/cli/package.json && echo pass` |
| Beads issues cleared | `test ! -s apps/boilerplate/.beads/issues.jsonl && echo pass` |
| Beads config intact | `test -f apps/boilerplate/.beads/config.yaml && echo pass` |
| Root README exists | `test -f README.md && echo pass` |
| Build succeeds | `pnpm build` |

## Test Requirements

- [ ] Test: All verification commands above pass
- [ ] Test: `pnpm build` completes without errors
- [ ] Test: No references to deleted folders break the build

## Post-Completion

- [ ] Close GitHub issue: https://github.com/eniem-dev/eniem/issues/21
