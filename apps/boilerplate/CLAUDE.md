# ENIEM - Development Guide

NEVER COMMENT IN FRENCH. Even if the user talks in French.

## Tech Stack

```
Framework:    Next.js 15 + App Router
Auth:         BetterAuth (GitHub, SIWE, Twitter/X, OTP)
Database:     PostgreSQL
ORM:          Prisma
Payments:     Polar via BetterAuth
Storage:      DigitalOcean Spaces
Deployment:   Self-hosted Coolify
UI:           shadcn/ui + Tailwind CSS
Email:        Resend + React Email
Actions:      NextSafeAction
Validation:   Zod schemas
```

## Commands

```bash
# Development
pnpm dev              # Start dev server (Turbopack)
pnpm build            # Production build
pnpm start            # Start production server
pnpm lint             # Run ESLint

# Database
pnpm db:start         # Start PostgreSQL (Docker)
pnpm db:stop          # Stop PostgreSQL
pnpm db:migrate       # Run migrations (deploy)
pnpm db:push          # Push schema changes (dev)
pnpm db:studio        # Open Prisma Studio
pnpm db:reset         # Reset database
pnpm db:generate      # Generate Prisma client

# Tunneling
pnpm ngrok            # Expose local server (for webhooks)
```

## Database

```typescript
import { prisma } from "@/lib/prisma";

// Schema location: prisma/schema.prisma
// Always use prisma client from lib, never instantiate directly
const user = await prisma.user.findUnique({ where: { id } });
```

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

## Principles

1. **Convention over Configuration** - Standardized patterns, feature-based architecture
2. **DRY** - Abstract common patterns, reuse schemas and actions
3. **Programmer Happiness** - Self-documenting code, intuitive naming
4. **Conceptual Compression** - Simple abstractions, TypeScript-first

## Code Organization

### App Router Groups

```
app/
├── (auth)/          # Authentication pages
├── (docs)/          # Documentation
├── (landing)/       # Pre-launch landing
├── (marketing)/     # Marketing pages
├── (protected)/     # Authenticated pages
└── api/             # API routes
```

### Feature Architecture

```
features/{feature}/
├── components/      # Feature-specific UI
├── schemas/         # Zod validation
├── hooks/           # Custom hooks (optional)
├── queries/         # Data fetching (optional)
├── services/        # Business logic (optional)
└── index.ts         # Public API exports
```

### Public API Pattern

Each feature exports through `index.ts`:

```typescript
// features/authentication/index.ts
export { LoginForm, SignUpForm } from "./components";
export { loginSchema, signUpSchema } from "./schemas";
```

## Components

**Smart Components** (`features/`): Handle business logic, API calls, auth, error states
**Dumb Components** (`components/ui/`): Pure UI, props-driven, no business logic

## Locales & Metadata

All text in `locales/index.ts`. Structure:

```typescript
export const locales = {
  metadata: { /* global app metadata */ },
  errors: { /* error messages */ },
  success: { /* success messages */ },
  common: { /* shared labels: save, cancel, loading... */ },

  // Pages (with metadata for SEO)
  HomePage: { metadata: { title, description }, hero: {...} },
  SignUpPage: { metadata: { title, description } },

  // Components (UI labels only)
  SignUpForm: { title, emailLabel, submitButton },
  LoginForm: { title, emailLabel, passwordLabel },
} as const;
```

### Metadata Pattern

```typescript
import { createMetadata, getDefaultMetadata } from "@/lib/metadata";
import { locales } from "@/locales";

export const metadata = createMetadata({
  ...getDefaultMetadata(),
  title: locales.LoginPage.metadata.title,
  description: locales.LoginPage.metadata.description,
});
```

## Server Patterns

### Queries (RSC)

```typescript
import { createQuery, createAuthenticatedQuery } from "@/lib/server-handler";

// Public query (session can be null)
export const getData = () =>
  createQuery(async ({ session }) => {
    return { data: "public", userId: session?.user?.id };
  });

// Authenticated query (session & user guaranteed)
export const getProfile = () =>
  createAuthenticatedQuery(async ({ user }) => {
    return prisma.user.findUnique({ where: { id: user.id } });
  });
```

### Server Actions

```typescript
"use server";
import { actionClient, authenticatedActionClient } from "@/lib/safe-action.server";
import { updateProfileSchema } from "./schemas";

export const updateProfile = authenticatedActionClient
  .inputSchema(updateProfileSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { user } = ctx;
    await prisma.user.update({
      where: { id: user.id },
      data: parsedInput,
    });
    revalidatePath("/dashboard/profile");
    return { success: true };
  });
```

