# Prompt Plan Tracer

## Overview
Update the tracer bullet section in `PROMPT_plan.md` so the initial vertical slice is no longer forced into a single bead task. The tracer concept remains (build a minimal end-to-end slice first), but it can span multiple tasks when the slice touches enough layers or exceeds the ~2 min granularity rule. Non-tracer tasks depend on the last tracer task via the dependency graph — no special naming convention needed.

## Job to Be Done
When the planning prompt creates beads from a spec, the tracer bullet phase should produce correctly-sized tasks rather than cramming an entire vertical slice into one oversized bead.

## Target User
AI agents running `eni:plan` to decompose specs into beads.

## Requirements

### Must Have
- [ ] Remove the `[Tracer]` prefix requirement from task titles
- [ ] Allow the tracer phase to produce 1 or more tasks based on Claude's judgment and the ~2 min rule
- [ ] All non-tracer tasks must depend on the last tracer task (dependency graph enforces ordering)
- [ ] Keep the tracer bullet concept: first tasks form a minimal end-to-end vertical slice
- [ ] Update the example in the prompt to show a multi-task tracer scenario
- [ ] Update the "Standard structure" section to reflect that tracer is a phase, not a single task

### Nice to Have
- [ ] Add guidance on when to split (e.g., distinct layers like DB, API, UI suggest separate tasks)

## Constraints
- Modify both `.eni/PROMPT_plan.md` (monorepo) and `apps/boilerplate/.eni/PROMPT_plan.md` (boilerplate) — no changes to `PROMPT_build.md`, `loop.sh`, or `spec-interview.md`
- Keep the Pragmatic Programmer reference and core philosophy
- Don't change the refinement (iteration 2+) section unless needed for consistency

## Acceptance Criteria
- [ ] Both `PROMPT_plan.md` files no longer require `[Tracer]` prefix in task titles
- [ ] Both `PROMPT_plan.md` files explicitly allow multiple tasks for the tracer phase
- [ ] Both `PROMPT_plan.md` files instruct that non-tracer tasks depend on the last tracer task
- [ ] Both files' tracer bullet task pattern example shows a multi-task scenario
- [ ] Both files' standard structure section describes tracer as a phase (1+ tasks), not a single task

## Edge Cases
- Single-layer feature (e.g., CLI-only change): tracer can still be one task — the prompt should not force splitting
- Large vertical slice (DB + API + UI + tests): Claude should split into multiple tracer tasks based on ~2 min rule
- No clear layers: Claude uses judgment, prompt should not be overly prescriptive

## Out of Scope
- Changes to `PROMPT_build.md`
- Changes to `loop.sh`
- Changes to `spec-interview.md`
- Auto-labeling GitHub issues with `spec-ready`
- Changing the dependency system in beads

## Technical Hints
- **Files to modify**:
  - `.eni/PROMPT_plan.md` (monorepo version, lines 89–113 — "Tracer Bullet First" section)
  - `apps/boilerplate/.eni/PROMPT_plan.md` (boilerplate version, lines 77–101 — same section, offset by monorepo-specific lines)
- **Differences between files**: The boilerplate version omits monorepo structure header, uses simple paths instead of monorepo-relative paths, and has no turborepo filter references. The tracer bullet section content is identical.
- **Patterns to follow**: The rest of `PROMPT_plan.md` for tone and structure
- **Key sections to update** (in both files):
  - "Tracer bullet task pattern": remove `[Tracer]` prefix, show multi-task example
  - "Standard structure": change "Tracer bullet" from singular to phase
  - "Add Dependencies" step: ensure guidance covers tracer→non-tracer dependency

## Verification Commands

| Criterion | Command |
|-----------|---------|
| No [Tracer] prefix (monorepo) | `! grep -q '\[Tracer\]' .eni/PROMPT_plan.md && echo pass` |
| No [Tracer] prefix (boilerplate) | `! grep -q '\[Tracer\]' apps/boilerplate/.eni/PROMPT_plan.md && echo pass` |
| Multi-task tracer (monorepo) | `grep -q 'one or more\|multiple tasks\|1+ tasks' .eni/PROMPT_plan.md && echo pass` |
| Multi-task tracer (boilerplate) | `grep -q 'one or more\|multiple tasks\|1+ tasks' apps/boilerplate/.eni/PROMPT_plan.md && echo pass` |
| Dependency guidance (monorepo) | `grep -q 'depend.*last tracer\|depend.*tracer.*task' .eni/PROMPT_plan.md && echo pass` |
| Dependency guidance (boilerplate) | `grep -q 'depend.*last tracer\|depend.*tracer.*task' apps/boilerplate/.eni/PROMPT_plan.md && echo pass` |

## Test Requirements
- [ ] Test: Running `eni:plan` on a multi-layer spec produces tracer tasks without `[Tracer]` prefix
- [ ] Test: Non-tracer tasks have dependency on the last tracer phase task
- [ ] Test: Single-layer spec can still produce a single tracer task (not forced to split)

## Post-Completion

- [ ] Close GitHub issue: https://github.com/eniem-dev/eniem/issues/7
- [ ] PR description includes: Closes #7
