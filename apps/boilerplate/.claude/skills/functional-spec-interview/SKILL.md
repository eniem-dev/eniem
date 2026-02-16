---
name: functional-spec-interview
description: Create detailed functional specifications through structured user interviews. Use when user says '/functional-spec', 'spec interview', 'create a spec', 'define requirements', or wants to document a feature before implementation. Produces comprehensive specs covering user stories, business rules, data models, and UI/UX that another agent can use to create implementation plans.
---

# Functional Spec Interview

Create a functional specification through adaptive interview using AskUserQuestion tool.

## Usage

`/functional-spec <feature-name>`

Example: `/functional-spec user-onboarding`

## Process Overview

1. **Context Discovery** - Understand what user already knows
2. **Problem & Users** - Who has the problem, why it matters
3. **Scope Definition** - What's in, what's out, boundaries
4. **User Stories** - What users can do (behaviors)
5. **Business Rules** - Conditions and logic governing the feature
6. **Data Model** - What data exists and how it transforms
7. **UI/UX Flows** - Screens, interactions, states
8. **Edge Cases** - Error states, limits, exceptions
9. **Acceptance Criteria** - How to verify success
10. **Write Spec** - Output to `specs/<feature-name>.md`

## Interview Guidelines

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

## Interview Sections

### 1. Context Discovery

Start here. Understand what's already known.

- What sparked this feature idea?
- Any existing docs, sketches, or prior discussions?
- What's the urgency/priority?

### 2. Problem & Users

**Target users:**
- Who is the primary user?
- Are there secondary users with different needs?
- What's their current workaround?

**Problem statement:**
- What problem does this solve?
- What's the cost of not solving it?
- How will users' lives improve?

### 3. Scope Definition

Draw clear boundaries before going deeper.

**Inclusions:**
- What should this feature include?
- What are the must-have behaviors for v1?
- Are there related features this touches?

**Exclusions:**
- What should it explicitly NOT do?
- What's a future phase vs this phase?
- Any adjacent features we should avoid scope-creeping into?

**Constraints:**
- Any non-functional requirements? (performance, accessibility, device support)
- Platform or browser constraints?
- Data volume expectations?

### 4. User Stories

Extract concrete behaviors users can perform.

Format: "As a [user], I can [action] so that [benefit]"

**Discovery questions:**
- Walk me through a typical user's journey
- What's the first thing a user does?
- What happens next? And after that?
- Are there different paths for different users?

### 5. Business Rules

Uncover the logic and conditions.

**Discovery questions:**
- What conditions must be true for [action] to work?
- Are there limits? (max items, rate limits, quotas)
- What permissions are required?
- Are there time-based rules? (expiration, scheduling)
- What validates input? What's rejected?

### 6. Data Model

Understand what data exists and transforms.

**Entities:**
- What are the main "things" in this feature?
- What properties does each have?
- How do they relate to each other?

**State transitions:**
- What states can [entity] be in?
- What triggers state changes?
- Are state changes reversible?

**Data flow:**
- Where does data come from?
- Where does it go?
- What transformations happen?

### 7. UI/UX Flows

Detail the interface and interactions.

**Screens:**
- What screens/pages are needed?
- What's the entry point?
- What navigation exists between screens?

**Components per screen:**
- What does the user see?
- What can they interact with?
- What feedback do they receive?

**States per component:**
- Empty state (no data)
- Loading state
- Success state
- Error state
- Disabled state (when applicable)

**Interactions:**
- What happens on click/tap?
- Are there hover states?
- Keyboard shortcuts?
- Mobile considerations?

### 8. Edge Cases

Explore boundaries and failures.

**Error scenarios:**
- What if network fails?
- What if user lacks permissions?
- What if data is invalid?
- What if dependent service is down?

**Boundary conditions:**
- What's the max/min allowed?
- What if list is empty?
- What if list has 10,000 items?
- What about concurrent access?

### 9. Acceptance Criteria

Define testable success conditions.

For each user story, define:
- Given [precondition]
- When [action]
- Then [expected result]

## Output

After interview, create `specs/<feature-name>.md` using template in `references/spec-template.md`.

## Guardrails

- This is a FUNCTIONAL spec, not implementation spec
- Capture WHAT and WHY, not HOW to build
- No code, no technical architecture, no file paths
- Focus on user-facing behavior and business logic
- The spec should be detailed enough for another agent to create an implementation plan
