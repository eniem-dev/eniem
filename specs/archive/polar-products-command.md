# Polar Products CLI Command

## Overview

Add a new `eniem products` CLI command that interactively guides users through creating Polar products. The command collects all product details (name, type, price, display data), writes to the project's products JSON file, and syncs to Polar API.

## Job to Be Done

Allow developers to create new Polar products without manually editing JSON files or using the Polar dashboard. The CLI provides a guided experience that ensures valid product configuration and immediate sync to Polar.

## Target User

Developers working inside an eniem project who need to add new subscription plans, one-time purchases, or free tiers to their pricing.

## Requirements

### Must Have

- [ ] New `eniem products` command that can be run from project root
- [ ] Detect and validate project context (products.{env}.json must exist)
- [ ] Support `--env=sandbox|production` flag (default: sandbox)
- [ ] Interactive prompts for all product fields:
  - Product name (asked first)
  - Product slug (optional, defaults to kebab-case of name)
  - Product type (subscription, one_time, free)
  - Recurring interval (month, year, week, day) - only for subscriptions
  - Price type (fixed, custom, free)
  - Price amount in dollars (e.g., "19" or "19.00") - converted to cents internally
  - Description (optional)
  - Display title
  - Display subtitle (optional)
  - Features list (comma-separated)
  - Badge text (optional)
  - Highlighted (yes/no)
  - CTA button text
- [ ] After creating a monthly subscription, ask "Create yearly version?" (y/N)
  - If yes, auto-generate yearly slug from monthly (e.g., "pro-monthly" → "pro-yearly")
  - Suggest yearly price with explanation: "Suggested: $190 (10x monthly = 2 months free)"
  - Auto-generate yearly display title from monthly + " Yearly" (e.g., "Pro" → "Pro Yearly")
  - Inherit description from monthly (no separate prompt)
  - Ask for features: "Same as monthly + add more" or "Write new features"
    - If "same + add": show monthly features, ask for additional features (comma-separated)
    - If "write new": prompt for full features list
  - Ask for yearly-specific display options (subtitle, badge, highlighted)
  - Sync yearly product to Polar
- [ ] Check for duplicate slugs in existing products.json before creating (error if exists)
- [ ] Validate input against Zod schema before writing
- [ ] Append new product(s) to products.{env}.json
- [ ] Read Polar credentials from .env file (POLAR_ACCESS_TOKEN, POLAR_ORGANIZATION_ID)
- [ ] Prompt for credentials if not found in .env
- [ ] Sync product to Polar API after creation
- [ ] Update JSON file with polarProductId after successful sync
- [ ] Show success message with product details

### Nice to Have

- [ ] `eniem products list` subcommand to show existing products
- [ ] `eniem products sync` subcommand to sync all products

## Constraints

- Must be run inside an eniem project directory
- Requires products.{env}.json file to exist
- USD currency only (Polar limitation)
- Minimum price is 50 cents for fixed pricing

## Acceptance Criteria

- [ ] Running `eniem products` in a project directory starts the interactive wizard
- [ ] Running `eniem products` outside a project shows error message
- [ ] All product types (subscription, one_time, free) can be created
- [ ] All price types (fixed, custom, free) can be configured
- [ ] Product is written to correct products.{env}.json file
- [ ] Product is synced to Polar and polarProductId is saved
- [ ] Invalid inputs are rejected with helpful error messages
- [ ] Missing credentials trigger prompt instead of error
- [ ] After monthly subscription, user is prompted for yearly version
- [ ] Yearly version inherits monthly features when "same + add" is selected
- [ ] Both monthly and yearly products are synced and saved
- [ ] Price can be entered as "19" or "19.00" (dollars, not cents)
- [ ] Yearly price defaults to 10x monthly with "2 months free" explanation
- [ ] Duplicate slugs are detected before creation attempt
- [ ] Products are saved to JSON even if Polar sync fails

## Edge Cases

- products.{env}.json doesn't exist: show error with instructions
- Duplicate slug: show error, ask for different slug
- Polar API error: show error, product saved to JSON with polarProductId: null (can retry sync later)
- Missing .env file: prompt for credentials
- Invalid price (< 50 cents): validation error before API call
- User cancels mid-wizard: no changes written
- User declines yearly version: only monthly product is created
- Yearly slug collision: prompt for different slug

## Out of Scope

- Editing existing products
- Deleting products
- Managing Polar webhooks
- Multi-currency support
- Benefit/entitlement configuration

## Technical Hints

