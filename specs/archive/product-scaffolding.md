# Product Scaffolding

## Overview

CLI command to sync products from JSON config to Polar API and generate TypeScript types. Single source of truth for products across Polar, pricing UI, and auth config.

## Job to Be Done

Eliminate manual Polar dashboard work. Define products in code, sync to Polar with one command.

## Target User

Developer (you) managing ENIEM products/pricing.

## Requirements

### Must Have

- [ ] JSON config files: `products.sandbox.json` and `products.production.json`
- [ ] `pnpm products:sync` command that reads JSON and upserts to Polar
- [ ] Zod schema validation before API calls
- [ ] Support all Polar product types: subscriptions, one-time, free
- [ ] Support all price types: fixed, custom (pay-what-you-want), free
- [ ] Generate TypeScript types/constants from JSON after sync
- [ ] Update auth.ts products config automatically
- [ ] Include pricing page display data in JSON (features, badges, descriptions)
- [ ] Fail fast on any API error (no partial syncs)

### Nice to Have

- [ ] Dry-run mode (`--dry-run`) to preview changes
- [ ] Diff output showing what would change

### Testing

- [ ] Unit tests for Zod schema validation (valid/invalid inputs)
- [ ] Unit tests for JSON parsing and transformation
- [ ] Unit tests for `getProducts(env)` helper
- [ ] Unit tests for upsert logic (create vs update detection)

## Constraints

- No product deletion via this tool (manual cleanup only)
- No webhook setup automation
- USD currency only (Polar limitation)
- Requires `POLAR_ACCESS_TOKEN` with write permissions

## JSON Schema

```json
{
  "$schema": "./products.schema.json",
  "products": [
    {
      "slug": "pro-monthly",
      "name": "Pro Monthly",
      "description": "Full access to all features",
      "type": "subscription",
      "recurringInterval": "month",
      "prices": [
        {
          "amountType": "fixed",
          "amount": 1900,
          "currency": "usd"
        }
      ],
      "display": {
        "title": "Pro",
        "subtitle": "For serious builders",
        "badge": null,
        "features": ["Unlimited projects", "Priority support", "Advanced analytics"],
        "highlighted": false
      },
      "polarProductId": null
    }
  ]
}
```

## Example File (products.example.jsonc)

Documented reference with all supported types and enum values:

```jsonc
{
  "$schema": "./products.schema.json",
  "products": [
    // ══════════════════════════════════════════════════════════════
    // SUBSCRIPTION - Fixed Price
    // ══════════════════════════════════════════════════════════════
    {
      "slug": "pro-monthly",
      "name": "Pro Monthly",
      "description": "Optional description",
      "type": "subscription", // "subscription" | "one_time" | "free"
      "recurringInterval": "month", // "day" | "week" | "month" | "year" (subscription only)
      "recurringIntervalCount": 1, // 1-999, billing cycle multiplier (optional, default: 1)
      "prices": [
        {
          "amountType": "fixed", // "fixed" | "custom" | "free"
          "amount": 1900, // cents, min 50, max 99999999
          "currency": "usd", // only "usd" supported
        },
      ],
      "display": {
        "title": "Pro",
        "subtitle": "For serious builders",
        "badge": null, // string or null
        "features": ["Feature 1", "Feature 2"],
        "highlighted": false,
      },
      "polarProductId": null, // filled after first sync
    },

    // ══════════════════════════════════════════════════════════════
    // SUBSCRIPTION - Custom Price (pay-what-you-want)
    // ══════════════════════════════════════════════════════════════
    {
      "slug": "supporter-monthly",
      "name": "Supporter",
      "type": "subscription",
      "recurringInterval": "month",
      "prices": [
        {
          "amountType": "custom",
          "minimumAmount": 500, // optional, min user can pay
          "maximumAmount": 10000, // optional, max user can pay
          "presetAmount": 1000, // optional, default suggested amount
          "currency": "usd",
        },
      ],
      "display": {
        "title": "Supporter",
        "subtitle": "Pay what you want",
        "badge": null,
        "features": ["Support the project"],
        "highlighted": false,
      },
      "polarProductId": null,
    },

    // ══════════════════════════════════════════════════════════════
    // ONE-TIME - Fixed Price
    // ══════════════════════════════════════════════════════════════
    {
      "slug": "lifetime-access",
      "name": "Lifetime Access",
      "type": "one_time",
      "prices": [
        {
          "amountType": "fixed",
          "amount": 29900,
          "currency": "usd",
        },
      ],
      "display": {
        "title": "Lifetime",
        "subtitle": "One-time payment",
        "badge": "Best Deal",
        "features": ["Forever access", "All future updates"],
        "highlighted": true,
      },
      "polarProductId": null,
    },

    // ══════════════════════════════════════════════════════════════
    // FREE PRODUCT
    // ══════════════════════════════════════════════════════════════
    {
      "slug": "free-tier",
      "name": "Free Tier",
      "type": "free",
      "prices": [
        {
          "amountType": "free",
        },
      ],
      "display": {
        "title": "Free",
        "subtitle": "Get started",
        "badge": null,
        "features": ["Basic features", "Community support"],
        "highlighted": false,
      },
      "polarProductId": null,
    },
  ],
}
```

