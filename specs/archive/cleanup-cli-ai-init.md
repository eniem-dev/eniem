# Cleanup CLI AI Init

## Overview

Clean up the `eni ai init` command to remove the deprecated `loop.sh` file from the boilerplate, add interactive CLI and verbose configuration during initialization, update the post-init message, and extend the config system to support a `verbose` boolean that auto-enables verbose logging for `plan` and `build` commands.

## Problem Statement

**Who:** Developers using `eni` to scaffold and run AI workflows
**Problem:** The `ai init` command still ships `loop.sh` (replaced by `eni plan`/`eni build`), doesn't configure which CLI adapter to use (forcing first-run prompts later), and doesn't set verbose preferences. The post-init message references the deprecated `loop.sh`.
**Impact:** Confusing onboarding — users see a dead script, then get prompted again for CLI selection on their first `eni plan` run. No way to persist verbose preference without passing `--verbose` every time.

## Scope

### Included

- Delete `loop.sh` from `apps/boilerplate/.eni/`
- Add CLI adapter selection (plan + build separately) to `eni ai init` flow
- Add verbose preference (boolean) to `eni ai init` flow
- Check if selected CLI binaries are installed; warn if not, but still save preference
- When re-running `ai init` on existing project, pre-select current config values
- Update post-init success message to reference `eni plan` / `eni build`
- Add `verbose` key to `.eni/config.json` schema
- `verbose: true` in config auto-enables verbose output for `plan` and `build` without `--verbose` flag
- `--verbose` CLI flag overrides config in both directions (flag always wins)
- Support `--no-verbose` flag to explicitly disable verbose even when config says `true`
- `eni config` interactive setup also asks for verbose preference
- `eni config set verbose true|false` support
- `eni config show` displays verbose value

### Excluded

- Changes to the plan/build iteration logic itself
- Adding new adapter types
- Changes to prompt templates
- Any changes to the wizard (main `eni` command)

### Constraints

- Must not break existing `.eni/config.json` files that lack a `verbose` key (default to `false`)
- CLI flag resolution priority: `--verbose`/`--no-verbose` flag > config file > default (`false`)

## User Stories

### Primary Flow

- [ ] As a developer, I can run `eni ai init` and choose my preferred CLI adapter for plan and build so that I don't get prompted again on first `eni plan` run
- [ ] As a developer, I can set verbose to true during `eni ai init` so that I always see tool usage details during plan and build
- [ ] As a developer, I can set `verbose: true` in config and run `eni plan` / `eni build` without `--verbose` and still see verbose output
- [ ] As a developer, I can override config verbose with `--verbose` or `--no-verbose` flags on any run

### Secondary Flows

- [ ] As a developer, I can re-run `eni ai init` on an existing project and see my current CLI/verbose preferences pre-selected
- [ ] As a developer, I can run `eni config set verbose true` to enable verbose without re-running ai init
- [ ] As a developer, I can run `eni config show` to see the current verbose setting alongside plan/build CLI choices
- [ ] As a developer, I can run `eni config` (interactive) to set verbose preference alongside CLI choices

## Business Rules

### Config Schema

- `verbose` key in `.eni/config.json` accepts boolean values only (`true` or `false`)
- Missing `verbose` key in existing configs defaults to `false`
- Config validation rejects non-boolean values for `verbose`

### CLI Flag Resolution (Verbose)

- `--verbose` flag explicitly passed → verbose is `true` (regardless of config)
- `--no-verbose` flag explicitly passed → verbose is `false` (regardless of config)
- Neither flag passed → read `verbose` from config, default to `false` if missing

### CLI Flag Resolution (Adapter — existing, unchanged)

- `--cli` flag → use that adapter (source: "flag")
- No flag → read config for command key → fallback to "claude"

### Binary Check During ai init

- After user selects a CLI adapter, check if the binary is installed
- If NOT installed: show a warning message but still save the preference
- Do not block the user from selecting an uninstalled CLI

### Validation

- `verbose` in config: must be boolean (`true` or `false`)
- `eni config set verbose <value>`: accepts `true` or `false` as strings, converts to boolean
- Invalid values (e.g., `eni config set verbose maybe`) → error message

## Data Model

### Entity: EniConfig (updated)

| Property | Type | Description |
|----------|------|-------------|
| plan | CLIId? | CLI adapter for plan command ("claude", "codex", "gemini", "opencode") |
| build | CLIId? | CLI adapter for build command |
| verbose | boolean? | Enable verbose logging for plan and build (default: false) |

### Example Config

```json
{
  "plan": "claude",
  "build": "claude",
  "verbose": true
}
```

### Backwards Compatibility

Existing config files without `verbose` key remain valid. The system treats missing `verbose` as `false`.

## UI/UX Specification

### Screen: AI Init — CLI Selection (new step, after file copy)

**Entry point:** Automatically shown after files are copied to project

**Layout:**
- Plan CLI selection: Select dropdown with options (claude, codex, gemini, opencode)
- Build CLI selection: Select dropdown with same options
- Verbose preference: Yes/No confirm prompt
- Per-selection binary check: inline warning if binary not found

**States:**

