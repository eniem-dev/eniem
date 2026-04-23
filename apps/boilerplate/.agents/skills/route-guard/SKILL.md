---
name: route-guard
description: "Request-time route protection and secure server handlers. Use when user says '/route-guard', or when implementing protected pages, secure API routes, authenticated queries, authenticated handlers, middleware, session checks, gated content, subscription-gated routes, or private-by-default routing."
---

# Route Guard

Request-time protection for pages, queries, API routes, and middleware. All patterns are authoritative — don't roll your own session check.

## Three Protection Patterns

Pick by surface area.

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

Use for server-side queries that require a user. The handler gets `{ user, session }` guaranteed non-null; no inline redirect needed — the wrapper throws `UnauthorizedError` which the error boundary handles.

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

1. **Landing mode** — when `LANDING_MODE=true`, only landing + legal pages are accessible.
2. **Public routes** — exact match list (`/`, `/auth/login`, `/pricing`, etc.) + prefix match (`/blog`).
3. **Access-gated routes** — require active subscription (configurable: subscription, one-time purchase, or hybrid).

```typescript
// In middleware.ts — choose ONE access model:
const hasUserAccess = await hasActiveSubscription(userId);     // Subscription
// const hasUserAccess = await hasActiveOrder(userId);          // One-time
// const hasUserAccess = await hasActiveSubscription(userId) || await hasActiveOrder(userId); // Hybrid
```

Public-route whitelist lives in `src/middleware.ts`.

## Related

- BetterAuth configuration, providers, flows, rate limits → `.agents/skills/auth-guide/SKILL.md`
- Error classes used by the wrappers (`UnauthorizedError`, `ValidationError`, `ServerError`) → `docs/server-patterns.md`
- Subscription/order access helpers (`hasActiveSubscription`, `hasActiveOrder`) → `.agents/skills/payments-polar/SKILL.md`
