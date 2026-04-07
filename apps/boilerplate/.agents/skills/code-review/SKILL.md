---
name: code-review
description: Review a pull request using the code-reviewer agent. Use when the user says '/code-review <PR_URL>', 'review this PR', 'review pull request', or provides a GitHub PR URL for code review.
---

# Code Review

Review a pull request against exacting standards for code quality using the **code-reviewer** agent.

## Usage

```
/code-review <PR_URL>
```

## Instructions

1. The user provides a GitHub pull request URL (e.g. `https://github.com/org/repo/pull/123`)
2. Fetch the PR diff and changed files using `gh pr diff <PR_URL>` and `gh pr view <PR_URL>`
3. **Delegate the review to the `code-reviewer` agent** — spawn it with the full diff and file contents, and ask it to perform its structured review
4. Post the review as a comment on the pull request using `gh pr comment <PR_URL> --body "<review>"`

## Important

- Always use the **code-reviewer** agent (defined in `~/.agents/code-reviewer.md`) to perform the actual review — do not review the code yourself
- Always post the review result as a PR comment — do not just display it locally
- If no URL is provided, ask the user for the PR URL
- For large PRs, focus the review on the most significant changes first
