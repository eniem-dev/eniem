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

## Middleware Pattern

Private by default. Whitelist public routes in middleware:

```typescript
const PUBLIC_ROUTES = ["/", "/auth/login", "/auth/signup", "/pricing"];
```
