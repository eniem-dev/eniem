# Docs: Beads Sync-Branch Setup Guide

> GitHub Issue: #5

## Overview

Add a guide page to the docs site (`apps/docs`) explaining what beads sync-branch is, why it exists, and how it keeps feature branches clean of issue-tracking noise. The guide is educational — the `eni` CLI already handles configuration, so customers don't need to set anything up manually.

## Problem Statement

**Who:** Eniem boilerplate customers (intermediate git users)
**Problem:** Customers see `.beads/` folder, a `beads-sync` branch, and JSONL files in their project without understanding what they are or why they exist. The CLI output references beads but there's no doc to learn more.
**Impact:** Without explanation, customers may be confused by unfamiliar artifacts, accidentally modify beads files, or worry something is misconfigured. A clear explainer builds trust and reduces support questions.

## Scope

### Included

- Brief intro: what beads is (1-2 sentences — git-native issue tracker)
- What the sync-branch does and why it exists
- Conceptual explanation of how it keeps feature branches clean
- What the customer should expect to see (artifacts, branches, files)
- Confirmation that setup is handled by `eni` CLI — no manual action needed

### Excluded

- Troubleshooting guide (not needed for v1 — this is educational)
- Full worktree workflow documentation
- Git internals (sparse-checkout, hidden worktrees, daemon mechanics)
- How to manually configure beads from scratch
- beads CLI command reference

### Constraints

- Must follow existing docs site conventions (Fumadocs MDX format)
- Must match tone and structure of other guides in `apps/docs/content/docs/guides/`
- Conceptual depth only — no deep git internals

## User Stories

### Primary Flow

- [ ] As a boilerplate customer, I can read a brief explanation of what beads is so that I understand the `.beads/` folder in my project
- [ ] As a boilerplate customer, I can understand why a `beads-sync` branch exists so that I don't worry about or interfere with it
- [ ] As a boilerplate customer, I can learn that the `eni` CLI handles beads setup so that I know no manual configuration is needed

### Secondary Flows

- [ ] As a boilerplate customer, I can understand what JSONL files are for so that I don't accidentally delete or modify them
- [ ] As a boilerplate customer, I can learn that beads commits go to a separate branch so that I understand why my feature branch PRs stay clean

## Business Rules

### Content Rules

- The doc must NOT instruct customers to run manual beads setup commands — the CLI handles this
- The doc must NOT go deeper than conceptual explanation (no `.git/beads-worktrees/` paths, no daemon flags)
- The doc MUST mention that `eni` CLI handles configuration automatically
- The doc SHOULD link to beads upstream docs for readers who want deeper knowledge

### Validation

- The guide must render correctly in the Fumadocs site
- The guide must appear in the guides section navigation

## Data Model

Not applicable — this is a documentation page with no data entities.

## UI/UX Specification

### Page: Beads Setup Guide

**Entry point:** Docs site sidebar → Guides → Beads Setup

**Layout / Content Sections:**

1. **Intro paragraph** — What beads is (git-native issue tracker used by the project for task management). 1-2 sentences.

2. **Why sync-branch?** — The problem it solves:
   - Without sync-branch: beads commits (JSONL changes) land on your feature branches, polluting PRs with issue-tracking diffs
   - With sync-branch: all beads commits go to a dedicated `beads-sync` branch, keeping feature branches and `main` clean

3. **What you'll see in your project** — List of artifacts customers will encounter:
   - `.beads/` folder (config and local database)
   - `beads-sync` branch (remote branch for syncing issue state)
   - These are normal and expected — don't modify or delete them

4. **Setup** — One sentence: "The `eni` CLI configures beads automatically when you set up your project. No manual setup is needed."

5. **Learn more** (optional) — Link to upstream beads docs for curious readers

**States:**
| State | Display |
|-------|---------|
| Normal | Static MDX page with text content |
| Not found | 404 if page path is wrong (standard Fumadocs behavior) |

### Navigation

- Add `beads-setup` entry to the guides `meta.json` so it appears in sidebar
- Page should be accessible at `/docs/guides/beads-setup`

## Edge Cases

### Content Edge Cases

| Condition | Expected Behavior |
|-----------|-------------------|
| Customer not using beads | Doc should make clear this is pre-configured — if they don't see it, they may be on an older version |
| Customer wants deeper technical detail | Link to upstream beads docs (worktrees doc referenced in issue) |
| Customer accidentally deleted .beads/ | Out of scope for this doc — could be a future troubleshooting guide |

## Acceptance Criteria

### Beads intro

- [ ] **Given** a customer opens the guide, **when** they read the intro, **then** they understand beads is a git-native issue tracker in 1-2 sentences

### Sync-branch explanation

- [ ] **Given** a customer reads the "Why sync-branch?" section, **when** they finish, **then** they understand that beads commits go to a separate branch to keep feature branches clean
- [ ] **Given** a customer reads the explanation, **when** they look at their repo, **then** they can identify the `beads-sync` branch and `.beads/` folder as expected artifacts

### Setup clarity

- [ ] **Given** a customer reads the setup section, **when** they finish, **then** they know no manual action is required because the CLI handles it

### Docs integration

- [ ] **Given** the guide is deployed, **when** a customer navigates to Guides in the sidebar, **then** they see "Beads Setup" as an option
- [ ] **Given** the guide exists, **when** accessed at `/docs/guides/beads-setup`, **then** the page renders correctly in Fumadocs

## Resolved Questions

- **Guide title**: "Beads Setup" — short, matches URL path
- **External link**: Link to the beads GitHub repo (github.com/steveyegge/beads) for readers who want to learn more
