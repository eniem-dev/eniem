# CLI App Name Prompt

## Overview

When a user runs `eniem-cli new [project-name]`, the CLI currently uses the project name but never asks for a human-readable application name. This feature adds an interactive prompt (and a `--app-name` flag) so users can set a proper display name (e.g., "Project Zero" instead of "project-zero") that gets written to `NEXT_PUBLIC_APP_NAME`.

## Problem Statement

**Who:** Developers using `eniem-cli` to scaffold new projects
**Problem:** The project name (slug) is used everywhere, but there's no way to specify a proper display name for the application during setup. Users must manually edit env files after scaffolding.
**Impact:** Extra manual step after every project creation; easy to forget, leading to apps displaying slug-style names in the UI.

## Scope

### Included
- Interactive prompt asking for the application name during `eniem-cli new`
- A suggested default derived from the project name (title-cased, hyphens/underscores to spaces)
- `--app-name` CLI flag to skip the prompt for non-interactive usage
- Writing the value to `NEXT_PUBLIC_APP_NAME` in the project's env file

### Excluded
- Updating other files (package.json, manifest.json, HTML title) with the app name — out of scope for v1
- Renaming or modifying the project name/slug behavior
- Retroactive updates for existing projects

### Constraints
- The prompt must be the first question asked during project setup
- The app name is required — the user cannot skip it with an empty input

## User Stories

### Primary Flow

- [ ] As a developer, I can be prompted for an application name when running `eniem-cli new [project-name]` so that my app has a proper display name from the start
- [ ] As a developer, I can accept the suggested default (derived from the project name) by pressing Enter so that I don't have to retype an obvious name
- [ ] As a developer, I can type a custom application name to override the suggestion so that I can name my app however I want

### Secondary Flows

- [ ] As a developer, I can pass `--app-name "My App"` to `eniem-cli new` so that I can script project creation without interactive prompts

## Business Rules

### Validation
- **app name**: Must be non-empty (no further validation — any non-empty string is accepted)

### Default Derivation
- The suggested default is derived from the project name by replacing hyphens and underscores with spaces and title-casing each word
- Examples:
  - `project-zero` → `Project Zero`
  - `my_cool_app` → `My Cool App`
  - `dashboard` → `Dashboard`

### Flag Behavior
- When `--app-name` is provided, the interactive prompt is skipped entirely
- The flag value is subject to the same validation (must be non-empty)

## Data Model

### Configuration Written

| Target | Key | Value |
|--------|-----|-------|
| `.env` (or equivalent) | `NEXT_PUBLIC_APP_NAME` | The user-provided or default-accepted application name |

## UI/UX Specification

### Screen: Terminal Prompt (Interactive)

**Entry point:** User runs `eniem-cli new [project-name]`

**Prompt display:**
```
? App name: (Project Zero) █
```

The suggested default appears in parentheses. The user can:
- Press Enter to accept the default
- Type a custom name and press Enter

**States:**

| State | Display |
|-------|---------|
| Prompt | `? App name: (Suggested Default) █` |
| Empty submission | Error message: app name is required. Re-prompt. |
| Accepted | Proceeds to next setup step |

### Screen: Non-Interactive (Flag)

**Entry point:** User runs `eniem-cli new [project-name] --app-name "My App"`

No prompt is shown. The provided value is used directly.

**Error state:** If `--app-name ""` (empty string) is passed, display an error and exit.

### Flow

```
eniem-cli new [project-name] → App name prompt (first) → rest of setup
eniem-cli new [project-name] --app-name "X" → skip prompt → rest of setup
```

## Edge Cases

### Error Scenarios

| Scenario | Expected Behavior |
|----------|-------------------|
| User submits empty input | Show error, re-prompt for app name |
| `--app-name ""` (empty flag) | Display error message and exit |
| `--app-name` flag without a value | Display error message and exit |

### Boundary Conditions

| Condition | Expected Behavior |
|-----------|-------------------|
| Project name is a single word (e.g., `dashboard`) | Default suggestion is title-cased: `Dashboard` |
| Project name has multiple hyphens (e.g., `my-cool-app`) | Default: `My Cool App` |
| Project name has underscores | Treated same as hyphens for default derivation |
| App name contains special characters | Accepted as-is (no validation beyond non-empty) |

## Acceptance Criteria

### Interactive prompt

- [ ] **Given** a user runs `eniem-cli new project-zero`, **when** the CLI starts setup, **then** the first prompt asks for the app name with "Project Zero" as the suggested default
- [ ] **Given** the app name prompt is displayed, **when** the user presses Enter without typing, **then** the suggested default "Project Zero" is used
- [ ] **Given** the app name prompt is displayed, **when** the user types "My Custom App" and presses Enter, **then** "My Custom App" is used
- [ ] **Given** the app name prompt is displayed, **when** the user submits an empty string, **then** an error is shown and the user is re-prompted
- [ ] **Given** a valid app name is provided, **when** setup completes, **then** `NEXT_PUBLIC_APP_NAME` is set to that value in the project env file

### Non-interactive flag

- [ ] **Given** a user runs `eniem-cli new project-zero --app-name "Zero Project"`, **when** the CLI starts setup, **then** no app name prompt is shown and "Zero Project" is used
- [ ] **Given** a user runs `eniem-cli new project-zero --app-name ""`, **when** the CLI validates input, **then** an error is displayed and the CLI exits

## Open Questions

None — all requirements are resolved.
