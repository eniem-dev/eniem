---
name: auth-guide
description: "BetterAuth integration reference. Use when user says '/auth-guide', or when implementing login, signup, auth providers, OAuth (GitHub/Twitter), Email OTP, SIWE, rate limits, email verification, password reset, account deletion, or auth schemas/hooks. For protecting pages/APIs/middleware, use route-guard instead."
---

# Authentication Guide

## Overview

BetterAuth with 5 auth flows: email/password, Email OTP, GitHub OAuth, Twitter OAuth, SIWE (Sign In With Ethereum). Private-by-default middleware. Polar customer created on signup.

## Key Files

- `src/lib/auth.ts` — Server-side BetterAuth config (providers, plugins, rate limits, email callbacks)
- `src/lib/auth-client.ts` — Client-side auth client (React hooks, plugins)
- `src/lib/auth.constants.ts` — OTP length, expiry, max attempts, password reset expiry
- `src/middleware.ts` — Route protection (private-by-default, public route whitelist)
- `src/features/authentication/` — Components, schemas, hooks
- `src/lib/email.ts` — Email sending (dev: console log, prod: Resend)

## Auth Flows

### Email/Password
- `requireEmailVerification: true` — users must verify before accessing protected routes
- `autoSignInAfterVerification: true` — auto sign-in after email verification
- Password reset via `sendPasswordResetEmail()`, expires in `AUTH_CONSTANTS.PASSWORD_RESET_EXPIRES_IN_SECONDS` (1 hour)

### Email OTP
- Plugin: `emailOTP()` in auth config
- Client: `authClient.emailOtp.sendVerificationOtp()`
- OTP length: 6 digits, expires in 5 minutes, max 3 attempts
- Sends via `sendOtpEmail(email, otp)`

### OAuth (GitHub, Twitter)
- Conditionally enabled via env vars (`GITHUB_CLIENT_ID`, `TWITTER_CLIENT_ID`)
- `getAvailableOAuthProviders()` returns only providers with configured credentials
- Client: `signIn.social({ provider: "github" })`

### SIWE (Sign In With Ethereum)
- Plugin: `siwe()` with viem for message verification
- Client hook: `useEthereumAuth()` in `src/features/authentication/hooks/use-ethereum-auth.ts`
- Flow: nonce → SIWE message → wallet signs → server verifies → session created
- `anonymous: true` — allows wallet-only accounts without email

## Rate Limiting

```typescript
rateLimit: {
  window: 60, max: 100, storage: "database",
  customRules: {
    "/sign-in/email": { window: 10, max: 3 },
    "/sign-up/email": { window: 10, max: 3 },
    "/email-otp/send-verification-otp": { window: 60, max: 3 },
    "/sign-in/email-otp": { window: 10, max: 3 },
  }
}
```

Client-side handling in `auth-client.ts` reads `X-Retry-After` header and shows locale message.

## Protecting Routes

For route protection (RSC pages, secure handlers, middleware), see `.agents/skills/route-guard/SKILL.md` or invoke `/route-guard`.

## Email Callbacks

Auth events trigger emails via callbacks in `auth.ts`:
- `emailAndPassword.sendResetPassword` → `sendPasswordResetEmail()`
- `emailVerification.sendVerificationEmail` → `sendVerificationEmail()`
- `user.changeEmail.sendChangeEmailVerification` → `sendVerificationEmail()` (sent to current email)
- `user.deleteUser.sendDeleteAccountVerification` → `sendDeleteAccountEmail()`

## User Deletion

`user.deleteUser.afterDelete` hook cascades to Polar:
```typescript
await polarClient.customers.deleteExternal({ externalId: user.id });
```

## Adding a New Auth Provider

1. Add env vars to `src/config/env.ts` under `oauth`
2. Add provider to `socialProviders` in `src/lib/auth.ts`
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
