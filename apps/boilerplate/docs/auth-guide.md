# Authentication Guide

## Route Protection

```typescript
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function ProtectedPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/auth/login");
  return <Dashboard user={session.user} />;
}
```

## Server Handlers

Use `createAuthenticatedQuery` for server-side data fetching and `createAuthenticatedApiHandler` for API routes — both guarantee an authenticated session:

```typescript
import { createAuthenticatedQuery } from "@/lib/server-handler";

export const getProfile = () =>
  createAuthenticatedQuery(async ({ user }) => {
    return getUserProfile(user.id);
  });
```

```typescript
import { createAuthenticatedApiHandler } from "@/lib/server-handler";

export const POST = createAuthenticatedApiHandler(
  async ({ user, input }) => ({ created: true, userId: user.id }),
  { validate: postSchema }
);
```

See `docs/server-patterns.md` for full usage.

## Middleware Pattern

Private by default. Whitelist public routes in middleware:

```typescript
const PUBLIC_ROUTES = ["/", "/auth/login", "/auth/signup", "/pricing"];
```
