# Handle Error in Checkout Redirection

## Overview

Fix silent failure when `authClient.checkout()` fails on the choose-plan page. Currently shows "Redirecting to checkout..." indefinitely when Polar API returns an error (e.g., archived product).

## Job to Be Done

User attempting to subscribe sees clear feedback when checkout fails, with options to retry or get help.

## Target User

Any user attempting to purchase a subscription plan.

## Requirements

### Must Have

- [ ] Catch errors from `authClient.checkout()` in `choose-plan-content.tsx`
- [ ] Display error state UI replacing the loading spinner when checkout fails
- [ ] Show generic error message (same for all failure types)
- [ ] Include "Try Again" button to retry checkout
- [ ] Include mailto link to support email
- [ ] Add `SUPPORT_EMAIL` environment variable to config
- [ ] Log checkout errors with `logger.error()` for debugging

### Nice to Have

- [ ] Track checkout errors in analytics (optional)

## Constraints

- Must use existing UI patterns (sonner toast is available but inline error state preferred for this flow)
- Support email must come from env config, not hardcoded

## Acceptance Criteria

- [ ] When Polar API returns error (500, archived product, etc.), error UI displays within 1s
- [ ] Error UI shows: error message, retry button, support email link
- [ ] Clicking "Try Again" re-triggers `authClient.checkout()` with same params
- [ ] Support email link opens mailto with `SUPPORT_EMAIL` value
- [ ] Loading spinner no longer shows indefinitely on failure

## Edge Cases

- **Network timeout:** Show same generic error, user can retry
- **Multiple rapid retries:** Prevent double-submit (use existing `hasTriggeredCheckout` ref pattern)
- **Missing SUPPORT_EMAIL env:** Fallback to `env.email.fromAddress` or hide contact link

## Out of Scope

- Specific error messages per failure type
- Automatic retry logic
- Error reporting to external service (Sentry, etc.)

## Technical Hints

- **Files to modify:**
  - `src/components/choose-plan-content.tsx` - Add error state, wrap checkout in try/catch
  - `src/config/env.ts` - Add `SUPPORT_EMAIL` to config schema
  - `src/locales/index.ts` - Add error message strings under `ChoosePlanPage`
  - `.env.example` - Document new env var

- **Files to create:** None

- **Patterns to follow:**
  - Error state pattern: See `src/features/authentication/components/reset-password.tsx` for `useState` error handling
  - Env config pattern: See existing `env.email.*` structure in `src/config/env.ts`
  - Locale pattern: Add to existing `ChoosePlanPage` object

- **Dependencies:** None

## Verification Commands

| Criterion | Command |
|-----------|---------|
| Error state catches checkout failures | `grep -q "catch.*error" src/components/choose-plan-content.tsx && echo pass` |
| Error UI has retry button | `grep -q "Try Again\|tryAgain" src/components/choose-plan-content.tsx && echo pass` |
| Support email link present | `grep -q "mailto:" src/components/choose-plan-content.tsx && echo pass` |
| SUPPORT_EMAIL in env config | `grep -q "SUPPORT_EMAIL\|supportEmail" src/config/env.ts && echo pass` |
| Error messages in locales | `grep -q "checkoutError\|checkoutFailed" src/locales/index.ts && echo pass` |
| Logger used for errors | `grep -q "logger.error" src/components/choose-plan-content.tsx && echo pass` |

## Test Requirements

- [ ] Test: Checkout failure displays error UI (mock `authClient.checkout` to reject)
- [ ] Test: Retry button triggers new checkout attempt
- [ ] Test: Support email link contains correct mailto href
- [ ] Test: Error state replaces loading state (no spinner visible)
