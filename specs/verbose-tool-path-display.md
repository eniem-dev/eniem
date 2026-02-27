# Verbose Tool Path Display Fix

## Overview

When running `eni plan` or `eni build` with `--verbose`, tool activity lines like `[tool] read` should display the file path (e.g., `[tool] read: /src/index.ts`). This works correctly with the Claude adapter but is broken for other adapters. The `toolInputSummary` function that extracts detail from tool events needs to handle each adapter's actual event format, and should be extracted from its current duplicated state into a shared module.

## Problem Statement

**Who:** Developers using eni CLI with non-Claude adapters (opencode, gemini, codex)
**Problem:** In verbose mode, `[tool] read` (and potentially other tools) shows no file path, making it impossible to follow what the AI is doing. Claude shows `[tool] Read: /src/index.ts` but opencode shows just `[tool] read`.
**Impact:** Verbose mode loses its primary value — understanding what the AI agent is doing in real-time. Users can't tell which files are being read/edited, making debugging and oversight difficult.

## Scope

### Included

- Fix opencode adapter: read tool events must surface file path in verbose output
- Audit and fix gemini adapter for same class of issue (read tool path display)
- Fix codex adapter: `file_change` events show no path; `mcp_tool_call` events have nested args unreachable by `toolInputSummary`
- Extract `toolInputSummary` from plan.tsx and build.tsx into a shared module
- Update existing tests to match real CLI event formats where test mocks are wrong

### Excluded

- Non-verbose mode (stays as-is: tool name only)
- Adding new tool types to `toolInputSummary` beyond what adapters currently emit
- Changing the display format (still `[tool] name: detail`)

### Constraints

- Must not break existing Claude adapter behavior (already works correctly)
- Changes are code-analysis-based; verify against real CLI JSON output where possible
- `toolInputSummary` must remain a pure function (name + input → string)

## User Stories

### Primary Flow

- [ ] As a developer using opencode adapter, I can see file paths in verbose tool output (e.g., `[tool] read: /src/index.ts`) so that I can follow what files the AI is reading/editing
- [ ] As a developer using codex adapter, I can see file paths for file_change events so that I know which files were modified
- [ ] As a developer using any adapter, I get the same level of verbose detail as the Claude adapter

### Secondary Flows

- [ ] As a developer, I benefit from `toolInputSummary` being defined once (not duplicated) so that future tool name/key additions apply everywhere

## Business Rules

### Tool Name Normalization

`toolInputSummary` normalizes tool names: lowercase + strip underscores. So `read_file` → `readfile`, `Read` → `read`, `list_directory` → `listdirectory`. This is correct and should be preserved.

### Input Key Resolution

The function tries multiple key names per tool type (e.g., `file_path` then `path` for read). This must be extended to cover keys used by all adapters' actual JSON event formats.

### Adapter Event Formats

Each CLI emits different JSON structures. The adapter layer normalizes them into `onToolUse(name: string, input: Record<string, unknown>)`. The fix may be in the adapter (restructure the input before passing) or in `toolInputSummary` (accept more key names), or both.

**Claude (reference — works correctly):**
```json
{ "type": "tool_use", "name": "Read", "input": { "file_path": "/src/index.ts" } }
```
→ `onToolUse("Read", { file_path: "/src/index.ts" })`

**OpenCode (broken for read):**
```json
{ "type": "tool_use", "part": { "tool": "read", "state": { "input": { ??? } } } }
```
→ `onToolUse("read", { ??? })` — the input object doesn't contain `file_path` or `path` as expected. Test mock assumed `{ path: "/src/index.ts" }` but real output differs.

**Gemini (unverified for read):**
```json
{ "type": "tool_use", "tool_name": "list_directory", "parameters": { "dir_path": "/src" } }
```
→ Works for `list_directory`. Read tool format unknown — needs verification.

**Codex (two issues):**
1. `file_change` → name normalizes to `"filechange"` which has no rule in `toolInputSummary`. Input has `file_path` but it's never extracted.
2. `mcp_tool_call` → args are nested inside `args: {}` object. `toolInputSummary` looks at top-level keys only, so `args.path` is unreachable.

