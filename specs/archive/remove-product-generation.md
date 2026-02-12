# Remove Product Generation Script

## Overview
Remove the local product sync/generation script and its supporting files since eniem-cli now handles this functionality. Keep JSON config files, remove script + schema + tests.

## Job to Be Done
Avoid duplicate tooling - product sync is now centralized in eniem-cli.

## Target User
Developer maintaining the eniem codebase.

## Requirements

### Must Have
- [ ] Remove `scripts/sync-products.ts`
- [ ] Remove `scripts/products.schema.ts` (only used by sync script)
- [ ] Remove `scripts/__tests__/sync-products.test.ts`
- [ ] Remove `products:sync` script from `package.json`
- [ ] Keep `products.sandbox.json` and `products.production.json`
- [ ] Keep `products.example.jsonc`
- [ ] Update comment in `products.generated.ts` to reference eniem-cli

## Constraints
- Do NOT remove JSON config files
- Do NOT remove products.generated.ts

## Acceptance Criteria
- [ ] `pnpm products:sync` command no longer exists
- [ ] `scripts/sync-products.ts` file deleted
- [ ] `scripts/products.schema.ts` file deleted
- [ ] `scripts/__tests__/` folder deleted
- [ ] `products.generated.ts` header updated to reference eniem-cli
- [ ] `pnpm build` still works
- [ ] All JSON product files remain intact

## Edge Cases
- None - straightforward deletion

## Out of Scope
- Modifying the schema file
- Changing how products are consumed in the app
- Adding eniem-cli integration or documentation

## Technical Hints
- **Files/folders to delete**:
  - `scripts/` folder entirely (contains only sync-products.ts and products.schema.ts)
    - `scripts/sync-products.ts`
    - `scripts/products.schema.ts`
    - `scripts/__tests__/sync-products.test.ts`
- **Files to modify**:
  - `package.json` - remove `products:sync` script
  - `apps/boilerplate/src/features/subscription/products.generated.ts` - update header comment
- **Files to keep**:
  - `products.sandbox.json`
  - `products.production.json`
  - `products.example.jsonc`

## Test Requirements
- [ ] Test: `pnpm build` succeeds
- [ ] Test: `pnpm lint` passes
- [ ] Test: Verify JSON files still exist
