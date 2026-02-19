# Replace 'myapp' Placeholders with Customer Project Name at Scaffolding Time

> Depends on [spec #50 — Replace Hardcoded 'eniem' References with Generic Placeholders](./50-replace-eniem-placeholders.md) being completed first.
> Depends on [cli-app-name-prompt spec](./cli-app-name-prompt.md) for the app name input.
> GitHub issue: [eniem-dev/eniem#16](https://github.com/eniem-dev/eniem/issues/16)

## Overview

After spec #50, the boilerplate uses `myapp`/`MyApp` as generic placeholders everywhere. The CLI needs a post-scaffolding step that replaces these placeholders with the customer's actual values: `myapp` → **project name slug** (CLI argument) and `MyApp` → **application display name** (collected via the [app name prompt](./cli-app-name-prompt.md) or `--app-name` flag), so the generated project is fully branded out of the box.

## Problem Statement

**Who:** Customers who scaffold a new project with `eni project <name>`.
**Problem:** After cloning, the boilerplate contains `myapp`/`MyApp` placeholders that need to be replaced with the customer's project slug and application display name.
**Impact:** Without this step, the customer must manually run a sed command or hunt-and-replace before launching.

## Scope

### Included

- New CLI post-scaffolding step: search-and-replace `myapp`/`MyApp` with customer's values
- Two passes: `myapp` → project slug, `MyApp` → app display name (two independent inputs)
- Replacement of file **content** only (not file/directory names)
- Runs as the **final step** after `pnpm install` and git init

### Excluded

- **Boilerplate source changes** — handled by spec #50
- **CLI tool's own branding** — ASCII logo, error messages, internal CLI code unchanged
- **PoweredByBadge / attribution** — already excluded in spec #50, no `myapp` present in those files

### Constraints

- Must skip binary files (images, fonts, etc.)
- Must skip `node_modules/`, `.git/`, `pnpm-lock.yaml`
- Replacement must be deterministic and idempotent
- Must not corrupt file encodings

## User Stories

### Primary Flow

- [ ] As a customer, when I run `eni project my-saas` and provide app name `My SaaS`, after scaffolding completes my project contains `my-saas` and `My SaaS` instead of `myapp`/`MyApp` everywhere
- [ ] As a customer, I don't need to manually search-and-replace anything after scaffolding

## Business Rules

### Replacement Mapping

Two passes using two independent inputs, applied in order:

| Search | Replace | Source | Example (slug `my-saas`, app name `My SaaS`) |
|--------|---------|--------|-----------------------------------------------|
| `MyApp` | Application display name | Interactive prompt or `--app-name` flag | `My SaaS` |
| `myapp` | Project name slug | CLI argument | `my-saas` |

**Pass order:** `MyApp` first (longer/more specific), then `myapp` to avoid partial matches.

**Note:** The app name is collected via the [app name prompt](./cli-app-name-prompt.md). The default suggestion is derived from the project slug (title-cased, hyphens → spaces), but the user can type any custom name.

### File Processing

- **Process:** All text files in the scaffolded project directory
- **Skip directories:** `node_modules/`, `.git/`
- **Skip files:** `pnpm-lock.yaml`, binary files (images, fonts, compiled assets)
- No content-pattern exclusions needed — spec #50 already ensures `myapp` only appears where replacement is desired

### Execution Timing

The replacement runs as the **final step** in the scaffolding flow, after:
1. Clone repo
2. Collect user config (OAuth, Polar, storage, analytics)
3. Generate `.env`
4. Reinitialize git
5. Run `pnpm install`
6. **→ Search-and-replace myapp/MyApp placeholders ← (NEW STEP)**

## What Gets Replaced (Examples)

For project slug `my-saas` with app name `My SaaS`:

| File | Before | After |
|------|--------|-------|
| `.env.example` | `NEXT_PUBLIC_APP_NAME=MyApp` | `NEXT_PUBLIC_APP_NAME=My SaaS` |
| `.env.example` | `postgresql://myapp:myapp-dev-password@...` | `postgresql://my-saas:my-saas-dev-password@...` |
| `docker-compose.yml` | `POSTGRES_DB: myapp` | `POSTGRES_DB: my-saas` |
| `docker-compose.yml` | `container_name: myapp-postgres` | `container_name: my-saas-postgres` |
| `src/config/env.ts` | `\|\| "MyApp"` | `\|\| "My SaaS"` |
| `public/manifest.json` | `"name": "MyApp - SaaS Boilerplate"` | `"name": "My SaaS - SaaS Boilerplate"` |
| `public/manifest.json` | `"short_name": "MyApp"` | `"short_name": "My SaaS"` |
| Email footer | `"sent by MyApp"` | `"sent by My SaaS"` |

## Edge Cases

### Error Scenarios

| Scenario | Expected Behavior |
|----------|-------------------|
| Project name contains regex special chars (e.g., `my.app`) | Search strings are fixed (`myapp`/`MyApp`), only replacement varies — still works |
| File read/write fails (permissions) | Log warning, skip file, continue with rest |
| No occurrences found in a file | Skip silently, no unnecessary writes |

### Boundary Conditions

| Condition | Expected Behavior |
|-----------|-------------------|
| App name contains special characters (e.g., `My SaaS!`) | Accepted as-is (validation is non-empty only, per cli-app-name-prompt spec) |
| App name equals the slug (e.g., slug `acme`, app name `acme`) | Works fine — both passes replace correctly |
| App name contains spaces | Replaced as-is — spaces are valid in display contexts |
| Binary file detected | Skip entirely |

## Acceptance Criteria

### Core Replacement

- [ ] **Given** a customer runs `eni project my-saas` with app name `My SaaS`, **when** scaffolding completes, **then** `grep -ri "myapp"` finds zero matches in the project
- [ ] **Given** a customer runs `eni project my-saas` with app name `My SaaS`, **when** scaffolding completes, **then** `grep -ri "my-saas\|My SaaS"` matches in all expected files

### Two Independent Values

- [ ] **Given** slug `my-saas` and app name `My SaaS`, **when** replacement runs, **then** `MyApp` becomes `My SaaS` and `myapp` becomes `my-saas`
- [ ] **Given** slug `acme` and app name `Acme Platform`, **when** replacement runs, **then** `MyApp` becomes `Acme Platform` and `myapp` becomes `acme`

### Robustness

- [ ] **Given** a file with no `myapp` references, **when** replacement runs, **then** the file is not modified
- [ ] **Given** a binary file (e.g., PNG), **when** replacement runs, **then** it is skipped entirely

## Open Questions

- [ ] Should the CLI display a summary of replacements made (e.g., "Replaced 22 occurrences across 9 files")?
- [ ] Should `.env` (the generated env file, not `.env.example`) also be processed, or is that handled by the CLI's env generation step?
