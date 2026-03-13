# Eniem Specifications

Functional specs for the Eniem monorepo — a Next.js boilerplate with CLI tooling, Polar billing, and AI-driven development workflow.

## Planned

Active and upcoming work.

| Spec | Purpose |
|------|---------|
| [prompt-composability](./planned/prompt-composability.md) | `{{#include}}` directive for shared prompt fragments across plan/build prompts |
| [verbose-tool-path-display](./planned/verbose-tool-path-display.md) | Show file paths in verbose tool activity lines for non-Claude adapters |

## Archive

Completed specs, grouped by category.

### Monorepo Setup

| Spec | Purpose |
|------|---------|
| [1-migrate-repos](./archive/1-migrate-repos.md) | Import existing repos into monorepo via git subtree with full history |
| [2-post-migration-config](./archive/2-post-migration-config.md) | Update package names, remove duplicate workflows, configure semantic-release |
| [3-setup-github-actions](./archive/3-setup-github-actions.md) | Create CI, CLI release, and boilerplate sync GitHub Actions workflows |
| [5-cleanup-old-repos](./archive/5-cleanup-old-repos.md) | Close issues/PRs on old repos, archive them, update READMEs |
| [21-cleanup-sub-projects](./archive/21-cleanup-sub-projects.md) | Remove AI workflow artifacts from sub-projects, consolidate at root |
| [35-move-starters-outside-monorepo](./archive/35-move-starters-outside-monorepo.md) | Move example apps into `apps/starters/` with CI sync to separate repo |

### CI/CD & Release

| Spec | Purpose |
|------|---------|
| [10-ci-release-quality-branch](./archive/10-ci-release-quality-branch.md) | Introduce `quality` branch as integration gate with auto-tagging on merge to `main` |
| [51-stable-build-branch-naming](./archive/51-stable-build-branch-naming.md) | Replace date-based build branch names with stable, resumable named branches |
| [scoped-build-gates](./archive/scoped-build-gates.md) | Package-scoped quality gates instead of full-monorepo validation in build loop |

### AI Workflow (eni CLI)

| Spec | Purpose |
|------|---------|
| [4-setup-ai-workflow](./archive/4-setup-ai-workflow.md) | Configure `.eni/` AI workflow for monorepo root and standalone boilerplate |
| [ai-init](./archive/ai-init.md) | `eni ai init` command to install AI workflow config via sparse clone |
| [cleanup-cli-ai-init](./archive/cleanup-cli-ai-init.md) | Remove deprecated `loop.sh`, add verbose config and interactive setup to `ai init` |
| [eni-rework-specs](./archive/eni-rework-specs.md) | Replace shell-based `loop.sh` with native TypeScript `eni plan` and `eni build` commands |
| [cli-rename-to-eni](./archive/cli-rename-to-eni.md) | Rename CLI binary from `eniem-cli` to `eni` for faster typing |
| [cli-header-spec-name-display](./archive/cli-header-spec-name-display.md) | Show active spec name in section header, limit logo to initial step |
| [plan-build-list-flag](./archive/plan-build-list-flag.md) | `--list` flag to print available specs for agent-to-agent discovery |
| [multi-cli-adapters](./archive/multi-cli-adapters.md) | Support multiple AI CLIs (Claude, Codex, OpenCode) via adapter abstraction |
| [multi-cli-config-setup](./archive/multi-cli-config-setup.md) | Ship pre-configured settings for all supported CLIs, smart merge on re-init |
| [fix-opencode-iteration-hang](./archive/fix-opencode-iteration-hang.md) | Fix OpenCode adapter hanging on iteration 2+ with zero stdout |
| [handle-ssh-agent-not-loaded](./archive/handle-ssh-agent-not-loaded.md) | Detect and auto-remediate missing SSH agent during `eni ai init` |
| [https-git-protocol-support](./archive/https-git-protocol-support.md) | HTTPS fallback for git clone operations with `--protocol` flag |
| [remove-gemini-cli-support](./archive/remove-gemini-cli-support.md) | Remove Gemini CLI adapter, leaving Claude, Codex, and OpenCode |
| [narrate-tool-activity](./archive/narrate-tool-activity.md) | Prompt non-Claude CLIs to emit explanatory text between tool calls |

### AI Prompts & Workflow

