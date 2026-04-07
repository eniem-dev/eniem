---
name: generate-specs
version: 2.1.0
description: "Create detailed, implementation-ready specifications through structured interview. Use when user says '/generate-specs', 'write specs', 'create specs', 'generate specifications', 'spec this out', 'spec interview', 'define requirements', or wants to turn a product idea into structured spec files that an agent can build from directly."
---

# Generate Specifications

Create implementation-ready specifications through adaptive interview using AskUserQuestion tool.
Features are first decomposed into focused topics of concern, then each topic goes through a structured interview producing one spec file with both behavioral requirements AND technical shape (types, interfaces, architecture).

## Usage

`/generate-specs <project-or-feature-name>`

Example: `/generate-specs user-onboarding`

## Process Overview

0. **Specs Location Detection** — Determine where to write spec files
1. **Foundation** — Establish project context and tech stack
2. **Topic Decomposition** — Break into focused topics of concern
3. **Per-topic interview** (repeated for each topic):
   - Context Discovery
   - Problem & Users
   - Scope Definition
   - User Stories & Behaviors
   - Business Rules
   - UI/UX Flows
   - Edge Cases
   - Acceptance Criteria
   - Resolve Open Questions
4. **Technical Shape** — Propose types, interfaces, architecture per topic (with user approval)
5. **Write Specs** — Output one file per topic to `<SPECS_DIR>/<topic-name>.md`
6. **Specs Audit** — Review for coherence and completeness

## Phase 0: Specs Location Detection

Before starting the interview, determine where spec files should be written.

1. Check if a `specs/` directory exists in the current working directory
2. If yes → use `specs/` as `SPECS_DIR` (existing local specs)
3. If no → ask the user using AskUserQuestion:
   - "Where should specs be written for this project?"
   - Option A: "Create specs/ here" — create a `specs/` folder in the current directory
   - Option B: "Custom path" — let the user provide a path (e.g., `../projects-specs/my-project`)
4. Store the resolved path as `SPECS_DIR` and use it in place of `specs/` throughout all subsequent phases

## Phase 1: Foundation

Before any topic decomposition, establish the project foundation.

**Ask about:**
- **What is the project?** Name, purpose, high-level vision
- **Tech stack** — Language, frameworks, database, infrastructure
- **Coding conventions** — Naming, patterns, module structure
- **Jobs to Be Done (JTBD)** — What problems does this solve for users?
- **Constraints** — Performance, security, compliance, scale, platform

Record the tech stack — it will inform the code included in specs later.

## Phase 2: Topic Decomposition

**Do this BEFORE any deep interview.** Break the feature into focused topics of concern.

**The one-sentence test:** Each topic must be describable in one sentence WITHOUT using "and" to join separate responsibilities.

- ✅ "Account registration via email and password" — one coherent topic
- ❌ "User onboarding handles registration, profile setup, and email verification" — three topics

**Process:**
1. Ask the user to describe the feature at a high level
2. Propose a topic breakdown as a numbered list
3. For each proposed topic, state the one-sentence description
4. Ask the user to validate, merge, or split topics
5. Lock the topic list before proceeding

Each topic becomes one spec file: `<SPECS_DIR>/01-account-registration.md`, `<SPECS_DIR>/02-profile-completion.md`, etc.

**After validation:** Run interview sections for EACH topic. You may batch shared context (Problem & Users is often the same across topics) but each topic gets its own Scope, Stories, Rules, UI/UX, Edge Cases, and Acceptance Criteria.

## Phase 3: Per-Topic Interview

### Interview Guidelines

**Adaptive questioning:**
- Start with grouped questions (2-3 related questions)
- Go deeper on complex or unclear areas
- Skip obvious follow-ups when answers are comprehensive

**Question framing:**
- Use AskUserQuestion with clear options when choices exist
- Ask open-ended questions for exploration
- Summarize understanding before moving to next section

**Depth over breadth:**
- Better to fully understand one area than superficially cover all
- Ask "why" to uncover real requirements vs assumed solutions
- Challenge vague requirements ("fast" → "under 200ms")

---

### 3.1 Context Discovery

Start here for each topic. Understand what's already known.

- What sparked this feature idea?
- Any existing docs, sketches, or prior discussions?
- What's the urgency/priority?

If context was already covered for a previous topic in this session, summarize what carries over and ask only what's new.

### 3.2 Problem & Users

**Target users:**
- Who is the primary user?
- Are there secondary users with different needs?
- What's their current workaround?

**Problem statement:**
- What problem does this solve?
- What's the cost of not solving it?
- How will users' lives improve?

