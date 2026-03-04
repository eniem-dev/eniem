# Handle SSH Agent/Key Not Loaded During `eni ai init`

## Overview

When `eni ai init` performs SSH git operations (sparse clone of the boilerplate repo), it fails with a cryptic error if the SSH agent isn't running or the key isn't loaded. This feature adds upfront SSH detection with automatic remediation — starting the agent and prompting for the passphrase — so users get a seamless experience instead of a confusing failure.

## Problem Statement

**Who:** Developers running `eni ai init` on machines where `ssh-agent` isn't persistent (servers, fresh terminals, machines without `keychain`/`gnome-keyring`)

**Problem:** The CLI calls `git fetch` over SSH but doesn't inherit stdio, so the passphrase prompt is swallowed. The user sees a generic "Could not read from remote repository" error with no indication that their SSH key simply isn't loaded.

**Impact:** Users are blocked from initializing their AI config. They must independently diagnose the SSH issue, which is especially confusing for less experienced developers.

## Scope

### Included

- Detect whether SSH keys are loaded before the first SSH operation
- Detect whether `ssh-agent` is running
- Auto-start `ssh-agent` if not running
- Auto-run `ssh-add` with inherited stdio so the user can enter their passphrase
- Show clear error with step-by-step fix instructions if auto-handling fails
- Show a brief tip about persistent SSH solutions (e.g., `keychain`)
- Abort the `ai init` flow if SSH cannot be resolved

### Excluded

- HTTPS fallback as an alternative to SSH (separate issue to be created)
- Parsing `~/.ssh/config` to detect specific key files per host
- A `--no-ssh-check` flag to bypass the check
- Persistent SSH setup (installing `keychain`, modifying shell profiles)
- SSH checks in other commands beyond `ai init`

### Constraints

- Must work on macOS and Linux
- Must use the default `ssh-add` behavior (no explicit key path argument)
- The check must not add noticeable delay to the happy path (agent running, key loaded)
- Must work within the Ink (React CLI) rendering model

## User Stories

### Primary Flow

- [ ] As a developer, I can run `eni ai init` on a machine where my SSH key isn't loaded, and the CLI automatically prompts me for my passphrase so that I can complete initialization without manual SSH setup
- [ ] As a developer, I can run `eni ai init` on a machine where `ssh-agent` isn't running, and the CLI starts the agent and prompts for my passphrase so that I don't have to diagnose SSH issues myself

### Secondary Flows

- [ ] As a developer, if auto-handling fails (wrong passphrase, no key file), I see clear step-by-step instructions to fix my SSH setup so that I know exactly what to do
- [ ] As a developer, after resolving an SSH issue, I see a tip about persistent solutions so that I can avoid the problem in future sessions

## Business Rules

### Detection Logic

- **SSH key loaded** (`ssh-add -l` exits with code 0): Skip all SSH handling, proceed directly to cloning
- **Agent running, no keys** (`ssh-add -l` exits with code 1): Run `ssh-add` with inherited stdio to prompt for passphrase
- **Agent not running** (`ssh-add -l` exits with code 2): Start `ssh-agent`, then run `ssh-add` with inherited stdio

### Auto-Remediation Sequence

1. Run `ssh-add -l` to check status
2. If exit code 2: start `ssh-agent` (capture and apply SSH_AUTH_SOCK and SSH_AGENT_PID env vars)
3. If exit code 1 or 2: run `ssh-add` with `stdio: 'inherit'` so the passphrase prompt reaches the user
4. After `ssh-add` completes, verify with `ssh-add -l` again
5. If verification passes (exit 0): proceed to cloning
6. If verification fails: show error with instructions and abort

### Fallback Message Content

On failure, display:
```
✗ SSH key not loaded

To fix this, run:
  1. eval "$(ssh-agent -s)"
  2. ssh-add ~/.ssh/your-key

Then run `eni ai init` again.

Tip: Install `keychain` to avoid this. See docs.eniem.dev/guides/ssh-setup
```

### Placement in Wizard

- The SSH check runs as an invisible pre-step before the "cloning" state
- On the happy path (key already loaded), the user sees nothing — cloning starts immediately
- On the remediation path, minimal output: just the passphrase prompt and a `✓ SSH ready` confirmation
- On failure, the error message replaces the wizard output and the flow aborts

## Data Model

No new data entities. This feature is purely runtime behavior with no persistence.

