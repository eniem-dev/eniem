# Blog Support with Velite

## Overview

Add a blog feature using Velite as the MDX content layer. Blog posts are authored as MDX files in `content/blog/`, compiled at build time, and rendered on `/blog` routes with pagination support.

## Job to Be Done

Enable content marketing and SEO through a built-in blog. Developers using the boilerplate can publish blog posts without additional setup or external CMS.

## Target User

- Developers building sites with eniem (authoring posts)
- End users reading blog content

## Requirements

### Must Have

- [ ] Install and configure Velite
- [ ] Create `content/blog/` directory for MDX files
- [ ] Define post schema with frontmatter: title, description, date, slug, coverImage, tags, draft
- [ ] Create `/blog` list page showing published posts
- [ ] Create `/blog/[slug]` detail page for individual posts
- [ ] Implement pagination on blog list
- [ ] Filter out draft posts in production
- [ ] Show draft posts in development mode
- [ ] MDX rendering with prose styling
- [ ] Syntax highlighting for code blocks
- [ ] Callout components (info, warning, tip)

### Nice to Have

- [ ] Reading time calculation
- [ ] Previous/next post navigation
- [ ] Table of contents from headings
- [ ] Social share buttons

## Constraints

- Posts only - no authors or categories collections
- Velite compiles at build time (static content)
- Draft visibility controlled by NODE_ENV

## Acceptance Criteria

- [ ] MDX files in `content/blog/` are parsed and available
- [ ] `/blog` displays paginated list of published posts
- [ ] `/blog/[slug]` renders full post content
- [ ] Draft posts (draft: true) hidden in production build
- [ ] Draft posts visible when running `pnpm dev`
- [ ] Code blocks have syntax highlighting
- [ ] Callout components render correctly in MDX
- [ ] Pagination works (e.g., 10 posts per page)

## Edge Cases

- No posts: Show empty state on /blog
- Invalid slug: 404 page
- All posts are drafts: Empty list in production, visible in dev
- Post without optional fields (coverImage, tags): Render without errors

## Out of Scope

- Author profiles/collection
- Categories/tags pages
- RSS feed generation
- Sitemap integration
- CMS integration (Sanity, Contentful, etc.)
- Comments system
- Search functionality
