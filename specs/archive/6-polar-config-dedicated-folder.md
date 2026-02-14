# Polar Config Dedicated Folder

## Overview
Move Polar meter and product JSON configuration files from the boilerplate app root into a dedicated `polar/` folder. This consolidates scattered config files into one location, improving developer experience and project structure clarity. The CLI code that reads/writes these files must be updated to use the new paths.

## Job to Be Done
When a developer needs to find or edit Polar configuration (products, meters, pricing), they should look in one obvious place (`apps/boilerplate/polar/`) instead of scanning the project root for scattered JSON files.

## Target User
Developers working with the Eniem boilerplate who need to configure Polar products, meters, or pricing.

## Requirements

### Must Have
- [ ] Create `apps/boilerplate/polar/` directory
- [ ] Move `meters.sandbox.json` → `polar/meters.sandbox.json`
- [ ] Move `meters.production.json` → `polar/meters.production.json`
- [ ] Move `meters.schema.json` → `polar/meters.schema.json`
- [ ] Move `products.sandbox.json` → `polar/products.sandbox.json`
- [ ] Move `products.production.json` → `polar/products.production.json`
- [ ] Move `products.example.jsonc` → `polar/products.example.jsonc`
- [ ] Create `polar/products.schema.json` (does not exist yet — derive from product structure)
- [ ] Update `$schema` relative paths in all JSON files to reference schemas within `polar/`
- [ ] Update CLI `readProductsFile()` to read from `polar/` subdirectory
- [ ] Update CLI `writeProductsFile()` to write to `polar/` subdirectory
- [ ] Update CLI `generateProductsTs()` — input paths change, output path stays (`src/features/subscription/products.generated.ts`)
- [ ] Update CLI default `$schema` reference in `writeProductsFile()` fallback (currently `"./products.schema.json"`)

### Nice to Have
- [ ] Add meters generation to CLI (currently only products have CLI generation)

## Constraints
- Generated TypeScript files (`meters.generated.ts`, `products.generated.ts`) stay in their feature directories — they are not moved
- Polar client init (`src/lib/polar.ts`) stays in `src/lib/` — it's a shared utility, not config
- Feature service files (billing, subscription, credits) are not moved
- All `polar/` files are committed to git (no special gitignore rules)

## Acceptance Criteria
- [ ] `apps/boilerplate/polar/` directory exists with all 7 config files + new products schema
- [ ] No meter/product JSON files remain at `apps/boilerplate/` root
- [ ] `$schema` references in JSON files point to correct relative paths within `polar/`
- [ ] `products.schema.json` validates the product JSON structure
- [ ] CLI `eniem-cli products` command works correctly with files in new location (reads, writes, generates)
- [ ] `products.generated.ts` is correctly generated at `src/features/subscription/products.generated.ts`
- [ ] Boilerplate app builds successfully (`pnpm build`)
- [ ] Existing tests pass (`pnpm test`)

## Edge Cases
- CLI run from project root (`apps/boilerplate/`): should look for `polar/products.{env}.json`
- CLI creates new file when none exists: should create in `polar/` with correct `$schema` path
- CLI error messages should reference `polar/products.{env}.json` (not old root paths)

## Out of Scope
- Moving `src/lib/polar.ts` (Polar SDK client init)
- Moving generated `.ts` files out of feature directories
- Adding `.gitignore` rules for the `polar/` folder
- Multi-provider payment support
- Meters CLI generation (nice-to-have, not required)

## Technical Hints
- **Files to move**: `apps/boilerplate/meters.*.json`, `apps/boilerplate/products.*.json`, `apps/boilerplate/products.example.jsonc`
- **Files to create**: `apps/boilerplate/polar/products.schema.json`
- **Files to modify in CLI**:
  - `packages/cli/src/lib/products.ts` — `readProductsFile()` (line 157), `writeProductsFile()` (line 231), `generateProductsTs()` (line 363) — all use `join(projectDir, \`products.${env}.json\`)`, change to `join(projectDir, \`polar/products.${env}.json\`)`
  - Default `$schema` fallback (line 247): change `"./products.schema.json"` to `"./products.schema.json"` (stays relative within `polar/`)
  - Error messages referencing `products.{env}.json` should update to `polar/products.{env}.json`
- **Patterns to follow**: Existing JSON schema pattern in `meters.schema.json` — use same style for `products.schema.json`
- **No boilerplate source code changes needed**: The boilerplate `src/` code only imports from `.generated.ts` files which stay in place

## Verification Commands

| Criterion | Command |
|-----------|---------|
| polar/ directory exists with all files | `ls apps/boilerplate/polar/ \| sort` |
| No JSON configs at root | `ls apps/boilerplate/meters.*.json apps/boilerplate/products.*.json 2>&1 \| grep -c "No such file"` |
| $schema refs are correct | `grep -r '"\$schema"' apps/boilerplate/polar/ --include='*.json'` |
| products.schema.json is valid JSON Schema | `node -e "JSON.parse(require('fs').readFileSync('apps/boilerplate/polar/products.schema.json'))"` |
| CLI reads from new location | `cd apps/boilerplate && pnpm eniem-cli products --env sandbox` |
| Boilerplate builds | `pnpm --filter @eniem/boilerplate build` |
| Tests pass | `pnpm test` |

## Test Requirements
- [ ] Test: CLI `readProductsFile()` reads from `polar/` subdirectory
- [ ] Test: CLI `writeProductsFile()` writes to `polar/` subdirectory with correct `$schema`
- [ ] Test: CLI `generateProductsTs()` reads from `polar/` and outputs to `src/features/subscription/`
- [ ] Test: CLI error messages reference `polar/products.{env}.json` paths
- [ ] Test: Products schema validates a valid product config
- [ ] Test: Products schema rejects invalid product config
