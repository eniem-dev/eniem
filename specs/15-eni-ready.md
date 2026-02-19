# eni ready — Generate Production .env

GitHub Issue: [#15](https://github.com/eniem-dev/eniem/issues/15)

## Overview

`eni ready` is an interactive CLI command that walks the user through generating a production-ready `.env` file for their Eniem boilerplate project. It reads an existing `.env` to pre-fill values, prompts for required vars first, offers optional feature groups via a checklist, and outputs the result to `.env.production` or clipboard.

## Problem Statement

**Who:** Eniem boilerplate buyers deploying their SaaS for the first time, and experienced developers re-deploying or updating their production config.

**Problem:** Manually copying `.env.example` and filling in production values is error-prone. Developers forget required vars, use wrong formats, leave sandbox values in production, or miss entire sections. There's no guided path from "I just bought this boilerplate" to "my production env is ready."

**Impact:** Failed deployments, missing features in production, wasted debugging time. A guided wizard reduces first-deploy friction and prevents common mistakes.

## Scope

### Included

- Interactive wizard that prompts for all required env vars
- Pre-fill from existing `.env` file if present
- Multi-select checklist for optional feature groups
- Analytics provider sub-selection (Umami vs PostHog)
- Output to `.env.production` file or clipboard
- Summary of configured vs skipped sections
- POLAR_SERVER defaults to `production` (shown for confirmation)

### Excluded

- No value validation (e.g., checking that URLs aren't localhost)
- No non-interactive / CI mode (future phase)
- No deployment to hosting providers (Vercel, Railway, etc.)
- No secret rotation or management
- No `.env.local` generation (dev-only concern)
- No integration with hosting provider env var APIs

### Constraints

- Must run from the project root (where `.env.example` exists)
- CLI-only — no web UI
- Must work on macOS and Linux
- Clipboard support via `clipboardy` npm package (cross-platform)

## User Stories

### Primary Flow

- [ ] As a user, I can run `eni ready` from my project root so that I start the production env wizard
- [ ] As a user, I see my existing `.env` values pre-filled so that I don't re-enter what I already have
- [ ] As a user, I am prompted for all required vars first so that my production deploy has the essentials
- [ ] As a user, I can select which optional feature groups to configure via a checklist so that I only fill in what I need
- [ ] As a user, I can choose to output the result to `.env.production` or clipboard so that I can use it however I deploy
- [ ] As a user, I see a summary of what was configured and what was skipped so that I know the state of my env

### Secondary Flows

- [ ] As a user, I am asked before overwriting an existing `.env.production` so that I don't lose previous config
- [ ] As a user, I see an error if I'm not in a project root (no `.env.example` found) so that I know to navigate to the right directory

## Business Rules

### Pre-flight

- Command MUST be run from a directory containing `.env.example`
- If `.env.example` is not found, print an error: "No .env.example found. Run this command from your project root." and exit
- If `.env` exists, parse it and use values as defaults for prompts

### Required Variables

These are prompted unconditionally, in this order:

| Variable | Prompt Label | Pre-fill Source | Notes |
|----------|-------------|-----------------|-------|
| `PROJECT_URL` | Production URL (e.g. https://myapp.com) | existing `.env` | Also sets `NEXT_PUBLIC_SITE_URL` and `BETTER_AUTH_URL` to same value |
| `NEXT_PUBLIC_APP_NAME` | App name | existing `.env` | |
| `DATABASE_URL` | Database connection string | existing `.env` | |
| `BETTER_AUTH_SECRET` | Auth secret key | existing `.env` | |
| `POLAR_ACCESS_TOKEN` | Polar access token | existing `.env` | |
| `POLAR_WEBHOOK_SECRET` | Polar webhook secret | existing `.env` | |
| `POLAR_ORGANIZATION_ID` | Polar organization ID | existing `.env` | |
| `RESEND_API_KEY` | Resend API key | existing `.env` | |

Auto-set (not prompted):
- `BETTER_AUTH_URL` = value of `PROJECT_URL`
- `NEXT_PUBLIC_SITE_URL` = value of `PROJECT_URL`
- `POLAR_SERVER` = `production` (shown in summary, not prompted)

### Optional Feature Groups

After required vars, show a multi-select checklist:

```
Which optional features do you want to configure?
[ ] GitHub OAuth
[ ] Twitter/X OAuth
[ ] WalletConnect (Web3)
[ ] Analytics
[ ] File Uploads (DigitalOcean Spaces)
[ ] Email Branding
[ ] Site Config (Landing Mode)
```

Pre-check groups that already have values in the existing `.env`.

#### Group: GitHub OAuth
| Variable | Prompt Label |
|----------|-------------|
| `GITHUB_CLIENT_ID` | GitHub OAuth client ID |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth client secret |

#### Group: Twitter/X OAuth
| Variable | Prompt Label |
|----------|-------------|
| `TWITTER_CLIENT_ID` | Twitter/X client ID |
| `TWITTER_CLIENT_SECRET` | Twitter/X client secret |

#### Group: WalletConnect (Web3)
| Variable | Prompt Label |
|----------|-------------|
| `NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID` | WalletConnect project ID |

#### Group: Analytics
Sub-prompt: "Which analytics provider?"
- Umami
- PostHog
- None (skip)

**If Umami:**
| Variable | Prompt Label |
|----------|-------------|
| `NEXT_PUBLIC_ANALYTICS_PROVIDER` | *(auto-set to `umami`)* |
| `NEXT_PUBLIC_UMAMI_HOST` | Umami host URL |
| `NEXT_PUBLIC_UMAMI_WEBSITE_ID` | Umami website ID |

**If PostHog:**
| Variable | Prompt Label |
|----------|-------------|
| `NEXT_PUBLIC_ANALYTICS_PROVIDER` | *(auto-set to `posthog`)* |
| `NEXT_PUBLIC_POSTHOG_HOST` | PostHog host URL |
| `NEXT_PUBLIC_POSTHOG_KEY` | PostHog project API key |

#### Group: File Uploads (DigitalOcean Spaces)
| Variable | Prompt Label |
|----------|-------------|
| `DIGITALOCEAN_SPACES_ENDPOINT` | Spaces endpoint URL |
| `DIGITALOCEAN_SPACES_REGION` | Spaces region |
| `DIGITALOCEAN_SPACES_BUCKET` | Bucket name |
| `DIGITALOCEAN_SPACES_KEY` | Spaces access key |
| `DIGITALOCEAN_SPACES_SECRET` | Spaces secret key |
| `DIGITALOCEAN_SPACES_CDN` | CDN URL (optional) |
| `MAX_FILE_SIZE_MB` | Max upload size in MB |

#### Group: Email Branding
| Variable | Prompt Label |
|----------|-------------|
| `EMAIL_FROM_ADDRESS` | From email address |
| `EMAIL_BRAND_LOGO_URL` | Brand logo URL for emails |
| `SUPPORT_EMAIL` | Support email address |

#### Group: Site Config (Landing Mode)
| Variable | Prompt Label |
|----------|-------------|
| `LANDING_MODE` | Landing mode (true/false) |

### Output

After all prompts are complete, ask:

```
Where should the production env be saved?
( ) .env.production file
( ) Copy to clipboard
```

**If `.env.production`:**
- If file already exists: "Found existing .env.production. Overwrite? [y/N]"
- If user declines, abort with "Aborted. No changes made."
- Write file and print path

**If clipboard:**
- Copy full env content to system clipboard
- Print confirmation: "Production env copied to clipboard"

### Summary

After output, print a summary:

```
Production .env ready!

  Configured:
    ✓ Core (URL, app name, database, auth)
    ✓ Payments (Polar)
    ✓ Email (Resend)
    ✓ GitHub OAuth
    ✓ Analytics (Umami)

  Skipped:
    - Twitter/X OAuth
    - WalletConnect
    - File Uploads
    - Email Branding
    - Site Config

  Auto-set:
    POLAR_SERVER = production
    BETTER_AUTH_URL = https://myapp.com
    NEXT_PUBLIC_SITE_URL = https://myapp.com
```

## Data Model

### Entities

**EnvConfig** (in-memory, not persisted)
| Property | Type | Description |
|----------|------|-------------|
| required | Record<string, string> | Required var key-value pairs |
| optional | Record<string, string> | Optional var key-value pairs from selected groups |
| autoSet | Record<string, string> | Automatically derived values (POLAR_SERVER, BETTER_AUTH_URL, etc.) |
| selectedGroups | string[] | Which optional groups the user chose |
| skippedGroups | string[] | Which optional groups were not selected |

**ExistingEnv** (parsed from .env file)
| Property | Type | Description |
|----------|------|-------------|
| values | Record<string, string> | Parsed key-value pairs from existing .env |
| source | string | File path that was parsed (.env) |

### State Transitions

```
[Start] → detect .env.example → [Pre-flight OK]
[Pre-flight OK] → parse existing .env → [Pre-filled]
[Pre-filled] → prompt required vars → [Required Complete]
[Required Complete] → show optional checklist → [Groups Selected]
[Groups Selected] → prompt selected group vars → [All Vars Collected]
[All Vars Collected] → choose output target → [Output Choice Made]
[Output Choice Made] → write file or copy to clipboard → [Done]
[Done] → print summary → [Exit]
```

## UI/UX Specification

### Screen: Pre-flight

**Entry point:** User runs `eni ready` from terminal

**Success state:**
```
Found .env — using existing values as defaults.
```

**Error state (no .env.example):**
```
✗ No .env.example found. Run this command from your project root.
```

### Screen: Required Variables

**Layout:** Sequential prompts, one variable at a time.

Each prompt shows:
```
? Production URL (e.g. https://myapp.com): [pre-filled value]
```

If pre-filled, the existing value appears as the default — user presses Enter to keep it or types a new value.

### Screen: Optional Groups Checklist

**Layout:** Multi-select checklist with cursor navigation.

```
? Which optional features do you want to configure? (space to select)
  ◉ GitHub OAuth
  ◯ Twitter/X OAuth
  ◯ WalletConnect (Web3)
  ◉ Analytics
  ◯ File Uploads (DigitalOcean Spaces)
  ◯ Email Branding
```

Groups with existing values in `.env` are pre-checked.

### Screen: Analytics Sub-selection

Only shown if "Analytics" was checked.

```
? Which analytics provider?
  ● Umami
  ○ PostHog
  ○ None
```

If existing `.env` has `NEXT_PUBLIC_ANALYTICS_PROVIDER`, pre-select that provider.

### Screen: Group Variable Prompts

Same layout as required variables — sequential prompts with pre-filled values.

### Screen: Output Choice

```
? Where should the production env be saved?
  ● .env.production file
  ○ Copy to clipboard
```

### Screen: Summary

Final output (see Business Rules > Summary section above).

## Edge Cases

### Error Scenarios

| Scenario | Expected Behavior |
|----------|-------------------|
| No `.env.example` in cwd | Print error, exit with code 1 |
| `.env` file doesn't exist | Proceed without pre-fill, inform user: "No existing .env found — starting fresh." |
| `.env` has malformed lines | Skip unparseable lines, proceed with what was parsed |
| Clipboard copy fails | Print error: "Failed to copy to clipboard. Outputting to stdout instead:" then print env content |
| User cancels mid-wizard (Ctrl+C) | Exit gracefully, no files written |
| Existing `.env.production` and user declines overwrite | Abort with message, exit code 0 |

### Boundary Conditions

| Condition | Expected Behavior |
|-----------|-------------------|
| All optional groups skipped | Proceed — only required vars in output |
| All optional groups selected | Prompt for all optional vars after checklist |
| Empty value entered for required var | Accept it — no validation (user's responsibility) |
| `.env` has vars not in `.env.example` | Ignore extra vars — only generate known vars |
| User selects clipboard but no clipboard available | Fall back to stdout with warning |

## Acceptance Criteria

### Pre-flight Check

- [ ] **Given** the user is in a directory without `.env.example`, **when** they run `eni ready`, **then** they see an error and the command exits
- [ ] **Given** the user is in a directory with `.env.example`, **when** they run `eni ready`, **then** the wizard starts

### Pre-fill

- [ ] **Given** a `.env` file exists with values, **when** the wizard starts, **then** prompts show existing values as defaults
- [ ] **Given** no `.env` file exists, **when** the wizard starts, **then** prompts have no defaults and a message says "No existing .env found — starting fresh."

### Required Variables

- [ ] **Given** the wizard is running, **when** the required section starts, **then** all 8 required vars are prompted in order
- [ ] **Given** a pre-filled value exists, **when** the user presses Enter without typing, **then** the existing value is used
- [ ] **Given** the user enters a new value, **when** they confirm, **then** the new value replaces the pre-filled one

### Optional Groups

- [ ] **Given** required vars are complete, **when** the checklist appears, **then** all 7 groups are listed
- [ ] **Given** existing `.env` has GitHub OAuth values, **when** the checklist appears, **then** GitHub OAuth is pre-checked
- [ ] **Given** the user selects Analytics, **when** they confirm the checklist, **then** they are asked to choose Umami or PostHog
- [ ] **Given** Analytics provider is chosen, **when** prompts appear, **then** only the relevant provider's vars are prompted

### Output

- [ ] **Given** all prompts are complete, **when** the user selects `.env.production`, **then** the file is written to the project root
- [ ] **Given** all prompts are complete, **when** the user selects clipboard, **then** the env content is copied to clipboard
- [ ] **Given** `.env.production` already exists, **when** the user selects file output, **then** they are asked to confirm overwrite
- [ ] **Given** the user declines overwrite, **when** prompted, **then** the command aborts without writing

### Summary

- [ ] **Given** output is complete, **when** the summary prints, **then** it shows configured groups with checkmarks, skipped groups, and auto-set values

### Auto-set Values

- [ ] **Given** the user enters a `PROJECT_URL`, **when** the env is generated, **then** `BETTER_AUTH_URL` and `NEXT_PUBLIC_SITE_URL` are set to the same value
- [ ] **Given** the env is generated, **when** `POLAR_SERVER` is included, **then** its value is `production`

## Resolved Questions

- **LANDING_MODE**: Included as an optional group ("Site Config")
- **Doctor suggestion**: Not shown — keep summary output clean
- **Clipboard**: Use `clipboardy` npm package for cross-platform clipboard support
