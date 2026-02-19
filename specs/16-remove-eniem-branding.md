# Remove 'eniem' Branding from Generated Projects

> **SUPERSEDED** by [spec #50 — Replace Hardcoded 'eniem' References with Generic Placeholders](./50-replace-eniem-placeholders.md)
> This spec covered CLI-side replacement at scaffolding time. Spec #50 takes the approach of making the boilerplate source itself generic, with CLI adaptation tracked separately.

## Overview

When a customer runs `eni project <name>`, the CLI clones the boilerplate repo and walks the customer through configuration. After scaffolding completes, the project still contains hardcoded "eniem" branding throughout — in UI strings, config files, Docker setup, manifest, etc. The CLI should add a final post-scaffolding step that automatically detects and replaces all "eniem" variants with the customer's project name, so the generated project is fully rebranded out of the box.

## Problem Statement

**Who:** Customers who scaffold a new project with `eni project <name>`.
**Problem:** After scaffolding, they must manually hunt for "eniem"/"Eniem"/"ENIEM" across dozens of files before they can launch without leaking another company's branding.
**Impact:** Tedious setup, risk of shipping with eniem branding in production if occurrences are missed, poor first impression of the product.

## Scope

### Included

- New CLI post-scaffolding step: automated search-and-replace of "eniem" variants in the cloned project
- Three case-variant passes: `eniem` → lowercase, `Eniem` → Title Case, `ENIEM` → UPPERCASE
- Replacement of file **content** only (not file/directory names)
- Runs as the **final step** after `pnpm install` and git init

### Excluded

- **PoweredByBadge component** — intentional attribution, excluded from replacement
- **Documentation links** (`doc.eniem.dev`, `eniem.dev`) — useful references, excluded from replacement
- **CLI tool's own branding** — ASCII logo, error messages, internal CLI code unchanged
- **CLI `.env` generation** — project-name-based `.env` defaults are a separate issue
- **Boilerplate source changes** — the boilerplate repo itself stays as-is; branding is replaced at scaffolding time

### Constraints

- Must skip binary files (images, fonts, etc.)
- Must skip `node_modules/`, `.git/`, `pnpm-lock.yaml`
- Replacement must be deterministic and idempotent
- Must not corrupt file encodings

## User Stories

### Primary Flow

- [ ] As a customer, when I run `eni project my-saas`, after scaffolding completes my project contains "my-saas"/"My-Saas"/"MY-SAAS" instead of "eniem"/"Eniem"/"ENIEM" everywhere
- [ ] As a customer, the PoweredByBadge and documentation links still reference eniem.dev (intentional attribution)
- [ ] As a customer, I don't need to manually search-and-replace anything after scaffolding

## Business Rules

### Replacement Mapping

Three explicit passes, applied in order to avoid conflicts:

| Search | Replace (for project name `my-saas`) | Context |
|--------|---------------------------------------|---------|
| `ENIEM` | `MY-SAAS` | Manifest names, env var values, uppercase occurrences |
| `Eniem` | `My-Saas` | Title-case references in UI strings, comments |
| `eniem` | `my-saas` | Package names, config values, DB names, URLs, lowercase occurrences |

**Case conversion rules:**
- Lowercase: project name as-is (e.g., `my-saas`)
- Title Case: capitalize first letter of each segment separated by `-` (e.g., `My-Saas`)
- Uppercase: all caps, preserving hyphens (e.g., `MY-SAAS`)

### File Processing

- **Process:** All text files in the scaffolded project directory
- **Skip directories:** `node_modules/`, `.git/`
- **Skip files:** `pnpm-lock.yaml`, binary files (images, fonts, compiled assets)
- **Skip content patterns:**
  - `PoweredByBadge` component file (`src/components/powered-by-badge.tsx`)
  - Locale string for PoweredByBadge (the specific `"Powered by eniem.dev"` entry)
  - Links to `doc.eniem.dev` and `eniem.dev` documentation URLs

### Execution Timing

The replacement runs as the **final step** in the scaffolding flow, after:
1. Clone repo
2. Collect user config (OAuth, Polar, storage, analytics)
3. Generate `.env`
4. Reinitialize git
5. Run `pnpm install`
6. **→ Search-and-replace eniem branding ← (NEW STEP)**

### Pass Order

Passes must run in this order to prevent partial matches:
1. `ENIEM` → `UPPERCASE` (longest/most specific first)
2. `Eniem` → `Title-Case`
3. `eniem` → `lowercase`

## What Gets Replaced (Examples)

For a project named `my-saas`, here's what changes across key files:

| File | Before | After |
|------|--------|-------|
| `package.json` | `"@eniem/boilerplate"` | `"@my-saas/boilerplate"` |
| `.env.example` | `NEXT_PUBLIC_APP_NAME=eniem` | `NEXT_PUBLIC_APP_NAME=my-saas` |
| `.env.example` | `postgresql://eniem:eniem-dev-password@...` | `postgresql://my-saas:my-saas-dev-password@...` |
| `docker-compose.yml` | `POSTGRES_DB: eniem` | `POSTGRES_DB: my-saas` |
| `docker-compose.yml` | `container_name: eniem-postgres` | `container_name: my-saas-postgres` |
| `src/config/env.ts` | `\|\| "Eniem"` | `\|\| "My-Saas"` |
| `src/config/wagmi.ts` | `\|\| "Eniem"` | `\|\| "My-Saas"` |
| `public/manifest.json` | `"ENIEM - Web3 SaaS Boilerplate"` | `"MY-SAAS - Web3 SaaS Boilerplate"` |
| `public/manifest.json` | `"short_name": "ENIEM"` | `"short_name": "MY-SAAS"` |
| `public/manifest.json` | `"id": "eniem-web3-saas"` | `"id": "my-saas-web3-saas"` |
| Email footer | `"sent by Eniem"` | `"sent by My-Saas"` |
| SIWE prompt | `"to Eniem"` | `"to My-Saas"` |
| `README.md` | `Eniem Boilerplate` | `My-Saas Boilerplate` |

### What Stays Unchanged

| File/Pattern | Reason |
|-------------|--------|
| `src/components/powered-by-badge.tsx` | Intentional attribution |
| `"Powered by eniem.dev"` locale string | Intentional attribution |
| `href="https://doc.eniem.dev"` links | Documentation reference |
| `href="https://eniem.dev"` links | Documentation/attribution reference |
| `node_modules/` | Dependencies, not project code |
| `.git/` | Git internals |
| `pnpm-lock.yaml` | Auto-generated lockfile |

## Edge Cases

### Error Scenarios

| Scenario | Expected Behavior |
|----------|-------------------|
| Project name contains regex special chars (e.g., `my.app`) | Replacement still works — search strings are fixed ("eniem"), only replacement varies |
| File read/write fails (permissions) | Log warning, skip file, continue with rest |
| No occurrences found in a file | Skip silently, no unnecessary writes |

### Boundary Conditions

| Condition | Expected Behavior |
|-----------|-------------------|
| Project name is a single word (e.g., `acme`) | Title Case → `Acme`, Uppercase → `ACME` |
| Project name has multiple hyphens (e.g., `my-cool-app`) | Title Case → `My-Cool-App`, Uppercase → `MY-COOL-APP` |
| Project name has no hyphens (e.g., `mysaas`) | Title Case → `Mysaas`, Uppercase → `MYSAAS` |
| Binary file detected | Skip entirely, do not attempt replacement |
| Very large file | Process normally — boilerplate files are small |

## Acceptance Criteria

### Core Replacement

- [ ] **Given** a customer runs `eni project my-saas`, **when** scaffolding completes, **then** searching for "eniem" (case-insensitive) in the project finds zero matches outside exempt files
- [ ] **Given** a customer runs `eni project my-saas`, **when** scaffolding completes, **then** `package.json` contains `@my-saas/boilerplate`
- [ ] **Given** a customer runs `eni project my-saas`, **when** scaffolding completes, **then** `docker-compose.yml` uses `my-saas` for DB name/user
- [ ] **Given** a customer runs `eni project my-saas`, **when** scaffolding completes, **then** `manifest.json` contains `MY-SAAS` for PWA name

### Exclusions

- [ ] **Given** scaffolding completes, **when** checking `powered-by-badge.tsx`, **then** it still references `eniem.dev`
- [ ] **Given** scaffolding completes, **when** checking dashboard page, **then** doc.eniem.dev link is unchanged
- [ ] **Given** scaffolding completes, **when** checking `node_modules/`, **then** no files were modified

### Case Variants

- [ ] **Given** project name `my-saas`, **when** replacement runs, **then** `Eniem` becomes `My-Saas` and `ENIEM` becomes `MY-SAAS`
- [ ] **Given** project name `acme`, **when** replacement runs, **then** `Eniem` becomes `Acme` and `ENIEM` becomes `ACME`

### Robustness

- [ ] **Given** a file that contains no "eniem" references, **when** replacement runs, **then** the file is not modified (no unnecessary writes)
- [ ] **Given** a binary file (e.g., PNG), **when** replacement runs, **then** the file is skipped entirely

## Open Questions

- [ ] Should the CLI display a summary of replacements made (e.g., "Replaced 47 occurrences across 12 files")?
- [ ] Should `eniem-dev` (GitHub org references in clone URLs, etc.) also be replaced, or only the bare "eniem" brand name?
- [ ] Should `.env` (the generated env file, not `.env.example`) also be processed, or is that handled by the CLI's env generation step?
