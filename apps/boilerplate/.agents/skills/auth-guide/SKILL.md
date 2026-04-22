---
name: auth-guide
description: "Authentication reference for BetterAuth integration. Use when user says '/auth-guide', or when implementing login, signup, auth providers, OAuth, OTP, SIWE, middleware, route protection, email verification, password reset, or user deletion."
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

## Route Protection & Secure Handlers

Three patterns, pick by surface area. All three are authoritative — don't roll your own session check.

### 1. Protected RSC page (inline check)

Use when an entire page should redirect unauthenticated users to login.

```typescript
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function ProtectedPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/auth/login");
  return <Dashboard user={session.user} />;
}
```

### 2. Authenticated data fetching (`createAuthenticatedQuery`)

Use for server-side queries that require a user. The handler gets `{ user, session }` guaranteed non-null; no inline redirect needed — the wrapper throws `UnauthorizedError` which your error boundary handles.

```typescript
import { createAuthenticatedQuery } from "@/lib/server-handler";

export const getProfile = () =>
  createAuthenticatedQuery(async ({ user }) => {
    return getUserProfile(user.id);
  });
```

Always call a service function from inside the query — no direct `prisma` in queries. For public queries (session may be null), use `createQuery`.

### 3. Secure API route (`createAuthenticatedApiHandler`)

Use for API routes that require a user. Signature includes optional `validate` for Zod input validation.

```typescript
import { createAuthenticatedApiHandler } from "@/lib/server-handler";
import { postSchema } from "./schemas";

export const POST = createAuthenticatedApiHandler(
  async ({ user, input }) => ({ created: true, userId: user.id }),
  { validate: postSchema }
);
```

For public API routes, use `createApiHandler`. See `docs/server-patterns.md` for error-handling conventions (`UnauthorizedError`, `ValidationError`, `ServerError`).

### Rule of thumb

- Page that should redirect on failure → inline `auth.api.getSession` + `redirect`.
- Data for a page/component → `createAuthenticatedQuery`.
- Route handler (`app/api/.../route.ts`) → `createAuthenticatedApiHandler`.

## Middleware Pattern

Private-by-default. Three route categories:

1. **Landing mode** — when `LANDING_MODE=true`, only landing + legal pages accessible
2. **Public routes** — exact match list (`/`, `/auth/login`, `/pricing`, etc.) + prefix match (`/blog`)
3. **Access-gated routes** — require active subscription (configurable: subscription, one-time purchase, or hybrid)

```typescript
// In middleware.ts — choose ONE access model:
const hasUserAccess = await hasActiveSubscription(userId);     // Subscription
// const hasUserAccess = await hasActiveOrder(userId);          // One-time
// const hasUserAccess = await hasActiveSubscription(userId) || await hasActiveOrder(userId); // Hybrid
```

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
