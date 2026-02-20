# Replace Hardcoded 'eniem' References with Generic Placeholders

> Supersedes [spec #16 — Remove 'eniem' Branding from Generated Projects](./16-remove-eniem-branding.md)
> GitHub issue: [eniem-dev/eniem#50](https://github.com/eniem-dev/eniem/issues/50)

## Overview

The boilerplate contains hardcoded "eniem" branding throughout config files, Docker setup, manifest, env fallbacks, and UI strings. Since the boilerplate is meant to be cloned and rebranded, all these references must be replaced with a normalized `myapp`/`MyApp` placeholder convention. `myapp` represents the **project name slug** and `MyApp` represents the **application display name** — two independent values provided by the user. This makes it trivially easy for users — whether they scaffold via the CLI or clone directly from GitHub — to find and replace all branding in one shot.

## Problem Statement

**Who:** Developers who clone the boilerplate repo directly from GitHub, and customers who scaffold via `eni project <name>`.
**Problem:** After cloning, the project is littered with "eniem" branding across 24 occurrences in 9 files. Users must manually hunt for every variant (`eniem`, `Eniem`, `ENIEM`) before they can ship without leaking another company's branding.
**Impact:** Tedious setup, risk of shipping with eniem branding in production if occurrences are missed, poor first impression of the boilerplate as a reusable product.

## Scope

### Included

- Replace all hardcoded "eniem" variants in boilerplate source files with `myapp`/`MyApp` placeholders
- Normalize to a single root keyword (`myapp`) so `grep -ri "myapp"` catches every placeholder
- Ensure `.env.example` and `docker-compose.yml` DB values stay in sync
- Add a one-liner sed command to the README for easy rebranding
- Manifest cleanup: strip product-specific branding, use generic suffix

### Excluded

- **CLI scaffolding adaptation** — the CLI's search-and-replace step (changing search term from `eniem` to `myapp`) is a separate ticket
- **PoweredByBadge component** (`src/components/powered-by-badge.tsx`) — intentional eniem.dev attribution, stays as-is
- **"Powered by eniem.dev" locale string** (`src/locales/index.ts:637`) — intentional attribution, stays as-is
- **Documentation links** (`doc.eniem.dev`, `eniem.dev`) in dashboard page — kept intentionally
- **`package.json` name** — managed by CI, not user-facing in the cloned repo
- **Documentation & tooling files** — `README.md`, `AGENTS.md`, `.claude/commands/`, `.claude/settings.json` are maintained separately
- **Generated files** — `*.generated.ts` are stamped by `eniem-cli` and regenerated automatically
- **CLI helper** — `.eni/loop.sh` is part of CLI tooling

### Constraints

- The app must build and pass tests after all replacements
- Replacement must be a pure string substitution (no build-time injection or dynamic config required)
- The `myapp` placeholder must be greppable — no mixed naming (e.g., no `my-app` alongside `myapp`)

## User Stories

### Primary Flow

- [ ] As a developer cloning the boilerplate, I see `myapp`/`MyApp` everywhere instead of `eniem`/`Eniem`, so I know exactly what to replace with my project name
- [ ] As a developer, I can run a single sed command from the README to replace all `myapp`/`MyApp` occurrences with my project name
- [ ] As a developer, after cloning and replacing, the app still builds and runs out of the box

### Secondary Flows

- [ ] As a developer, I see that PoweredByBadge still references `eniem.dev` and understand it's intentional attribution
- [ ] As a developer, I see the `.env.example` and `docker-compose.yml` use matching `myapp` values, so Docker starts without manual DB config alignment

## Business Rules

### Placeholder Convention

Two placeholders representing two independent user inputs (see [cli-app-name-prompt spec](./cli-app-name-prompt.md)):

| Placeholder | Represents | Source | Used in |
|-------------|-----------|--------|---------|
| `MyApp` | Application display name | Interactive prompt or `--app-name` flag | Env fallbacks, UI strings, manifest name, email footer, SIWE prompts |
| `myapp` | Project name slug | CLI argument (`eni project <slug>`) | DB names, Docker container, env var values, domain placeholders, manifest id |
| `myapp.example.com` | Domain fallback (derived from slug) | — | Email from/support addresses (RFC 2606 reserved domain) |

### Replacement Mapping

All paths relative to `apps/boilerplate/`.

#### Configuration & metadata

| File | Line | Before | After |
|------|------|--------|-------|
| `.env.example` | 4 | `NEXT_PUBLIC_APP_NAME=eniem` | `NEXT_PUBLIC_APP_NAME=MyApp` |
| `.env.example` | 11 | `postgresql://eniem:eniem-dev-password@localhost:5432/eniem` | `postgresql://myapp:myapp-dev-password@localhost:5432/myapp` |
| `.env.example` | 62 | `EMAIL_FROM_ADDRESS=no-reply@eniem.dev` | `EMAIL_FROM_ADDRESS=no-reply@myapp.example.com` |
| `.env.example` | 67 | `SUPPORT_EMAIL=support@eniem.dev` | `SUPPORT_EMAIL=support@myapp.example.com` |
| `public/manifest.json` | 2 | `"name": "ENIEM - Web3 SaaS Boilerplate"` | `"name": "MyApp - SaaS Boilerplate"` |
| `public/manifest.json` | 3 | `"short_name": "ENIEM"` | `"short_name": "MyApp"` |
| `public/manifest.json` | 11 | `"id": "eniem-web3-saas"` | `"id": "myapp"` |

#### Docker / Database

| File | Line | Before | After |
|------|------|--------|-------|
| `docker-compose.yml` | 6 | `container_name: eniem-postgres` | `container_name: myapp-postgres` |
| `docker-compose.yml` | 9 | `POSTGRES_DB: eniem` | `POSTGRES_DB: myapp` |
| `docker-compose.yml` | 10 | `POSTGRES_USER: eniem` | `POSTGRES_USER: myapp` |
| `docker-compose.yml` | 11 | `POSTGRES_PASSWORD: eniem-dev-password` | `POSTGRES_PASSWORD: myapp-dev-password` |
| `docker-compose.yml` | 17 | `pg_isready -U eniem -d eniem` | `pg_isready -U myapp -d myapp` |

#### Application source code

| File | Line | Before | After |
|------|------|--------|-------|
| `src/config/env.ts` | 7 | `\|\| "Eniem"` | `\|\| "MyApp"` |
| `src/config/env.ts` | 66 | `\|\| "no-reply@eniem.dev"` | `\|\| "no-reply@myapp.example.com"` |
| `src/config/env.ts` | 86 | `\|\| "support@eniem.dev"` | `\|\| "support@myapp.example.com"` |
| `src/config/wagmi.ts` | 5 | `\|\| "Eniem"` | `\|\| "MyApp"` |
| `src/locales/index.ts` | 637 | `"Powered by eniem.dev"` | **NO CHANGE** (attribution) |
| `src/components/powered-by-badge.tsx` | 8 | `href="https://eniem.dev"` | **NO CHANGE** (attribution) |
| `src/components/emails/components/EmailLayout.tsx` | 32 | `sent by Eniem` | `sent by MyApp` |
| `src/features/authentication/hooks/use-ethereum-auth.ts` | 41 | `"Sign in with Ethereum to Eniem"` | `"Sign in with Ethereum to MyApp"` |
| `src/features/authentication/hooks/use-ethereum-auth.ts` | 42 | `"Sign up with Ethereum to Eniem"` | `"Sign up with Ethereum to MyApp"` |

### DB Value Sync Rule

The database credentials in `.env.example` and `docker-compose.yml` must always match:

- `POSTGRES_DB` = `myapp` ↔ DATABASE_URL db name = `myapp`
- `POSTGRES_USER` = `myapp` ↔ DATABASE_URL user = `myapp`
- `POSTGRES_PASSWORD` = `myapp-dev-password` ↔ DATABASE_URL password = `myapp-dev-password`

### README One-Liner

Add a section to the README with sed commands for rebranding. Two separate values are needed — the project slug and the display name:

```bash
# Replace placeholders with your project slug and app name
grep -rl "MyApp" . --exclude-dir={node_modules,.git} | xargs sed -i 's/MyApp/Your App Name/g'
grep -rl "myapp" . --exclude-dir={node_modules,.git} | xargs sed -i 's/myapp/yourslug/g'
```

## Edge Cases

### Error Scenarios

| Scenario | Expected Behavior |
|----------|-------------------|
| Developer runs sed one-liner with a project name containing regex special chars | The one-liner uses literal strings; special chars in project names may need escaping — document this caveat |
| Developer forgets to update `.env` after changing `docker-compose.yml` | DB connection fails with clear Postgres auth error — document that both files must match |

### Boundary Conditions

| Condition | Expected Behavior |
|-----------|-------------------|
| `grep -ri "eniem"` after replacement | Zero matches in in-scope files; only hits in excluded files (PoweredByBadge, locale attribution, generated files, CLI tooling, docs) |
| `grep -ri "myapp"` after replacement | Catches every single placeholder across all 9 files |
| App build after replacement | `pnpm build` succeeds with no errors |
| App tests after replacement | `pnpm test` passes with no failures |

## Acceptance Criteria

### Core Replacement

- [ ] **Given** the boilerplate source, **when** all replacements are applied, **then** `grep -ri "eniem"` finds zero matches in in-scope files (excluding `package.json`, `powered-by-badge.tsx`, locale attribution string, `*.generated.ts`, `.eni/`, docs/tooling files, and dashboard doc link)
- [ ] **Given** the boilerplate source, **when** all replacements are applied, **then** `grep -ri "myapp"` catches every placeholder — no mixed naming exists
- [ ] **Given** the replacements, **when** running `pnpm build`, **then** the build succeeds
- [ ] **Given** the replacements, **when** running `pnpm test`, **then** all tests pass

### Specific Files

- [ ] **Given** `public/manifest.json`, **when** inspected, **then** `name` is `"MyApp - SaaS Boilerplate"`, `short_name` is `"MyApp"`, `id` is `"myapp"`
- [ ] **Given** `docker-compose.yml`, **when** inspected, **then** all DB references use `myapp` and match `.env.example` DATABASE_URL
- [ ] **Given** `.env.example`, **when** inspected, **then** email fallbacks use `@myapp.example.com` domain
- [ ] **Given** `src/config/env.ts` and `src/config/wagmi.ts`, **when** inspected, **then** appName fallback is `"MyApp"`

### Exclusions Preserved

- [ ] **Given** `src/components/powered-by-badge.tsx`, **when** inspected, **then** it still references `eniem.dev`
- [ ] **Given** `src/locales/index.ts:637`, **when** inspected, **then** it still reads `"Powered by eniem.dev"`
- [ ] **Given** `src/app/(protected)/dashboard/page.tsx:33`, **when** inspected, **then** the `doc.eniem.dev` link is unchanged

### README

- [ ] **Given** the README, **when** inspected, **then** it contains the sed one-liner for rebranding `myapp`/`MyApp`

## Open Questions

None — all requirements are resolved. `MYAPP` (full uppercase) is not needed since no placeholder uses that variant.
