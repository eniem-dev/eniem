# Powered By Badge

## Overview

A branded badge component displaying "Powered by eniem.dev" with the eniem logo, fixed in the bottom-right corner of webapps built with the eniem boilerplate. Serves as attribution and organic marketing for the platform.

## Job to Be Done

Provide brand visibility and attribution for eniem on sites built with the boilerplate. Drives traffic back to eniem.dev through organic discovery.

## Target User

- End users of sites built with eniem (see the badge, may click)
- Developers using the boilerplate (can remove if desired since they have source access)

## Requirements

### Must Have

- [ ] Create `PoweredByBadge` component
- [ ] Fixed position in bottom-right corner of viewport
- [ ] Display eniem logo (small) + "Powered by eniem.dev" text
- [ ] Link to https://eniem.dev (opens in new tab)
- [ ] Minimal/subtle visual style - unobtrusive
- [ ] Responsive - works on mobile and desktop

### Nice to Have

- [ ] Subtle hover effect (opacity or scale)
- [ ] `rel="noopener noreferrer"` on external link

## Constraints

- No removal logic needed - users have source access
- No referral tracking params - Umami handles referrer automatically
- Should not interfere with page content or other fixed elements
- Should respect z-index layering

## Acceptance Criteria

- [ ] Badge visible in bottom-right corner on all pages where component is used
- [ ] Eniem logo displays correctly
- [ ] Text reads "Powered by eniem.dev"
- [ ] Clicking badge opens eniem.dev in new tab
- [ ] Badge is visually subtle/minimal
- [ ] Badge is accessible (proper link semantics, readable)

## Edge Cases

- Mobile viewport: Badge should scale appropriately, not overflow
- Scrolling: Badge stays fixed, doesn't scroll with content
- Dark mode: Badge should remain readable (consider theme-aware opacity)

## Out of Scope

- Paid tier removal/hiding logic
- Referral parameter tracking
- Analytics event on badge click
- Customizable position via props
- Animation on page load
