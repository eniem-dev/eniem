# Multi-CLI Adapter Support

## Overview

Add support for multiple AI coding CLIs (Claude, Codex, Gemini, OpenCode) to the `eni` CLI tool. Users can configure which CLI to use as the default for `plan` and `build` commands via a config file, override it at runtime with a `--cli` flag, and manage their preferences through an `eni config` command. An abstraction layer normalizes the different CLIs into a unified interface so plan/build commands work identically regardless of backend.

## Problem Statement

**Who:** Developers using the `eni` CLI for AI-assisted planning and building
**Problem:** The CLI is hardcoded to use Claude Code as the only AI backend. Users who prefer or need to use other AI CLIs (Codex, Gemini, OpenCode) cannot use `eni plan` or `eni build` at all.
**Impact:** Limits adoption to Claude Code users only. Teams with mixed CLI preferences or those evaluating alternatives are locked out. Adding CLI flexibility increases eni's value as a workflow tool independent of any single AI provider.

## Scope

### Included

- Configuration file (`.eni/config.json`) to set default CLI per command (plan, build)
- `--cli <name>` flag on `plan` and `build` commands to override the configured default
- Adapter abstraction layer: a common interface that all CLI adapters implement
- Four built-in adapters: Claude, Codex, Gemini, OpenCode
- `eni config` command: interactive picker (no args) + non-interactive subcommands (`set`, `show`)
- First-run prompt: if no config exists, interactively ask user to choose defaults and create config
- Missing binary fallback: if configured CLI is not on PATH, prompt user to pick from available CLIs
- CLI indicator: always display which CLI is being used at the start of plan/build commands
- Sentinel-based completion detection (`:::ENI_DONE:::`) for all CLIs — this is prompt-level, not CLI-specific

### Excluded

- Custom/third-party adapter registration (future phase)
- Auth checks or env var validation — users must be logged into their CLI beforehand
- Per-CLI model selection (e.g., choosing which model Codex or Gemini uses)
- Changes to prompt files (`.eni/PROMPT_plan.md`, `.eni/PROMPT_build.md`) — they work as-is
- Changes to sentinel detection logic — the `:::ENI_DONE:::` approach stays unchanged

### Constraints

- Must be backward-compatible: existing projects without `.eni/config.json` continue to work (defaulting to Claude after first-run prompt)
- Each adapter is fully self-contained: builds its own CLI args, parses its own streaming JSON output, emits normalized events
- All four CLIs must support headless/non-interactive mode with streaming JSON output

## User Stories

### Primary Flow

- [ ] As a developer, I can run `eni plan` and have it use my configured default CLI so that I don't have to specify it every time
- [ ] As a developer, I can run `eni build --cli codex` to override my default and use Codex for this session so that I can try different CLIs without changing my config
- [ ] As a developer, I can run `eni config` to interactively choose my default plan and build CLIs so that I can set up my preferences easily
- [ ] As a developer, I can run `eni config show` to see my current CLI configuration so that I know what defaults are active

### Secondary Flows

- [ ] As a developer running `eni plan` for the first time (no config file), I am prompted to choose my default CLIs so that the config file is created automatically
- [ ] As a developer whose configured CLI binary is missing, I am shown a picker of available CLIs so that I can continue working without editing config manually
- [ ] As a developer, I can run `eni config set plan gemini` to change my default plan CLI non-interactively so that I can script my setup

## Business Rules

### CLI Resolution Order

1. `--cli <name>` flag (highest priority — runtime override)
2. `.eni/config.json` value for the command (`plan` or `build`)
3. If no config file exists → trigger first-run interactive prompt, create config, then proceed
4. If config file exists but key is missing → default to `claude`

### CLI Validation

- On resolution, check that the selected CLI binary exists on PATH using `which` / `command -v`
- If the binary is not found, show an interactive picker listing only CLIs whose binaries are available
- If no CLIs are available, exit with an error and list install instructions for all supported CLIs

### Supported CLI Identifiers

| Identifier | Binary | Headless invocation |
|---|---|---|
| `claude` | `claude` | `claude --dangerously-skip-permissions -p --verbose --output-format stream-json` (prompt via stdin) |
| `codex` | `codex` | `codex exec <prompt>` with `--json --yolo` (prompt as positional arg) |
| `gemini` | `gemini` | `gemini -p <prompt> --output-format stream-json --yolo` (prompt via `-p` flag) |
| `opencode` | `opencode` | `opencode run <prompt> --format json -q` (prompt as positional arg) |

### Config File Rules

- Location: `.eni/config.json` (per-project, committed to git)
- Created automatically on first run if it doesn't exist
- Only contains CLI selection — no auth, no model config
- Valid CLI values: `"claude"`, `"codex"`, `"gemini"`, `"opencode"`
- Invalid CLI names produce an error listing valid options

