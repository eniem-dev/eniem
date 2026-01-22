# Implementation Plan: Documentation Updates January 2026

## Overview

Batch of documentation updates to fix outdated content, improve organization, and streamline the getting-started experience. This includes updating Ralph commands, removing deprecated services, splitting installation docs, and fixing subscription setup docs to reflect the automated product configuration workflow.

**Branch:** `docs/jan-2026-updates`
**Spec Reference:** `specs/docs-updates-jan-2026.md`

---

## Tasks

### Phase 1: Prerequisites Cleanup

- [x] Remove Posthog from `content/docs/getting-started/prerequisites/index.mdx` third-party services list

### Phase 2: Installation Page Split

- [x] Rename current installation page title to "Quick Start" and update content to focus on CLI-based workflow

- [x] Add CLI product creation step to Quick Start (run `eniem products` after initial setup)

- [x] Update Ralph commands section to use new `loop.sh` based commands (`ralph:plan`, `ralph:plan-work`, `ralph:build`, `ralph:build:auto`)

- [ ] Create new `content/docs/getting-started/manual-installation/index.mdx` with manual setup content (git clone workflow, manual Polar product creation)

- [ ] Update `content/docs/getting-started/meta.json` to include `manual-installation` page

### Phase 3: Setup Subscriptions Reorg

- [ ] Move "Add Environment Variables" section (step 3) to come before "Create a Subscription Product" (step 2)

- [ ] Update step 4 ("Configure the Product in Auth") to show automated flow using `getCheckoutProducts()` from `products.generated.ts`

- [ ] Update step 5 ("Use BuyButton") to reflect current component usage patterns

- [ ] Add prominent link to CLI docs from product creation section

### Phase 4: Cross-Linking (Nice to Have)

- [ ] Improve cross-linking between CLI guide, products-generated, and setup-subscriptions

- [ ] Add brief explanation of automated product data flow in Quick Start

### Phase 5: Validation and Completion

- [ ] Run `pnpm types:check && pnpm build` - verify all pages render correctly

- [ ] Verify all internal links work correctly

- [ ] Create commit with descriptive message

---

## Acceptance Criteria Checklist

Before marking complete, verify:

- [x] Installation page at `/getting-started/installation` is "Quick Start" with CLI-based workflow
- [ ] New page at `/getting-started/manual-installation` covers git clone + manual Polar setup
- [x] Ralph commands show: `ralph:plan`, `ralph:plan-work`, `ralph:build`, `ralph:build:auto` with `loop.sh` descriptions
- [x] Posthog is not mentioned in prerequisites
- [ ] Setup-subscriptions has env vars before product creation
- [ ] Setup-subscriptions step 4 shows `getCheckoutProducts()` import from products.generated.ts
- [ ] All internal links work correctly

---

## Notes

- Keep CLI guide as comprehensive reference (don't simplify it)
- Preserve existing URL structure where possible to avoid broken links
- Content exists - this is reorganization and updates, not new content creation
