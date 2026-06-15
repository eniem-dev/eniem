# Authentication Guide

## Overview

BetterAuth with 5 auth flows: email/password, Email OTP, GitHub OAuth, Twitter OAuth, and SIWE (Sign In With Ethereum). Middleware is private by default. Polar customers are created on signup through the Polar BetterAuth plugin.

## Key Files

- `src/lib/auth/config.ts` — server-side BetterAuth config composition
- `src/lib/auth/oauth.ts` — social provider configuration
- `src/lib/auth/rate-limit.ts` — rate-limit rules
- `src/lib/auth/email-hooks.ts` — auth email callbacks using `sendEmail`
- `src/lib/auth/user-hooks.ts` — change-email and delete-user hooks
- `src/lib/auth/plugins/` — Email OTP, Polar, and SIWE plugin wiring
- `src/lib/auth/side-effects.ts` — auth lifecycle/webhook bridge to feature services
- `src/lib/auth-client.ts` — client-side auth client (React hooks, plugins)
- `src/lib/auth.constants.ts` — OTP length, expiry, max attempts, password reset expiry
- `src/middleware.ts` — route protection (private-by-default, public route whitelist)
- `src/features/authentication/` — auth components, schemas, hooks, and SIWE verifier
- `src/lib/email/send-email.ts` — email dispatcher (dev: logger output, prod: Resend)
- `src/lib/email/types.ts` — discriminated `EmailMessage` and `EmailResult` unions

## Auth Flows

### Email/Password

- `requireEmailVerification: true` — users must verify before accessing protected routes
- `autoSignInAfterVerification: true` — auto sign-in after email verification
- Password reset is wired through `sendResetPassword()` in `src/lib/auth/email-hooks.ts`
- Reset links expire in `AUTH_CONSTANTS.PASSWORD_RESET_EXPIRES_IN_SECONDS` (1 hour)

### Email OTP

- Plugin: `emailOtpPlugin` in `src/lib/auth/plugins/email-otp.ts`
- Client: `authClient.emailOtp.sendVerificationOtp()`
- OTP length: 6 digits, expires in 5 minutes, max 3 attempts
- Sends via `sendOtp({ email, otp })`, which dispatches `{ type: "otp" }` through `sendEmail`

### OAuth (GitHub, Twitter)

- Configured in `src/lib/auth/oauth.ts`
- Conditionally enabled via env vars (`GITHUB_CLIENT_ID`, `TWITTER_CLIENT_ID`)
- `getAvailableOAuthProviders()` returns only providers with configured credentials
- Client: `signIn.social({ provider: "github" })`

### SIWE (Sign In With Ethereum)

- Plugin: `siwePlugin` in `src/lib/auth/plugins/siwe.ts`
- Verification delegates through `src/lib/auth/side-effects.ts` to the authentication feature's SIWE verifier service
- Client hook: `useEthereumAuth()` in `src/features/authentication/hooks/use-ethereum-auth.ts`
- Flow: nonce → SIWE message → wallet signs → server verifies → session created
- `anonymous: true` — allows wallet-only accounts without email

## Rate Limiting

Rules live in `src/lib/auth/rate-limit.ts` and are passed into `betterAuth()` from `src/lib/auth/config.ts`:

```typescript
rateLimit: {
  enabled: true,
  window: 60,
  max: 100,
  storage: "database",
  customRules: {
    "/sign-in/email": { window: 10, max: 3 },
    "/sign-up/email": { window: 10, max: 3 },
    "/email-otp/send-verification-otp": { window: 60, max: 3 },
    "/sign-in/email-otp": { window: 10, max: 3 },
  },
}
```

Client-side handling in `src/lib/auth-client.ts` reads the `X-Retry-After` header and shows a localized message.

## Protecting Routes

For route protection (RSC pages, secure handlers, middleware), see `docs/stack/route-guard.md`.

## Email Callbacks

Auth events trigger emails via callbacks in `src/lib/auth/email-hooks.ts`:

- `emailAndPassword.sendResetPassword` → `sendResetPassword()` → `{ type: "password-reset" }`
- `emailVerification.sendVerificationEmail` → `sendVerificationEmail()` → `{ type: "verification" }`
- `user.changeEmail.sendChangeEmailVerification` → `sendChangeEmailVerification()` → `{ type: "verification" }` (sent to current email)
- `user.deleteUser.sendDeleteAccountVerification` → `sendDeleteAccountVerification()` → `{ type: "delete-account" }`
- Email OTP plugin → `sendOtp()` → `{ type: "otp" }`

Low-level delivery returns `EmailResult`. Auth hooks are the BetterAuth boundary where delivery failures should be converted into auth-flow failures.

## User Deletion

`user.deleteUser.afterDelete` delegates to `onUserDeleted(user.id)`, which attempts Polar customer cleanup after the local BetterAuth user has been deleted. Missing Polar customers are idempotent non-errors in the Polar gateway. Other Polar SDK/network failures are logged with `userId` and a safe error message, then swallowed so confirmed account deletion is not blocked by third-party cleanup.

If guaranteed external cleanup with retries is needed, add an explicit retry/outbox workflow rather than duplicating Polar cleanup in routes or making the BetterAuth delete-user hook fail.

## Adding a New Auth Provider

1. Add env vars to `src/config/env.ts` under `oauth`
2. Add provider to `socialProviders` in `src/lib/auth/oauth.ts`
3. Update `getAvailableOAuthProviders()` to include the new provider
4. Add client-side button in `src/features/authentication/components/social-auth-buttons.tsx`
5. Add env vars to `.env.example`

## Auth Schemas

Located in `src/features/authentication/schemas/auth.schema.ts`:

- `loginSchema` — email + optional password + optional OTP
- `signupSchema` — email + optional password/confirmation + optional OTP, with refine for password match
- Both use `locales.errors.*` for validation messages

## Auth Hook

`useAuthForm({ schema, mode, callbackURL, loginRedirectURL })` in `src/features/authentication/hooks/use-auth-form.ts`:

- Handles both email/password and OTP flows
- Manages states: `codeSent`, `emailNotVerified`, `pendingVerificationEmail`
- Returns: `form`, `loading`, `onSubmit`, `onOtpComplete`, `handleSendCode`, `resendVerificationEmail`