## Data Model

### Config File Schema

**`.eni/config.json`**
| Property | Type | Description |
|----------|------|-------------|
| plan | string | Default CLI identifier for the `plan` command |
| build | string | Default CLI identifier for the `build` command |

Example:
```json
{
  "plan": "claude",
  "build": "claude"
}
```

### Adapter Interface

**CLIAdapter** (the contract each adapter implements)

| Method/Property | Type | Description |
|---|---|---|
| name | string | Human-readable name (e.g., "Claude Code") |
| id | string | Identifier used in config (e.g., "claude") |
| binary | string | Binary name to check on PATH (e.g., "claude") |
| run(prompt, options) | CLIRunner | Launches the subprocess and returns a runner handle |

**RunOptions** (passed to `run()`)

| Property | Type | Description |
|---|---|---|
| onText | (text: string) => void | Callback for text output chunks |
| onToolUse | (name: string, input: Record<string, unknown>) => void | Callback for tool-use events |
| cwd | string? | Working directory for the subprocess |
| args | string[]? | Additional CLI-specific arguments |

**CLIRunner** (returned by `run()`)

| Property | Type | Description |
|---|---|---|
| result | Promise\<CLIResult\> | Resolves when the subprocess exits |
| kill | () => void | Sends SIGTERM to the subprocess |

**CLIResult** (resolved by `result`)

| Property | Type | Description |
|---|---|---|
| exitCode | number | Process exit code |
| sentinelDetected | boolean | Whether `:::ENI_DONE:::` was found in output |

### Event Normalization

Each adapter parses its CLI's native JSON stream format and maps events to the unified callbacks:

| Source CLI | Text event | Tool-use event | Completion signal |
|---|---|---|---|
| Claude | `assistant` → content `type: "text"` | `assistant` → content `type: "tool_use"` | Sentinel in last text block |
| Codex | `item.agent_message` | `item.command`, `item.file_change`, `item.mcp_tool_call` | Sentinel in last text block |
| Gemini | `message` event | `tool_use` event | Sentinel in last text block |
| OpenCode | `type: "text"` → `part.text` | `type: "tool_use"` → `part.tool`, `part.state.input` | Sentinel in last text block |

## UI/UX Specification

### Screen: First-Run Prompt (no config file)

**Entry point:** User runs `eni plan` or `eni build` and `.eni/config.json` does not exist

**Layout:**
- Header: "No CLI configuration found. Let's set up your defaults."
- Select component: "Default CLI for plan:" → list of 4 CLIs (only those installed are selectable)
- Select component: "Default CLI for build:" → list of 4 CLIs
- Confirmation: "Saved to .eni/config.json"
- Then proceeds to run the original command

**States:**
| State | Display |
|-------|---------|
| No CLIs installed | Error: "No supported CLI found. Install one of: claude, codex, gemini, opencode" with install links |
| One CLI installed | Auto-select it, confirm with user |
| Multiple installed | Show picker with all installed options |

### Screen: eni config (interactive, no args)

**Entry point:** `eni config`

**Layout:**
- Select: "Default CLI for plan:" with 4 options (grayed out if not installed)
- Select: "Default CLI for build:" with 4 options
- Summary: shows the two selections
- Saves to `.eni/config.json`

### Screen: eni config show

**Entry point:** `eni config show`

**Layout:**
- Non-interactive text output:
  ```
  CLI Configuration (.eni/config.json):
    plan:  claude
    build: codex
  ```
- If no config file: "No configuration found. Run 'eni config' to set up."

### Screen: eni config set

**Entry point:** `eni config set <command> <cli>`

**Examples:**
- `eni config set plan gemini`
- `eni config set build opencode`

**Behavior:**
- Validates command is `plan` or `build`
- Validates CLI is one of: `claude`, `codex`, `gemini`, `opencode`
- Updates `.eni/config.json` (creates if missing)
- Prints confirmation: "Set plan CLI to gemini"

### Screen: Missing Binary Fallback

**Entry point:** Configured or flag-specified CLI binary is not on PATH

**Layout:**
- Warning: "codex binary not found on PATH"
- Select: "Choose an available CLI:" → list of installed CLIs
- Proceeds with the selected CLI (does not update config)

### CLI Indicator (plan/build commands)

At the start of every plan/build run, display:
```
Using claude for plan (iteration 1/3)
```
or when overridden:
```
Using codex for build (--cli override) (iteration 1/10)
```

### Navigation Flow

```
eni plan (no config) → First-Run Prompt → save config → run plan
eni plan (with config) → resolve CLI → CLI indicator → run plan
eni plan --cli codex → override → CLI indicator → run plan
eni config → interactive picker → save config
eni config show → display config
eni config set plan gemini → update config
```

## Edge Cases

### Error Scenarios

