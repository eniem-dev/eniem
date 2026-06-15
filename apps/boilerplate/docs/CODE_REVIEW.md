# Code Review

The reviewer's checklist for evaluating a pull request. The companion to `CODING_STANDARDS.md` — that file says how to write code; this file says what to look for when reviewing it.

## Philosophy

Review for code that is:

- **DRY** — ruthlessly eliminate duplication.
- **Concise** — every line should earn its place.
- **Elegant** — solutions should feel natural and obvious in hindsight.
- **Expressive** — code should read like well-written prose.
- **Idiomatic** — embrace the conventions and spirit of the language and framework in use.
- **Self-documenting** — comments are a code smell. If a comment is needed, the code can usually be made clearer instead.

## Review Process

### 1. Initial assessment

Scan for immediate red flags:

- Unnecessary complexity or cleverness.
- Violations of framework conventions.
- Non-idiomatic patterns for the language in use.
- Redundant or stale comments.

### 2. Doctrine alignment

Check the change against the repo's own rules:

- **`CODING_STANDARDS.md`** — TDD discipline, mocking boundaries, deep modules, interface design. Are tests integration-style? Are mocks at system boundaries only? Are interfaces small and deep?
- **`docs/CONTEXT.md`** — does the code use the project's canonical domain vocabulary? Flag terminology drift (e.g. code introducing "Account" when `docs/CONTEXT.md` defines "Customer").
- **`docs/adr/`** — is the change consistent with prior architectural decisions? If it contradicts an ADR, the PR should explicitly supersede that ADR.
- **`AGENTS.md`** — does the change respect the repo's hard rules (logger usage, error handling pattern, file naming, etc.)?

### 3. Deep analysis

Evaluate against core principles:

- **Convention over Configuration** — is the code fighting the framework or flowing with it?
- **Programmer Happiness** — does this code spark joy or dread for the next reader?
- **Conceptual Compression** — are the right abstractions in place? Or have shallow abstractions been added that hide nothing?
- **Single paradigm appropriately chosen** — is the solution OO / functional / procedural where each fits, without dogma?

### 4. Craftsmanship test

- Does this demonstrate mastery of the language?
- Could this code be used as an exemplar in documentation?
- Would an elite craftsman write it this way?

## Standards (language-specific)

### JavaScript / TypeScript

- Prefer declarative over imperative style.
- Extract complex logic into well-named functions.
- Use modern features idiomatically (destructuring, optional chaining, nullish coalescing).
- Prefer `const` over `let`. Avoid `var`.
- Use TypeScript's type system to its full potential — no `any`, no `as Type` assertions when narrowing would do.
- Keep functions small and single-purpose.
- Prefer composition over inheritance.
- Question any abstraction that doesn't earn its complexity.

(Add stack-specific sections — Prisma, Next.js, your framework — by appending to this file in the repo.)

## Feedback Style

Reviews should be:

1. **Direct and honest** — don't sugarcoat. If the code isn't exemplary, say so clearly.
2. **Constructive** — always show the path to improvement with concrete examples.
3. **Educational** — explain the *why* behind the critique.
4. **Actionable** — provide refactoring suggestions with code, not just diagnoses.

## Output Format

Structure the review as:

### Overall Assessment

One paragraph verdict: is this exemplary? Why or why not?

### Critical Issues

Violations of core principles or repo doctrine that must be fixed before merge.

### Improvements Needed

Specific changes to meet the standard, with before/after code examples.

### What Works Well

Acknowledge parts that already meet the standard.

### Refactored Version

If the code needs significant work, provide a rewrite of the most problematic section that would be exemplary.

---

Remember: the standard is not "good enough" but "exemplary." Every line should be a joy to read and maintain.

---

## Eniem-specific checks

Apply these in addition to the general doctrine above when reviewing changes in this monorepo.

### Prisma migrations

- New migrations must be additive. Drops/renames need an ADR linked from the PR.
- Schema diff matches migration body — no manual hand-edits to generated SQL.
- No `db:push` artefacts merged into `quality`; deploy migrations only.
- Reference: `CODING_STANDARDS.md` → "Prisma migrations".

### Polar webhooks

- Handler is idempotent under replay (re-running with the same event leaves DB unchanged).
- All writes key on stable Polar IDs, not on event arrival order.
- No bespoke webhook routes outside the BetterAuth Polar plugin.
- Reference: `docs/stack/payments-polar.md`.

### BetterAuth flows

- Session checks go through `auth.api.getSession` or `authed.*` wrappers — flag any inline cookie/header parsing.
- New providers, rate-limit rules, and email callbacks live in `src/lib/auth/*` (`oauth.ts`, `rate-limit.ts`, `email-hooks.ts`, plugin modules), not in routes or middleware.
- Reference: `docs/stack/auth-guide.md`.

### Next.js boundaries

- Action files start with `"use server"`. Query factories are not invoked from client modules.
- Server-only deps (`prisma`, `auth`, Polar SDK, `@/lib/email/send-email`) never reach a `"use client"` component.
- Routes use `authed.route` / `publicly.route`; pages use `auth.api.getSession` + `redirect` or `authed.query`. Flag inline session reconstruction.
- Reference: `docs/stack/route-guard.md`, `docs/stack/feature-scaffold.md`.
