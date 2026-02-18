# ENI CLI — Setup Refactor + Migration

## Overview

Refactor `eni ai setup` to replace the old `eniem ai init` command: sparse-clone prompts and `.claude/` config from the boilerplate, initialize beads, and add a `--update` flag for refreshing managed files without overwriting customized prompts. Handle migration from the old `eniem-cli` package including deprecation notices and cleanup of `loop.sh`.

## Problem Statement

**Who:** Eniem boilerplate developers (internal) and customers
**Problem:** The current `eniem ai init` only copies files. It doesn't initialize beads, doesn't offer partial updates, and the old `loop.sh` is still copied into projects even though the CLI now handles loop logic internally. There's also no migration path from `eniem-cli` to `eni`.
**Impact:** Users must run multiple commands to bootstrap (`eniem ai init` + `bd onboard`). Updating Claude skills requires re-running init which overwrites customized prompts. Old projects have a stale `loop.sh` that conflicts with the new CLI.

## Scope

### Included
- `eni ai setup` — full bootstrap: sparse-clone `.eni/` + `.claude/`, create `specs/`, init beads
- `eni ai setup --update` — refresh `.claude/` only, preserve `.eni/PROMPT_*.md`
- `eni ai setup --force` — overwrite everything without confirmation
- Detection and cleanup of old `loop.sh` files
- Deprecation notice in final `eniem-cli` release pointing users to `eni`

### Excluded
- Changes to the loop engine (spec 1)
- New utility commands (spec 2)
- Changes to PROMPT file content
- Changes to beads itself
- Publishing the deprecation release (manual npm publish)

### Constraints
- Sparse-clone requires network access to `eniem-dev/eniem-boilerplate.git`
- Sparse-clone requires git SSH access (same as current `ai init`)
- `bd onboard` requires `bd` to be installed
- Must work on macOS and Linux

## User Stories

### Full Setup

- [ ] As a new user, I can run `eni ai setup` to bootstrap my project with AI workflow files and beads in one command
- [ ] As a user, I see what files were created and what was initialized so that I know what happened
- [ ] As a user, I am prompted for confirmation if `.eni/` already exists so that I don't accidentally overwrite my customized prompts

### Update Mode

- [ ] As a user, I can run `eni ai setup --update` to get the latest Claude skills and commands without losing my customized prompts
- [ ] As a user, I see what files were updated so that I know what changed

### Migration

- [ ] As an existing `eniem-cli` user, I see a deprecation notice when I run the old CLI so that I know to switch to `eni`
- [ ] As a user with an old `loop.sh` in `.eni/`, I am offered to clean it up during `eni ai setup`

## Business Rules

### Full Setup (default)

1. Check if `.eni/` exists in the current directory
2. If exists and no `--force`: prompt "This will overwrite existing files. Continue?" (default: No)
3. Sparse-clone `eniem-dev/eniem-boilerplate.git` (depth=1, main branch)
4. Sparse checkout: only `.eni/` and `.claude/` directories
5. Copy `.eni/` contents to project (exclude `loop.sh` if it exists in the boilerplate)
6. Copy `.claude/` contents to project
7. Create `specs/` with `.gitkeep` if `specs/` doesn't exist
8. Check if `bd` is installed:
   - If yes: run `bd onboard` if `.beads/` doesn't exist
   - If no: print warning "bd not found — install beads to use eni ai plan/build"
9. If old `loop.sh` found in `.eni/`: prompt "Remove old .eni/loop.sh? It's no longer needed." (default: Yes)
10. Clean up temp directory
11. Print summary of files created/updated

### Update Mode (`--update`)

1. Sparse-clone same as full setup
2. Only overwrite `.claude/` directory (settings, hooks, commands, skills)
3. Do NOT touch `.eni/PROMPT_plan.md` or `.eni/PROMPT_build.md`
4. Do NOT touch `.beads/` or `specs/`
5. If old `loop.sh` found: prompt to remove it
6. Clean up temp directory
7. Print summary of files updated

### Force Mode (`--force`)

- Skip all confirmation prompts
- Overwrite everything (full setup) or `.claude/` only (with `--update`)
- Auto-remove old `loop.sh` without asking

### loop.sh Cleanup

- During any setup run, check for `.eni/loop.sh`
- If found: inform user it's no longer needed (loop logic is now in the CLI)
- Prompt to delete (default Yes), or auto-delete with `--force`
- Also check for `.eni/check_beads.test.sh` (test file for loop.sh) and offer to remove

### Sparse Clone Details

- Repository: `eniem-dev/eniem-boilerplate.git`
- Branch: `main`
- Depth: 1
- Sparse checkout paths: `.eni/` and `.claude/`
- Git host: configurable via `--git-host` flag (default: `github.com`)
- Clone URL format: `git@{git-host}:eniem-dev/eniem-boilerplate.git`

### Deprecation Notice (old eniem-cli)

