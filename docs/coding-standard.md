# Coding Standard

## 1. Testing (RED-GREEN-REFACTOR)

For each behavior or requirement:

1. **RED** — Write a failing test from the spec. Run it — confirm it fails.
2. **GREEN** — Write minimum code to pass. Run it — confirm it passes.
3. **REFACTOR** — Clean up. Run full suite — confirm nothing broke.
4. **REPEAT** — Next behavior. One cycle at a time.

**Rules:**
- Never write implementation before its failing test exists.
- Tests verify behavior through public interfaces, not implementation details.
- One logical assertion per test.
- If a refactor breaks a test, fix the code — not the test.
- Run `typecheck + test + lint` before every commit.
- Vertical slices only: one test → one implementation → repeat. Never batch tests first then implementation — that tests imagined shape, not real behavior.
- Never refactor while RED. Reach GREEN first.

**Test smells (reject in review):**
- Mocking internal collaborators.
- Asserting on call counts, call order, or that a specific internal method was invoked.
- Verifying outcomes by querying the DB / filesystem directly instead of through the interface that reads them back.
- Test names that describe HOW (`calls paymentService.process`) instead of WHAT (`confirms order after valid payment`).

**Mocking:**
- Mock only at system boundaries: external APIs, time/randomness, databases when impractical.
- Never mock your own code.
- Prefer SDK-style interfaces (`api.getUser(id)`, `api.createOrder(data)`) over generic fetchers (`api.fetch(endpoint, opts)`). Each operation is a named function — no conditional logic inside mocks, one shape per mock return.

**Skip TDD for:** pure boilerplate, config files, static markup, one-liners with no branching.

---

## 2. Error Handling

- Handle errors at system boundaries (API handlers, event listeners, user input). Trust internal code.
- Use typed errors or Result pattern (`{ success, data } | { success, error }`). Never `throw new Error(string)`.
- Never swallow errors — no empty catch, no `catch (e) { console.log(e) }`.
- No defensive `?? fallback` on values that must exist. If it's missing, fail loud.
- Early return with guard clauses. No deep nesting.

---

## 3. Types (TypeScript)

- No `any`. No `as Type` assertions. Use type guards and narrowing.
- Discriminated unions over optional fields: `{ type: "guest" } | { type: "user", id: string }` not `{ type?: string, id?: string }`.
- Branded types for domain values: `UserId`, `Email`, `Amount` — not bare `string` and `number`.
- Infer over annotate. Only annotate at module boundaries and function signatures.

---

## 4. Naming

- Functions: verb + domain noun — `validateInvoiceTotal`, not `handleData`.
- Booleans: read as questions — `isExpired`, `hasPermission`.
- No god files: no `utils.ts`, `helpers.ts`, `common.ts`, `misc.ts`.
- If you need a comment to explain the name, rename it.

---

## 5. Functions

- One level of abstraction per function — orchestrate or do work, not both.
- Max one side effect per function.
- Extract when the "what" is unclear, not when the code is long.
- Don't abstract until the pattern appears twice.

---

## 6. Modules & Imports

- No barrel files (`index.ts` re-exports) for general utilities or components. Exception: feature `index.ts` files serve as the public API boundary — only import other features through their index.
- Colocate code next to where it's used.
- No `import *`. No deep cross-feature imports.
- Respect dependency direction — never import upward (e.g., DB layer importing from routes).

---

## 7. Design for Testability

- Accept dependencies — inject, don't instantiate.
- Return values over side effects.
- Prefer deep modules (small interface, rich implementation) over shallow ones (many methods, little value).
