# Documentation: Multi-CLI Adapter Support

## Overview

Update the Eniem documentation to reflect that the AI workflow supports three CLI adapters (Claude Code, Codex, OpenCode) instead of only Claude Code. Remove all Gemini references silently. Replace "Claude Commands" terminology with the generic "Slash Commands." Show users how to configure their preferred CLI via `eni config`.

## Problem Statement

**Who:** Eniem users setting up the AI workflow
**Problem:** The docs present Claude Code as the only supported CLI, but the `eni` CLI actually supports three adapters (Claude Code, Codex, OpenCode). Users of Codex or OpenCode don't know they can use the workflow.
**Impact:** Users who prefer Codex or OpenCode skip the AI workflow entirely, or assume it's Claude-only.

## Scope

### Included

- Update the AI Workflow guide page (`apps/docs/content/docs/guides/ai-workflow/index.mdx`)
- Audit and update all other doc pages that reference "Claude Code" as a hard requirement
- Replace "Claude Commands" section header with "Slash Commands"
- Add a brief mention of `eni config` for selecting the preferred CLI adapter
- Remove Gemini references silently (no migration note, no changelog)

### Excluded

- The "Sell Code via GitHub" guide — it mentions Claude as a general AI assistant, not as a CLI adapter; leave as-is
- CLI code changes (removing the Gemini adapter from `packages/cli`) — separate task
- Detailed `eni config` documentation (full syntax, all options) — just mention it briefly
- Adding new doc pages or sections for individual adapter guides

### Constraints

- All three CLIs must be presented as equal choices — no recommendation
- Slash commands should be presented generically without noting CLI-specific compatibility
- No mention of Gemini anywhere — treat it as if it never existed

## User Stories

### Primary Flow

- [ ] As a user reading the AI Workflow guide, I can see that the workflow supports Claude Code, Codex, and OpenCode so that I know my preferred CLI works
- [ ] As a user reading prerequisites, I can see I need to install one of three supported CLIs so that I don't think Claude Code is the only option
- [ ] As a user, I can see how to select my preferred CLI via `eni config` so that I can configure the adapter

### Secondary Flows

- [ ] As a user reading any doc page, I see consistent terminology ("Slash Commands" not "Claude Commands") so that the docs don't feel Claude-specific

## Business Rules

### Terminology

- "Claude Commands" → "Slash Commands" everywhere in docs
- The intro paragraph must not name a specific CLI as the one the workflow "uses"
- Prerequisites list: present as "one of the following" with all three CLIs

### Content Rules

- Each CLI should show its install command in the prerequisites
- The `eni config` mention should be brief — one sentence explaining it lets you select your preferred CLI, no full syntax
- No Gemini references anywhere in docs

## UI/UX Specification

### Page: AI Workflow Guide

**Changes to intro paragraph (line 6):**
- Current: "...uses Claude Code to implement features..."
- New: Generic phrasing like "...uses an AI coding CLI to implement features..."

**Changes to Prerequisites section (lines 10-13):**
- Current: Single `claude` CLI install line
- New: List of 3 CLIs as alternatives (install one of)
- Add a line mentioning `eni config` to select the active CLI

**Changes to section header (line 97):**
- Current: `## Claude Commands`
- New: `## Slash Commands`

**Changes to Quick Start (lines 27-36):**
- The `/functional-spec-interview` command is fine as-is (it's a slash command, not CLI-specific)
- No changes needed here

**All other sections:**
- Scan for any "Claude" or "claude" references that imply Claude-only and make generic

### Page: Other Doc Pages

- Audit all pages under `apps/docs/content/docs/` for Claude Code references that imply it's the only supported CLI
- The only other page found was "Sell Code via GitHub" which should be left as-is per scope

## Edge Cases

| Scenario | Expected Behavior |
|----------|-------------------|
| User has none of the 3 CLIs installed | Prerequisites make clear they need at least one |
| User has multiple CLIs installed | `eni config` lets them pick which to use for plan/build |
| Future CLI adapter added | Docs structure supports adding another CLI to the list without restructuring |

## Acceptance Criteria

### Multi-CLI prerequisites displayed

- [ ] **Given** a user reads the AI Workflow prerequisites, **when** they see the CLI requirement, **then** they see all three CLIs (Claude Code, Codex, OpenCode) as equal alternatives
- [ ] **Given** a user reads the prerequisites, **when** they look for install commands, **then** each CLI has its install command shown

### Terminology updated

- [ ] **Given** any doc page in the site, **when** searched for "Claude Commands", **then** zero results are found
- [ ] **Given** the AI Workflow guide, **when** the user reads the commands section, **then** it's titled "Slash Commands"

### Intro paragraph is CLI-agnostic

- [ ] **Given** the AI Workflow guide intro, **when** the user reads the first paragraph, **then** it does not name Claude Code as the specific CLI used

### Config command mentioned

- [ ] **Given** the AI Workflow guide, **when** the user reads the prerequisites or a nearby section, **then** they see a brief mention of `eni config` for selecting their CLI

### No Gemini references

- [ ] **Given** any doc page, **when** searched for "Gemini" or "gemini", **then** zero results are found
