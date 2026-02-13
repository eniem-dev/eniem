# Check Beads Installed

## Overview
Add a `check_beads` safety-net function to `.eni/loop.sh` that verifies `bd` (beads) is both installed and initialized before running `plan` or `build` commands. Prevents confusing downstream errors when the beads CLI is missing or the repo hasn't been initialized.

## Job to Be Done
When a developer runs `./loop.sh plan` or `./loop.sh build` without beads installed or initialized, they get cryptic errors from `bd ready` or other bd commands deep in the script. A clear, early error message with install instructions saves debugging time.

## Target User
Eniem developers and AI agents using the loop.sh workflow.

## Requirements

### Must Have
- [ ] Add `check_beads()` function to `.eni/loop.sh` that checks:
  1. `bd` command is available (`command -v bd`)
  2. `.beads/` directory exists in the project root (beads initialized)
- [ ] Call `check_beads` before `check_requirements` in both `plan` and `build` commands
- [ ] If `bd` not installed: print error with install instruction (`eniem ai init`), exit 1
- [ ] If `.beads/` not found: print error suggesting `eniem ai init`, exit 1
- [ ] Apply the same change to both `.eni/loop.sh` (root) and `apps/boilerplate/.eni/loop.sh`

### Nice to Have
- [ ] Include a secondary fallback install method in the error message (e.g., `npm install -g @beads/bd`)

## Constraints
- No interactive prompts — just check and fail fast
- Must not change any other behavior of loop.sh
- Must work on both Linux and macOS

## Acceptance Criteria
- [ ] Running `./loop.sh plan <name>` without bd installed shows clear error and exits 1
- [ ] Running `./loop.sh build` without bd installed shows clear error and exits 1
- [ ] Running `./loop.sh plan <name>` with bd installed but no `.beads/` dir shows init error and exits 1
- [ ] Running `./loop.sh build` with bd installed but no `.beads/` dir shows init error and exits 1
- [ ] When bd is installed and initialized, behavior is unchanged
- [ ] Both root and boilerplate loop.sh files are updated
- [ ] `./loop.sh help` still works without bd installed (check only runs for plan/build)

## Edge Cases
- bd is installed but not on PATH: treated as "not installed" — user sees install message
- `.beads/` exists but bd is broken: passes check_beads, bd's own errors will surface later
- Running `./loop.sh help` or `./loop.sh --help`: should NOT check for bd (no bd dependency for help)

## Out of Scope
- Actually installing bd from loop.sh
- Checking bd version compatibility
- Checking if the beads daemon is running
- Modifying the `eniem ai init` command itself

## Technical Hints
- **Files to modify**: `.eni/loop.sh` (root), `apps/boilerplate/.eni/loop.sh`
- **Patterns to follow**: Existing `check_requirements()` function at line 115 of loop.sh
- **Insertion point**: Define `check_beads()` near `check_requirements()`, call it before `check_requirements` in both `plan)` and `build)` case blocks
- **Project root variable**: `$PROJECT_ROOT` is already defined and points to the correct directory

## Verification Commands

| Criterion | Command |
|-----------|---------|
| check_beads function exists in root loop.sh | `grep -q "check_beads" .eni/loop.sh && echo pass` |
| check_beads function exists in boilerplate loop.sh | `grep -q "check_beads" apps/boilerplate/.eni/loop.sh && echo pass` |
| check_beads called before check_requirements in plan | `grep -A1 "check_beads" .eni/loop.sh \| grep -q "check_requirements" && echo pass` |
| Help works without bd | `bash .eni/loop.sh help && echo pass` |
| bd check uses command -v | `grep -q 'command -v bd' .eni/loop.sh && echo pass` |
| .beads check uses -d | `grep -q '! -d.*\.beads' .eni/loop.sh && echo pass` |

## Test Requirements
- [ ] Test: `check_beads` function is defined in both loop.sh files
- [ ] Test: `check_beads` is called before `check_requirements` in plan command
- [ ] Test: `check_beads` is called before `check_requirements` in build command
- [ ] Test: Error message references `eniem ai init` when bd is not found
- [ ] Test: Error message references `eniem ai init` when .beads/ is missing
- [ ] Test: Help command does not trigger check_beads

## Post-Completion

- [ ] Close GitHub issue: https://github.com/eniem-dev/eniem/issues/9
- [ ] PR description includes: Closes #9
