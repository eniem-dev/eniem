# 0002. Use BetterAuth for authentication

Date: 2026-05-06
Status: Accepted

## Context

The boilerplate ships with five auth flows out of the box: email/password (with verification), Email OTP, GitHub OAuth, Twitter OAuth, and SIWE (Sign In With Ethereum). Adopters expect to drop in providers, rate-limit rules, and email callbacks without rewriting middleware.

Auth.js (formerly NextAuth) is the historical default in the Next.js ecosystem and the obvious thing a reader would expect. Choosing differently needs a justification that survives "why isn't this Auth.js".

## Decision

Use BetterAuth. Server config is composed in `src/lib/auth/config.ts` with providers, hooks, and plugins under `src/lib/auth/`; client config lives in `src/lib/auth-client.ts`. Session checks are funnelled through `auth.api.getSession`, `authed.query`, and `authed.route` — never reconstructed inline.

## Consequences

Easier:
- First-class plugin model (Email OTP, SIWE, Polar, anonymous accounts) without bespoke glue per provider.
- TypeScript-first API — the session shape is fully typed end-to-end.
- Built-in DB-backed rate limiting with per-route customisation.
- Polar customer creation on signup is a one-line plugin config.

Harder:
- Smaller community than Auth.js — fewer Stack Overflow answers, more reading source code.
- Plugin compatibility is a real risk: an upstream change in Polar's BetterAuth plugin can ripple through subscription sync.
- Migrating to Auth.js later means rewriting the auth tables, session shape, and every route guard.

## Alternatives considered

- **Auth.js / NextAuth** — largest ecosystem, most documentation. Rejected because the plugin model felt heavier for the multi-flow setup we ship (especially SIWE + Email OTP), and the Polar integration story was weaker.
- **Clerk / Supabase Auth** — managed services. Rejected: adds a vendor dependency for a self-hosted boilerplate, and pricing scales per MAU in a way that hurts adopters.
