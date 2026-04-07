<!-- CLAUDE.md is a symlink to this file -->

# Agent Instructions

This file provides guidance to AI agents when working with code in this repository.

## Project Overview

eniem-docs is the documentation site for Eniem. Built with Next.js and Fumadocs, it provides comprehensive guides, API references, and tutorials for using the Eniem starter kit.

## Commands

```bash
# Install dependencies
pnpm install

# Development (watch mode)
pnpm dev

# Build for production
pnpm build

# Type checking
pnpm types:check

# Linting
pnpm lint
```

## Architecture

### Directory Structure
- `content/docs/` - MDX documentation files organized by topic
- `src/app/` - Next.js App Router pages and API routes
- `src/components/` - React components for custom UI elements
- `src/lib/` - Utility functions and Fumadocs configuration
- `public/` - Static assets

### Documentation Organization (`content/docs/`)
- `authentication/` - Auth methods (OAuth, email, passwordless, SIWE)
- `deployments/` - Deployment guides (managed, self-hosted)
- `features/` - Core feature documentation
- `getting-started/` - Installation and prerequisites
- `guides/` - How-to guides and tutorials
- `payments/` - Payment integration docs
- `project-configuration/` - Configuration reference

### Key Files
- `source.config.ts` - Fumadocs MDX configuration
- `src/lib/source.ts` - Fumadocs source adapter
- `src/mdx-components.tsx` - Custom MDX component mappings

## Tech Stack
- **Next.js 16** - React framework with App Router
- **Fumadocs** - Documentation framework (MDX-based)
- **Tailwind CSS 4** - Styling
- **TypeScript** - Type safety
- **Radix UI** - Accessible UI primitives