| Spec | Purpose |
|------|---------|
| [7-prompt-plan-tracer](./archive/7-prompt-plan-tracer.md) | Allow tracer bullet to span multiple tasks instead of forcing single-bead slices |
| [10-fix-loop-prompt-path-hallucination](./archive/10-fix-loop-prompt-path-hallucination.md) | Inject directory tree and anti-hallucination rules to prevent guessed file paths |
| [22-agents-claude-md-refactoring](./archive/22-agents-claude-md-refactoring.md) | Consolidate CLAUDE.md/AGENTS.md files, symlink CLAUDE.md → AGENTS.md |
| [23-spec-interview-issue-closing](./archive/23-spec-interview-issue-closing.md) | Auto-fetch GitHub issue context in spec interview, label as `spec-ready` |
| [no-open-questions-spec-interview](./archive/no-open-questions-spec-interview.md) | Resolve all open questions during interview before writing the spec |
| [prompt-enforce-tests](./archive/prompt-enforce-tests.md) | Enforce unit test creation in plan/build prompts, use git worktrees for isolation |
| [ralph-improvements](./archive/ralph-improvements.md) | Enhance AI workflow based on Anthropic and AIHero research |
| [9-check-beads-installed](./archive/9-check-beads-installed.md) | Verify `bd` is installed and initialized before running plan/build commands |

### Polar Integration

| Spec | Purpose |
|------|---------|
| [6-polar-config-dedicated-folder](./archive/6-polar-config-dedicated-folder.md) | Move Polar config files into dedicated `polar/` folder |
| [44-fix-polar-lazy-init](./archive/44-fix-polar-lazy-init.md) | Fix build failure when Polar env vars missing on Nixpacks/Coolify |
| [polar-products-command](./archive/polar-products-command.md) | Interactive CLI command to create and sync Polar products |
| [products-command-improvements](./archive/products-command-improvements.md) | Menu-driven workflow for add/remove/sync/regenerate product operations |
| [product-scaffolding](./archive/product-scaffolding.md) | Sync products from JSON config to Polar API and generate TypeScript types |
| [remove-product-generation](./archive/remove-product-generation.md) | Remove local product sync script now handled by CLI |
| [credits-meter-config](./archive/credits-meter-config.md) | JSON + TypeScript config system for credit meter IDs and event names |
| [credits-local-balance](./archive/credits-local-balance.md) | Local Postgres credit balance with atomic deduction and Polar sync |
| [credits-usage-history](./archive/credits-usage-history.md) | Credits usage history on billing page with pagination |
| [usage-based-credits](./archive/usage-based-credits.md) | Usage-based credit billing via Polar metered billing |
| [handle-checkout-error](./archive/handle-checkout-error.md) | Fix silent failure when Polar checkout redirect errors |

### CLI Features

| Spec | Purpose |
|------|---------|
| [cli-app-name-prompt](./archive/cli-app-name-prompt.md) | Prompt for human-readable app name during `eniem-cli new` scaffolding |
| [cli-documentation](./archive/cli-documentation.md) | Comprehensive docs for the `eniem products` command |

### Boilerplate Features

| Spec | Purpose |
|------|---------|
| [blog-velite](./archive/blog-velite.md) | Blog feature using Velite as MDX content layer with pagination |
| [conditional-oauth-buttons](./archive/conditional-oauth-buttons.md) | Hide OAuth buttons when provider env vars are not configured |
| [database-file-upload](./archive/database-file-upload.md) | Database-backed file upload as zero-config default storage provider |
| [powered-by-badge](./archive/powered-by-badge.md) | "Powered by eniem.dev" badge component for attribution |
| [unit-test-setup](./archive/unit-test-setup.md) | Set up Vitest with React Testing Library, Prisma mocking, and coverage |

### Branding & Placeholders

| Spec | Purpose |
|------|---------|
| [16-remove-eniem-branding](./archive/16-remove-eniem-branding.md) | Replace `myapp` placeholders with customer project name at scaffolding time |
| [50-replace-eniem-placeholders](./archive/50-replace-eniem-placeholders.md) | Replace hardcoded `eniem` references with generic placeholders |
| [15-eni-ready](./archive/15-eni-ready.md) | `eni ready` command to generate production `.env` file |

### Documentation

| Spec | Purpose |
|------|---------|
| [5-docs-beads-sync-branch](./archive/5-docs-beads-sync-branch.md) | Guide for beads sync-branch setup |
| [docs-ai-workflow-rename](./archive/docs-ai-workflow-rename.md) | Rename Ralph references to AI Workflow, update commands and concepts |
| [docs-beads-hooks-setup](./archive/docs-beads-hooks-setup.md) | Document beads git hooks installation and behavior |
| [docs-multi-cli-adapters](./archive/docs-multi-cli-adapters.md) | Update docs for multi-CLI adapter support, remove Gemini references |
| [docs-updates-jan-2026](./archive/docs-updates-jan-2026.md) | Batch docs updates: fix outdated content, split install docs, fix subscription setup |
| [products-generated-documentation](./archive/products-generated-documentation.md) | Document `products.generated.ts` usage in pricing and checkout components |

### Developer Workflow

| Spec | Purpose |
|------|---------|
| [2-cleanup-after-pr-merge](./archive/2-cleanup-after-pr-merge.md) | `/cleanup` slash command to remove merged worktrees and branches |