## Acceptance Criteria

- [ ] Running `pnpm products:sync` with valid JSON creates products on Polar
- [ ] Running sync again updates existing products (matched by slug)
- [ ] Invalid JSON fails with clear Zod error message before any API call
- [ ] Generated TS file exports product slugs, IDs, and display data
- [ ] Auth.ts products array imports from generated file, switches based on `env.payment.polarServer`
- [ ] Pricing page can render from generated display data
- [ ] Command outputs summary: X created, Y updated, Z unchanged, W added from Polar
- [ ] Untracked Polar products auto-appended to JSON file with `display` placeholder

## Edge Cases

- Product exists on Polar but not in JSON: auto-append to JSON with `display` placeholder (no deletion)
- Slug collision in JSON: Zod validation error
- API rate limit: fail fast with error message
- Empty products array: valid, syncs nothing
- Price amount below Polar minimum (50 cents): Zod validation error

## Out of Scope

- Deleting products from Polar
- Webhook configuration
- Multi-currency support
- Coupon/discount management
- Benefit/entitlement sync

## Technical Hints

- **Files to create**:
  - `scripts/sync-products.ts` - Main CLI script
  - `scripts/products.schema.ts` - Zod schema for JSON validation
  - `scripts/__tests__/sync-products.test.ts` - Unit tests
  - `products.example.jsonc` - Documented example with all product/price types and enum comments
  - `products.sandbox.json` - Sandbox product definitions (root)
  - `products.production.json` - Production product definitions (root)
  - `apps/boilerplate/src/features/subscription/products.generated.ts` - Exports `sandboxProducts`, `productionProducts`, and `getProducts(env)` helper

- **Files to modify**:
  - `package.json` - Add `products:sync` script
  - `apps/boilerplate/src/lib/auth.ts` - Import `getProducts(env.payment.polarServer)` for checkout config
  - `apps/boilerplate/src/features/subscription/index.ts` - Export generated products
  - `apps/boilerplate/src/app/(marketing)/pricing/page.tsx` - Use generated display data
  - `apps/boilerplate/src/locales/index.ts` - Remove hardcoded pricing text (moved to JSON)

- **Patterns to follow**:
  - Use `tsx` to run TypeScript scripts (already in devDeps)
  - Use existing `apps/boilerplate/src/lib/polar.ts` client
  - Follow `env.payment.polarServer` for environment detection

- **Dependencies**:
  - `@polar-sh/sdk` (already installed)
  - `zod` (already installed)
  - `tsx` (already installed)

## Test Requirements

- [ ] Test: Valid JSON passes Zod validation
- [ ] Test: Invalid JSON (missing required fields) fails validation
- [ ] Test: Duplicate slugs in JSON fails validation
- [ ] Test: Price amount < 50 fails validation
- [ ] Test: Generated TS file has correct types
- [ ] Test: Upsert logic correctly identifies create vs update
- [ ] Test: Untracked Polar products auto-appended to JSON file

## Decisions

- Generated file uses `as const` for full literal type inference
- JSON files at repo root (`products.sandbox.json`, `products.production.json`, `product.exemple.json`)
- Plain strings for display data (no i18n keys for now)
