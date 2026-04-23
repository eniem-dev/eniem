# Coding Standard

For the test-driven development workflow (cadence, per-cycle checklist, anti-patterns), see `.agents/skills/tdd/SKILL.md` or invoke `/tdd`.

## 1. Testing rules

- Tests verify behavior through public interfaces, not implementation details.
- One logical assertion per test.
- If a refactor breaks a test but behavior hasn't changed, fix the code — not the test.
- Mock only at system boundaries: external APIs, time/randomness, databases when impractical.
- Never mock your own code.
- Test names describe WHAT (`confirms order after valid payment`), not HOW (`calls paymentService.process`).
- Don't assert on call counts, call order, or internal method invocations.
- Don't verify outcomes by reading the DB/filesystem directly — read them back through the interface that writes them.

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

- No barrel files (`index.ts` re-exports). Import from the actual source.
- Colocate code next to where it's used.
- No `import *`. No deep cross-feature imports.
- Respect dependency direction — never import upward (e.g., DB layer importing from routes).

---

## 7. Design for Testability

- Accept dependencies — inject, don't instantiate.
- Return values over side effects.
- Prefer deep modules (small interface, rich implementation) over shallow ones (many methods, little value).
