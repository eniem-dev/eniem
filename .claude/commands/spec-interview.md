---
description: Interview user to create a spec file for a feature
---

# Spec Interview

Create a specification file through structured interview using AskUserQuestionTool.

## Usage

`/spec-interview <feature-name>`

Example: `/spec-interview analytics-dashboard`

## Process

1. **Start with context**: Ask what the user already knows about the feature
2. **JTBD Discovery**: Understand the job-to-be-done
3. **Scope Definition**: Clarify boundaries and constraints
4. **Requirements Gathering**: Identify specific requirements
5. **Acceptance Criteria**: Define what success looks like
6. **Edge Cases**: Explore error states and edge cases
7. **Technical Hints**: Identify files, patterns, dependencies
8. **Test Requirements**: Derive test cases from acceptance criteria
9. **Write Spec**: Create `specs/<feature-name>.md`

## Interview Questions (use AskUserQuestionTool)

Ask questions ONE AT A TIME. Adapt based on answers.

### Question Categories

**Purpose & JTBD**
- What is the primary job this feature helps users accomplish?
- Who is the target user for this feature?
- What problem does this solve?

**Scope**
- What should this feature include?
- What should it explicitly NOT include?
- Are there related features to consider?

**Requirements**
- What are the must-have behaviors?
- What data/inputs does it need?
- What outputs/results should it produce?

**Constraints**
- Any technical constraints?
- Performance requirements?
- Security considerations?

**Acceptance Criteria**
- How will we know it's working correctly?
- What are the success scenarios?
- What are the failure scenarios?

**Technical Hints** (explore codebase to answer these)
- Which existing files will need modification?
- Are there similar patterns in the codebase to follow?
- Does this depend on other specs/features?
- What new files will need to be created?

**Test Requirements** (derive from acceptance criteria)
- What unit tests are needed?
- What integration tests are needed?
- Are there edge cases that need specific tests?

## Output Format

After interview, create `specs/<feature-name>.md`:

```markdown
# <Feature Name>

## Overview
[One paragraph summary of the feature and its purpose]

## Job to Be Done
[What user need this addresses]

## Target User
[Who uses this feature]

## Requirements

### Must Have
- [ ] Requirement 1
- [ ] Requirement 2

### Nice to Have
- [ ] Optional requirement

## Constraints
- Constraint 1
- Constraint 2

## Acceptance Criteria
- [ ] Criterion 1 (specific, testable)
- [ ] Criterion 2 (specific, testable)

## Edge Cases
- Edge case 1: expected behavior
- Edge case 2: expected behavior

## Out of Scope
- Thing explicitly not included

## Technical Hints
- **Files to modify**: `content/docs/...`, `src/app/...`, `src/components/...`
- **Files to create**: `content/docs/<topic>/...`
- **Patterns to follow**: See `content/docs/guides/` for similar structure
- **Dependencies**: Requires `specs/other-spec.md` (if applicable)

## Test Requirements
- [ ] Test: [derived from acceptance criterion 1]
- [ ] Test: [derived from acceptance criterion 2]
- [ ] Test: [edge case test]
```

## Guardrails

- Ask questions using AskUserQuestionTool with clear options
- Don't make assumptions - ask if unclear
- Keep questions focused and concise
- Summarize understanding before writing spec
- The spec captures WHAT and WHY, not HOW
- Explore the codebase to fill Technical Hints section
- Derive Test Requirements directly from Acceptance Criteria
