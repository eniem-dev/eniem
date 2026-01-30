# AI Init

## Overview

`eniem ai init` command to initialize or update the ENI AI workflow in any project. This command fetches AI configuration files (`.eni`, `.claude`, `specs/`) from the eniem boilerplate via sparse clone and installs them in the current project.

## Job to Be Done

Allow developers to quickly set up the ENI AI workflow (autonomous loop, prompts, Claude commands) in any project, and keep these files up to date with the latest boilerplate versions.

## Target User

Developers using Claude Code who want to benefit from the ENI AI workflow (loop.sh, planning/build prompts, slash commands) in their projects.

## Requirements

### Must Have

- [ ] Detect if `.eni` already exists in current project
- [ ] If `.eni` exists: ask for confirmation before updating (update mode)
- [ ] If `.eni` doesn't exist: initialize directly (init mode)
- [ ] Sparse clone of eniem-boilerplate repo (only `.eni`, `.claude`)
- [ ] Copy complete `.eni` folder (loop.sh, PROMPT_*.md)
- [ ] Copy complete `.claude` folder (settings.local.json, commands/)
- [ ] Create `specs/` folder with `.gitkeep` if it doesn't exist
- [ ] Never touch the project's CLAUDE.md
- [ ] Display success message with list of copied files

### Nice to Have

- [ ] `--force` flag to skip confirmation in update mode

## Constraints

- Works in any directory (no need to be an Eniem project)
- No network or permission error handling (keep it simple)
- Sparse clone from GitHub (no full boilerplate clone)

## Acceptance Criteria

- [ ] `eniem ai init` in a new project creates `.eni/`, `.claude/`, `specs/`
- [ ] `eniem ai init` in a project with `.eni` asks for confirmation before overwriting
- [ ] Copied files are identical to boilerplate files
- [ ] `specs/` folder contains at least `.gitkeep`
- [ ] Project's CLAUDE.md is never modified
- [ ] Success message displayed at the end

## Edge Cases

- Project without `.eni`: direct init mode, no confirmation needed
- Project with existing `.eni`: ask confirmation, then fully replace
- `specs/` folder already exists: don't touch content, keep existing specs
- No network connection: let the error bubble up naturally

## Out of Scope

- Smart merge of files (we replace everything)
- Network/permission error handling
- CLAUDE.md modification
- Support for sources other than GitHub boilerplate

## Technical Hints

- **Files to modify**:
  - `src/cli.tsx` - Add routing for "ai" command
- **Files to create**:
  - `src/commands/ai.tsx` - Main command component
  - `src/lib/ai-init.ts` - Utilities for sparse clone and copy
- **Patterns to follow**:
  - See `src/commands/products.tsx` for command structure
  - See `src/lib/clone.ts` for git operations with execa
  - Use `Spinner`, `Confirm`, `StatusMessage` components
- **Dependencies**: No new dependencies required (execa already present)

## Verification Commands

| Check | Command |
|-------|---------|
| Command accessible | `node bin/eniem-cli.js ai init --help` |
| Init new project | `cd /tmp/test && node /path/to/bin/eniem-cli.js ai init && ls -la .eni .claude specs` |
| Files present | `test -f .eni/loop.sh && test -f .eni/PROMPT_build.md && test -f .eni/PROMPT_plan.md` |
| Claude commands | `test -d .claude/commands && ls .claude/commands` |
| Specs gitkeep | `test -f specs/.gitkeep` |

## Test Requirements

- [ ] Test: `ai init` command creates expected folders in empty project
- [ ] Test: `ai init` command asks for confirmation if `.eni` exists
- [ ] Test: Copied files match boilerplate
- [ ] Test: Existing `specs/` is not emptied (preserves specs)
- [ ] Test: CLAUDE.md is never created/modified
