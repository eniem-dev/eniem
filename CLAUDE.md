# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

eniem-cli is an interactive CLI wizard for scaffolding Eniem projects. Built with TypeScript and Ink (React for CLI), it guides users through setting up authentication, OAuth, payments, storage, web3, and analytics configurations.

## Commands

```bash
# Install dependencies
pnpm install

# Development (watch mode)
pnpm dev

# Build for production
pnpm build

# Type checking
pnpm typecheck

# Run the CLI locally
pnpm start
# or
node bin/eniem-cli.js [project-name]
```

### Ralph Workflow (AI-driven feature implementation)

```bash
# Plan a new feature (creates PRD)
pnpm feature:create

# Implement a feature
pnpm feature:implement -- <feature-name>
pnpm feature:implement -- <feature-name> -w      # with worktree
pnpm feature:implement -- <feature-name> 20 -i   # 20 iterations, interactive

# Single implementation iteration
pnpm feature:implement-once -- <feature-name>

# List available implementations
pnpm feature:list
```

## Architecture

### Entry Point & CLI Flow
- `src/cli.tsx` - Main entry point using meow for CLI arg parsing, renders the Ink app
- `src/Wizard.tsx` - State machine orchestrating wizard steps in sequence
- `bin/eniem-cli.js` - Shim that imports the built output

### Configuration System (`src/config/`)
- `types.ts` - TypeScript interfaces for all config sections (project, auth, oauth, payment, storage, web3, analytics)
- `ConfigContext.tsx` - React context providing config state and setters to all wizard steps
- `index.ts` - Barrel export

### Wizard Steps (`src/steps/`)
Each step collects user input and calls back with its config portion:
- `ProjectSetup.tsx` - Project name input
- `CloneStep.tsx` - Clones the template repo
- `OAuthSetup.tsx` - GitHub/Twitter OAuth credentials
- `PaymentSetup.tsx` - Polar payment integration
- `StorageSetup.tsx` - DigitalOcean Spaces config
- `AnalyticsSetup.tsx` - Umami/PostHog setup
- `EnvStep.tsx` - Generates .env file from collected config
- `GitStep.tsx` - Git operations (new remote, initial commit)
- `InstallStep.tsx` - Runs pnpm install

### Reusable Components (`src/components/`)
Ink wrappers for common UI patterns:
- `TextInput.tsx`, `Select.tsx`, `Confirm.tsx` - Form inputs
- `Spinner.tsx` - Loading indicator
- `SectionHeader.tsx`, `StatusMessage.tsx` - Display formatting
- `CompletedSteps.tsx`, `WizardProgress.tsx` - Progress tracking

### Utilities (`src/lib/`)
- `clone.ts` - Git clone operations
- `git.ts` - Git helpers
- `env.ts` - .env file generation
- `install.ts` - Package installation
- `validation.ts` - Input validation with Zod

## Tech Stack
- **Ink** - React-based CLI framework
- **meow** - CLI argument parsing
- **Zod** - Runtime validation
- **tsup** - TypeScript bundling (ESM output)
