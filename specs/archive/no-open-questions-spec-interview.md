# No Open Questions in Spec Interview Output

## Overview

The functional-spec-interview skill currently produces specs that may contain an "Open Questions" section with unresolved items. This feature ensures the interview resolves every question before writing the spec, and removes the Open Questions section from the output entirely.

## Problem Statement

**Who:** Developers using `/functional-spec` to create specs for implementation
**Problem:** The spec output includes "3 open questions left for implementation time" — leaving ambiguity for the implementation agent
**Impact:** Open questions create blockers during implementation. The whole point of the interview is to resolve decisions upfront so the spec is actionable without further clarification.

## Scope

### Included
- Add an explicit "resolve open questions" step to the interview process (before writing the spec)
- Present all remaining questions in a single batch using AskUserQuestion
- Keep asking until zero questions remain
- Remove the "Open Questions" section from the spec template
- Add guardrail instruction: no open questions allowed in final output

### Excluded
- No changes to the interview sections themselves (1-9)
- No changes to how the spec is formatted beyond removing Open Questions
- No auto-decision fallback — always ask the user

## User Stories

### Primary Flow

- [ ] As a developer running `/functional-spec`, I receive a spec with zero open questions so that I can hand it to an implementation agent without further clarification

### Secondary Flows

- [ ] As a developer, after the interview sections are complete, I am presented with any remaining unresolved questions in a single batch so that I can resolve them before the spec is written

## Business Rules

### Validation
- The final spec MUST NOT contain an "Open Questions" section
- Every question identified during the interview must be resolved into a concrete decision captured in the relevant spec section
- If questions remain after all interview sections, they must be presented to the user via AskUserQuestion before proceeding to write the spec

### Process Rules
- Questions are presented in a single batch (not one at a time, not grouped)
- The interview loops on the resolution step until all questions are answered
- Resolved answers are incorporated into the appropriate spec section (Scope, Business Rules, etc.) — not collected into a separate section

## Acceptance Criteria

### Zero open questions in output
- [ ] **Given** a completed spec interview, **when** the spec is written to `specs/`, **then** it contains no "Open Questions" section
- [ ] **Given** a completed spec interview, **when** the spec is written to `specs/`, **then** every decision point has been resolved and captured in the relevant section

### Resolution step
- [ ] **Given** unresolved questions remain after interview sections 1-9, **when** the interview reaches the resolution step, **then** all remaining questions are presented in a single AskUserQuestion call
- [ ] **Given** the user answers all remaining questions, **when** the spec is written, **then** answers are incorporated into the appropriate sections (not a separate "resolved questions" section)

### Template update
- [ ] **Given** the spec template in `references/spec-template.md`, **when** a new spec is generated, **then** no "Open Questions" section exists in the template
