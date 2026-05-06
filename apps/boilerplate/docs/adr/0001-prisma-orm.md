# 0001. Use Prisma as the ORM

Date: 2026-05-06
Status: Accepted

## Context

The boilerplate needs an ORM for PostgreSQL. The two realistic options at scaffolding time were Prisma and Drizzle. Drizzle has growing momentum in the Next.js ecosystem (closer-to-SQL DSL, smaller runtime, better edge story) and is increasingly the default pick in new template repos.

Eniem is a customer-facing boilerplate: every adopter inherits this choice and must live with it long-term. Migrations, seed data, schema diffs, and the generated client all assume the ORM stays put.

## Decision

Use Prisma. Schema lives at `apps/boilerplate/prisma/schema.prisma`; migrations under `apps/boilerplate/prisma/migrations/`; generated client imported as `prisma` from `@/lib/db`.

## Consequences

Easier:
- Mature ecosystem (BetterAuth and Polar plugins ship Prisma adapters out of the box).
- Generated TypeScript types are exhaustive and stable across the schema.
- Migration tooling (`prisma migrate dev|deploy`) is well-trodden.

Harder:
- Heavier runtime than Drizzle (Prisma engine binary). Not edge-runtime friendly.
- DSL hides the SQL, so complex queries fall back to `$queryRaw` and lose some type safety.
- Switching to Drizzle later is a full data-layer rewrite — schema, migrations, every query and service.

## Alternatives considered

- **Drizzle** — closer to SQL, smaller runtime, edge-friendly. Rejected because the BetterAuth and Polar adapter ecosystem was less mature at scaffolding time, and the boilerplate's primary value is "it just works".
- **Kysely / raw SQL** — maximum control, no codegen. Rejected: too much boilerplate for adopters; no migration story bundled.
