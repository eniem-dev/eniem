# Multi-CLI Config Setup

## Overview

The eniem boilerplate and CLI should provide first-class support for all three AI coding CLIs: Claude Code, OpenCode, and Codex. The boilerplate ships with pre-configured settings, skills, commands, and hooks for each CLI. The `eni ai init` command manages which CLI configs exist in a project — setting up selected CLIs and offering to remove unselected ones, with smart merge behavior on re-initialization.

## Problem Statement

**Who:** Developers using the eniem boilerplate with different AI coding CLIs
**Problem:** The boilerplate only ships with Claude Code configuration (`.claude/`). Developers using OpenCode or Codex must manually set up their CLI's project config, losing the curated skills, commands, hooks, and settings that Claude Code users get out of the box.
**Impact:** OpenCode and Codex users have a degraded experience — no pre-configured permissions, no functional-spec-interview skill, no code-review commands, no startup hooks. This creates a two-tier experience that undermines the CLI-agnostic design of the `eni` tool.

## Scope

### Included

- **Boilerplate ships all 3 CLI configs:** `.claude/`, `.opencode/`, `.codex/`, `.agents/` (Codex skills) folders pre-configured
- **AGENTS.md becomes primary:** Reverse the current symlink — AGENTS.md is the source of truth, CLAUDE.md symlinks to it
- **Skills parity:** Port existing skills (functional-spec-interview, etc.) to OpenCode and Codex formats
- **Commands parity:** Port existing slash commands (fix-code-review, etc.) to each CLI's format
- **Hooks parity:** Port existing startup hooks to each CLI's equivalent (plugins for OpenCode, notify for Codex where possible)
- **Settings parity:** Mirror Claude's permission/domain settings in each CLI's config format (opencode.json, .codex/config.toml)
- **`ai init` folder management:** New interactive step to select which CLIs to set up, with removal of unselected CLI configs
- **Config persistence:** Persist selected CLIs in `.eni/config.json`
- **Re-initialization support:** Restore deleted CLI configs via sparse clone with merge behavior
- **Root file cleanup:** Remove associated root-level files (e.g. `opencode.json`) when removing a CLI
- **Docs updates:** Update the docs site with setup instructions covering all 3 CLIs

### Excluded

- Gemini CLI support (being removed per existing spec)
- Custom theme porting for OpenCode (`.opencode/themes/`)
- Custom agents for OpenCode (`.opencode/agents/`) — beyond scope for v1
- Custom modes for OpenCode (`.opencode/modes/`) — beyond scope for v1
- Custom tools for OpenCode/Codex — beyond scope for v1
- Changes to the adapter system or plan/build command behavior
- MCP server configuration parity

### Constraints

- Each CLI's config must follow that CLI's conventions exactly (no custom folder structures)
- The sparse clone approach for `ai init` requires network access (no offline fallback in this version)
- Skills must be manually adapted to each CLI's format — there's no automatic transpilation

## User Stories

### Primary Flow

- [ ] As a developer, I can clone the boilerplate and immediately use any of the three AI CLIs (Claude Code, OpenCode, Codex) with pre-configured settings, skills, and commands
- [ ] As a developer, I can run `eni ai init` and select which CLIs I use, so that only relevant config folders remain in my project
- [ ] As a developer, I can re-run `eni ai init` after deleting a CLI's config folder, and have it restored from the boilerplate template

### Secondary Flows

- [ ] As a developer, I can see which CLIs are installed on my system during the `ai init` selection step
- [ ] As a developer, I can select multiple CLIs during `ai init` if I use more than one
- [ ] As a developer, I can decline to remove an unselected CLI's config folder if I want to keep it for later
- [ ] As a developer, I can re-run `ai init` and my custom additions to CLI config folders are preserved (merge, not overwrite)

## Business Rules

### CLI Config Folder Mapping

Each CLI has specific folders and files that belong to it:

| CLI | Config folder | Root files | Skills location |
|-----|--------------|------------|-----------------|
| Claude Code | `.claude/` | — | `.claude/skills/` |
| OpenCode | `.opencode/` | `opencode.json` | `.opencode/skills/` |
| Codex | `.codex/` | — | `.agents/skills/` |

### Shared Resources (never removed)

- `AGENTS.md` — custom instructions file (primary, used by all 3 CLIs)
- `CLAUDE.md` — symlink to AGENTS.md (kept for backwards compatibility)
- `.eni/` — eniem config and prompt templates (CLI-agnostic)
- `specs/` — specification files (CLI-agnostic)

### CLI Selection Rules

- User may select one or more CLIs during `ai init`
- Selected CLIs are persisted in `.eni/config.json` under a `clis` key
- On re-run, previously selected CLIs are pre-selected
- Plan/build CLI selection still happens separately (after CLI setup selection)
- Plan/build CLI options show ALL available/installed CLIs, not filtered to selected ones

### Folder Removal Rules