### State Transitions

```
[checking] → SSH key loaded (exit 0) → [cloning]
[checking] → No keys (exit 1) → [ssh_remediating] → ssh-add succeeds → [cloning]
[checking] → No agent (exit 2) → [ssh_remediating] → start agent + ssh-add succeeds → [cloning]
[ssh_remediating] → ssh-add fails → [error] (abort with instructions)
```

## UI/UX Specification

### Happy Path (key already loaded)

No visible output. The wizard proceeds from "checking" to "cloning" without interruption.

### Remediation Path (passphrase needed)

```
Enter passphrase for /Users/you/.ssh/id_ed25519: ****
✓ SSH ready
```

- The passphrase prompt comes from `ssh-add` via inherited stdio — not rendered by Ink
- After success, Ink renders the `✓ SSH ready` confirmation
- Then proceeds to the normal cloning spinner

### Failure Path (cannot load key)

```
✗ SSH key not loaded

To fix this, run:
  1. eval "$(ssh-agent -s)"
  2. ssh-add ~/.ssh/your-key

Then run `eni ai init` again.

Tip: Install `keychain` to avoid this. See docs.eniem.dev/guides/ssh-setup
```

- Rendered by Ink in the error state
- The wizard does not proceed — process exits with non-zero code

### Ink Rendering Notes

- During `ssh-add` with inherited stdio, Ink rendering must be paused/suspended to avoid conflicts with the passphrase prompt
- After `ssh-add` completes (success or failure), Ink resumes control

## Edge Cases

### Error Scenarios

| Scenario | Expected Behavior |
|----------|-------------------|
| `ssh-add` binary not found | Show error: "ssh-add not found. Install OpenSSH and try again." Abort. |
| No default key files exist (~/.ssh/id_*) | `ssh-add` fails with "No identities found". Show step-by-step fix instructions. Abort. |
| User enters wrong passphrase | `ssh-add` returns non-zero. Show step-by-step fix instructions. Abort. |
| User cancels passphrase prompt (Ctrl+C) | `ssh-add` returns non-zero. Show step-by-step fix instructions. Abort. |
| `ssh-agent` fails to start | Show step-by-step fix instructions including `eval "$(ssh-agent -s)"`. Abort. |
| SSH_AUTH_SOCK env var set but points to dead socket | `ssh-add -l` returns exit code 2. Auto-start new agent. |

### Boundary Conditions

| Condition | Expected Behavior |
|-----------|-------------------|
| Key is loaded but for wrong host | Not detected by this check (only checks if any key is loaded). The clone step's existing error handler catches "Permission denied". |
| Multiple keys loaded | `ssh-add -l` returns 0. Proceed normally. |
| SSH agent forwarding active | `ssh-add -l` returns 0 if forwarded keys exist. Proceed normally. |

## Acceptance Criteria

### SSH key already loaded

- [ ] **Given** `ssh-add -l` succeeds (exit 0), **when** `eni ai init` runs, **then** the SSH check produces no visible output and cloning starts immediately

### Agent running, no keys loaded

- [ ] **Given** `ssh-agent` is running but no keys are loaded, **when** `eni ai init` runs, **then** `ssh-add` is invoked with inherited stdio so the user can enter their passphrase
- [ ] **Given** the user enters the correct passphrase, **when** `ssh-add` succeeds, **then** `✓ SSH ready` is displayed and cloning proceeds

### Agent not running

- [ ] **Given** `ssh-agent` is not running, **when** `eni ai init` runs, **then** the CLI starts `ssh-agent` and invokes `ssh-add` with inherited stdio
- [ ] **Given** the agent starts and the user enters the correct passphrase, **when** `ssh-add` succeeds, **then** `✓ SSH ready` is displayed and cloning proceeds

### Auto-handling fails

- [ ] **Given** `ssh-add` fails (wrong passphrase, no key, cancelled), **when** the verification check fails, **then** a step-by-step fix guide is displayed with numbered instructions
- [ ] **Given** auto-handling fails, **when** the error is displayed, **then** a tip about `keychain` and a docs link is included
- [ ] **Given** auto-handling fails, **when** the error is displayed, **then** the CLI exits with a non-zero exit code and does not proceed to cloning

### No visible delay on happy path

- [ ] **Given** SSH is properly configured, **when** `eni ai init` runs, **then** the SSH check adds less than 100ms to the startup time