### API Routes

```typescript
import { createApiHandler, createAuthenticatedApiHandler } from "@/lib/server-handler";

export const GET = createApiHandler(async ({ session }) => {
  return { isAuthenticated: !!session?.user };
});

export const POST = createAuthenticatedApiHandler(
  async ({ user, input }) => ({ created: true, userId: user.id }),
  { validate: postSchema }
);
```

### Error Handling

```typescript
import { ServerError, UnauthorizedError, ValidationError } from "@/lib/errors";

throw new UnauthorizedError(); // 401
throw new ValidationError("Bad input"); // 400
throw new ServerError("Error", 500); // Custom status
```

### Email

```typescript
import {
  sendOtpEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendDeleteAccountEmail,
} from "@/lib/email";

// Available functions:
await sendOtpEmail(email, otp); // 6-digit verification code
await sendVerificationEmail(email, token, url); // Email verification link
await sendPasswordResetEmail(email, token, url); // Password reset link
await sendDeleteAccountEmail(email, token, url); // Account deletion confirmation

// Templates location: components/emails/
// In dev: logs to console with OTP/token/links for easy testing
// In prod: sends via Resend using env.email.fromAddress
```

## Authentication

### Route Protection

```typescript
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function ProtectedPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/auth/login");
  return <Dashboard user={session.user} />;
}
```

### Middleware Pattern

Private by default. Whitelist public routes in middleware:

```typescript
const PUBLIC_ROUTES = ["/", "/auth/login", "/auth/signup", "/pricing"];
```

## Logging & Analytics

```typescript
// NEVER use console.log - use logger
import { logger } from "@/lib/logger";
logger.info("Creating user", { email });
logger.error("Failed", { error: error.message });

// NEVER use PostHog directly - use tracking
import { captureEvent } from "@/lib/tracking";
captureEvent("button_clicked", { buttonName: "signup" });
```

## File Naming

- **Files**: kebab-case (`user-profile.tsx`)
- **Components**: PascalCase (`UserProfile`)
- **Functions**: camelCase (`getUserProfile`)
- **Constants**: SCREAMING_SNAKE_CASE (`API_BASE_URL`)

### Typed File Suffixes

- `.action.ts` - Server actions
- `.query.ts` - Data fetching
- `.schema.ts` - Zod validation
- `.service.ts` - Business logic

## Schema Validation

```typescript
import { z } from "zod";
import { locales } from "@/locales";

export const signUpSchema = z.object({
  email: z.string().email(locales.errors.invalidEmail),
  password: z.string().min(8, locales.errors.passwordTooShort),
});
```

## Quick Reference

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

## Documentation

Full docs available at `/docs`:

- `/docs/authentication` - Auth patterns (OAuth, SIWE, OTP, email/password)
- `/docs/features` - Server utilities, analytics, emails, uploads
- `/docs/payments` - Polar integration, subscriptions
- `/docs/security` - Security checklist

## Plan Mode

- Make the plan extremely concise. Sacrifice grammar for the sake of concision.
- At the end of each plan, give me a list of unresolved questions to answer, if any.

## Beads (Issue Tracking)

This project uses **bd** (beads) for issue tracking. Run `bd onboard` to get started.

### Quick Reference

```bash
bd ready              # Find available work
bd show <id>          # View issue details
bd update <id> --status in_progress  # Claim work
bd close <id>         # Complete work
bd sync --from-main   # Sync beads from main
```

### Beads Hygiene

- **Run `bd doctor` regularly** — diagnoses and fixes issues
- **Keep tasks small** — ~2 minutes each; if longer, break down
- **Run `bd cleanup` when > 200 issues** — keep database performant
- **File issues for discovered work** — anything > 2 min gets a bead
- **Near-term focus** — beads is for this week's work, not distant backlog

### Session Completion

**When ending a work session**, complete ALL steps below. Work is NOT complete until `git push` succeeds.

1. **File issues for remaining work** - Create beads for anything needing follow-up
2. **Run quality gates** (if code changed) - `pnpm build && pnpm lint`
3. **Update issue status** - `bd close` finished work
4. **PUSH TO REMOTE** - This is MANDATORY:
   ```bash
   git pull --rebase
   bd sync --from-main
   git push
   ```
5. **Verify** - `git status` must show "up to date with origin"

**CRITICAL:** Work is NOT complete until `git push` succeeds. Never stop before pushing.