- Only folders belonging to **unselected** CLIs are candidates for removal
- Each unselected CLI's files are listed before asking for confirmation
- Confirmation is per-CLI (not a single yes/no for all)
- If user declines removal, the folder stays — no further prompting
- Root files associated with a CLI (e.g. `opencode.json`) are included in removal

### Merge Behavior (Re-initialization)

- When restoring a CLI config via sparse clone, use **additive merge**:
  - Files that don't exist locally → added from template
  - Files that exist locally → **not overwritten** (user customizations preserved)
- This applies to all files within the CLI's config folder and root files

### Binary Detection

- During CLI selection, each option shows install status: `(installed)` or `(not found)`
- Uninstalled CLIs can still be selected (user may install later)
- Detection uses the existing `checkBinary()` from the adapter registry

## Data Model

### Config Entity: `.eni/config.json`

| Property | Type | Description |
|----------|------|-------------|
| clis | string[] | Selected CLI identifiers, e.g. `["claude", "opencode"]` |
| plan | string | CLI identifier for plan command |
| build | string | CLI identifier for build command |
| verbose | boolean | Verbose output preference |
| narration | string | Narration style: "concise" or "explicit" |

### CLI Config Inventory

**Claude Code (`.claude/`)**
| Path | Purpose |
|------|---------|
| `.claude/settings.json` | Permissions, allowed domains, hooks |
| `.claude/commands/fix-code-review.md` | Code review slash command |
| `.claude/hooks/inject-commit-context.sh` | Startup hook: git context |
| `.claude/hooks/inject-tree-context.sh` | Startup hook: directory tree |
| `.claude/skills/functional-spec-interview/` | Spec interview skill |

**OpenCode (`.opencode/` + `opencode.json`)**
| Path | Purpose |
|------|---------|
| `opencode.json` | Provider settings, tool permissions, MCP config |
| `.opencode/commands/fix-code-review.md` | Code review slash command |
| `.opencode/plugins/inject-commit-context.js` | Startup plugin: git context |
| `.opencode/plugins/inject-tree-context.js` | Startup plugin: directory tree |
| `.opencode/skills/functional-spec-interview/SKILL.md` | Spec interview skill |

**Codex (`.codex/` + `.agents/`)**
| Path | Purpose |
|------|---------|
| `.codex/config.toml` | Model settings, permissions, MCP config |
| `.agents/skills/fix-code-review/SKILL.md` | Code review skill (Codex has no slash commands — uses skills) |
| `.agents/skills/functional-spec-interview/SKILL.md` | Spec interview skill |

Note: Codex has no general-purpose hooks system (only notification hooks), so startup hooks cannot be fully ported. Document this limitation.

## UI/UX Specification

### Screen: `eni ai init` — CLI Selection Step (NEW)

**Entry point:** Runs as the **first interactive step** after initial checks (before plan/build selection)

**Layout:**
- Header: "Which AI CLIs do you use?"
- Multi-select list with checkboxes for each CLI
- Each option shows CLI name and install status
- Pre-selects CLIs from existing `config.json` if re-running

**Display:**
```
Which AI CLIs do you use? (space to toggle, enter to confirm)

  ◉ Claude Code (installed)
  ◯ OpenCode (not found)
  ◯ Codex (installed)
```

**States:**

| State | Display |
|-------|---------|
| Fresh init | All CLIs unchecked, install status shown |
| Re-init with config | Previously selected CLIs pre-checked |
| No CLIs installed | All show "(not found)" — still selectable |

### Screen: `eni ai init` — Folder Removal Confirmation (NEW)

**Entry point:** After CLI selection, if unselected CLIs have existing config folders

**Layout:**
- One confirmation prompt per unselected CLI that has files present
- Lists all files/folders that will be removed
- Yes/No choice

**Display:**
```
You didn't select OpenCode. Remove its config files?

  Will remove:
    .opencode/ (5 files)
    opencode.json

  ◯ Yes, remove
  ◯ No, keep
```

**States:**

| State | Display |
|-------|---------|
| CLI has files | Show removal prompt with file listing |
| CLI has no files | Skip — no prompt needed |
| User declines | Files kept, continue to next CLI |

### Screen: `eni ai init` — Folder Restoration (EXISTING, MODIFIED)

**Entry point:** After CLI selection, if selected CLIs are missing config folders

**Layout:**
- Info message showing which configs will be restored
- Proceeds automatically (no confirmation needed — user just selected these CLIs)

**Display:**
```
Setting up config for Claude Code...
  ✓ Added .claude/settings.json
  ✓ Added .claude/commands/fix-code-review.md
  ✓ Added .claude/skills/functional-spec-interview/
  ⊘ Skipped .claude/hooks/inject-commit-context.sh (already exists)

Setting up config for Codex...
  ✓ Added .codex/config.toml
  ✓ Added .agents/skills/functional-spec-interview/
```

### Navigation Flow

```
eni ai init
  → Check if .eni/ exists (existing behavior)
  → CLI Selection (multi-select: which CLIs do you use?)
  → Folder Removal (per unselected CLI with existing files)
  → Folder Restoration (for selected CLIs with missing files)
  → Plan CLI selection (existing behavior)
  → Build CLI selection (existing behavior)
  → Verbose preference (existing behavior)
  → Narration style (existing behavior)
  → Save config & show success
```