| Scenario | Expected Behavior |
|----------|-------------------|
| CLI binary not found | Show interactive picker of available CLIs |
| No CLIs installed at all | Error with install instructions for all 4 CLIs |
| Invalid CLI name in config | Error: "'foo' is not a valid CLI. Valid options: claude, codex, gemini, opencode" |
| Invalid CLI name in --cli flag | Same error as above |
| .eni/ directory doesn't exist | Create it when saving config (config command or first-run prompt) |
| Config file has invalid JSON | Error: "Invalid .eni/config.json — fix or delete it and run 'eni config'" |
| CLI subprocess crashes mid-stream | Treated as non-zero exit, same error handling as current Claude runner |
| CLI produces unexpected JSON format | Adapter logs a warning and skips the unparseable line; continues processing |

### Boundary Conditions

| Condition | Expected Behavior |
|-----------|-------------------|
| --cli flag with same value as config | Works normally, no special behavior |
| Config has plan key but no build key | Missing key defaults to "claude" |
| Empty config file `{}` | Both plan and build default to "claude" |
| eni config set with missing args | Error: "Usage: eni config set <plan\|build> <claude\|codex\|gemini\|opencode>" |

## Acceptance Criteria

### Config File

- [ ] **Given** no `.eni/config.json` exists, **when** user runs `eni plan`, **then** an interactive prompt asks for plan and build CLI defaults and creates `.eni/config.json`
- [ ] **Given** `.eni/config.json` exists with `{ "plan": "codex", "build": "gemini" }`, **when** user runs `eni plan`, **then** the plan command uses Codex
- [ ] **Given** `.eni/config.json` exists with `{ "plan": "codex" }`, **when** user runs `eni build`, **then** build defaults to Claude (missing key fallback)

### --cli Flag Override

- [ ] **Given** config says `plan: "claude"`, **when** user runs `eni plan --cli gemini`, **then** Gemini is used instead of Claude
- [ ] **Given** user runs `eni build --cli invalidname`, **then** an error lists valid CLI names

### Adapter Abstraction

- [ ] **Given** the Claude adapter, **when** `run()` is called with a prompt, **then** it invokes `claude --dangerously-skip-permissions -p --verbose --output-format stream-json` with the prompt on stdin
- [ ] **Given** the Codex adapter, **when** `run()` is called with a prompt, **then** it invokes `codex exec <prompt> --json --yolo`
- [ ] **Given** the Gemini adapter, **when** `run()` is called with a prompt, **then** it invokes `gemini -p <prompt> --output-format stream-json --yolo`
- [ ] **Given** the OpenCode adapter, **when** `run()` is called with a prompt, **then** it invokes `opencode run <prompt> --format json -q`
- [ ] **Given** any adapter, **when** the subprocess emits text, **then** the `onText` callback fires with the normalized text
- [ ] **Given** any adapter, **when** the subprocess emits a tool-use event, **then** the `onToolUse` callback fires with the tool name and input
- [ ] **Given** any adapter, **when** the subprocess exits, **then** `result` resolves with `exitCode` and `sentinelDetected`

### eni config Command

- [ ] **Given** user runs `eni config` with no args, **then** an interactive picker lets them choose plan and build defaults
- [ ] **Given** user runs `eni config show`, **then** the current config is displayed as text
- [ ] **Given** user runs `eni config set plan gemini`, **then** the plan key in `.eni/config.json` is updated to "gemini"
- [ ] **Given** user runs `eni config set build opencode`, **then** the build key is updated to "opencode"
- [ ] **Given** `.eni/config.json` does not exist, **when** user runs `eni config set plan codex`, **then** the file is created with `{ "plan": "codex" }`

### Missing Binary Handling

- [ ] **Given** config says `build: "codex"` but `codex` is not on PATH, **when** user runs `eni build`, **then** a picker shows available CLIs
- [ ] **Given** no supported CLI is installed, **when** user runs any command, **then** an error lists install instructions for all 4 CLIs

### CLI Indicator

- [ ] **Given** any plan/build run, **then** the first line of output shows "Using <cli-name> for <command>"
- [ ] **Given** `--cli` flag is used, **then** the indicator includes "(--cli override)"

## Resolved Questions

1. **Prompt size limits** — Not an issue. Shell ARG_MAX is 2 MB; current prompts are ~8 KB (250x under the limit). Positional args are safe.
2. **Codex elicitation cancellation** — Not an issue. Prompts instruct the agent what to do; agents should not ask for clarification. Sentinel is emitted on task completion.
3. **OpenCode event schema** — Fully documented from source (`sst/opencode`, `packages/opencode/src/cli/cmd/run.ts`). Six event types: `text` (→ onText via `part.text`), `tool_use` (→ onToolUse via `part.tool` + `part.state.input`), `step_start`, `step_finish`, `reasoning`, `error`. Process exits when internal `session.status` reaches `idle`.