### 3.3 Scope Definition

Draw clear boundaries before going deeper.

**Inclusions:**
- What should this topic include?
- What are the must-have behaviors for v1?
- Are there related features this touches?

**Exclusions:**
- What should it explicitly NOT do?
- What's a future phase vs this phase?
- Any adjacent topics we should avoid scope-creeping into?

**Constraints:**
- Non-functional requirements? (performance, accessibility, device support)
- Platform or browser constraints?
- Data volume expectations?

### 3.4 User Stories & Behaviors

Extract concrete behaviors users can perform.

Format: "As a [user], I can [action] so that [benefit]"

**Discovery questions:**
- Walk me through a typical user's journey for this topic
- What's the first thing a user does?
- What happens next? And after that?
- Are there different paths for different users?

### 3.5 Business Rules

Uncover the logic and conditions.

- What conditions must be true for [action] to work?
- Are there limits? (max items, rate limits, quotas)
- What permissions are required?
- Are there time-based rules? (expiration, scheduling)
- What validates input? What's rejected?

### 3.6 UI/UX Flows

Detail the interface and interactions.

**Screens:** What screens are needed? Entry point? Navigation between them?

**Components per screen:** What does the user see? Interact with? What feedback?

**States per component:** Empty, loading, success, error, disabled.

**Interactions:** Click/tap behavior, hover states, keyboard shortcuts, mobile considerations.

### 3.7 Edge Cases

Explore boundaries and failures.

**Error scenarios:** Network failure, missing permissions, invalid data, dependent service down.

**Boundary conditions:** Max/min values, empty lists, 10,000 items, concurrent access.

### 3.8 Acceptance Criteria

Define testable success conditions for each user story:

- Given [precondition]
- When [action]
- Then [expected result]

Criteria must be behavioral and observable.

### 3.9 Resolve Open Questions

Before moving on, collect and resolve every remaining uncertainty.

- Review all sections for unanswered questions or ambiguous requirements
- Present all unresolved items in a single AskUserQuestion call, grouped by section
- If answers surface new questions, repeat until zero open questions remain
- Incorporate each answer into the relevant spec section

## Phase 4: Technical Shape

**After the behavioral interview for each topic, propose the technical shape.**

This is where specs become implementation-ready. Based on the tech stack established in Phase 1 and the behaviors discovered in Phase 3, propose:

### Data Model
- Types, structs, interfaces, schemas — in the project's language
- Entity relationships
- State enums with transitions

### Public API / Interface
- Function signatures / method signatures
- Request/response formats (with actual types)
- Event types emitted
- Route definitions (if applicable)

### Architecture
- How this topic fits into the broader system
- Module/file structure
- Dependencies on other topics
- Data flow (include mermaid diagrams if helpful)

### Library Verification

Before proposing types or interfaces that depend on external libraries, **verify the library's actual API surface**:

- Check the library's docs, README, or source for the APIs you're referencing
- Confirm function signatures, option shapes, and config formats match the installed version
- Flag any APIs that are experimental, deprecated, or version-specific
- If you cannot verify an API, say so explicitly — don't guess

This prevents specs from encoding assumptions about library internals that turn out to be wrong. A spec that says `betterAuth({ apiKey: { enabled: true } })` is only useful if that's the real API. If it's not, the build agent will copy it verbatim and waste hours debugging.

### Implementation Hazards

For each topic, identify known limitations or risks that could trip up implementation:

- **Platform/browser limitations** — e.g., browser `EventSource` API doesn't support custom headers, so SSE endpoints can't use Bearer token auth without a workaround (query params, cookies, or polyfill)
- **Library gotchas** — APIs that look simple but have complex setup, implicit dependencies, or version-specific behavior
- **Cross-topic integration points** — where two specs must agree on a shared contract and getting the order wrong causes rework
- **Concurrency / timing issues** — race conditions, ordering assumptions, connection lifecycle

Document these in the spec so the build agent knows about them upfront rather than discovering them mid-implementation.

**Present the proposed technical shape to the user for approval.** Walk through each type/interface and ask:
- Does this capture the right shape?
- Any fields missing or wrong?
- Does this match your mental model?
- Any known hazards or library gotchas I missed?

Iterate until the user approves. This is a collaborative design step, not a rubber stamp.

### What to include vs exclude

**Include:**
- Public contracts: types, traits, interfaces, function signatures
- Data shapes: structs, enums, schemas
- State machines with transitions
- API surface: routes, request/response types, event types
- Module boundaries and dependencies
- Library verification notes and implementation hazards

