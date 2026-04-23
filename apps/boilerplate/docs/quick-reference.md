# Quick Reference

## Config

```typescript
import { env, routes } from "@/config";

// Typed environment variables
env.database.url;
env.email.resendApiKey;
env.email.fromAddress;
env.polar.accessToken;

// Type-safe routes
routes.auth.login; // "/auth/login"
routes.dashboard.home; // "/dashboard"
```

## Database

```typescript
import { prisma } from "@/lib/prisma";

// Schema location: prisma/schema.prisma
// Always use prisma client from lib, never instantiate directly
const user = await prisma.user.findUnique({ where: { id } });
```

## Import Table

| Pattern              | Import                                                                |
| -------------------- | --------------------------------------------------------------------- |
| Prisma client        | `prisma` from `@/lib/prisma`                                          |
| Environment          | `env` from `@/config`                                                 |
| Routes               | `routes` from `@/config`                                              |
| Auth session         | `auth.api.getSession({ headers: await headers() })`                   |
| Authenticated action | `authenticatedActionClient` from `@/lib/safe-action.server`           |
| Public query         | `createQuery` from `@/lib/server-handler`                             |
| Auth query           | `createAuthenticatedQuery` from `@/lib/server-handler`                |
| Errors               | `ServerError, UnauthorizedError, ValidationError` from `@/lib/errors` |
| Email                | `sendOtpEmail, sendVerificationEmail...` from `@/lib/email`           |
| Logger               | `logger` from `@/lib/logger`                                          |
| Analytics            | `captureEvent` from `@/lib/tracking`                                  |
| Locales              | `locales` from `@/locales`                                            |
| Metadata             | `createMetadata, getDefaultMetadata` from `@/lib/metadata`            |
