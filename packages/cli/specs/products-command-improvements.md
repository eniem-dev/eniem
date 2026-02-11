# Products Command Improvements

## Overview

Refactor the products CLI command to provide an interactive menu-driven workflow for managing Polar products. Users can add, remove, sync (push updates), and regenerate TypeScript files for their products. The command supports both sandbox (default) and production environments, with a special flow for promoting sandbox products to production.

## Job to Be Done

As a developer using eniem-cli, I want to manage my Polar products through an interactive menu so that I can easily add new products, remove obsolete ones, push local changes to Polar, and regenerate TypeScript exports without running multiple commands or manually editing files.

## Target User

Developers using the eniem-cli to manage their SaaS product catalog integrated with Polar for payments.

## Requirements

### Must Have

- [ ] Default to sandbox mode when running `eniem-cli products`
- [ ] Display all products from the local file with sync status (exists on Polar / not synced)
- [ ] Present main menu with options: Add new product, Remove products, Sync products, Regenerate products
- [ ] **Add new product**: Use existing product creation wizard flow
- [ ] **Remove products**: Multi-select list to choose products, then remove from both local file AND Polar (archive)
- [ ] **Sync products**: Multi-select list to choose products, then push local changes to Polar for existing products
- [ ] **Regenerate products**: Multi-select list to choose products, then regenerate `products.generated.ts` for selected products
- [ ] After any operation completes, prompt user: "Perform another operation?" or "Exit"
- [ ] Loop back to product list + main menu if user wants to continue
- [ ] Exit cleanly if user chooses to exit
- [ ] Show confirmation prompt before any destructive operation (remove, sync to Polar)
- [ ] Support `--prod` flag for production mode
- [ ] When `--prod` flag is used, ask user if they want to sync sandbox products to production
- [ ] **Sandbox → Production sync**: Multi-select sandbox products, create them as new products in production (both local file and Polar)
- [ ] If user declines sandbox→prod sync, use same menu workflow but in production mode

### Nice to Have

- [ ] Show diff of local vs Polar data before sync confirmation
- [ ] Batch operations progress indicator (e.g., "Syncing 3/5 products...")
- [ ] Undo last operation

## Constraints

- Polar API only supports monthly/yearly billing intervals (day/week get converted to monthly)
- Must maintain backward compatibility with existing `products.{env}.json` file format
- Must work with both direct array and schema-wrapped JSON formats
- Sync status is existence-based only (check if `polarProductId` exists on Polar, not field-by-field comparison)
- Regenerate only affects TypeScript generation, not Polar data

## Acceptance Criteria

- [ ] Running `eniem-cli products` without flags starts in sandbox mode
- [ ] Running `eniem-cli products --prod` starts in production mode with sandbox sync prompt
- [ ] Product list displays each product with its sync status icon (✓ synced, ○ not synced)
- [ ] Multi-select works with spacebar to toggle selection, enter to confirm
- [ ] Remove operation deletes from local JSON file AND archives product on Polar
- [ ] Sync operation updates existing Polar products with local data (name, price, description, etc.)
- [ ] Regenerate operation only regenerates `products.generated.ts` without touching Polar
- [ ] Confirmation prompt appears before remove and sync operations
- [ ] After operation, user can choose to perform another operation or exit
- [ ] Sandbox → Production creates new products (not updates) in both local prod file and Polar production

## Edge Cases

- **Empty product list**: Show message "No products found. Would you like to add one?" and only show "Add new product" option
- **All products selected for removal**: Show warning "This will remove all products. Are you sure?"
- **Polar API failure during batch operation**: Continue with remaining products, show summary of successes/failures at end
- **Product exists locally but not on Polar**: Mark as "not synced", sync operation should create it on Polar
- **Product exists on Polar but polarProductId is null locally**: Treat as not synced
- **No products selected in multi-select**: Show message "No products selected" and return to menu
- **Network error checking sync status**: Show error icon (✗) with "Unable to verify" status
- **Sandbox → Production with no sandbox products**: Show message "No sandbox products to sync to production"

## Out of Scope

- Pull/fetch products from Polar to local (only push direction)
- Field-by-field diff comparison for sync status
- Automatic sync (user must always explicitly choose to sync)
- Product variant/tier management
- Editing individual product fields (must use full sync)
- Deleting products permanently from Polar (only archive)

## Technical Hints

### Files to Modify
- `src/commands/products.tsx` - Major refactor to add menu system and new operations
- `src/lib/polar.ts` - Add `updatePolarProduct()`, `archivePolarProduct()`, `checkProductExists()` functions
- `src/lib/products.ts` - Add `removeProduct()` helper function

### Files to Create
- `src/components/MultiSelect.tsx` - New multi-select component with spacebar toggle (or use existing ink library)
- `src/components/ProductList.tsx` - Reusable product list with sync status display
- `src/components/OperationMenu.tsx` - Main menu component for operation selection

### Patterns to Follow
- See `src/components/Select.tsx` for single-select pattern
- Use step-based state machine pattern from existing `products.tsx`
- Use `useRef` pattern to prevent duplicate API calls
- Use `StatusMessage` component for operation results

### Dependencies
- Consider `ink-multi-select` package for multi-select functionality (or build custom)
- Existing `@polar-sh/sdk` for Polar API calls

### API Methods Needed
```typescript
// New functions in polar.ts
async function updatePolarProduct(credentials, productId, updates, env): Promise<UpdateResult>
async function archivePolarProduct(credentials, productId, env): Promise<ArchiveResult>
async function checkProductExists(credentials, productId, env): Promise<boolean>
async function createPolarProductInEnv(credentials, product, env): Promise<CreateResult> // For sandbox→prod
```

### State Machine Steps (Suggested)
```
init → load_products → show_menu
  → add_product (existing flow) → operation_complete
  → remove_products → select_products → confirm_remove → removing → operation_complete
  → sync_products → select_products → confirm_sync → syncing → operation_complete
  → regenerate_products → select_products → regenerating → operation_complete
operation_complete → show_menu | exit
```

### Production Mode Steps
```
init → ask_sandbox_sync
  → yes → select_sandbox_products → confirm_create_prod → creating_prod → operation_complete → show_menu
  → no → load_products (prod) → show_menu (prod workflow)
```

## Test Requirements

- [ ] Test: Sandbox mode is default when no flags provided
- [ ] Test: Production mode activates with `--prod` flag
- [ ] Test: Product list correctly shows sync status for each product
- [ ] Test: Multi-select allows toggling multiple products with spacebar
- [ ] Test: Remove operation removes product from local file
- [ ] Test: Remove operation archives product on Polar
- [ ] Test: Sync operation calls Polar update API with correct data
- [ ] Test: Regenerate operation only updates TypeScript file, not Polar
- [ ] Test: Confirmation prompt blocks destructive operations until confirmed
- [ ] Test: Operation loop returns to menu when user chooses "Perform another"
- [ ] Test: CLI exits cleanly when user chooses "Exit"
- [ ] Test: Sandbox→Production creates new products in production environment
- [ ] Test: Empty product list shows appropriate message and limited options
- [ ] Test: API failures during batch don't crash CLI, show summary instead
- [ ] Test: Declining all confirmations returns to menu without changes
