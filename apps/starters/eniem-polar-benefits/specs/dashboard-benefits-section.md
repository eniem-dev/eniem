# Dashboard Benefits Section

## Overview

Wire up existing benefits components (`GitHubBenefitsList`, `DownloadablesList`) on the main dashboard page. Display GitHub repository access and downloadable files side-by-side with skeleton loading states and buy button for users without benefits.

## Job to Be Done

Allow authenticated users to see and access their subscription benefits (GitHub repos, downloadable files) directly from the dashboard homepage.

## Target User

All authenticated users, regardless of subscription status.

## Requirements

### Must Have

- [ ] Add "Your Benefits" section to `/dashboard` page
- [ ] Display `GitHubBenefitsList` and `DownloadablesList` side-by-side (2-column grid)
- [ ] Wrap each component in `Suspense` with skeleton loaders
- [ ] Create skeleton components matching the card structure
- [ ] Use existing error handling from benefit components (`ErrorCard`)
- [ ] Show buy button when user has no benefits (components already handle empty state)

### Nice to Have

- [ ] Responsive layout: stack vertically on mobile

## Constraints

- No new API routes or queries needed - use existing exports from `@/features/benefits`
- No database changes - benefits fetched from Polar API
- Use existing skeleton pattern from `src/components/ui/skeleton.tsx`

## Acceptance Criteria

- [ ] Dashboard shows "Your Benefits" heading with two cards below
- [ ] GitHub benefits card loads independently with skeleton
- [ ] Downloadables card loads independently with skeleton
- [ ] Side-by-side layout on desktop (≥768px)
- [ ] Stacked layout on mobile (<768px)
- [ ] Users with no subscription see empty state with pricing link (existing component behavior)
- [ ] Errors display via `ErrorCard` component (existing component behavior)

## Edge Cases

- User with no benefits: Show empty state message from components
- User with only GitHub benefits (no downloadables): Show empty state in downloadables card
- User with only downloadables (no GitHub): Show empty state in GitHub card
- Polar API error: Show ErrorCard (already handled by components)

## Out of Scope

- GitHub OAuth connection flow (handled by `CustomerPortalButton` component)
- Grant/revoke repository access (handled by Polar)
- Benefits management or editing
- Dedicated `/dashboard/benefits` page
- Sidebar navigation changes

## Technical Hints

### Files to modify

- `src/app/(protected)/dashboard/page.tsx` - Add benefits section

### Files to create

- `src/features/benefits/components/github-benefits-skeleton.tsx` - Skeleton loader
- `src/features/benefits/components/downloadables-skeleton.tsx` - Skeleton loader
- Update `src/features/benefits/index.ts` - Export new skeleton components

### Patterns to follow

- See `src/app/(protected)/account/billing/loading.tsx` for skeleton patterns
- See existing benefits components for card structure
- Use `Suspense` from React with skeleton fallback

### Dependencies

- Components already exported from `src/features/benefits/index.ts`
- Locales already exist: `locales.GitHubBenefitsList`, `locales.DownloadablesList`
- Section title locale exists: `locales.BenefitsList.title` ("Your Benefits")

## Verification Commands

| Criterion | Command |
|-----------|---------|
| Benefits section rendered | `grep -q "GitHubBenefitsList\|DownloadablesList" src/app/\(protected\)/dashboard/page.tsx && echo pass` |
| Suspense wrapper used | `grep -q "Suspense" src/app/\(protected\)/dashboard/page.tsx && echo pass` |
| Skeleton components created | `ls src/features/benefits/components/*skeleton*.tsx && echo pass` |
| Grid layout implemented | `grep -q "grid-cols-" src/app/\(protected\)/dashboard/page.tsx && echo pass` |
| Build passes | `pnpm build` |

## Test Requirements

- [ ] Test: Dashboard page renders benefits section
- [ ] Test: Skeleton shows while benefits load
- [ ] Test: GitHub benefits display correctly when user has benefits
- [ ] Test: Downloadables display correctly when user has files
- [ ] Test: Empty state shows when user has no benefits
- [ ] Test: Error state shows when API fails
