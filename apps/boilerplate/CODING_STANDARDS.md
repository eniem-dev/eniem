---
title: Coding Standards
---

# Coding Standards

Doctrine for human and AFK work in this repo. Read by the `/tdd` skill, by `.looper/PROMPT_BUILD.md`, and by humans before writing code.

This file is the **single source of doctrine in the repo**. If a skill bundles fallback defaults, this file overrides them when present.


---

# Test-Driven Development

## Philosophy

**Core principle**: Tests should verify behavior through public interfaces, not implementation details. Code can change entirely; tests shouldn't.

**Good tests** are integration-style: they exercise real code paths through public APIs. They describe _what_ the system does, not _how_ it does it. A good test reads like a specification — "user can checkout with valid cart" tells you exactly what capability exists. These tests survive refactors because they don't care about internal structure.

**Bad tests** are coupled to implementation. They mock internal collaborators, test private methods, or verify through external means (like querying a database directly instead of using the interface). The warning sign: your test breaks when you refactor, but behavior hasn't changed. If you rename an internal function and tests fail, those tests were testing implementation, not behavior.

## Anti-Pattern: Horizontal Slices

**DO NOT write all tests first, then all implementation.** This is "horizontal slicing" — treating RED as "write all tests" and GREEN as "write all code."

This produces **crap tests**:

- Tests written in bulk test _imagined_ behavior, not _actual_ behavior.
- You end up testing the _shape_ of things (data structures, function signatures) rather than user-facing behavior.
- Tests become insensitive to real changes — they pass when behavior breaks, fail when behavior is fine.
- You outrun your headlights, committing to test structure before understanding the implementation.

**Correct approach**: Vertical slices via tracer bullets. One test → one implementation → repeat. Each test responds to what you learned from the previous cycle. Because you just wrote the code, you know exactly what behavior matters and how to verify it.

```
WRONG (horizontal):
  RED:   test1, test2, test3, test4, test5
  GREEN: impl1, impl2, impl3, impl4, impl5

RIGHT (vertical):
  RED→GREEN: test1→impl1
  RED→GREEN: test2→impl2
  RED→GREEN: test3→impl3
```

## Workflow

### 1. Tracer Bullet

Write ONE test that confirms ONE thing about the system:

```
RED:   Write test for first behavior → test fails
GREEN: Write minimal code to pass → test passes
```

This is your tracer bullet — proves the path works end-to-end.

### 2. Incremental Loop

For each remaining behavior:

```
RED:   Write next test → fails
GREEN: Minimal code to pass → passes
```

Rules:

- One test at a time.
- Only enough code to pass current test.
- Don't anticipate future tests.
- Keep tests focused on observable behavior.

### 3. Refactor

After all tests pass, look for refactor candidates (see Refactoring section).

**Never refactor while RED.** Get to GREEN first.

## Checklist Per Cycle

```
[ ] Test describes behavior, not implementation
[ ] Test uses public interface only
[ ] Test would survive internal refactor
[ ] Code is minimal for this test
[ ] No speculative features added
```

---

# Good and Bad Tests

## Good Tests

**Integration-style**: Test through real interfaces, not mocks of internal parts.

```typescript
// GOOD: Tests observable behavior
test("user can checkout with valid cart", async () => {
  const cart = createCart();
  cart.add(product);
  const result = await checkout(cart, paymentMethod);
  expect(result.status).toBe("confirmed");
});
```

Characteristics:

- Tests behavior users/callers care about
- Uses public API only
- Survives internal refactors
- Describes WHAT, not HOW
- One logical assertion per test

## Bad Tests

**Implementation-detail tests**: Coupled to internal structure.

```typescript
// BAD: Tests implementation details
test("checkout calls paymentService.process", async () => {
  const mockPayment = jest.mock(paymentService);
  await checkout(cart, payment);
  expect(mockPayment.process).toHaveBeenCalledWith(cart.total);
});
```

Red flags:

- Mocking internal collaborators
- Testing private methods
- Asserting on call counts/order
- Test breaks when refactoring without behavior change
- Test name describes HOW not WHAT
- Verifying through external means instead of interface

```typescript
// BAD: Bypasses interface to verify
test("createUser saves to database", async () => {
  await createUser({ name: "Alice" });
  const row = await db.query("SELECT * FROM users WHERE name = ?", ["Alice"]);
  expect(row).toBeDefined();
});

// GOOD: Verifies through interface
test("createUser makes user retrievable", async () => {
  const user = await createUser({ name: "Alice" });
  const retrieved = await getUser(user.id);
  expect(retrieved.name).toBe("Alice");
});
```

---

# When to Mock

Mock at **system boundaries** only:

- External APIs (payment, email, etc.)
- Databases (sometimes - prefer test DB)
- Time/randomness
- File system (sometimes)

Don't mock:

- Your own classes/modules
- Internal collaborators
- Anything you control

## Designing for Mockability

At system boundaries, design interfaces that are easy to mock:

**1. Use dependency injection**

Pass external dependencies in rather than creating them internally:

```typescript
// Easy to mock
function processPayment(order, paymentClient) {
  return paymentClient.charge(order.total);
}

// Hard to mock
function processPayment(order) {
  const client = new StripeClient(process.env.STRIPE_KEY);
  return client.charge(order.total);
}
```

**2. Prefer SDK-style interfaces over generic fetchers**

Create specific functions for each external operation instead of one generic function with conditional logic:

