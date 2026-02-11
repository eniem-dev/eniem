# Set Up AI Workflow for Monorepo

## Overview
Configure two versions of the `.eni/` AI workflow: a monorepo-aware version at root and a standalone version in `apps/boilerplate/` for customers. Move specs to root level and remove the docs-specific workflow.

## Job to Be Done
Enable the eni AI workflow (plan/build loop) to work across all packages in the monorepo, while ensuring customers still get a working standalone AI workflow in their boilerplate.

## Requirements

### Must Have
- [ ] Root `.eni/PROMPT_plan.md` updated for monorepo context (reference `apps/boilerplate/`, `packages/cli/`, `apps/docs/`, turborepo commands)
- [ ] Root `.eni/PROMPT_build.md` updated for monorepo context (turborepo build/lint/test commands, monorepo paths)
- [ ] `apps/boilerplate/.eni/` keeps original standalone prompts (unchanged, for customer sync)
- [ ] Keep `eni:*` scripts in `apps/boilerplate/package.json` (customers use these)
- [ ] Move `apps/boilerplate/specs/` to root `specs/` (if any specs exist post-migration)
- [ ] Delete `apps/docs/loop.sh`
- [ ] Remove `ralph:*` scripts from `apps/docs/package.json` (ralph:plan, ralph:plan-work, ralph:build, ralph:build:auto)
- [ ] Verify `pnpm eni:plan` works from monorepo root

## Constraints
- Root `.eni/loop.sh` is already copied and working (done in Part 1 setup)
- Root `eni:*` scripts already in root `package.json` (done in Part 1 setup)
- Do NOT modify `apps/boilerplate/.eni/` prompts — they must stay standalone
- `specs/` at root can contain specs targeting any package

## Acceptance Criteria
- [ ] `pnpm eni:plan <spec-name>` works from monorepo root
- [ ] Root prompts reference monorepo structure and turborepo commands
- [ ] `apps/boilerplate/.eni/` prompts are unchanged (standalone)
- [ ] No `loop.sh` in `apps/docs/`
- [ ] No `ralph:*` scripts in `apps/docs/package.json`
- [ ] `specs/` directory exists at root level

## Edge Cases
- If boilerplate `specs/` has active specs during migration, move them to root and update any boilerplate-specific paths in them

## Out of Scope
- Modifying `loop.sh` behavior (it works as-is)
- Beads configuration (already set up)

## Technical Hints
- **Root prompts to update**:
  - `.eni/PROMPT_plan.md` — update path references, verify commands
  - `.eni/PROMPT_build.md` — update build commands to use `pnpm turbo build`, update verify commands
- **Files to delete**:
  - `apps/docs/loop.sh`
- **Files to modify**:
  - `apps/docs/package.json` — remove ralph:plan, ralph:plan-work, ralph:build, ralph:build:auto scripts
- **Current docs ralph scripts**: `"ralph:plan": "./loop.sh plan"`, `"ralph:build": "./loop.sh build"`, etc.

## Test Requirements
- [ ] Test: `pnpm eni:plan --help` or dry run works
- [ ] Test: `apps/boilerplate/.eni/PROMPT_plan.md` is unchanged from original
- [ ] Test: `apps/docs/package.json` has no ralph scripts
