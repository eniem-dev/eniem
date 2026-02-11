# Set Up GitHub Actions

## Overview
Create 3 GitHub Actions workflows for the monorepo: unified CI, CLI npm release, and boilerplate sync to customer repo.

## Job to Be Done
Automate CI checks on PRs, CLI publishing to npm on conventional commits, and boilerplate syncing to the customer-facing repo on version tags.

## Requirements

### Must Have
- [ ] Create `.github/workflows/ci.yml` — runs on PR to main, builds/lints/typechecks/tests all packages
- [ ] Create `.github/workflows/release-cli.yml` — runs on push to main when `packages/cli/**` changes, runs semantic-release
- [ ] Create `.github/workflows/sync-boilerplate.yml` — runs on `boilerplate@*` tags, syncs to customer repo

### CI Workflow Details
- Trigger: `pull_request` to `main`
- Setup: pnpm v9, Node 22, pnpm cache
- Steps: `pnpm install --frozen-lockfile`, copy `.env.example` to `.env` for boilerplate, `pnpm turbo build lint typecheck test`

### CLI Release Workflow Details
- Trigger: `push` to `main`, paths `packages/cli/**`
- Permissions: contents write, issues write, pull-requests write, id-token write
- Steps: checkout with `fetch-depth: 0`, pnpm v9, Node 22, `npm install -g npm@latest` (OIDC), install, build CLI, `cd packages/cli && npx semantic-release`
- Secrets: `NPM_TOKEN`, `GITHUB_TOKEN`

### Boilerplate Sync Workflow Details
- Trigger: push tags `boilerplate@*`
- Steps:
  1. Extract version from tag
  2. Setup pnpm v9 + Node 22
  3. rsync `apps/boilerplate/` to temp dir (exclude: node_modules, .next, .worktrees, .beads)
  4. Restore package name: sed `"@eniem/boilerplate"` → `"eniem"`
  5. Generate standalone lock file: `pnpm install --lockfile-only`
  6. Clone customer repo, swap `.git`, commit + tag + push (only if changes exist)
- Secrets: `BOILERPLATE_DEPLOY_KEY`

## Constraints
- Boilerplate needs `.env` from `.env.example` for CI builds
- CLI release needs `fetch-depth: 0` for semantic-release history analysis
- Sync must produce a standalone repo (own lock file, no workspace refs in package.json)
- Only commit to customer repo if there are actual changes

## Acceptance Criteria
- [ ] `.github/workflows/ci.yml` exists and is valid YAML
- [ ] `.github/workflows/release-cli.yml` exists and is valid YAML
- [ ] `.github/workflows/sync-boilerplate.yml` exists and is valid YAML
- [ ] CI workflow runs all checks via turborepo

## Edge Cases
- Sync with no changes: workflow should exit cleanly without empty commit
- CLI release with no version bump: semantic-release handles this (exits 0, no publish)

## Out of Scope
- Configuring GitHub secrets (manual step)
- Setting up deploy keys (manual step)
- Vercel/Netlify deployment for docs (existing setup)

## Technical Hints
- See current boilerplate CI at: was at `eniem-boilerplate/.github/workflows/ci.yml`
- See current CLI release at: was at `eniem-cli/.github/workflows/release.yml`
- Customer repo: `eniem-dev/eniem-boilerplate`
- Use `GIT_SSH_COMMAND="ssh -i ~/.ssh/deploy_key -o StrictHostKeyChecking=no"` for deploy key auth

## Test Requirements
- [ ] Test: YAML linting passes on all workflow files
- [ ] Test: CI workflow triggers on a test PR (verify after secrets are configured)
- [ ] Test: `boilerplate@0.1.0` tag triggers sync workflow
