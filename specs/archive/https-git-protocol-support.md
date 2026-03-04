# Support HTTPS as Alternative to SSH for Git Operations

## Overview

Add HTTPS support as an alternative protocol for git clone operations in the CLI. By default, the CLI tries SSH and auto-falls back to HTTPS on network timeout. Users can also explicitly choose a protocol via `--protocol https` or `--https` flags, skipping detection entirely. The CLI does not handle git authentication — it constructs the URL and lets git manage credentials natively.

## Problem Statement

**Who:** Developers in corporate environments (SSH port 22 blocked), CI/CD systems using token-based auth, and users who prefer HTTPS over SSH keys.

**Problem:** The CLI only supports SSH git URLs (`git@host:org/repo`). If SSH is blocked at the network level, the clone fails with no workaround — the user cannot use the CLI at all.

**Impact:** Users in restricted networks are completely blocked. CI/CD pipelines that use HTTPS tokens cannot use the CLI without workarounds.

## Scope

### Included

- `--protocol` flag accepting `ssh` or `https` for all clone commands (`eni init`, `eni ai init`)
- `--https` and `--ssh` shorthand flags
- Auto-fallback from SSH to HTTPS on network timeout (10 seconds) when no explicit protocol is set
- HTTPS URL derivation from the existing `gitHost` config (no new config fields)
- Tip message after successful HTTPS fallback suggesting `--protocol https` for next time
- Combined error display when both SSH and HTTPS fail

### Excluded

- Authentication handling — the CLI does not manage tokens, credentials, or credential helpers. Git handles all auth natively.
- Protocol persistence / config storage — no saved preference, per-invocation only
- HTTPS as default protocol — SSH remains the default
- Credential prompting or token input within the CLI

### Constraints

- Git is the only required external dependency (no `gh` CLI, no additional tools)
- The SSH timeout detection must not add delay to the happy path (SSH works immediately)
- Must work on macOS and Linux
- Must integrate with the SSH agent check from spec #89 (SSH check runs first when protocol is default or `ssh`)

## User Stories

### Primary Flow

- [ ] As a developer, I can pass `--protocol https` (or `--https`) to clone the boilerplate via HTTPS so that I can use the CLI in environments where SSH port 22 is blocked
- [ ] As a developer, when I run the CLI without a protocol flag and SSH times out, the CLI automatically retries via HTTPS so that I get a seamless experience without manual intervention

### Secondary Flows

- [ ] As a developer, I can pass `--protocol ssh` (or `--ssh`) to force SSH-only with no HTTPS fallback so that I have explicit control when needed
- [ ] As a developer, after a successful HTTPS fallback, I see a tip suggesting `--protocol https` for future runs so that I can skip the SSH timeout wait next time
- [ ] As a CI operator, I can set `--protocol https` in my pipeline to clone directly via HTTPS so that I avoid SSH setup entirely

## Business Rules

### Protocol Resolution

