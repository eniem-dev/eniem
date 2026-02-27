# Test Opencode Page

## Overview

Add a static `/test-opencode` page under the `(marketing)` route group. This is a smoke test for the opencode adapter's plan+build pipeline.

## Requirements

### Must Have

- Create `src/app/(marketing)/test-opencode/page.tsx`
- Page exports metadata using `createMetadata` + `getDefaultMetadata` from `@/lib/metadata`
- Page renders a `<div>` with heading "Test Opencode Page" and a paragraph "This page was built by the opencode adapter."
- Tailwind styling: `container mx-auto px-4 py-16 max-w-4xl`
- No locales entry needed (hardcoded strings are fine for this test)

## Constraints

- No new dependencies
- No database changes
- No new components — inline everything in page.tsx
- No tests needed (static page with no logic)

## Acceptance Criteria

- [ ] `pnpm build` passes
- [ ] `pnpm lint` passes
- [ ] Page file exists at `src/app/(marketing)/test-opencode/page.tsx`
- [ ] Page renders heading and paragraph text

## Beads Rules

- Epic title: `test-opencode-page: Add /test-opencode placeholder page`
- Epic must use `--type=epic`
- Create exactly **1 task** under the epic
- Task title: `Create /test-opencode page component`
- Do NOT create tasks that overlap with other test-* specs
- Do NOT modify any existing files — only create new ones

## Out of Scope

- Navigation links to this page
- Locales entries
- Tests
- Any other page modifications

## Technical Hints

- Reference: `src/app/(marketing)/privacy/page.tsx` for pattern
- Metadata imports: `createMetadata`, `getDefaultMetadata` from `@/lib/metadata`
- Inherits `(marketing)/layout.tsx` (navbar + footer) automatically
