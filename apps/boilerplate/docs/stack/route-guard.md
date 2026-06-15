
# Route Guard

Request-time protection for pages, queries, API routes, and middleware. All patterns are authoritative — don't roll your own session check.

## Three Protection Patterns

Pick by surface area.

### 1. Protected RSC page (inline check)

Use when an entire page should redirect unauthenticated users to login.

```typescript
import { auth } from "@/lib/auth/config";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function ProtectedPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/auth/login");
  return <Dashboard user={session.user} />;
}
```

### 2. Authenticated data fetching (`authed.query`)

Use for server-side queries that require a user. The handler gets `{ user, session }` guaranteed non-null; no inline redirect needed — the wrapper throws `UnauthorizedError` which the error boundary handles.

```typescript
import { authed } from "@/lib/handler";

export const getProfile = () =>
  authed.query(async ({ user }) => {
    return getUserProfile(user.id);
  });
```

Always call a service function from inside the query — no direct `prisma` in queries. For public queries (session may be null), use `publicly.query`.

### 3. Secure API route (`authed.route`)

Use for API routes that require a user. Chain `.input(schema)` for Zod input validation.

```typescript
import { authed } from "@/lib/handler";
import { postSchema } from "./schemas";

export const POST = authed
  .input(postSchema)
  .route(async ({ user, input }) => ({ created: true, userId: user.id }));
```

For public API routes, use `publicly.route`. See `docs/server-patterns.md` for error-handling conventions (`UnauthorizedError`, `ValidationError`, `ServerError`).

### Rule of thumb

- Page that should redirect on failure → inline `auth.api.getSession` + `redirect`.
- Data for a page/component → `authed.query`.
- Route handler (`app/api/.../route.ts`) → `authed.route`.

## Middleware Pattern

Private-by-default. Three route categories:

1. **Landing mode** — when `LANDING_MODE=true`, only landing + legal pages are accessible.
2. **Public routes** — exact match list (`/`, `/auth/login`, `/pricing`, etc.) + prefix match (`/blog`).
3. **Access-gated routes** — require active subscription (configurable: subscription, one-time purchase, or hybrid).

```typescript
// In middleware.ts — choose ONE access model:
const hasUserAccess = await hasActiveSubscription(userId);     // Subscription (`@/features/billing`)
// const hasUserAccess = await hasActiveOrder(userId);          // One-time (`@/features/benefits`)
// const hasUserAccess = await hasActiveSubscription(userId) || await hasActiveOrder(userId); // Hybrid
```

Public-route whitelist lives in `src/middleware.ts`.

## Related

- BetterAuth configuration, providers, flows, rate limits → `docs/stack/auth-guide.md`
- Error classes used by the wrappers (`UnauthorizedError`, `ValidationError`, `ServerError`) → `docs/server-patterns.md`
- Subscription/order access helpers (`hasActiveSubscription` from billing, `hasActiveOrder` from benefits) → `docs/stack/payments-polar.md`
