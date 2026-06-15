# Quick Reference

## Config

```typescript
import { env, routes } from "@/config";

// Typed environment variables
env.database.url;
env.email.resendApiKey;
env.email.fromAddress;
env.payment.polarServer;

// Type-safe routes
routes.auth.login; // "/login"
routes.dashboard; // "/dashboard"
```

## Database

```typescript
import { prisma } from "@/lib/db";

// Schema location: prisma/schema.prisma
// Always use prisma client from lib/db, never instantiate directly.
// Put DB access in services; queries/actions/routes call services.
export async function getUserProfile(userId: string) {
  return prisma.user.findUnique({ where: { id: userId } });
}
```

## Import Table

| Pattern              | Import                                                                                  |
| -------------------- | --------------------------------------------------------------------------------------- |
| Prisma client        | `prisma` from `@/lib/db` (services only)                                                 |
| Environment          | `env` from `@/config`                                                                   |
| Routes               | `routes` from `@/config`                                                                |
| Auth config          | `auth` from `@/lib/auth/config`                                                         |
| Auth client          | `authClient`, `signIn`, `signUp`, `signOut`, `useSession` from `@/lib/auth-client`      |
| Authenticated action | `authed.action(...)` from `@/lib/handler`                                               |
| Public query         | `publicly.query(...)` from `@/lib/handler`                                              |
| Auth query           | `authed.query(...)` from `@/lib/handler`                                                |
| API route handlers   | `authed.route(...)` / `publicly.route(...)` from `@/lib/handler`                        |
| Errors               | `ServerError, UnauthorizedError, ValidationError` from `@/lib/errors`                   |
| Email dispatcher     | `sendEmail` from `@/lib/email/send-email`                                               |
| Email types          | `EmailMessage, EmailResult` from `@/lib/email/types`                                    |
| Logger               | `logger` from `@/lib/logger`                                                            |
| Analytics            | `captureEvent` from `@/lib/tracking`                                                    |
| Billing products     | `getCheckoutProducts, getDisplayProducts` from `@/features/billing`                     |
| Polar gateway        | `polar` / `type PolarGateway` from `@/lib/polar`                                        |
| Locales              | `locales` from `@/locales`                                                              |
| Metadata             | `createMetadata, getDefaultMetadata` from `@/lib/metadata`                              |
