# Implementation Plan: CLI Products Documentation

## Overview

Create comprehensive single-page documentation for the `eniem products` CLI command, enabling developers to manage Polar products through an interactive terminal interface following a sandbox-first workflow.

**Branch:** `docs/cli-products-documentation`
**Target File:** `content/docs/guides/cli/index.mdx`
**Spec Reference:** `specs/cli-documentation.md`

---

## Tasks

### Phase 1: Setup

- [x] Create git branch `docs/cli-products-documentation` from main

- [x] Create directory structure: `content/docs/guides/cli/` for documentation file

- [x] Create directory structure: `public/images/cli/` for screenshot assets

### Phase 2: Core Documentation Structure

- [ ] Create `content/docs/guides/cli/index.mdx` with frontmatter (title: "CLI Products Command", description) and document skeleton with all major section headings

- [ ] Write Prerequisites section: link to Installation guide, Polar.sh account requirement, reference to setup-subscriptions guide for API token creation

- [ ] Write Polar API Setup section: document sandbox vs production environments, required scopes for CLI (`products:read`, `products:write`), environment variable configuration (`POLAR_ACCESS_TOKEN`, `POLAR_SERVER`)

### Phase 3: Command Reference (Must Have)

- [ ] Document `eniem products` base command with `--prod` flag explanation, including command syntax and when to use each environment

- [ ] Create Commands Reference table listing all operations: Add, Remove, Sync, Regenerate, Unarchive with one-line descriptions

- [ ] Document Add operation: interactive wizard flow, product schema fields (slug, name, description, type, prices, display config), validation rules

- [ ] Document Remove operation: product selection, confirmation flow, what happens to synced products

- [ ] Document Sync operation: what gets synced to Polar, idempotency behavior, success/failure states

- [ ] Document Regenerate operation: when to use, what files are regenerated, impact on existing code

- [ ] Document Unarchive operation: when products become archived, how to restore them

### Phase 4: Product Schema and Generated Files (Must Have)

- [ ] Document product schema fields in detail: slug naming conventions, name display rules, description formatting, type (subscription vs one-time), prices array structure, display config options

- [ ] Document generated files: `products.sandbox.json` and `products.production.json` file structure, location, and purpose

- [ ] Document TypeScript types generation: where types are created, how to import and use them in application code

- [ ] Document integration with Eniem codebase: how generated files connect to checkout flow, BuyButton component references

### Phase 5: Workflows (Must Have)

- [ ] Write End-to-End Workflow section: zero to synced products in numbered steps (install, configure, add product, sync, verify)

- [ ] Write Sandbox-to-Production Workflow section: complete sandbox testing first, then use `--prod` flag, explain why this order matters

### Phase 6: Error Handling and Troubleshooting (Must Have)

- [ ] Document error messages section: list common errors with exact messages and resolution steps

- [ ] Document edge case: Missing/invalid Polar API keys - error message, how to verify token, resolution steps

- [ ] Document edge case: Network failure during sync - retry behavior, manual recovery steps

- [ ] Document edge case: Product slug conflicts - validation error message, how to choose unique slugs

- [ ] Document edge case: Attempting production sync without sandbox products - guard behavior explanation

- [ ] Document edge case: Archived products - why products get archived, unarchive flow

- [ ] Write Troubleshooting section: table format with Problem, Cause, Solution columns for common issues

### Phase 7: Screenshots (Must Have)

- [ ] Add placeholder images for: main menu interface, add product wizard, sync confirmation, success states (create placeholder files in `public/images/cli/` with TODO comments noting actual screenshots needed)

- [ ] Add image references in documentation with alt text describing what each screenshot should show

### Phase 8: Nice to Have Enhancements

- [ ] Add Command Cheatsheet section: quick reference table with command, flags, and one-line description for copy-paste usage

- [ ] Add FAQ section: 3-5 common questions with concise answers (e.g., "Can I skip sandbox?", "How do I update a product?", "Where are products stored?")

- [ ] Add Video Walkthrough placeholder: section with "Coming soon" note and embedded video placeholder markup

### Phase 9: Integration and Finalization

- [ ] Update `content/docs/guides/meta.json`: add "cli" entry to pages array (position after "setup-subscriptions" for logical flow)

- [ ] Review and verify all internal links work (Prerequisites links to Installation, references to setup-subscriptions)

- [ ] Verify documentation follows existing guide patterns (frontmatter format, heading hierarchy, code block styling from ralph/index.mdx)

### Phase 10: Completion

- [ ] Create pull request with title "docs: add CLI products command documentation" and description summarizing coverage of all Must Have requirements from spec

---

## Acceptance Criteria Checklist

Before marking complete, verify:

- [ ] A developer can install Eniem, configure Polar, and have products synced using only this documentation
- [ ] Every CLI option and operation has a clear description with example
- [ ] Error messages are documented with resolution steps
- [ ] Sandbox-first workflow is clearly explained
- [ ] Generated file integration with Eniem codebase is documented
- [ ] Screenshots show actual terminal output for key flows (or placeholders with clear TODO notes)

---

## Notes

- Screenshots will initially be placeholders; actual CLI screenshots should be captured during review or follow-up
- The setup-subscriptions guide already documents Polar API token creation; CLI docs should reference it rather than duplicate
- Product schema fields should match actual CLI implementation (reference PRs #9 and #10 from eniem-cli repo if accessible)
