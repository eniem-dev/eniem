# Document Beads Git Hooks Setup

## Overview

Add a "Git Hooks" section to the existing beads-setup documentation page so Eniem customers understand the automated sync hooks, how to install them, and what each hook does. This eliminates the need for manual `bd sync` commands.

## Problem Statement

**Who:** Eniem customers (developers who purchased the boilerplate)
**Problem:** Beads git hooks are installed in the project but undocumented. Customers with basic beads awareness (from existing docs) don't know hooks exist, what they automate, or how to install them.
**Impact:** Without documentation, customers either skip hooks entirely (relying on error-prone manual syncing) or encounter hook behavior they don't understand.

## Scope

### Included

- New "Git Hooks" section on the existing `beads-setup` page
- Explanation of what hooks are and why they exist (eliminates manual `bd sync`)
- Install command: `bd hooks install`
- Table listing all 5 hooks with one-line descriptions
- Brief mention of the manual alternative (`bd sync`) for those who don't install hooks

### Excluded

- No AGENTS.md changes
- No new standalone documentation page (content goes on existing beads-setup page)
- No troubleshooting section
- No uninstall instructions
- No changes to existing page title, intro paragraph, or other existing content

### Constraints

- Must match existing Fumadocs MDX format and style conventions
- Section goes after the existing "Setup" section, before "Learn more"
- Keep it concise — this is a "just the basics" addition, not a deep dive

## User Stories

### Primary Flow

- [ ] As a customer, I can learn what beads git hooks are and why they exist, so I understand the automation before installing
- [ ] As a customer, I can follow a one-command install step (`bd hooks install`), so hooks are set up in my project
- [ ] As a customer, I can see what each hook does (pre-push, pre-commit, etc.), so I know what's happening automatically
- [ ] As a customer, I can understand I no longer need to manually run `bd sync`, so I trust the automation

## Content Specification

### New Section: "Git Hooks"

**Position:** After "Setup", before "Learn more"

**Content structure:**

1. **Opening sentence** — What hooks do at a high level (automate beads syncing so you never need to run `bd sync` manually)
2. **Install command** — Code block: `bd hooks install`
3. **Hooks table** — All 5 hooks with one-line descriptions:

| Hook | What it does |
|------|-------------|
| `pre-commit` | Flushes pending beads changes to JSONL before commit |
| `post-merge` | Imports updated JSONL after pull/merge |
| `pre-push` | Prevents pushing stale JSONL |
| `post-checkout` | Imports JSONL after branch checkout |
| `prepare-commit-msg` | Adds agent identity trailers for forensics |

4. **Manual alternative note** — Brief sentence: without hooks, you'd need to run `bd sync` manually before pushing

### Existing Content

All existing content remains untouched:
- Title: "Beads Setup" (unchanged)
- Description meta: unchanged
- Intro paragraph: unchanged
- "Why a sync-branch?" section: unchanged
- "What you'll see" artifacts table: unchanged
- "Setup" section: unchanged
- "Learn more" section: unchanged

## Acceptance Criteria

### Customer can learn about hooks

- [ ] **Given** a customer is on the beads-setup docs page, **when** they scroll past the "Setup" section, **then** they see a "Git Hooks" section
- [ ] **Given** a customer reads the Git Hooks section, **when** they finish reading, **then** they understand hooks automate beads syncing

### Customer can install hooks

- [ ] **Given** a customer wants to install hooks, **when** they read the section, **then** they find the `bd hooks install` command in a code block

### Customer can understand each hook

- [ ] **Given** a customer wants to know what each hook does, **when** they look at the hooks table, **then** they see all 5 hooks with clear one-line descriptions

### Customer understands the alternative

- [ ] **Given** a customer doesn't want to install hooks, **when** they read the section, **then** they learn they can manually run `bd sync` instead

### No regressions

- [ ] **Given** existing beads-setup content, **when** the new section is added, **then** all existing content remains unchanged
- [ ] **Given** the docs site, **when** built, **then** the page renders correctly with the new section