| State | Display |
|-------|---------|
| Selecting plan CLI | "Select CLI for planning:" with dropdown |
| Plan CLI not installed | Yellow warning: "⚠ {cli} is not installed. You can install it later." |
| Selecting build CLI | "Select CLI for building:" with dropdown |
| Build CLI not installed | Yellow warning: "⚠ {cli} is not installed. You can install it later." |
| Verbose prompt | "Enable verbose logging? (shows tool usage during plan/build)" Yes/No |
| Saving | Spinner: "Saving configuration..." |

**Pre-selection (re-run on existing project):**
When config already exists, pre-select current values:
- Plan dropdown: highlight current `config.plan` value
- Build dropdown: highlight current `config.build` value
- Verbose confirm: default to current `config.verbose` value

### Screen: AI Init — Success Message (updated)

**Current message:**
```
Created specs/ folder for feature specs

Run ./loop.sh plan to start planning with AI
```

**New message:**
```
AI workflow initialized.
Config saved to .eni/config.json

Open your CLI and run the /functional-spec-interview to start creating specifications.
Run `eni plan` to start planning with AI
Run `eni build` to start building from a spec
```

### Screen: Config Interactive (updated)

**Existing flow:** Plan CLI → Build CLI → Save
**New flow:** Plan CLI → Build CLI → Verbose (Yes/No) → Save

### Screen: Config Show (updated)

**Current output:**
```
plan: claude
build: claude
```

**New output:**
```
plan: claude
build: claude
verbose: true
```

(Shows `verbose: false` when not set or explicitly false)

### Screen: Config Set — Verbose

**Command:** `eni config set verbose true` or `eni config set verbose false`

**Success:** "Updated verbose to true" / "Updated verbose to false"
**Error:** "Invalid value for verbose: must be true or false"

### Navigation Flow (AI Init)

```
checking → confirm_update (if .eni exists) → cloning → copying → select_plan_cli → select_build_cli → select_verbose → saving_config → complete
```

## Edge Cases

### Error Scenarios

| Scenario | Expected Behavior |
|----------|-------------------|
| `eni config set verbose maybe` | Error: "Invalid value for verbose: must be true or false" |
| Config has `verbose: "yes"` (string) | Validation error with helpful message |
| Config has `verbose: 1` (number) | Validation error with helpful message |
| Binary not installed at init time | Warning shown, preference saved anyway |
| `--verbose` and `--no-verbose` both passed | `--no-verbose` wins (explicit disable takes precedence) |

### Boundary Conditions

| Condition | Expected Behavior |
|-----------|-------------------|
| No config file exists | verbose defaults to `false` |
| Config exists but no `verbose` key | verbose defaults to `false` |
| Config has only `verbose`, no plan/build | Valid — plan/build default to "claude" |
| `ai init` interrupted after clone but before config save | Files copied but no config — next `eni plan` triggers first-run setup |

## Acceptance Criteria

### Delete loop.sh

- [ ] **Given** `apps/boilerplate/.eni/loop.sh` exists, **when** the change is applied, **then** `loop.sh` is removed from the boilerplate
- [ ] **Given** `eni ai init` runs, **when** files are copied, **then** no `loop.sh` is included

### AI Init CLI Selection

- [ ] **Given** user runs `eni ai init` on a new project, **when** files are copied, **then** user is prompted to select plan CLI, build CLI, and verbose preference
- [ ] **Given** user selects a CLI that is not installed, **when** selection is confirmed, **then** a yellow warning appears but the preference is still saved
- [ ] **Given** user runs `eni ai init` on a project with existing config, **when** CLI selection appears, **then** current values are pre-selected
- [ ] **Given** user completes `eni ai init`, **when** success is shown, **then** `.eni/config.json` contains plan, build, and verbose keys

### Updated Post-Init Message

- [ ] **Given** `eni ai init` completes, **when** success message is shown, **then** it says "AI workflow initialized. Config saved to .eni/config.json" followed by spec interview instruction and `eni plan`/`eni build` commands
- [ ] **Given** `eni ai init` completes, **when** success message is shown, **then** no reference to `loop.sh` appears

### Verbose Config

- [ ] **Given** `verbose: true` in config, **when** user runs `eni plan` without `--verbose`, **then** verbose output is enabled
- [ ] **Given** `verbose: true` in config, **when** user runs `eni plan --no-verbose`, **then** verbose output is disabled
- [ ] **Given** `verbose: false` in config, **when** user runs `eni plan --verbose`, **then** verbose output is enabled
- [ ] **Given** no `verbose` key in config, **when** user runs `eni plan`, **then** verbose defaults to `false`
- [ ] **Given** user runs `eni config set verbose true`, **when** config is read, **then** `verbose` is `true`
- [ ] **Given** user runs `eni config set verbose false`, **when** config is read, **then** `verbose` is `false`
- [ ] **Given** user runs `eni config show`, **when** output is displayed, **then** verbose value is included
- [ ] **Given** user runs `eni config` (interactive), **when** setup completes, **then** verbose preference is saved alongside CLI choices

## Open Questions

- [ ] None — all requirements clarified during interview