```typescript
// GOOD: Each function is independently mockable
const api = {
  getUser: (id) => fetch(`/users/${id}`),
  getOrders: (userId) => fetch(`/users/${userId}/orders`),
  createOrder: (data) => fetch('/orders', { method: 'POST', body: data }),
};

// BAD: Mocking requires conditional logic inside the mock
const api = {
  fetch: (endpoint, options) => fetch(endpoint, options),
};
```

The SDK approach means:
- Each mock returns one specific shape
- No conditional logic in test setup
- Easier to see which endpoints a test exercises
- Type safety per endpoint

---

# Interface Design for Testability

Good interfaces make testing natural:

1. **Accept dependencies, don't create them**

   ```typescript
   // Testable
   function processOrder(order, paymentGateway) {}

   // Hard to test
   function processOrder(order) {
     const gateway = new StripeGateway();
   }
   ```

2. **Return results, don't produce side effects**

   ```typescript
   // Testable
   function calculateDiscount(cart): Discount {}

   // Hard to test
   function applyDiscount(cart): void {
     cart.total -= discount;
   }
   ```

3. **Small surface area**
   - Fewer methods = fewer tests needed
   - Fewer params = simpler test setup

---

# Deep Modules

From "A Philosophy of Software Design":

**Deep module** = small interface + lots of implementation

```
┌─────────────────────┐
│   Small Interface   │  ← Few methods, simple params
├─────────────────────┤
│                     │
│                     │
│  Deep Implementation│  ← Complex logic hidden
│                     │
│                     │
└─────────────────────┘
```

**Shallow module** = large interface + little implementation (avoid)

```
┌─────────────────────────────────┐
│       Large Interface           │  ← Many methods, complex params
├─────────────────────────────────┤
│  Thin Implementation            │  ← Just passes through
└─────────────────────────────────┘
```

When designing interfaces, ask:

- Can I reduce the number of methods?
- Can I simplify the parameters?
- Can I hide more complexity inside?

---

# Refactor Candidates

After TDD cycle, look for:

- **Duplication** → Extract function/class
- **Long methods** → Break into private helpers (keep tests on public interface)
- **Shallow modules** → Combine or deepen
- **Feature envy** → Move logic to where data lives
- **Primitive obsession** → Introduce value objects
- **Existing code** the new code reveals as problematic

---

# Code style

General TypeScript / Node code-quality rules that apply across the boilerplate. The TDD doctrine above is about *what to test*; this section is about *how to write the code under test*.

## Error handling

- Handle errors at system boundaries (API handlers, event listeners, user input). Trust internal code.
- Use typed errors or the Result pattern (`{ success, data } | { success, error }`). Never `throw new Error(string)`.
- Never swallow errors — no empty `catch`, no `catch (e) { console.log(e) }`.
- No defensive `?? fallback` on values that must exist. If it's missing, fail loud.
- Early return with guard clauses. No deep nesting.

## Types (TypeScript)

- No `any`. No `as Type` assertions. Use type guards and narrowing.
- Discriminated unions over optional fields: `{ type: "guest" } | { type: "user", id: string }`, not `{ type?: string, id?: string }`.
- Branded types for domain values: `UserId`, `Email`, `Amount` — not bare `string` / `number`.
- Infer over annotate. Only annotate at module boundaries and function signatures.

## Naming

- Functions: verb + domain noun — `validateInvoiceTotal`, not `handleData`.
- Booleans: read as questions — `isExpired`, `hasPermission`.
- No god files: no `utils.ts`, `helpers.ts`, `common.ts`, `misc.ts`.
- If you need a comment to explain the name, rename it.

## Functions

- One level of abstraction per function — orchestrate or do work, not both.
- Max one side effect per function.
- Extract when the "what" is unclear, not when the code is long.
- Don't abstract until the pattern appears twice.

## Modules and imports

- No barrel files (`index.ts` re-exports) outside a feature's public API. Import from the actual source.
- Colocate code next to where it's used.
- No `import *`. No deep cross-feature imports.
- Respect dependency direction — never import upward (e.g. DB layer importing from routes).

---

# Eniem-specific rules

These rules apply on top of the doctrine above. Stack-specific long-form references live under `docs/stack/`.

## Prisma migrations

- Migrations are forward-only. Never edit a migration that has been committed — write a new one.
- Use `pnpm db:push` for dev-loop iteration only. Anything reaching the `quality` branch must include a real migration generated via `pnpm db:migrate`.
- Schema changes that drop or rename columns require an ADR (data loss is not reversible).

## Polar webhooks

- Webhook handlers must be idempotent under replay. The same event can arrive more than once.
- Side effects must key on stable Polar IDs (customer/subscription/order), never on event arrival order.
- Verification is done by the BetterAuth Polar plugin — don't add a parallel handler.
- See `docs/stack/payments-polar.md` for the integration shape.

## BetterAuth flows

- Do not roll your own session check. Use `auth.api.getSession` for inline page guards or `authed.query` / `authed.route` for handlers.
- New auth providers, rate-limit rules, or email callbacks go through `src/lib/auth/*` (`config.ts`, `oauth.ts`, `rate-limit.ts`, `email-hooks.ts`) — not bespoke routes.
- See `docs/stack/auth-guide.md` before touching auth.

## Next.js boundaries

- Server-only modules (`*.service.ts`, `*.query.ts`, `*.action.ts`, anything importing `prisma` / `auth` / the Polar SDK) must not be imported by client components.
- Action files start with `"use server"`. Query factories are invoked from RSC, not client code.
- Use the `authed` / `publicly` wrappers from `@/lib/handler` — never replicate their session-check logic inline.
- See `docs/stack/route-guard.md` and `docs/stack/feature-scaffold.md`.