---
name: tdd
description: "Test-driven development workflow for building features and fixing bugs. Use when user says '/tdd', 'tdd', 'test-first', 'red-green-refactor', or asks to build a feature test-first. Invoke this at the start of any feature or bugfix where tests should lead implementation."
---

# TDD — Red, Green, Refactor

For each behavior or requirement:

1. **RED** — Write a failing test from the spec. Run it, confirm it fails.
2. **GREEN** — Write the minimum code to pass. Run it, confirm it passes.
3. **REFACTOR** — Clean up while GREEN. Run full suite, confirm nothing broke.
4. **REPEAT** — Next behavior. One cycle at a time.

## Rules

- Never write implementation before its failing test exists.
- One logical assertion per test.
- If a refactor breaks a test, fix the code — not the test.
- Run `pnpm typecheck && pnpm test && pnpm lint` before every commit.
- You can't test everything. Focus on critical paths and complex logic, not every edge case.

## Anti-pattern: horizontal slicing

NEVER write all tests first, then all implementation. That verifies imagined behavior and the *shape* of data, not what the code actually does.

Correct: one test → one implementation → repeat. Each test responds to what you learned from the previous cycle.

## First test = tracer bullet

The first test proves the end-to-end path works before you expand. One test, one behavior, end to end. Then grow from there.

## Per-cycle checklist

- [ ] Test describes behavior, not implementation.
- [ ] Test uses the public interface only.
- [ ] Test would survive an internal refactor.
- [ ] Code is minimal for this test — no speculative branches.
- [ ] No mocks of internal collaborators. Mocks only at system boundaries.
- [ ] Not refactoring while RED.

## Refactor candidates (only when GREEN)

- Extract duplication.
- Deepen modules (move complexity behind simple interfaces).
- Consider what new code reveals about existing code.
- Run tests after each refactor step. Never refactor while RED.

## When not to use this skill

- Pure boilerplate, config files, static markup, one-liners with no branching.
- Exploratory spikes where the interface is unknown — spike first, delete, then TDD.

Test-quality rules (mocking boundaries, "verify through public interfaces", "never mock your own code") live in `docs/coding-standard.md`. This skill is the cadence only.
