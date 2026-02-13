# Spec Interview — GitHub Issue Integration

## Overview

Enhance the `/spec-interview` command so that when invoked with a GitHub issue URL, it auto-fetches the issue context, ensures the generated spec includes a Post-Completion section instructing that the PR should close the issue, and labels the issue as `spec-ready` for triage visibility.

## Job to Be Done

When a maintainer creates a spec from a GitHub issue, the resulting spec should automatically link back to the issue and specify that the implementing PR must close it — eliminating the manual step of remembering to add issue-closing references.

## Target User

Eniem maintainers using `/spec-interview` to create specs from GitHub issues.

## Requirements

### Must Have

#### 1. Detect GitHub issue URL argument
- [ ] When the argument to `/spec-interview` matches a GitHub issue URL pattern (e.g., `https://github.com/<owner>/<repo>/issues/<number>`), treat it as an issue-linked spec interview
- [ ] Extract the issue number from the URL

#### 2. Auto-fetch issue context
- [ ] Use `gh issue view <number> --json title,body,labels` (or equivalent) to fetch issue details
- [ ] Use the issue title and body as starting context for the interview — reducing redundant questions about purpose/problem
- [ ] If the fetch fails (e.g., private repo, no `gh` CLI), gracefully fall back to the normal interview flow and warn the user

#### 3. Add Post-Completion section to spec template
- [ ] When a GitHub issue URL is provided, append a `## Post-Completion` section to the generated spec with:
  - `- [ ] Close GitHub issue: <issue-url>`
  - `- [ ] PR description includes \`Closes #<number>\` for automatic issue closing`
- [ ] When NO GitHub issue URL is provided, omit the Post-Completion section entirely

#### 4. Label the GitHub issue as `spec-ready`
- [ ] After the spec file is written, run `gh issue edit <number> --add-label spec-ready` to tag the issue
- [ ] If the `spec-ready` label doesn't exist on the repo, create it first with `gh label create spec-ready --description "Spec created, ready for implementation" --color 0E8A16`
- [ ] If labeling fails (permissions, no `gh` CLI), warn the user but don't block spec creation

#### 5. Update spec template in the command file
- [ ] Add the `## Post-Completion` section to the output format template in `apps/boilerplate/.claude/commands/spec-interview.md`
- [ ] Add instructions in the Process section for handling GitHub issue URL arguments
- [ ] Add the `spec-ready` labeling step to the Process section

### Nice to Have
- [ ] Use issue labels to pre-suggest scope/constraints during the interview

## Constraints

- Only the boilerplate copy of `spec-interview.md` is modified (`apps/boilerplate/.claude/commands/spec-interview.md`)
- The command must remain backward-compatible — passing a plain feature name (e.g., `analytics-dashboard`) still works as before, without a Post-Completion section
- The `gh` CLI must be available for auto-fetching; if not, the command should degrade gracefully

## Acceptance Criteria

- [ ] `/spec-interview https://github.com/eniem-dev/eniem/issues/99` produces a spec with a `## Post-Completion` section containing `Close GitHub issue: https://github.com/eniem-dev/eniem/issues/99` and `PR description includes \`Closes #99\``
- [ ] `/spec-interview analytics-dashboard` produces a spec without a `## Post-Completion` section (same behavior as today)
- [ ] When given a GitHub issue URL, the interview starts with context from the issue (title, body) rather than asking "what is this feature about?" from scratch
- [ ] After spec is written from a GitHub issue URL, the issue is labeled `spec-ready`
- [ ] The spec-interview command template in `apps/boilerplate/.claude/commands/spec-interview.md` includes the new Process steps and Output Format section
- [ ] Existing specs (#21, #22) format is consistent with the new template's Post-Completion section

## Edge Cases

- Invalid GitHub URL (not matching issue pattern): treat as a plain feature name, no Post-Completion section, no labeling
- `gh` CLI not installed or not authenticated: warn user, skip auto-fetch and labeling, proceed with normal interview, still add Post-Completion section with the URL
- Issue URL from a different repo than eniem: still works — the URL is used as-is in Post-Completion, labeling attempted on that repo
- `spec-ready` label doesn't exist on the repo: auto-create it before applying

## Out of Scope

- Updating the docs, CLI, or example project copies of `spec-interview.md`
- Auto-creating PRs or auto-closing issues
- Modifying the `functional-spec-interview` skill

## Technical Hints

- **File to modify**: `apps/boilerplate/.claude/commands/spec-interview.md`
- **Patterns to follow**: Existing specs `specs/21-cleanup-sub-projects.md` and `specs/22-agents-claude-md-refactoring.md` both have `## Post-Completion` sections
- **Dependencies**: None

## Verification Commands

| Criterion | Command |
|-----------|---------|
| Post-Completion in template | `grep -q "Post-Completion" apps/boilerplate/.claude/commands/spec-interview.md && echo pass` |
| GitHub issue URL handling in template | `grep -q "github.com" apps/boilerplate/.claude/commands/spec-interview.md && echo pass` |
| Auto-fetch instruction in template | `grep -q "gh issue view" apps/boilerplate/.claude/commands/spec-interview.md && echo pass` |
| Closes syntax in template | `grep -q "Closes #" apps/boilerplate/.claude/commands/spec-interview.md && echo pass` |
| spec-ready labeling in template | `grep -q "spec-ready" apps/boilerplate/.claude/commands/spec-interview.md && echo pass` |

## Test Requirements

- [ ] Test: Spec generated from issue URL contains `## Post-Completion` with correct issue link
- [ ] Test: Spec generated from plain feature name does NOT contain `## Post-Completion`
- [ ] Test: Template file contains updated Process steps for GitHub URL detection
- [ ] Test: Template file contains updated Output Format with Post-Completion section
- [ ] Test: GitHub issue is labeled `spec-ready` after spec creation from issue URL
- [ ] Test: `spec-ready` label is auto-created if it doesn't exist on the repo

## Post-Completion

- [ ] Close GitHub issue: https://github.com/eniem-dev/eniem/issues/23
- [ ] PR description includes `Closes #23` for automatic issue closing
