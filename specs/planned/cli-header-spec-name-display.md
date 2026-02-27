# CLI Header: Show Spec Name & Single Logo Display

## Overview

When running `eni plan` or `eni build`, the selected spec name is invisible after selection — the user loses context about which spec is being processed. Additionally, the large ASCII logo consumes vertical space throughout execution. This feature adds the spec name to the section header and limits the logo to only the initial spec-selection step.

## Problem Statement

**Who:** Developers running `eni plan` or `eni build`
**Problem:** After selecting a spec, there's no visual indicator of which spec is running. The section header just says "Plan" or "Build" with no context. The logo takes up 7 lines of vertical space throughout the entire run.
**Impact:** Users lose track of which spec they're working on, especially when switching between tasks. Wasted screen real estate from the logo during long-running iterations.

## Scope

### Included
- Show spec name in the section header after selection (format: `Build — my-feature`)
- Hide the logo once execution starts (after spec selection and CLI resolution)
- Show logo during spec selection step only

### Excluded
- Changes to other commands (ready, config, products, ai init, wizard) — they keep current logo behavior
- Changes to the logo itself (design, color, content)
- Changes to the iteration separator or output formatting

### Constraints
- Must work with both interactive spec selection and `--spec` flag
- Ink/React terminal rendering constraints — the logo area must cleanly disappear without layout artifacts

## User Stories

### Primary Flow

- [ ] As a developer, I can see the spec name in the section header after selecting a spec, so that I know which spec is being processed
- [ ] As a developer, I see the logo only during the initial spec selection step, so that screen space is maximized during execution

### Secondary Flows

- [ ] As a developer using `--spec` flag, I can see the spec name in the header immediately when execution starts (no selection step), so the header reads `Build — my-feature` from the first moment

## Business Rules

### Display Logic
- Section header without spec: `Plan` or `Build` (bold, magenta) — shown during spec selection
- Section header with spec: `Plan — my-feature` or `Build — my-feature` (bold, magenta) — shown after spec is selected
- Logo (`<Header />`) is rendered during: `selecting` step only
- Logo is NOT rendered during: `resolving`, `first-run`, `fallback`, `running`, `summary`, `error` steps
- When `--spec` flag is provided (no `selecting` step occurs), logo is never shown

### Formatting
- Separator between command and spec name: em dash ` — ` (space, em dash, space)
- Spec name uses the raw spec name (e.g. `my-feature`, not the full path or `.md` extension)

## UI/UX Specification

### Screen: Spec Selection (step = "selecting")

**Layout:**
```
███████╗███╗   ██╗██╗███████╗███╗   ███╗
██╔════╝████╗  ██║██║██╔════╝████╗ ████║
█████╗  ██╔██╗ ██║██║█████╗  ██╔████╔██║
██╔══╝  ██║╚██╗██║██║██╔══╝  ██║╚██╔╝██║
███████╗██║ ╚████║██║███████╗██║ ╚═╝ ██║
╚══════╝╚═╝  ╚═══╝╚═╝╚══════╝╚═╝     ╚═╝
v0.1.0 - Scaffold your next Eniem project

Build

Select a spec to build:
> my-feature
  other-spec
  another-one
```

### Screen: Running (step = "running")

**Layout:**
```
Build — my-feature
Using claude for build

── Iteration 1 ──
[streaming output...]
● Iteration 2/10 (45s)
```

**Note:** No logo. Only the section header with spec name, CLI indicator, and output.

### Screen: Summary (step = "summary")

**Layout:**
```
Build — my-feature

✓ Build complete — spec archived.
Completed in 3/10 iterations (early exit).
```

### Screen: Error (step = "error")

**Layout:**
```
Build — my-feature

✗ Failed to load spec: file not found
```

### State Transitions

```
selecting (logo + "Build")
  → spec chosen → resolving (no logo, "Build — my-feature")
  → resolving → running (no logo, "Build — my-feature")
  → running → summary (no logo, "Build — my-feature")

With --spec flag:
  → resolving (no logo, "Build — my-feature" from start)
  → resolving → running → summary
```

## Edge Cases

### Boundary Conditions

| Condition | Expected Behavior |
|-----------|-------------------|
| Long spec name (e.g. `implement-user-authentication-with-oauth2-flow`) | Render full name, no truncation — terminal will wrap if needed |
| `--spec` flag used (no selection step) | No logo shown at all, header shows spec name immediately |
| Spec name has special characters | Render as-is (spec names come from filenames, already sanitized) |

## Acceptance Criteria

### Spec name in header

- [ ] **Given** a user selects a spec interactively, **when** execution starts, **then** the section header reads `Build — {spec-name}` or `Plan — {spec-name}`
- [ ] **Given** a user provides `--spec my-feature`, **when** the command starts, **then** the section header reads `Build — my-feature` from the first render
- [ ] **Given** no spec is selected yet, **when** the selection prompt is showing, **then** the section header reads just `Build` or `Plan` without a spec name

### Logo display

- [ ] **Given** a user runs `eni build` without `--spec`, **when** the spec selection prompt is displayed, **then** the full ASCII logo is visible above the section header
- [ ] **Given** a user has selected a spec, **when** execution transitions past selection, **then** the logo is no longer rendered
- [ ] **Given** a user runs `eni build --spec my-feature`, **when** the command starts, **then** the logo is never shown
- [ ] **Given** a user runs any other command (ready, config, etc.), **when** the command runs, **then** the logo behavior is unchanged (still shows as before)

## Open Questions

None — all questions resolved during interview.
