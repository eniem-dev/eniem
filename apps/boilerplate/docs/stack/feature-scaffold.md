
# Feature Scaffold Guide

## Overview

Features live in `src/features/{feature-name}/`. Each feature is a self-contained module with strict file conventions, typed suffixes, and a public API via `index.ts`.

## Directory Structure

```
src/features/{feature-name}/
├── index.ts              # Public API — ALL imports go through here
├── models/
│   └── {name}.model.ts   # TypeScript interfaces and types
├── schemas/
│   └── {name}.schema.ts  # Zod validation schemas
├── services/
│   └── {name}.service.ts # Business logic (pure async functions)
├── queries/
│   └── {name}.query.ts   # Server-side data fetching (RSC)
├── actions/
│   └── {name}.action.ts  # Server actions ("use server")
├── hooks/
│   └── use-{name}.ts     # Client-side React hooks
└── components/
    └── {name}.tsx         # Feature-specific UI components
```

Not every folder is required — only create what the feature needs.

## Step-by-Step: Creating a New Feature

### 1. Define the Model

```typescript
// src/features/my-feature/models/my-feature.model.ts
export interface MyFeatureResult {
  id: string;
  name: string;
  createdAt: Date;
}
```

### 2. Create the Schema

```typescript
// src/features/my-feature/schemas/my-feature.schema.ts
import { z } from "zod";
import { locales } from "@/locales";

export const createMyFeatureSchema = z.object({
  name: z.string().min(1, locales.errors.nameRequired),
});

export type CreateMyFeatureInput = z.infer<typeof createMyFeatureSchema>;
```

Rules:
- Always use `locales.errors.*` for validation messages
- Export both schema and inferred type
- Use factory functions `()` for dynamic schemas (e.g., file uploads with env-based limits)
- Use `.refine()` for cross-field validation

### 3. Write the Service

```typescript
// src/features/my-feature/services/my-feature.service.ts
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

export async function getMyFeature(id: string) {
  return prisma.myFeature.findUnique({ where: { id } });
}

export async function createMyFeature(userId: string, data: { name: string }) {
  logger.info("Creating feature", { userId, name: data.name });
  return prisma.myFeature.create({
    data: { ...data, userId },
  });
}
```

Rules:
- Pure async functions, no classes
- Always log context (userId, relevant IDs)
- Use `logger` from `@/lib/logger`, never `console.log`
- Use `locales` for user-facing error messages
- Use JSDoc for guard functions (like `assertHasCredits`)

### 4. Create the Query

```typescript
// src/features/my-feature/queries/my-feature.query.ts
import { authed } from "@/lib/handler";
import { getMyFeature } from "../services/my-feature.service";

export const getMyFeatureQuery = (id: string) =>
  authed.query(async ({ user }) => {
    return getMyFeature(id);
  });
```

Rules:
- Query is a **factory function** that returns `publicly.query()` or `authed.query()`
- Parameters are closure arguments (e.g., `id`)
- Handler receives `{ session }` (public) or `{ session, user }` (authenticated)
- Returns `Result<T>`: `{ data: T, error: null }` or `{ data: null, error: string }`

### 5. Create the Action

```typescript
// src/features/my-feature/actions/my-feature.action.ts
"use server";

import { ServerError } from "@/lib/errors";
import { authed } from "@/lib/handler";
import { createMyFeatureSchema } from "../schemas/my-feature.schema";
import { createMyFeature } from "../services/my-feature.service";
import { logger } from "@/lib/logger";
import { locales } from "@/locales";

export const createMyFeatureAction = authed
  .input(createMyFeatureSchema)
  .action(async ({ input, user }) => {
    try {
      logger.info("Creating feature", { userId: user.id });
      const result = await createMyFeature(user.id, input);
      return { success: true, data: result };
    } catch (error) {
      logger.error("Failed to create feature", {
        userId: user.id,
        error: error instanceof Error ? error.message : String(error),
      });
      throw new ServerError(locales.errors.serverError);
    }
  });
```

Rules:
- Always start with `"use server"` directive
- Use `publicly` (public) or `authed` (requires auth) root from `@/lib/handler`
- Chain `.input(schema).action(handler)`
- Log before and after key operations
- Throw typed errors with `locales.errors.*` messages

### 6. Create the Component

```typescript
// src/features/my-feature/components/my-feature-form.tsx
"use client";

import { useAction } from "next-safe-action/hooks";
import { createMyFeatureAction } from "../actions/my-feature.action";

export function MyFeatureForm() {
  const { execute, isExecuting } = useAction(createMyFeatureAction);
  // ...
}
```

Rules:
- **Smart components** live in `features/` — handle business logic, API calls, auth
- **Dumb components** live in `src/components/ui/` — pure UI, props-driven
- Feature components use feature's own actions/hooks, never import from other features' internals

### 7. Set Up the Index

```typescript
// src/features/my-feature/index.ts

// Models
export type { MyFeatureResult } from "./models/my-feature.model";

// Schemas
export { createMyFeatureSchema } from "./schemas/my-feature.schema";
export type { CreateMyFeatureInput } from "./schemas/my-feature.schema";

// Services
export { getMyFeature, createMyFeature } from "./services/my-feature.service";

// Queries
export { getMyFeatureQuery } from "./queries/my-feature.query";

// Actions
export { createMyFeatureAction } from "./actions/my-feature.action";

// Components
export { MyFeatureForm } from "./components/my-feature-form";
```

Rules:
- Organize exports by: Types/Models → Schemas → Services → Queries → Actions → Hooks → Components
- **All external imports** must go through `index.ts` — never import from internal paths
- Use `export type` for type-only exports

### 8. Add Locales

```typescript
// In src/locales/index.ts, add:

MyFeaturePage: {
  metadata: {
    title: "My Feature - Your App Name",
    description: "Description for SEO",
  },
  // Page-specific labels
  title: "My Feature",
  createButton: "Create",
},

// For reusable components:
MyFeatureForm: {
  nameLabel: "Name",
  submitButton: "Create Feature",
},
```

Rules:
- Pages get `PageNamePage` key with nested `metadata` object
- Reusable components get `ComponentName` key
- Error messages go in top-level `errors` object
- Success messages go in top-level `success` object

### 9. Add Page Metadata

```typescript
// In your page file:
import { createMetadata, getDefaultMetadata } from "@/lib/metadata";
import { locales } from "@/locales";

export const metadata = createMetadata({
  ...getDefaultMetadata(),
  title: locales.MyFeaturePage.metadata.title,
  description: locales.MyFeaturePage.metadata.description,
});
```

## File Naming Conventions

| Type | Suffix | Example |
|------|--------|---------|
| Model | `.model.ts` | `subscription.model.ts` |
| Schema | `.schema.ts` | `newsletter.schema.ts` |
| Service | `.service.ts` | `credits.service.ts` |
| Query | `.query.ts` | `subscription.query.ts` |
| Action | `.action.ts` | `newsletter.action.ts` |
| Hook | `use-{name}.ts` | `use-credits.ts` |
| Component | `{name}.tsx` | `credit-balance.tsx` |

## Existing Features for Reference

| Feature | Complexity | Good example of |
|---------|-----------|----------------|
| `newsletter` | Simple | Action + schema + service |
| `subscription` | Medium | Service + query + generated products |
| `credits` | Complex | Full stack: model → service → query → hook → components |
| `billing` | Medium | Cross-feature service (uses subscription) |
| `authentication` | Complex | Schemas + hooks (useAuthForm, useEthereumAuth) |
