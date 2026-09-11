
> ## 📦 eniem v1 — archived
>
> This repository is part of the **eniem.dev v1 archive** (read-only). This was the eniem.dev monorepo: boilerplate, docs, and CLI.
> It is now **free and open source**, preserved here for reading, cloning, and learning. Issues and pull requests are disabled.
>
> **Successor:** the boilerplate is being rebuilt from scratch as part of [**TStack**](https://tstack.dev) — a practical AI engineering stack for agentic software delivery.

---

# Eniem

SaaS boilerplate with Next.js, BetterAuth, Polar, and Prisma.

## Monorepo Structure

- `apps/boilerplate` — Main product (Next.js 15, BetterAuth, Polar, Prisma)
- `apps/docs` — Documentation site (Next.js 16, Fumadocs)
- `packages/cli` — CLI scaffolding tool (Ink 5, React 18)

## Commands

```bash
pnpm dev:boilerplate   # Start boilerplate dev server
pnpm dev:docs          # Start docs dev server
pnpm dev:cli           # Start CLI in watch mode
pnpm build             # Build all packages
pnpm test              # Run all tests
pnpm lint              # Lint all packages
```