**Exclude:**
- Private helper functions and internal algorithms
- Implementation details that don't affect the public contract
- Boilerplate (imports, error handling plumbing)
- **Full function/hook/component bodies** — specify the signature and behavior, not the implementation. The build agent should read actual library docs for that.
- **Library configuration objects** — specify what needs to be configured and the expected behavior, not the exact config syntax (it may change between versions)

## Phase 5: Write Specs

After all topics are interviewed and technical shapes are approved, write spec files.

### Spec File Structure

Organize each spec naturally based on what's relevant to the topic. Not every topic needs every section — a background job won't have UI flows, a UI component won't need a security section. Include only what matters.

Use these as a **checklist of things to consider**, not a rigid template:

- **Overview** — what this does and why it exists
- **Users & Problem** — who has the problem, why it matters
- **Scope** — what's in, what's out, constraints
- **User Stories** — "As a [user], I can [action] so that [benefit]"
- **Business Rules** — conditions, limits, permissions, validation
- **UI/UX Flows** — screens, components, states, interactions
- **Edge Cases** — error scenarios, boundary conditions
- **Data Model** — types, structs, schemas in the project's language
- **API / Interface** — function signatures, request/response types, event types
- **Architecture** — module structure, dependencies, data flow
- **Security Considerations** — auth, input validation, secrets
- **Acceptance Criteria** — Given/When/Then, written so they map directly to test assertions during planning
- **Testing Strategy** — what should be tested and how

Let the content dictate the structure. If a topic is best explained as a state machine with transitions, lead with that. If it's a CRUD resource, lead with the data model. Organize each spec in whatever way communicates the topic most clearly.

### File Naming

- One file per topic: `<SPECS_DIR>/NN-topic-name.md` (zero-padded prefix, kebab-case)
- Number reflects suggested planning order — foundational topics first (data model, auth), dependent topics later (UI, flows)
- Create `<SPECS_DIR>/README.md` as the index

### README.md Format

```markdown
# Specifications

## Tech Stack
- **Language:** [language]
- **Framework:** [framework]
- **Database:** [database]
- **Infrastructure:** [infrastructure]

## Specs

| Spec | Source Path | Description |
|------|------------|-------------|
| [Topic Name](./01-topic-name.md) | `src/path/` | One-line description |
| ... | ... | ... |
```

## Phase 6: Specs Audit

After ALL spec files are written, run this audit.

### Scope coherence check
- Can each topic be described in one sentence without "and"?
- Does it overlap with another spec? If yes, move shared content to one spec and cross-reference.
- Are acceptance criteria observable from the user's perspective?

### Completeness check
- Does every user story have acceptance criteria?
- Does every business rule have edge cases covered?
- Are all UI states specified (empty, loading, error, success)?
- Does the data model cover all entities mentioned in behaviors?
- Are all cross-topic dependencies documented?

### Technical shape check
- Do types/interfaces match the behavioral requirements?
- Are state transitions complete (no missing states)?
- Does the API surface cover all user stories?
- Are there types referenced but not defined?

### Audit output

```
## Specs Audit Results

### specs/01-account-registration.md
- ✅ Scope focused (one sentence: "New users create an account with email/password")
- ✅ All stories have acceptance criteria
- ⚠️ Added missing error state for duplicate email in UI flows

### specs/02-profile-completion.md
- ✅ Clean
```

If any spec required changes, show the before/after for user confirmation.

## Key Principles

- **Specs are the heart of the application.** The more detailed the *behavioral requirements and contracts*, the better the agent performs. But implementation mechanics should be left to the build agent and actual library docs.
- **Include contracts, not implementation.** Types, traits, interfaces, function signatures, schemas — in the project's language. Do NOT include full function bodies, hook implementations, library config objects, or middleware wiring. Specify *what* and *why*, not *how*.
- **One topic per file.** If you need "and" to describe it, split it.
- **Behaviors first, then shape.** Interview discovers WHAT, then technical shape proposes HOW it looks — both belong in the spec.
- **Public contracts, not internals.** Specify the surface area, not private helpers or algorithm guts.
- **Verify before specifying.** If a type or interface depends on an external library, verify the API actually exists as described. Don't spec against imagined APIs.
- **Flag hazards.** Known platform limitations, library gotchas, and cross-topic integration risks belong in the spec so the build agent doesn't discover them the hard way.
- **Zero open questions.** Every decision point must be resolved during the interview.
- **User approves technical shape.** Don't just generate types — walk through them and iterate.
