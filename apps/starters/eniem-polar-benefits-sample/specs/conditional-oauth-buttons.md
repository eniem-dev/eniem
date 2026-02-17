# Conditional OAuth Buttons

## Overview

Hide GitHub and Twitter OAuth buttons when their respective environment variables are not configured. Server-side detection passes available providers to auth forms, preventing UI from showing non-functional auth options.

## Job to Be Done

Allow deployment of the app without requiring all OAuth providers to be configured. Developers/operators can enable only the auth providers they have credentials for.

## Target User

- Developers deploying the app
- End users see only functional auth options

## Requirements

### Must Have

- [ ] Create `getAvailableOAuthProviders()` helper in auth lib
- [ ] Check for `GITHUB_CLIENT_ID` + `GITHUB_CLIENT_SECRET` existence
- [ ] Check for Twitter OAuth env vars existence
- [ ] Update login page RSC to call helper, pass `availableProviders` to `LoginForm`
- [ ] Update signup page RSC to call helper, pass `availableProviders` to `SignUpForm`
- [ ] Conditionally render GitHub button based on `availableProviders`
- [ ] Conditionally render Twitter button based on `availableProviders`

### Nice to Have

- [ ] TypeScript type for available providers array

## Constraints

- SIWE/wallet connect always visible (same section as OAuth buttons)
- No API endpoint needed - server component handles detection
- No special security measures required (UI-only hiding)

## Acceptance Criteria

- [ ] GitHub button hidden when `GITHUB_CLIENT_ID` or `GITHUB_CLIENT_SECRET` missing
- [ ] GitHub button shown when both env vars present
- [ ] Twitter button hidden when Twitter OAuth env vars missing
- [ ] Twitter button shown when Twitter OAuth env vars present
- [ ] Wallet connect button always visible regardless of OAuth config
- [ ] Works on both login and signup pages

## Edge Cases

- No OAuth configured: Only wallet connect visible in auth section
- Partial env vars (ID without secret): Treat as unconfigured, hide button
- All providers configured: All buttons visible (current behavior)

## Out of Scope

- SIWE visibility toggling
- OTP visibility toggling
- API endpoint for provider discovery
- Server-side rejection of unconfigured providers
- Logging/analytics for this feature
