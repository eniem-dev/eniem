---
name: fix-code-review
description: Fix code review comments from a GitHub PR. Use when the user says '/fix-code-review <PR_URL>', 'fix review comments', 'fix PR feedback', 'address review comments', or wants to resolve PR review feedback.
---

# Fix Code Review

Fetch review comments from a GitHub PR and fix them with approval before applying changes.

## Usage

`/fix-code-review <pr-url>`

Example: `/fix-code-review https://github.com/owner/repo/pull/42`

## Process

1. **Discover branch**: Find the PR's head branch and switch to the correct worktree
2. **Fetch PR comments**: Use `gh` CLI to get all review comments
3. **Parse comments**: Extract file paths, line numbers, and feedback
4. **Show plan**: Display each comment and proposed fix
5. **Get approval**: Ask user to confirm before making changes
6. **Apply fixes**: Make the code changes
7. **Validate**: Run the project's validation commands to ensure fixes don't break anything
8. **Summarize**: Show what was fixed

## Step 1: Discover PR Branch and Worktree

Before doing anything, find and switch to the correct working directory:

1. Get the PR's head branch:
   ```bash
   gh pr view <pr-number> --json headRefName --repo <owner/repo>
   ```
2. Check if a worktree already exists at `.worktrees/<head-branch-name>`
3. If it exists, work in that directory
4. If not, create it:
   ```bash
   git fetch origin <head-branch-name>
   git worktree add .worktrees/<head-branch-name> origin/<head-branch-name>
   ```

All subsequent steps run from this worktree directory.

## Step 2: Fetch All Comments

GitHub PRs have 3 types of comments - fetch ALL of them:

```bash
# 1. Review comments (line-specific feedback on the diff) - MOST IMPORTANT
gh api repos/<owner>/<repo>/pulls/<pr-number>/comments

# 2. Reviews with their body comments (approve/request changes summary)
gh pr view <pr-number> --json reviews --repo <owner/repo>

# 3. Issue comments (general conversation, not tied to code lines)
gh pr view <pr-number> --json comments --repo <owner/repo>
```

**Important**: `gh pr view --json comments` returns conversation comments, NOT the line-specific review comments. You MUST use the API endpoint to get line-specific feedback.

Parse the response to extract:

**From review comments (API):**
- `path` - File path
- `line` or `original_line` - Line number
- `body` - Comment body (the feedback to address)
- `user.login` - Author
- `diff_hunk` - Context of the code being commented on

**From reviews:**
- `body` - Review summary comment
- `state` - APPROVED, CHANGES_REQUESTED, COMMENTED
- `author.login` - Reviewer

**From issue comments:**
- `body` - General feedback
- `author.login` - Commenter

## Step 3: Build Fix Plan

For each comment, analyze:
- What change is being requested?
- Which file/lines need modification?
- What's the proposed fix?

Present as a numbered list:

```
## Fix Plan

1. **src/lib/auth.ts:42** - "Add error handling for null user"
   → Add null check before accessing user properties

2. **src/components/Button.tsx:15** - "Use semantic HTML"
   → Change div to button element

3. **src/features/settings/index.ts:8** - "Missing export"
   → Add missing export statement
```

## Step 4: Get Approval

Ask the user before proceeding:
- "Apply all fixes?" → Yes / No / Let me select specific ones

If user selects specific ones, show checkboxes for each fix.

## Step 5: Apply Fixes

For each approved fix:
1. Read the file
2. Apply the change
3. Verify syntax is valid

## Step 6: Validate

Run the project's validation commands (build, lint, tests).

If validation fails:
- Show the error
- Attempt to fix
- Re-validate

## Step 7: Summarize

```
## Summary

Fixed 3/3 review comments:
- ✅ src/lib/auth.ts:42 - Added null check
- ✅ src/components/Button.tsx:15 - Changed to semantic button
- ✅ src/features/settings/index.ts:8 - Added export

Validation: ✅ Build passed, ✅ Lint passed, ✅ Tests passed

Ready to commit? (Don't commit automatically - let user decide)
```

## Guardrails

- Always show plan before making changes
- Ask for approval before applying fixes
- Run validation after fixes
- Don't commit automatically - user decides
- If a comment is unclear, ask for clarification
- Handle PR URLs from any GitHub repo (parse owner/repo from URL)
