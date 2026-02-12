# Centralize Meter ID and Event Name Configuration

## Overview

Create a JSON + TypeScript configuration system for credit meters and their associated event names, following the existing products config pattern (`products.sandbox.json` + `products.generated.ts`). This prevents hardcoding meter IDs and event names across the codebase and provides type-safe access per environment.

## Job to Be Done

Developers need a single source of truth for meter IDs and event names so they can consume credits without hardcoding UUIDs or risking typos in event names across the codebase.

## Target User

Developers building features that consume credits.

## Requirements

### Must Have

- [ ] `meters.sandbox.json` — sandbox meter definitions with Polar meter IDs and associated event names
- [ ] `meters.production.json` — production meter definitions (meter IDs can be `null` until configured)
- [ ] `meters.schema.json` — JSON schema for validation (like `products.schema.json`)
- [ ] `src/features/credits/meters.generated.ts` — hand-written TypeScript file mirroring the JSON structure with typed exports
- [ ] `GeneratedMeter` interface: `slug`, `meterId` (string | null), `name`, `eventNames` (string array)
- [ ] `sandboxMeters` / `productionMeters` typed arrays exported as `const`
- [ ] `getMeters(env)` function returning the correct array for the environment
- [ ] `getMeter(env, slug)` helper to look up a specific meter by slug
- [ ] Type-safe meter slugs — union type derived from config (e.g., `"llm-tokens" | "image-generation"`)
- [ ] Type-safe event names — per-meter union types derived from config
- [ ] Update `src/features/credits/index.ts` to export meter config utilities
- [ ] Update `src/config/index.ts` to re-export or document meter config access pattern

### Nice to Have

- [ ] CLI script (`pnpm meters:generate`) to auto-generate TypeScript from JSON
- [ ] Validation that meter IDs in production config are set before deploy

## Constraints

- Follow the existing products config pattern (`products.sandbox.json` → `products.generated.ts`)
- Type-level safety only (no runtime validation of event names)
- Generated file is hand-written for now (no CLI codegen in v1)
- Meter IDs are Polar UUIDs, different per environment (sandbox vs production)
- Event names are strings defined in Polar dashboard, coupled to specific meters

## Acceptance Criteria

- [ ] `meters.sandbox.json` and `meters.production.json` exist at project root
- [ ] `meters.schema.json` validates the JSON structure
- [ ] `meters.generated.ts` exports typed meter config with `sandboxMeters` and `productionMeters`
- [ ] `getMeter(env, "some-slug")` returns the correct meter with typed `meterId` and `eventNames`
- [ ] TypeScript compiler catches invalid meter slugs (type error on `getMeter(env, "nonexistent")`)
- [ ] TypeScript compiler catches invalid event names when used with typed helpers
- [ ] Existing credits service functions can consume meter config instead of raw string arguments
- [ ] `pnpm build` passes with new files

## Edge Cases

- **Production meter ID is null**: Functions using `getMeter` must handle `null` productId (same as products pattern)
- **Meter slug doesn't exist**: TypeScript type error at compile time; `getMeter` returns `undefined` at runtime
- **Empty event names array**: Valid — meter exists but no events configured yet
- **Same event name across meters**: Allowed — event names are scoped per-meter in Polar

## Out of Scope

- CLI code generation script (nice-to-have for later)
- Runtime validation of event names in `ingestUsage`
- Automatic sync of meter config from Polar API
- Migration of existing code to use meter config (separate task)

## Technical Hints

- **Files to create**:
  - `meters.sandbox.json` — at project root (like `products.sandbox.json`)
  - `meters.production.json` — at project root
  - `meters.schema.json` — at project root
  - `src/features/credits/meters.generated.ts` — typed exports
- **Files to modify**:
  - `src/features/credits/index.ts` — export meter config utilities
  - `src/config/index.ts` — optionally re-export meter access
- **Patterns to follow**:
  - `products.sandbox.json` — JSON structure with `$schema`, environment-specific IDs
  - `src/features/subscription/products.generated.ts` — `GeneratedProduct` interface, `sandboxProducts`/`productionProducts` arrays, `getProducts(env)` function, `as const` exports
- **Example JSON structure**:
  ```json
  {
    "$schema": "./meters.schema.json",
    "meters": [
      {
        "slug": "llm-tokens",
        "name": "LLM Token Credits",
        "polarMeterId": "uuid-here",
        "eventNames": ["llm.completion", "llm.embedding"]
      }
    ]
  }
  ```
- **Example TypeScript usage**:
  ```typescript
  import { getMeter } from "@/features/credits";
  import { env } from "@/config";

  const llmMeter = getMeter(env.payment.polarServer, "llm-tokens");
  await assertHasCredits(userId, llmMeter.meterId!, 1);
  await ingestUsage(userId, { name: llmMeter.eventNames[0] });
  ```
- **Dependencies**: Existing credits feature, products config as reference pattern

## Verification Commands

| Criterion | Command |
|-----------|---------|
| Sandbox JSON exists | `test -f meters.sandbox.json && echo pass` |
| Production JSON exists | `test -f meters.production.json && echo pass` |
| Schema exists | `test -f meters.schema.json && echo pass` |
| Generated TS exists | `test -f src/features/credits/meters.generated.ts && echo pass` |
| Exports getMeter | `grep -q "getMeter" src/features/credits/meters.generated.ts && echo pass` |
| Credits index exports | `grep -q "getMeter" src/features/credits/index.ts && echo pass` |
| Build passes | `pnpm build` |

## Test Requirements

- [ ] Test: `getMeters("sandbox")` returns sandbox meters array
- [ ] Test: `getMeters("production")` returns production meters array
- [ ] Test: `getMeter(env, slug)` returns correct meter for valid slug
- [ ] Test: `getMeter(env, slug)` returns undefined for invalid slug
- [ ] Test: TypeScript compilation fails with invalid meter slug (type test)
- [ ] Test: TypeScript compilation fails with invalid event name (type test)