The final release of `eniem-cli` should:
- Print a deprecation banner on every command: "eniem-cli is deprecated. Install the new CLI: npm install -g eniem"
- `eniem-cli ai init` → "Use: eni ai setup"
- `eniem-cli <project>` → "Use: eni project <project>"
- `eniem-cli products` → "Use: eni products"
- Still execute the command after showing the notice (don't break existing users)

## Data Model

### Entities

**SetupResult**
| Property | Type | Description |
|----------|------|-------------|
| filesCreated | string[] | List of files/dirs created |
| filesUpdated | string[] | List of files/dirs overwritten |
| filesRemoved | string[] | List of files removed (loop.sh) |
| beadsInitialized | boolean | Whether bd onboard was run |
| warnings | string[] | Non-fatal issues encountered |

## UI/UX Specification

### eni ai setup — Full Setup Output

```
$ eni ai setup

Cloning AI workflow files from eniem-boilerplate...
  ✓ .eni/PROMPT_plan.md
  ✓ .eni/PROMPT_build.md
  ✓ .claude/settings.json
  ✓ .claude/hooks/inject-commit-context.sh
  ✓ .claude/commands/cleanup.md
  ✓ .claude/commands/fix-code-review.md
  ✓ .claude/skills/functional-spec-interview/SKILL.md
  ✓ .claude/skills/functional-spec-interview/references/spec-template.md
  ✓ specs/ (created)

Initializing beads...
  ✓ bd onboard

✓ Setup complete. Start with: eni ai plan
```

### eni ai setup — Existing Directory

```
$ eni ai setup

.eni/ already exists. This will overwrite existing files.
? Continue? (y/N) y

Cloning AI workflow files...
  ...

Old .eni/loop.sh found. This file is no longer needed.
? Remove it? (Y/n) y
  ✓ Removed .eni/loop.sh

✓ Setup complete.
```

### eni ai setup --update

```
$ eni ai setup --update

Updating Claude configuration...
  ✓ .claude/settings.json
  ✓ .claude/hooks/inject-commit-context.sh
  ✓ .claude/commands/cleanup.md
  ✓ .claude/commands/fix-code-review.md
  ✓ .claude/skills/functional-spec-interview/SKILL.md
  ↷ .eni/PROMPT_plan.md (preserved)
  ↷ .eni/PROMPT_build.md (preserved)

✓ Update complete. Claude skills and commands refreshed.
```

### Error Output

**No network:**
```
$ eni ai setup

✗ Failed to clone from eniem-boilerplate.

  Check your network connection and SSH access:
    ssh -T git@github.com

  If using a custom git host:
    eni ai setup --git-host=your-host.com
```

**bd not found:**
```
$ eni ai setup

Cloning AI workflow files...
  ✓ (all files)

⚠ bd (beads) not found — skipping beads initialization.
  Install beads to use eni ai plan/build.

✓ Setup complete (without beads).
```

### Deprecation Notice (old CLI)

```
$ eniem-cli my-app

╔══════════════════════════════════════════════════════════╗
║  eniem-cli is deprecated. Switch to the new CLI:        ║
║                                                         ║
║    npm install -g eniem                                  ║
║    eni project my-app                                   ║
╚══════════════════════════════════════════════════════════╝

(Running scaffold wizard...)
```

## Edge Cases

### Error Scenarios

| Scenario | Expected Behavior |
|----------|-------------------|
| No network | Clone fails, show SSH troubleshooting guidance |
| SSH key not configured | Clone fails, show `ssh -T git@github.com` suggestion |
| Git not installed | "git not found" error |
| `.eni/` exists, no `--force` | Prompt for confirmation |
| `.eni/` exists, with `--force` | Overwrite without asking |
| `bd` not installed | Warn, skip beads init, complete setup without it |
| `.beads/` already exists | Skip `bd onboard` (already initialized) |
| `specs/` already exists | Skip creating specs/ |
| Clone succeeds but copy fails (permissions) | Error with file path and permission details |
| Old `loop.sh` found | Prompt to remove (or auto-remove with --force) |
| Old `check_beads.test.sh` found | Remove alongside loop.sh |

### Boundary Conditions

| Condition | Expected Behavior |
|-----------|-------------------|
| Empty project (no files) | Create everything, no conflicts |
| Project with only `.claude/` | Create `.eni/`, skip `.claude/` overwrite prompt (it's managed) |
| Running setup twice | Second run prompts for confirmation, then overwrites |
| `--update` without prior setup | Error: ".eni/ not found. Run `eni ai setup` first" |
| `--update --force` | Update .claude/ without prompts |
| Boilerplate repo has no `.eni/` | Clone succeeds but nothing to copy — warn and exit |

## Acceptance Criteria

### Full Setup
- [ ] **Given** a project without `.eni/`, **when** I run `eni ai setup`, **then** `.eni/`, `.claude/`, and `specs/` are created from the boilerplate
- [ ] **Given** `bd` is installed and `.beads/` doesn't exist, **when** setup runs, **then** `bd onboard` is executed automatically
- [ ] **Given** `bd` is not installed, **when** setup runs, **then** I see a warning but setup completes successfully
- [ ] **Given** `.eni/` already exists, **when** I run `eni ai setup` without `--force`, **then** I am prompted for confirmation
- [ ] **Given** `.eni/` already exists, **when** I run `eni ai setup --force`, **then** files are overwritten without prompting

### Update Mode
- [ ] **Given** a project with `.eni/` and customized prompts, **when** I run `eni ai setup --update`, **then** `.claude/` is refreshed but `.eni/PROMPT_*.md` files are preserved
- [ ] **Given** no `.eni/` directory exists, **when** I run `eni ai setup --update`, **then** I see an error directing me to run full setup

### loop.sh Cleanup
- [ ] **Given** `.eni/loop.sh` exists, **when** I run `eni ai setup`, **then** I am prompted to remove it
- [ ] **Given** `.eni/loop.sh` exists, **when** I run `eni ai setup --force`, **then** it is removed automatically
- [ ] **Given** `.eni/check_beads.test.sh` exists alongside `loop.sh`, **when** cleanup runs, **then** both files are removed

### Deprecation
- [ ] **Given** the old `eniem-cli` is installed, **when** I run any command, **then** I see a deprecation notice with the new CLI install command
- [ ] **Given** the deprecation notice is shown, **when** the old command runs, **then** it still executes normally (not broken)

## Open Questions

- [ ] Should `eni ai setup` also create `AGENTS.md` from a template, or leave that to the user?