- **No flag provided (default):** Try SSH first. On network timeout (10s), auto-fallback to HTTPS.
- **`--protocol https` or `--https`:** Use HTTPS directly. Skip SSH agent check and SSH clone entirely.
- **`--protocol ssh` or `--ssh`:** Use SSH only. No HTTPS fallback. SSH agent check (#89) runs normally.
- **`--protocol` with invalid value:** Show error: "Invalid protocol. Use 'ssh' or 'https'."

### URL Construction

- **SSH URL:** `git@{gitHost}:{BOILERPLATE_REPO_PATH}` (existing behavior)
- **HTTPS URL:** `https://{gitHost}/{BOILERPLATE_REPO_PATH}.git` (derived from same `gitHost` config)

### Timeout Detection

- SSH clone is started with a 10-second timeout
- If the clone process does not produce output or complete within 10 seconds, it is killed and treated as a network timeout
- Only network timeouts trigger HTTPS fallback — authentication errors, permission errors, and other git errors do NOT trigger fallback (they are handled by existing error logic and SSH spec #89)

### Interaction with SSH Agent Check (Spec #89)

- When protocol is default or `ssh`: SSH agent check runs first, then SSH clone, then HTTPS fallback on timeout
- When protocol is `https`: SSH agent check is skipped entirely — go straight to HTTPS clone
- Auth/key errors detected by the SSH agent check do NOT trigger HTTPS fallback — they are handled per spec #89

### Authentication

- The CLI does not handle authentication for either protocol
- For SSH: handled by SSH agent/keys (spec #89)
- For HTTPS: handled by git's configured credential helper (osxkeychain, credential-manager, store, etc.) or git's native username/password prompt
- If HTTPS auth fails, the raw git error is surfaced to the user

### Validation

- `--protocol` accepts only: `ssh`, `https`
- `--protocol` and `--https`/`--ssh` are mutually exclusive — if both are provided, show error

## Data Model

No new data entities. This feature modifies runtime behavior of the clone operation only.

### State Transitions

```
[default protocol] → SSH agent check → SSH clone attempt
  SSH clone succeeds → [done]
  SSH clone timeout (10s) → [https_fallback] → HTTPS clone attempt
    HTTPS succeeds → [done] + show tip
    HTTPS fails → [error] (show both SSH + HTTPS errors)
  SSH clone auth error → [ssh_error] (handled by existing logic / spec #89)

[--protocol https] → HTTPS clone attempt
  HTTPS succeeds → [done]
  HTTPS fails → [error] (show HTTPS error)

[--protocol ssh] → SSH agent check → SSH clone attempt
  SSH clone succeeds → [done]
  SSH clone fails → [error] (show SSH error, no fallback)
```

## UI/UX Specification

### Happy Path: SSH works (default, no flag)

No change from current behavior. Clone proceeds via SSH as today.

### Happy Path: Explicit HTTPS

```
$ eni ai init my-project --https

⠋ Cloning boilerplate via HTTPS...
✓ Clone complete!
```

### Fallback Path: SSH times out, HTTPS succeeds

```
$ eni ai init my-project

⠋ Cloning boilerplate...
⚠ SSH timed out, switching to HTTPS...
⠋ Cloning via HTTPS...
✓ Clone complete!

💡 Tip: Use --protocol https to skip SSH next time
```

### Failure Path: SSH times out, HTTPS also fails

```
$ eni ai init my-project

⠋ Cloning boilerplate...
⚠ SSH timed out, switching to HTTPS...
⠋ Cloning via HTTPS...
✗ Could not clone the repository

  SSH:   Timed out after 10s (port 22 may be blocked)
  HTTPS: <git error message>

Check your network connection and git credentials.
```

### Failure Path: Explicit SSH, no fallback

```
$ eni ai init my-project --ssh

⠋ Cloning boilerplate...
✗ SSH connection timed out after 10s

Check your network connection or try --protocol https.
```

### Failure Path: Explicit HTTPS fails

```
$ eni ai init my-project --https

⠋ Cloning boilerplate via HTTPS...
✗ Clone failed: <git error message>
```

### Flag Validation Error

```
$ eni ai init my-project --protocol ftp

✗ Invalid protocol "ftp". Use "ssh" or "https".
```

```
$ eni ai init my-project --protocol https --ssh

✗ Cannot use --protocol with --https or --ssh. Pick one.
```

## Edge Cases

### Error Scenarios

| Scenario | Expected Behavior |
|----------|-------------------|
| SSH times out, HTTPS succeeds | Auto-switch with warning + tip message |
| SSH times out, HTTPS also fails | Show both errors with suggestions |
| SSH auth fails (not timeout) | Handled by existing error logic / SSH spec #89. No HTTPS fallback. |
| HTTPS clone fails (explicit --https) | Show git error as-is. No SSH fallback. |
| Invalid --protocol value | Show validation error, exit |
| --protocol + --https/--ssh combined | Show mutual exclusion error, exit |
| Network completely down | SSH timeout → HTTPS also fails → show both errors |
| gitHost is a custom domain (not github.com) | HTTPS URL still derived as `https://{gitHost}/{path}.git` — works for GitHub Enterprise, GitLab, etc. |

### Boundary Conditions

| Condition | Expected Behavior |
|-----------|-------------------|
| SSH fails instantly (connection refused, not timeout) | Treated as network error → trigger HTTPS fallback (same as timeout) |
| SSH fails with DNS resolution error | Treated as network error → trigger HTTPS fallback |
| SSH hangs indefinitely | Killed at 10s timeout → HTTPS fallback |
| HTTPS clone prompts for credentials (no helper) | Git's native prompt appears via inherited stdio. CLI does not interfere. |
| Large repo / slow clone | Only the initial connection has the 10s timeout. Once git starts receiving data, the timeout does not apply. |

## Acceptance Criteria

### Explicit HTTPS via flag

- [ ] **Given** the user passes `--protocol https`, **when** `eni init` or `eni ai init` runs, **then** the SSH agent check is skipped and the clone uses `https://{gitHost}/{path}.git`
- [ ] **Given** the user passes `--https`, **when** the CLI runs, **then** it behaves identically to `--protocol https`
- [ ] **Given** the user passes `--protocol ssh`, **when** the CLI runs, **then** SSH is used with no HTTPS fallback on failure
- [ ] **Given** the user passes `--ssh`, **when** the CLI runs, **then** it behaves identically to `--protocol ssh`

### Auto-fallback on SSH timeout

- [ ] **Given** no protocol flag is set and SSH clone does not respond within 10 seconds, **when** the timeout fires, **then** the SSH process is killed, a warning is shown, and HTTPS clone is attempted automatically
- [ ] **Given** SSH times out and HTTPS clone succeeds, **when** the clone completes, **then** a tip is displayed: "Use --protocol https to skip SSH next time"
- [ ] **Given** SSH times out and HTTPS clone also fails, **when** both attempts fail, **then** both error messages are displayed with a suggestion to check network and credentials

### No fallback on auth errors

- [ ] **Given** SSH fails with a permission/auth error (not timeout), **when** the error occurs, **then** HTTPS fallback is NOT triggered and the error is handled by existing SSH error logic

### No fallback with explicit SSH

- [ ] **Given** `--protocol ssh` is set and SSH times out, **when** the timeout fires, **then** no HTTPS fallback occurs and the error suggests trying `--protocol https`

### Flag validation

- [ ] **Given** an invalid protocol value, **when** the CLI parses flags, **then** an error is shown before any clone attempt
- [ ] **Given** both `--protocol` and `--https`/`--ssh` are provided, **when** the CLI parses flags, **then** a mutual exclusion error is shown

### Connection refused treated as network error

- [ ] **Given** SSH fails immediately with "Connection refused" or DNS error, **when** the error is detected, **then** HTTPS fallback is triggered (same as timeout behavior)
