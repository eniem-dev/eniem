# Documentation Updates - January 2026

## Overview

A batch of documentation updates to fix outdated content, improve organization, and streamline the getting-started experience. This includes updating Ralph commands, removing deprecated services, splitting installation docs, and fixing subscription setup docs to reflect the automated product configuration workflow.

## Job to Be Done

Help new users get started with Eniem quickly and accurately, with clear documentation that reflects the current codebase behavior.

## Target User

Developers setting up Eniem for the first time, or existing users referencing docs for product/subscription configuration.

## Requirements

### Must Have

- [ ] Update Ralph commands in installation docs to new `loop.sh` based commands
- [ ] Remove Posthog from prerequisites third-party services list
- [ ] Split installation into two pages: "Quick Start" and "Manual Installation"
- [ ] Quick Start should include CLI product creation step
- [ ] Manual Installation should explain manual product creation on Polar
- [ ] Move "Add Environment Variables" section before "Create a Subscription Product" in setup-subscriptions
- [ ] Update setup-subscriptions step 4 ("Configure the Product in Auth") to show automated flow from products.generated.ts
- [ ] Update setup-subscriptions step 5 ("Use BuyButton") to reflect current component usage
- [ ] Add link to CLI docs from setup-subscriptions product creation section

### Nice to Have

- [ ] Improve cross-linking between CLI guide, products-generated, and setup-subscriptions
- [ ] Add brief explanation of the automated product data flow in Quick Start

## Constraints

- Keep CLI guide as comprehensive reference (don't simplify it)
- Preserve existing URL structure where possible to avoid broken links
- Content exists - this is reorganization and updates, not new content creation

## Acceptance Criteria

- [ ] Installation page at `/getting-started/installation` becomes "Quick Start" with CLI-based workflow
- [ ] New page at `/getting-started/manual-installation` covers git clone + manual Polar setup
- [ ] Ralph commands show: `ralph:plan`, `ralph:plan-work`, `ralph:build`, `ralph:build:auto` with `loop.sh` descriptions
- [ ] Posthog is not mentioned in prerequisites
- [ ] Setup-subscriptions has env vars before product creation
- [ ] Setup-subscriptions step 4 shows `getCheckoutProducts()` import from products.generated.ts (not manual productId)
- [ ] All internal links work correctly

## Edge Cases

- Users following old bookmarks to installation page: They land on Quick Start which is the recommended path anyway
- Users looking for manual setup: Clear link to Manual Installation from Quick Start page

## Out of Scope

- Creating new payments overview page
- Restructuring the guides/ or payments/ sections
- Simplifying or merging CLI documentation
- Adding new features or content beyond what exists

## Technical Hints

- **Files to modify**:
  - `content/docs/getting-started/installation/index.mdx` - Rename to Quick Start, update Ralph commands, add CLI products step
  - `content/docs/getting-started/prerequisites/index.mdx` - Remove Posthog
  - `content/docs/guides/setup-subscriptions/index.mdx` - Reorder sections, update auth config
  - `content/docs/getting-started/meta.json` - Add new manual-installation page to nav

- **Files to create**:
  - `content/docs/getting-started/manual-installation/index.mdx` - Manual setup guide

- **Patterns to follow**:
  - See existing `content/docs/getting-started/` for page structure
  - Use existing code block styles from installation docs

- **New Ralph commands** (from eniem package.json):
  ```json
  "ralph:plan": "./loop.sh plan",
  "ralph:plan-work": "./loop.sh plan-work",
  "ralph:build": "./loop.sh build",
  "ralph:build:auto": "./loop.sh build 10"
  ```

- **Auth.ts automated config**: The checkout plugin should use `getCheckoutProducts()` from `products.generated.ts`:
  ```typescript
  import { getCheckoutProducts } from "@/features/subscription/products.generated";

  checkout({
    products: getCheckoutProducts(),
    // ...
  })
  ```

## Test Requirements

- [ ] Test: Build succeeds after all changes (`pnpm build`)
- [ ] Test: Quick Start page renders correctly with updated Ralph commands
- [ ] Test: Manual Installation page renders and is accessible from nav
- [ ] Test: Prerequisites page no longer mentions Posthog
- [ ] Test: Setup-subscriptions shows env vars before product creation
- [ ] Test: All internal links in modified pages resolve correctly
- [ ] Test: Navigation (meta.json) includes new manual-installation page
