# Feature Architecture

## App Router Groups

```
app/
├── (auth)/          # Authentication pages
├── (docs)/          # Documentation
├── (landing)/       # Pre-launch landing
├── (marketing)/     # Marketing pages
├── (protected)/     # Authenticated pages
└── api/             # API routes
```

## Feature Structure

```
features/{feature}/
├── components/      # Feature-specific UI
├── schemas/         # Zod validation
├── hooks/           # Custom hooks (optional)
├── queries/         # Data fetching (optional)
├── services/        # Business logic (optional)
└── index.ts         # Public API exports
```

## Public API Pattern

Each feature exports through `index.ts`:

```typescript
// features/authentication/index.ts
export { LoginForm, SignUpForm } from "./components";
export { loginSchema, signUpSchema } from "./schemas";
```

## Components

**Smart Components** (`features/{feature}/components/`): Handle business logic, API calls, auth, error states
**Dumb Components** (`components/`): Reusable UI, props-driven, no business logic
**Shadcn Components** (`components/ui/`): Generated shadcn/ui primitives — do not edit directly

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

## Schema Validation

```typescript
import { z } from "zod";
import { locales } from "@/locales";

export const signUpSchema = z.object({
  email: z.string().email(locales.errors.invalidEmail),
  password: z.string().min(8, locales.errors.passwordTooShort),
});
```
