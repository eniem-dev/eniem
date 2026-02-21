# CLI Rename: `eniem-cli` → `eni`

## Overview

Rename the CLI binary command from `eniem-cli` to `eni` for faster typing. The npm package name stays `eniem-cli` — only the executable bin name and all user-facing command references change. Product branding ("Eniem") remains unchanged.

## Problem Statement

**Who:** Developers using the Eniem CLI daily
**Problem:** `eniem-cli` is verbose to type repeatedly — 9 characters for a command used frequently during development
**Impact:** `eni` (3 chars) is 3x faster to type and easier to remember. Reduces friction for every CLI interaction.

## Scope

### Included

- Rename the `bin` entry in `packages/cli/package.json` from `eniem-cli` to `eni`
- Update all help text, usage examples, and error messages in CLI source to reference `eni`
- Update documentation site (`apps/docs`) — installation guides, CLI docs
- Update CLAUDE.md, README, and other repo-level references

### Excluded

- npm package name stays `eniem-cli` (no npm rename)
- Product branding stays "Eniem" — only the command name changes
- CLI banner/header stays as-is
- No subcommand renames — `products`, `ready`, `ai init` keep their names
- No new subcommand aliases (e.g., no `eni p` shortcut for `eni products`)

### Constraints

- `npx eniem-cli@latest` must continue to work (it does, since npm package name is unchanged)
- No known system conflicts — `eni` is not a standard Unix command

## User Stories

### Primary Flow

- [ ] As a developer, I can run `eni my-app` to scaffold a new project so that I type fewer characters
- [ ] As a developer, I can run `eni products` to manage Polar products so that the command is shorter
- [ ] As a developer, I can run `eni ready` to generate production .env so that the command is shorter
- [ ] As a developer, I can run `eni ai init` to initialize AI workflow so that the command is shorter
- [ ] As a developer, I can run `eni --help` and see usage with `eni` (not `eniem-cli`) so that the help is consistent
- [ ] As a developer, I can run `eni --version` to check the version so that standard flags work

### Secondary Flows

- [ ] As a developer, I can run `npx eniem-cli@latest my-app` and it still works because the npm package name is unchanged

## Business Rules

### Naming

- The bin name is `eni` — exactly 3 lowercase characters
- All user-visible command references use `eni`, never `eniem-cli`
- Internal code (variable names, module names, imports) does NOT need renaming — only user-facing strings
- The product is still called "Eniem" — only the CLI command shortens to `eni`

### Backward Compatibility

- `npx eniem-cli` continues to work because the npm package name is unchanged
- After global install (`npm i -g eniem-cli`), only `eni` is available as a command (no `eniem-cli` bin alias)

## UI/UX Specification

### Help Output (`eni --help`)

All usage examples and descriptions reference `eni`:

```
Usage: eni [project-name] [options]

Commands:
  eni products    Manage Polar products
  eni ready       Generate production .env
  eni ai init     Initialize AI workflow

Options:
  --app-name      Display name for the app
  --git-host      SSH host alias (default: github.com)
  -h, --help      Show help
  -v, --version   Show version
```

### CLI Banner

Unchanged — keeps existing Eniem branding/ASCII art.

### Error Messages

Any error messages that reference the command name use `eni`:

- "Run `eni ready` to generate your .env file"
- "Usage: eni [project-name]"

## Acceptance Criteria

### Bin name is `eni`

- [ ] **Given** `packages/cli/package.json`, **when** inspecting the `bin` field, **then** it maps `eni` to the entry point
- [ ] **Given** a global install of `eniem-cli`, **when** running `eni --version`, **then** version number is displayed
- [ ] **Given** a global install of `eniem-cli`, **when** running `eniem-cli`, **then** the command is NOT found (only `eni` exists as bin)

### Help text uses `eni`

- [ ] **Given** running `eni --help`, **when** output is displayed, **then** all examples reference `eni` (zero occurrences of `eniem-cli`)
- [ ] **Given** running any subcommand with `--help`, **when** output is displayed, **then** all examples reference `eni`

### Documentation is updated

- [ ] **Given** the docs site, **when** viewing installation guide, **then** examples show `npx eniem-cli@latest` (unchanged, this is the npm package) and post-install usage shows `eni`
- [ ] **Given** the CLI guide in docs, **when** viewing command examples, **then** all references use `eni` instead of `eniem-cli`

### npx still works

- [ ] **Given** a fresh environment, **when** running `npx eniem-cli@latest my-app`, **then** the wizard starts normally

## Open Questions

- [ ] Should the README in `packages/cli/` update the npm badge or keep it as `eniem-cli`? (Likely keep, since package name is unchanged)