## Edge Cases

### Error Scenarios

| Scenario | Expected Behavior |
|----------|-------------------|
| Network failure during sparse clone | Show error: "Could not fetch boilerplate config. Check your connection and retry." Abort init. |
| No CLIs selected | Show warning: "No CLIs selected. Your project won't have AI CLI configuration." Proceed with plan/build selection (they can still pick CLIs for eni commands). |
| Selected CLI binary not installed | Show warning after selection: "⚠ opencode binary not found. You can still set up config and install it later." Continue normally. |
| .agents/ folder exists but Codex not selected for removal | If user had Codex and deselects it but declines removal, .agents/ stays. No issue — it's inert without Codex. |
| Sparse clone returns different files than expected | Only copy files that match known CLI config paths. Ignore unexpected files. |
| Permission denied on file deletion | Show error for that specific file, continue with remaining files. |

### Boundary Conditions

| Condition | Expected Behavior |
|-----------|-------------------|
| All 3 CLIs selected | No removal prompts. All configs set up/verified. |
| No CLI configs exist yet (fresh project) | Only set up selected CLIs. No removal prompts. |
| User customized a skill that the template also provides | Merge behavior: existing file preserved, not overwritten. |
| `.agents/` folder has user-created skills alongside boilerplate ones | Only remove `.agents/skills/` entries that came from the boilerplate. Keep user-created skills. (Or: only remove the entire folder if user confirms.) |
| Re-run after manual deletion of config.json | CLI selection shows all unchecked. User re-selects. |
| CLAUDE.md exists but AGENTS.md doesn't (legacy project) | Create AGENTS.md with CLAUDE.md content, replace CLAUDE.md with symlink to AGENTS.md. |

## Acceptance Criteria

### CLI Selection during ai init

- [ ] **Given** a fresh project, **when** running `eni ai init`, **then** a multi-select CLI picker appears as the first interactive step
- [ ] **Given** an existing `.eni/config.json` with `"clis": ["claude"]`, **when** re-running `ai init`, **then** Claude Code is pre-selected in the picker
- [ ] **Given** Claude and OpenCode binaries installed, **when** CLI picker renders, **then** both show "(installed)" and Codex shows "(not found)"

### Folder Management

- [ ] **Given** user selects only Claude, **and** `.opencode/` exists, **when** folder management runs, **then** user is prompted with a file listing to confirm removal of `.opencode/` and `opencode.json`
- [ ] **Given** user declines removal of `.opencode/`, **when** init completes, **then** `.opencode/` and `opencode.json` are still present
- [ ] **Given** user confirms removal, **when** removal runs, **then** all listed files are deleted and success is shown

### Folder Restoration

- [ ] **Given** user selects Claude but `.claude/` doesn't exist, **when** restoration runs, **then** `.claude/` is populated from the boilerplate via sparse clone
- [ ] **Given** user has custom files in `.claude/skills/my-custom-skill/`, **when** restoration runs, **then** custom skill is preserved and only missing boilerplate files are added
- [ ] **Given** user selects Codex, **when** restoration runs, **then** both `.codex/` and `.agents/skills/` are set up

### Config Persistence

- [ ] **Given** user selects Claude and OpenCode, **when** init completes, **then** `.eni/config.json` contains `"clis": ["claude", "opencode"]`

### AGENTS.md as Primary

- [ ] **Given** a fresh boilerplate clone, **then** `AGENTS.md` is the real file and `CLAUDE.md` is a symlink pointing to it
- [ ] **Given** a legacy project with CLAUDE.md as primary, **when** running `ai init`, **then** AGENTS.md is created from CLAUDE.md content and CLAUDE.md becomes a symlink

### Skills Parity

- [ ] **Given** the boilerplate, **then** functional-spec-interview skill exists in `.claude/skills/`, `.opencode/skills/`, and `.agents/skills/`
- [ ] **Given** the boilerplate, **then** fix-code-review exists as a command in `.claude/commands/`, `.opencode/commands/`, and as a skill in `.agents/skills/`

### Hooks/Plugins Parity

- [ ] **Given** the boilerplate, **then** startup hooks exist in `.claude/hooks/` and equivalent plugins exist in `.opencode/plugins/`
- [ ] **Given** Codex's lack of general hooks, **then** this limitation is documented and Codex config does not include non-functional hooks

### Settings Parity

- [ ] **Given** the boilerplate, **then** `opencode.json` mirrors `.claude/settings.json` permissions and allowed domains in OpenCode's format
- [ ] **Given** the boilerplate, **then** `.codex/config.toml` mirrors equivalent settings in Codex's format

### Documentation

- [ ] **Given** the docs site, **then** setup instructions cover all 3 CLIs with their respective config structures
- [ ] **Given** the docs site, **then** differences between CLIs (e.g. Codex hook limitations) are clearly documented