## Data Model

### toolInputSummary Interface

**Input:**
| Property | Type | Description |
|----------|------|-------------|
| name | string | Tool name as reported by the adapter (e.g., "read", "read_file", "bash") |
| input | Record<string, unknown> | Tool input parameters, key names vary by adapter |

**Output:** string — the detail to display after the tool name (file path, command, pattern, etc.). Empty string if no relevant detail found.

### Current Matching Rules

| Normalized Name | Keys Checked | Used By |
|-----------------|-------------|---------|
| read, readfile, edit, write | file_path, path | All adapters |
| bash, shell | command | Claude, codex (command_execution) |
| glob, listdirectory | pattern, dir_path, path | All adapters |
| grep, search | pattern, query | All adapters |
| task | description | Claude |
| webfetch | url | Claude |
| websearch | query | Claude |

### Missing Rules

| Normalized Name | Adapter | Should Extract |
|-----------------|---------|----------------|
| filechange | Codex | file_path (from input) |

## Edge Cases

### Error Scenarios

| Scenario | Expected Behavior |
|----------|-------------------|
| Adapter sends empty input object | Display `[tool] name` with no detail (current behavior, correct) |
| Adapter sends unknown tool name | Display `[tool] name` with no detail (current behavior, correct) |
| Input key exists but value is not a string | Skip that key, try next (current behavior via `typeof` check) |

### Boundary Conditions

| Condition | Expected Behavior |
|-----------|-------------------|
| Tool name with mixed case and underscores (e.g., "Read_File") | Normalize correctly to "readfile" and match |
| Very long file path | Display full path (no truncation for paths; only bash commands truncate at 80 chars) |
| Nested input (e.g., codex mcp_tool_call `args: {}`) | Flatten or restructure in adapter before passing to toolInputSummary |

## Acceptance Criteria

### OpenCode read tool shows path

- [ ] **Given** opencode adapter in verbose mode, **when** a read tool event is emitted, **then** output shows `[tool] read: /path/to/file`
- [ ] **Given** the test mock for opencode read, **when** the test runs, **then** it uses the correct real event format (not the assumed one)

### Codex file_change shows path

- [ ] **Given** codex adapter in verbose mode, **when** a file_change event is emitted, **then** output shows `[tool] file_change: /path/to/file`
- [ ] **Given** toolInputSummary receives name "file_change", **when** input contains `file_path`, **then** it returns the file path

### Codex mcp_tool_call shows detail

- [ ] **Given** codex adapter in verbose mode, **when** an mcp_tool_call with read_file is emitted, **then** output shows `[tool] read_file: /path/to/file`
- [ ] **Given** mcp_tool_call has args nested in `args: {}`, **when** adapter processes the event, **then** args are flattened or extracted before passing to onToolUse

### Gemini read tool verified

- [ ] **Given** gemini adapter, **when** a read tool event is emitted, **then** it is verified that the parameter key matches what toolInputSummary expects
- [ ] **Given** any mismatch is found, **then** it is fixed (in adapter or toolInputSummary)

### Shared module extraction

- [ ] **Given** toolInputSummary exists in both plan.tsx and build.tsx, **when** refactored, **then** it lives in a single shared file imported by both commands
- [ ] **Given** the shared module, **when** a new tool name is added, **then** it only needs to be added in one place

### No regression on Claude

- [ ] **Given** Claude adapter in verbose mode, **when** tool events are emitted, **then** behavior is identical to before the change

## Open Questions

- [ ] What are the exact keys in opencode's real JSON output for a read tool event? The current test mock uses `{ path: "/src/index.ts" }` but this doesn't match observed behavior. Need to capture real `opencode run --format json` output to confirm.
- [ ] What tool name and parameter keys does gemini use for file reading? The test only covers `list_directory`. Need to capture real `gemini -p --output-format stream-json` output to confirm.
- [ ] For codex `mcp_tool_call`: should the adapter flatten `args` into the top-level input, or should `toolInputSummary` be taught to look inside `args`? Flattening in the adapter is cleaner (keeps toolInputSummary simple).
