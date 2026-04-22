---
name: tdd
description: Drive a feature or bugfix with test-first, red-green-refactor vertical slices. Invoke when the user says "tdd", "test-first", "red-green-refactor", or asks to build a feature test-first.
---

# TDD — Vertical Slicing

Coding standards (testing philosophy, mocking boundaries, DI, deep modules) live in `docs/coding-standard.md`. This skill is only the **workflow** for driving implementation test-first.

## Loop

One behavior at a time:

```
RED    → write one failing test for the next behavior
GREEN  → minimum code to make it pass
REFACTOR → clean up while GREEN, run full suite
```

Repeat. Never batch.

## The rule that matters most

**No horizontal slicing.** Do not write tests 1–5, then implementations 1–5. That tests imagined behavior and the shape of data, not what the code actually does. One test, one implementation, then the next test — because each cycle teaches you what the next test should be.

## Before starting

Align with the user on:

1. The public interface (function signatures, inputs/outputs, no internals).
2. Which behaviors matter most — you cannot test everything. Pick the critical paths.
3. Whether a deep module is hiding here (small interface, rich implementation). If yes, design the interface first.

## Per-cycle checklist

- [ ] Test names a behavior (WHAT), not a mechanism (HOW).
- [ ] Test uses only the public interface.
- [ ] Test would still pass if internals were rewritten.
- [ ] Implementation is the minimum that passes — no speculative branches.
- [ ] No mocks of internal collaborators. Mocks only at system boundaries.
- [ ] Not refactoring while RED.

## When not to use this skill

- Pure boilerplate, config, static markup, trivial one-liners.
- Exploratory spikes where the interface is unknown — spike first, delete, then TDD.
- Hotfixes where the test harness for the affected area doesn't exist yet and building it isn't in scope.

## Running tests in this repo

Use the project's run_silent wrapper — never raw `pnpm test`:

```
./scripts/run_silent "test" pnpm test
```

Follow `docs/coding-standard.md` for everything about what a *good* test looks like; this skill only governs the cadence.
