# Fix: Polar Client Lazy Init & Turborepo Env Passthrough

## Overview

The boilerplate fails to build on Coolify (Nixpacks) because Turborepo strips environment variables from the build process, and `polar.ts` throws at module-scope when `POLAR_ACCESS_TOKEN` is missing. This spec covers both fixes to make the build work on self-hosted platforms.

## Problem Statement

**Who:** Developers deploying the boilerplate on Coolify or any platform using Nixpacks/Docker
**Problem:** `next build` crashes at "Collecting page data" with `Error: POLAR_ACCESS_TOKEN is required`, even when the env var is set on the platform
**Impact:** Boilerplate is undeployable on Coolify — the primary deployment target

## Scope

### Included
- Declare all env vars from `env.ts` in `turbo.json` `build` task so Turborepo passes them through
- Make `polarClient` in `src/lib/polar.ts` lazy-initialized via Proxy so the module can be imported at build time without crashing

### Excluded
- Changing how other service clients (Resend, S3, etc.) initialize — audit confirms only Polar has this pattern
- Validating env vars at build time — current behavior (require at runtime) is acceptable
- Switching to `turbo.json` wildcard passthrough (`"env": ["*"]`) — explicit list preferred for cache correctness

### Constraints
- Must not change runtime behavior — Polar client still throws if `POLAR_ACCESS_TOKEN` is missing when actually used
- Must maintain Turborepo cache correctness — env vars affect the build hash

## User Stories

### Primary Flow

- [ ] As a developer, I can deploy the boilerplate on Coolify with platform-level env vars so that the build succeeds without workarounds
- [ ] As a developer, I can run `turbo build` in an environment without Polar credentials (e.g., CI type-check step) so that the build doesn't crash at import time

## Business Rules

### Validation
- `POLAR_ACCESS_TOKEN`: required at **runtime** (first API call), NOT at import/build time
- All env vars in `env.ts`: must be declared in `turbo.json` `env` array for build cache correctness

### Env Var List (derived from `env.ts`)

Server-side:
- `PROJECT_URL`
- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_URL`
- `DATABASE_URL`
- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`
- `TWITTER_CLIENT_ID`
- `TWITTER_CLIENT_SECRET`
- `LANDING_MODE`
- `DIGITALOCEAN_SPACES_ENDPOINT`
- `DIGITALOCEAN_SPACES_REGION`
- `DIGITALOCEAN_SPACES_BUCKET`
- `DIGITALOCEAN_SPACES_ACCESS_KEY_ID`
- `DIGITALOCEAN_SPACES_SECRET_ACCESS_KEY`
- `DIGITALOCEAN_SPACES_CDN`
- `MAX_FILE_SIZE_MB`
- `POLAR_ACCESS_TOKEN`
- `POLAR_SERVER`
- `POLAR_WEBHOOK_SECRET`
- `POLAR_ORGANIZATION_ID`
- `RESEND_API_KEY`
- `EMAIL_FROM_ADDRESS`
- `EMAIL_BRAND_LOGO_URL`
- `SUPPORT_EMAIL`

Client-side (`NEXT_PUBLIC_*`):
- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_APP_NAME`
- `NEXT_PUBLIC_ANALYTICS_PROVIDER`
- `NEXT_PUBLIC_UMAMI_WEBSITE_ID`
- `NEXT_PUBLIC_UMAMI_HOST`
- `NEXT_PUBLIC_POSTHOG_KEY`
- `NEXT_PUBLIC_POSTHOG_HOST`

## Edge Cases

### Error Scenarios

| Scenario | Expected Behavior |
|----------|-------------------|
| Build without `POLAR_ACCESS_TOKEN` | Build succeeds; Polar module imports without error |
| Runtime API call without `POLAR_ACCESS_TOKEN` | Throws `Error: POLAR_ACCESS_TOKEN is required` on first use |
| Turborepo cache with different env values | Cache miss triggers rebuild (env declared in `turbo.json`) |

## Acceptance Criteria

### Turbo env passthrough

- [ ] **Given** `turbo.json` with env array, **when** running `turbo build` with platform env vars, **then** env vars are available to `next build`
- [ ] **Given** all env vars from `env.ts`, **when** checking `turbo.json` env array, **then** every var is listed

### Lazy Polar client

- [ ] **Given** `POLAR_ACCESS_TOKEN` is NOT set, **when** `polar.ts` is imported, **then** no error is thrown
- [ ] **Given** `POLAR_ACCESS_TOKEN` is NOT set, **when** `polarClient` property is accessed, **then** `Error: POLAR_ACCESS_TOKEN is required` is thrown
- [ ] **Given** `POLAR_ACCESS_TOKEN` IS set, **when** `polarClient` is used, **then** Polar SDK works identically to current behavior

## Open Questions

None — approach is settled per issue #44.