- **Files to create**:
  - `src/commands/products.tsx` - Main products command with Ink UI
  - `src/lib/polar.ts` - Polar API client wrapper
  - `src/lib/products.ts` - Product JSON file read/write utilities

- **Files to modify**:
  - `src/cli.tsx` - Add products command routing
  - `package.json` - May need @polar-sh/sdk dependency

- **Patterns to follow**:
  - Use existing Ink components (TextInput, Select, Confirm) from `src/components/`
  - Follow wizard step pattern from `src/Wizard.tsx`
  - Use Zod for validation (copy schema from eniem-boilerplate's `scripts/products.schema.ts`)

- **Dependencies**:
  - `@polar-sh/sdk` - Polar API client
  - `dotenv` - Read .env file for credentials
  - Existing: `ink`, `zod`

- **Product schema reference** (from eniem-boilerplate):
  ```typescript
  interface Product {
    slug: string;                    // URL-safe, lowercase alphanumeric with hyphens
    name: string;                    // 1-99 chars
    description?: string;            // max 200 chars
    type: "subscription" | "one_time" | "free";
    recurringInterval?: "day" | "week" | "month" | "year";  // required for subscription
    prices: Price[];
    display: {
      title: string;
      subtitle?: string;
      badge: string | null;
      features: string[];
      highlighted: boolean;
      cta: string;
    };
    polarProductId?: string | null;  // filled after sync
  }
  ```

## Test Requirements

- [ ] Test: Command fails gracefully outside project directory
- [ ] Test: Command fails if products.{env}.json missing
- [ ] Test: Subscription product requires recurringInterval
- [ ] Test: Fixed price validates minimum 50 cents
- [ ] Test: Slug validation (lowercase alphanumeric with hyphens)
- [ ] Test: Slug defaults to kebab-case of name when not provided
- [ ] Test: Product is appended to existing JSON array
- [ ] Test: Credentials are read from .env
- [ ] Test: Missing credentials trigger prompt
- [ ] Test: Monthly subscription prompts for yearly version
- [ ] Test: Yearly slug is derived from monthly slug correctly
- [ ] Test: "Same + add" features appends to monthly features
- [ ] Test: "Write new" features replaces monthly features entirely
- [ ] Test: Price input accepts dollar format (19, 19.00) and converts to cents
- [ ] Test: Yearly price suggestion is 10x monthly
- [ ] Test: Duplicate slug in existing products.json shows error
- [ ] Test: Failed Polar sync still saves product to JSON with null polarProductId
- [ ] Test: Yearly inherits description from monthly
- [ ] Test: Yearly title is derived from monthly title + " Yearly"

## Example Session

```
$ cd my-eniem-project
$ eniem products --env=sandbox

Creating a new Polar product...

Product name: Pro Monthly
Product slug (pro-monthly): ↵
Product type: (subscription / one_time / free) subscription
Billing interval: (month / year / week / day) month
Price type: (fixed / custom / free) fixed
Price in dollars (min $0.50): 19
Description (optional): Full access to all Pro features

Display Configuration
Title: Pro
Subtitle (optional): Billed monthly
Features (comma-separated): Unlimited projects, Priority support, API access
Badge (optional, press Enter to skip): ↵
Highlighted on pricing page? (y/N) n
CTA button text: Get Started

Creating product on Polar...
✓ Product created: pro-monthly (pol_abc123)
✓ Saved to products.sandbox.json

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Create yearly version of this plan? (y/N) y

Yearly Version
Name: Pro Yearly
Slug (pro-yearly): ↵
Suggested price: $190 (10x monthly = 2 months free)
Price in dollars ($190): ↵
Title: Pro Yearly

Yearly Display Configuration
Subtitle (optional): Billed yearly

Features for yearly plan:
  (1) Same as monthly + add more
  (2) Write new features
Choice: 1

Monthly features:
  • Unlimited projects
  • Priority support
  • API access

Additional features (comma-separated, or press Enter to skip): 2 months free, Early access to new features

Badge (optional): 2 months free
Highlighted on pricing page? (y/N) y
CTA button text (Get Started): ↵

Creating product on Polar...
✓ Product created: pro-yearly (pol_def456)
✓ Saved to products.sandbox.json

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Summary:
  ✓ pro-monthly - $19/month
  ✓ pro-yearly - $190/year

Next: Run 'pnpm products:sync' to regenerate TypeScript exports
```

## CLI Interface

```
Usage: eniem products [options]

Create a new Polar product interactively

Options:
  --env <environment>  Target environment (sandbox or production) [default: sandbox]
  -h, --help          Show help
```
