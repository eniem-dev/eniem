---
description: Interview user to create an app plan that feeds features into /spec-interview
---

# App Interview

Create an application plan through structured interview using AskUserQuestionTool.

## Usage

`/app-interview <app-name>`

Example: `/app-interview expense-tracker`

## Flow

```
/app-interview <app-name>  →  Interview  →  specs/app-<app-name>.md
                                                    ↓
                              Pick feature  →  /spec-interview <feature>
```

## Process

1. **Vision**: Ask what is this app? What problem does it solve?
2. **Users**: Identify target users and their pain points
3. **Core Features**: List essential features
4. **User Flows**: Map main user journeys
5. **Technical Context**: Understand integrations, constraints, stack
6. **Success Metrics**: Define how to measure success
7. **Scope Boundaries**: Clarify what's explicitly out of scope
8. **Priorities**: Categorize MVP vs future features
9. **Write Plan**: Create `specs/app-<app-name>.md`

## Interview Questions (use AskUserQuestionTool)

Ask questions ONE AT A TIME. Adapt based on answers.

### Question Categories

**Vision & Purpose**
- What is this app in one sentence?
- What problem does it solve?
- Why does this need to exist?

**Target Users**
- Who are the primary users?
- What are their biggest pain points?
- What's their current workaround?

**Core Features**
- What are the essential features for launch?
- What features can wait until later?
- Are there features you explicitly want to avoid?

**User Flows**
- What's the primary user journey?
- What secondary flows matter most?
- Where do users start and end?

**Technical Context**
- Any specific stack preferences or constraints?
- External integrations needed?
- Performance or security requirements?

**Success Metrics**
- How will you know if this app succeeds?
- What's the key metric to track?

**Scope Boundaries**
- What should this app NOT do?
- Any features that seem obvious but you want to exclude?

**Priorities**
- Which features are MVP (must have for launch)?
- Which are nice-to-have for v2?
- Which are future/backlog?

## Output Format

After interview, create `specs/app-<app-name>.md`:

```markdown
# <App Name>

## Vision
[One sentence: what is this app and why?]

## Problem Statement
[What problem does this solve? Why does it need to exist?]

## Target Users
[Who are the primary users? What are their pain points?]

## Features

### MVP (Must Have)
| Feature | Description |
|---------|-------------|
| feature-1 | Brief desc |
| feature-2 | Brief desc |

### Phase 2 (Nice to Have)
| Feature | Description |
|---------|-------------|
| feature-3 | Brief desc |

### Future
- feature-4
- feature-5

## User Flows

### Primary: [Flow Name]
1. User does X
2. System responds Y
3. User achieves Z

### Secondary: [Flow Name]
1. Step 1
2. Step 2

## Technical Context
- **Stack**: [if known/specified]
- **Integrations**: [external systems]
- **Constraints**: [limitations, requirements]

## Success Metrics
- Metric 1: [how measured]
- Metric 2: [how measured]

## Out of Scope
- Excluded thing 1
- Excluded thing 2

## Next Steps
Run `/spec-interview <feature>` for each MVP feature:
- `/spec-interview feature-1`
- `/spec-interview feature-2`
```

## Guardrails

- Ask questions ONE AT A TIME using AskUserQuestionTool
- Don't make assumptions - ask if unclear
- Keep questions focused and concise
- Summarize understanding before writing plan
- The plan captures WHAT and WHY, not HOW
- Use kebab-case for feature names (for spec-interview compatibility)
- Features should be granular enough for a single spec file

## Feature Naming

Feature names MUST be:
- kebab-case: `user-authentication`, `expense-tracking`
- Specific enough to be a single spec
- Action-oriented when possible: `export-reports`, `invite-team-members`

Bad: `auth` (too vague), `User Settings` (wrong case), `everything-else` (not specific)
Good: `email-login`, `password-reset`, `user-profile-settings`
