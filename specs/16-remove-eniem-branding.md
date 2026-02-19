# Replace 'myapp' Placeholders with Customer Project Name at Scaffolding Time

> Depends on [spec #50 — Replace Hardcoded 'eniem' References with Generic Placeholders](./50-replace-eniem-placeholders.md) being completed first.
> GitHub issue: [eniem-dev/eniem#16](https://github.com/eniem-dev/eniem/issues/16)

## Overview

After spec #50, the boilerplate uses `myapp`/`MyApp` as generic placeholders everywhere. The CLI needs a post-scaffolding step that replaces these placeholders with the customer's actual project name, so the generated project is fully branded out of the box.

## Problem Statement

**Who:** Customers who scaffold a new project with `eni project <name>`.
**Problem:** After cloning, the boilerplate contains `myapp`/`MyApp` placeholders that need to be replaced with the customer's project name.
**Impact:** Without this step, the customer must manually run a sed command or hunt-and-replace before launching.

## Scope

### Included

- New CLI post-scaffolding step: search-and-replace `myapp`/`MyApp` with customer's project name
- Two case-variant passes: `myapp` → lowercase, `MyApp` → Title Case
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

- [ ] As a customer, when I run `eni project my-saas`, after scaffolding completes my project contains `my-saas`/`My-Saas` instead of `myapp`/`MyApp` everywhere
- [ ] As a customer, I don't need to manually search-and-replace anything after scaffolding

## Business Rules

### Replacement Mapping

Two passes, applied in order:

| Search | Replace (for project name `my-saas`) | Context |
|--------|---------------------------------------|---------|
| `MyApp` | `My-Saas` | Title-case: display names, UI strings, env fallbacks |
| `myapp` | `my-saas` | Lowercase: DB names, Docker, config values, domains, slugs |

**Case conversion rules:**
- Lowercase: project name as-is (e.g., `my-saas`)
- Title Case: capitalize first letter of each segment separated by `-` (e.g., `My-Saas`)

**Pass order:** `MyApp` first (longer/more specific), then `myapp` to avoid partial matches.

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

For a project named `my-saas`:

| File | Before | After |
|------|--------|-------|
| `.env.example` | `NEXT_PUBLIC_APP_NAME=MyApp` | `NEXT_PUBLIC_APP_NAME=My-Saas` |
| `.env.example` | `postgresql://myapp:myapp-dev-password@...` | `postgresql://my-saas:my-saas-dev-password@...` |
| `docker-compose.yml` | `POSTGRES_DB: myapp` | `POSTGRES_DB: my-saas` |
| `docker-compose.yml` | `container_name: myapp-postgres` | `container_name: my-saas-postgres` |
| `src/config/env.ts` | `\|\| "MyApp"` | `\|\| "My-Saas"` |
| `public/manifest.json` | `"name": "MyApp - SaaS Boilerplate"` | `"name": "My-Saas - SaaS Boilerplate"` |
| `public/manifest.json` | `"short_name": "MyApp"` | `"short_name": "My-Saas"` |
| Email footer | `"sent by MyApp"` | `"sent by My-Saas"` |

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
| Project name is a single word (e.g., `acme`) | Title Case → `Acme` |
| Project name has multiple hyphens (e.g., `my-cool-app`) | Title Case → `My-Cool-App` |
| Project name has no hyphens (e.g., `mysaas`) | Title Case → `Mysaas` |
| Binary file detected | Skip entirely |

## Acceptance Criteria

### Core Replacement

- [ ] **Given** a customer runs `eni project my-saas`, **when** scaffolding completes, **then** `grep -ri "myapp"` finds zero matches in the project
- [ ] **Given** a customer runs `eni project my-saas`, **when** scaffolding completes, **then** `grep -ri "my-saas\|My-Saas"` matches in all expected files

### Case Variants

- [ ] **Given** project name `my-saas`, **when** replacement runs, **then** `MyApp` becomes `My-Saas` and `myapp` becomes `my-saas`
- [ ] **Given** project name `acme`, **when** replacement runs, **then** `MyApp` becomes `Acme` and `myapp` becomes `acme`

### Robustness

- [ ] **Given** a file with no `myapp` references, **when** replacement runs, **then** the file is not modified
- [ ] **Given** a binary file (e.g., PNG), **when** replacement runs, **then** it is skipped entirely

## Open Questions

- [ ] Should the CLI display a summary of replacements made (e.g., "Replaced 22 occurrences across 9 files")?
- [ ] Should `.env` (the generated env file, not `.env.example`) also be processed, or is that handled by the CLI's env generation step?
