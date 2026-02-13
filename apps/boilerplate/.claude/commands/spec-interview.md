---
description: Interview user to create a spec file for a feature
---

# Spec Interview

Create a specification file through structured interview using AskUserQuestionTool.

## Usage

`/spec-interview <feature-name-or-github-url>`

Examples:
- `/spec-interview analytics-dashboard`
- `/spec-interview https://github.com/eniem-dev/eniem/issues/42`

## Process

1. **Parse argument**: Check if the argument matches a GitHub issue URL (`https://github.com/<owner>/<repo>/issues/<number>`). If so, extract the issue number and store the full URL for use in the Post-Completion section. Use the extracted issue number alongside the feature name for the spec filename. If the argument is a plain feature name, proceed without GitHub issue context.
2. **Start with context**: Ask what the user already knows about the feature
3. **JTBD Discovery**: Understand the job-to-be-done
4. **Scope Definition**: Clarify boundaries and constraints
5. **Requirements Gathering**: Identify specific requirements
6. **Acceptance Criteria**: Define what success looks like
7. **Edge Cases**: Explore error states and edge cases
8. **Technical Hints**: Identify files, patterns, dependencies
9. **Test Requirements**: Derive test cases from acceptance criteria
10. **Write Spec**: Create `specs/<feature-name>.md`

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

**Verification Commands**
- For each acceptance criterion, what command verifies it?
- Grep patterns, test commands, or CLI checks

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
- **Files to modify**: `src/lib/...`, `src/components/...`
- **Files to create**: `src/features/<feature>/...`
- **Patterns to follow**: See `src/features/settings/` for similar structure
- **Dependencies**: Requires `specs/other-spec.md` (if applicable)

## Verification Commands

| Criterion | Command |
|-----------|---------|
| [Acceptance criterion 1] | `pnpm test -- [file] "[test name]"` |
| [Acceptance criterion 2] | `grep -q "pattern" src/path/file.ts && echo pass` |

## Test Requirements
- [ ] Test: [derived from acceptance criterion 1]
- [ ] Test: [derived from acceptance criterion 2]
- [ ] Test: [edge case test]

<!-- Include this section ONLY if a GitHub issue URL was provided as argument -->
## Post-Completion

- [ ] Close GitHub issue: <github-issue-url>
- [ ] PR description includes: Closes #<issue-number>
```

## Guardrails

- Ask questions using AskUserQuestionTool with clear options
- Don't make assumptions - ask if unclear
- Keep questions focused and concise
- Summarize understanding before writing spec
- The spec captures WHAT and WHY, not HOW
- Explore the codebase to fill Technical Hints section
- Derive Test Requirements directly from Acceptance Criteria
- Only include the Post-Completion section when a GitHub issue URL was provided as argument; omit it entirely for plain feature names
