# CLI Documentation

## Overview

Comprehensive documentation for the Eniem CLI tool, specifically covering the `eniem products` command that enables developers to create, manage, and sync Polar products through an interactive terminal interface. This documentation will serve as a single reference page with full setup instructions, command details, integration guidance, and troubleshooting.

## Job to Be Done

Help developers using Eniem quickly set up and manage their Polar products through the CLI, following a sandbox-first workflow that ensures safe testing before production deployment.

## Target User

Developers using the Eniem boilerplate who need to manage subscription and one-time payment products via the CLI.

## Requirements

### Must Have

- [ ] Document Polar API setup (getting API keys, configuring .env, sandbox vs production)
- [ ] Document `eniem products` command with all flags (`--prod`)
- [ ] Document all operations: Add, Remove, Sync, Regenerate, Unarchive
- [ ] Document sandbox-to-production sync workflow with `--prod` flag
- [ ] Include screenshots of interactive menu and wizard flows
- [ ] Explain product schema fields (slug, name, description, type, prices, display config)
- [ ] Document generated files: `products.sandbox.json`, `products.production.json`, TypeScript types
- [ ] Document error messages and how to resolve them
- [ ] Provide end-to-end workflow: zero to synced products
- [ ] Include troubleshooting section with common issues/solutions

### Nice to Have

- [ ] Command cheatsheet/quick reference table
- [ ] Video walkthrough link placeholder
- [ ] FAQ section

## Constraints

- Single page format (not split across multiple pages)
- Must include terminal screenshots for interactive flows
- Documentation must be self-contained for CLI usage

## Acceptance Criteria

- [ ] A developer can install Eniem, configure Polar, and have products synced using only this documentation
- [ ] Every CLI option and operation has a clear description with example
- [ ] Error messages are documented with resolution steps
- [ ] Sandbox-first workflow is clearly explained
- [ ] Generated file integration with Eniem codebase is documented
- [ ] Screenshots show actual terminal output for key flows

## Edge Cases

- Missing/invalid Polar API keys: Document expected error and resolution
- Network failure during sync: Document retry behavior and manual recovery
- Product slug conflicts: Document validation error and how to resolve
- Attempting production sync without sandbox products: Document guard behavior
- Archived products and unarchive flow: Document when and how to use

## Out of Scope

- Polar web dashboard usage (how to navigate Polar's UI)
- Payment integration code (using products in React components, hooks, checkout flows)
- Polar pricing strategies or business model decisions

## Technical Hints

- **Files to create**: `content/docs/guides/cli/index.mdx`
- **Files to modify**:
  - `content/docs/guides/meta.json` (add "cli" entry)
- **Patterns to follow**: See `content/docs/guides/ralph/index.mdx` for structure (frontmatter, commands table, workflow sections)
- **Screenshots location**: `public/images/cli/` (create directory for terminal screenshots)
- **Reference PRs for accuracy**:
  - https://github.com/eniem-dev/eniem-cli/pull/9 (products command, Polar sync)
  - https://github.com/eniem-dev/eniem-cli/pull/10 (menu-driven operations, --prod flag)

## Test Requirements

- [ ] Test: Verify all CLI commands shown in docs work as documented
- [ ] Test: Follow end-to-end workflow from scratch and confirm success
- [ ] Test: Trigger each documented error condition and verify error message matches
- [ ] Test: Confirm generated file paths match documentation
- [ ] Test: Verify screenshots match current CLI version output
