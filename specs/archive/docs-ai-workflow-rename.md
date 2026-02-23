# Docs: Rename Ralph to AI Workflow

## Problem

The documentation at `/guides/ralph` describes an outdated AI-driven development workflow. It references commands (`pnpm ralph:plan`, `ralph:build:auto`), tools (`IMPLEMENTATION_PLAN.md`, root-level `loop.sh`), and concepts that no longer exist. The CLI has been renamed to `eni`, planning now creates beads issues (not a flat markdown plan), and the folder structure has changed significantly.

Additionally, "Ralph" as a brand name should be removed entirely from the docs.

## Target Users

Developers who clone the Eniem boilerplate and want to use the AI workflow to plan and build features.

## Scope

### In Scope

1. **Rename page**: `guides/ralph/index.mdx` → `guides/ai-workflow/index.mdx`
2. **Rewrite content**: Replace all outdated Ralph workflow docs with current `eni plan` / `eni build` workflow
3. **Update cross-references**: Fix all Ralph mentions in:
   - `apps/docs/content/docs/guides/meta.json` (nav entry)
   - `apps/docs/content/docs/getting-started/installation/index.mdx` (commands section)
   - `apps/docs/AGENTS.md` (Ralph Workflow section)
4. **Remove Ralph keyword** entirely — no reference to "Ralph" should remain in docs

### Out of Scope

- Updating the actual CLI code or prompts
- Documenting internal prompt templates, sentinel detection, or stream-json parsing
- Documenting the `.eni/loop.sh` wrapper script
- Changes to the boilerplate AGENTS.md or CLI AGENTS.md

## Requirements

### Page Structure: `/guides/ai-workflow`

**Title:** "AI Workflow"
**Description:** Plan and build features with AI-driven development using the eni CLI.

#### Sections

1. **Overview** (2-3 sentences)
   - What: AI-driven development workflow that uses Claude Code to implement features from specs
   - How: Spec-driven approach — define requirements → plan tasks → build iteratively
   - Result: Atomic commits, tested code, PRs created automatically

2. **Prerequisites**
   - `eni` CLI installed (`pnpm add -g @eniem/cli` or local)
   - `claude` CLI installed (`npm install -g @anthropic-ai/claude-code`)
   - `bd` (beads) CLI installed (`npm install -g @beads-cli/bd`)
   - Beads initialized in the project (`.beads/` directory)

3. **How It Works** (high-level flow)
   ```
   specs/*.md → eni plan → beads issues → eni build → committed code + PR
   ```
   Brief explanation of each stage:
   - **Specs**: Markdown files describing features (created manually or via `/functional-spec-interview`)
   - **Plan**: Reads spec, explores codebase, creates beads epic + decomposed tasks
   - **Build**: Picks one ready task per iteration, implements, validates, commits, closes bead

4. **Quick Start**
   ```bash
   # 1. Create a spec
   /functional-spec-interview user-authentication

   # 2. Plan: generates beads tasks from the spec
   eni plan --spec=user-authentication

   # 3. Build: implements tasks one at a time
   eni build --spec=user-authentication
   ```

5. **Commands Reference**

   | Command | Description |
   |---------|-------------|
   | `eni plan` | Interactive spec selection, then plan |
   | `eni plan --spec=<name>` | Plan a specific spec |
   | `eni plan --spec=<name> --iterations=5` | Plan with custom iteration count (default: 3) |
   | `eni build` | Interactive spec selection from planned/, then build |
   | `eni build --spec=<name>` | Build a specific planned spec |
   | `eni build --spec=<name> --iterations=20` | Build with custom iteration count (default: 10) |
   | `eni build --verbose` | Build with detailed tool invocation output |

6. **Plan Mode** (brief section)
   - What it does: reads spec, explores codebase, creates beads epic + tasks
   - Default: 3 iterations (refines tasks across iterations)
   - Output: beads epic with atomic tasks, dependencies, acceptance criteria
   - Spec lifecycle: `specs/<name>.md` → `specs/planned/<name>.md` when done
   - Early exit: stops early if tasks are fully refined before max iterations

7. **Build Mode** (brief section)
   - What it does: picks one ready task per iteration, implements it
   - Default: 10 iterations
   - Each iteration: claim task → implement → test → commit → close bead → push
   - Creates a PR when all tasks are complete
   - Spec lifecycle: `specs/planned/<name>.md` → `specs/archive/<name>.md` when done
   - Early exit: stops early if all tasks complete before max iterations

8. **Creating Specs**
   - Use `/functional-spec-interview <name>` for guided creation
   - Or create manually in `specs/<name>.md`
   - Interview covers: purpose, target user, scope, requirements, acceptance criteria, edge cases
   - Output saved to `specs/<feature-name>.md`

9. **Claude Commands**
   - `/functional-spec-interview <name>` — Interactive spec creation through guided questions
   - `/fix-code-review <pr-url>` — Automatically address GitHub PR review comments

10. **Guardrails**
    Updated to reflect current workflow principles:
    - **One task per iteration** — Fresh context prevents drift and hallucination
    - **Validation required** — Never commit code that fails tests, lint, typecheck, or build
    - **Search before implementing** — Always verify functionality doesn't already exist
    - **Follow existing patterns** — Match AGENTS.md conventions and existing code style
    - **Atomic commits** — Each commit implements exactly one task
    - **Tracer bullet first** — First tasks form minimal end-to-end vertical slice

11. **Folder Structure**
    ```
    repo/
    ├── .eni/
    │   ├── PROMPT_plan.md      # Plan prompt template
    │   └── PROMPT_build.md     # Build prompt template
    ├── .beads/                 # Issue tracking database
    ├── specs/                  # Feature specifications
    │   ├── my-feature.md       # Unplanned specs
    │   ├── planned/            # Specs with generated tasks
    │   └── archive/            # Completed specs
    └── AGENTS.md               # Project conventions
    ```

12. **Workflow Example**
    ```bash
    # 1. Create spec via interview
    /functional-spec-interview user-dashboard

    # 2. Plan the feature
    eni plan --spec=user-dashboard

    # 3. Check generated tasks
    bd ready

    # 4. Build iteratively
    eni build --spec=user-dashboard

    # 5. PR is created automatically when all tasks complete
    ```

### Cross-Reference Updates

#### `apps/docs/content/docs/guides/meta.json`
- Change `"ralph"` → `"ai-workflow"` in pages array

#### `apps/docs/content/docs/getting-started/installation/index.mdx`
- Rename section from "### Ralph (AI-driven development)" → "### AI Workflow"
- Replace `pnpm ralph:plan` / `ralph:build` commands with `eni plan` / `eni build`
- Update link from `/guides/ralph` → `/guides/ai-workflow`
- Remove `loop.sh` reference

#### `apps/docs/AGENTS.md`
- Rename section from "### Ralph Workflow" → "### AI Workflow"
- Replace all `pnpm ralph:*` commands with `eni` CLI equivalents
- Remove `loop.sh` references

### File Operations

1. Delete `apps/docs/content/docs/guides/ralph/index.mdx`
2. Create `apps/docs/content/docs/guides/ai-workflow/index.mdx` with new content
3. Edit `apps/docs/content/docs/guides/meta.json`
4. Edit `apps/docs/content/docs/getting-started/installation/index.mdx`
5. Edit `apps/docs/AGENTS.md`

## Acceptance Criteria

- [ ] No occurrence of "Ralph" or "ralph" in any docs file (search `apps/docs/`)
- [ ] `/guides/ai-workflow` page renders with updated content
- [ ] Navigation shows "AI Workflow" instead of "Ralph" in guides sidebar
- [ ] Installation page references `eni plan` / `eni build` with link to `/guides/ai-workflow`
- [ ] AGENTS.md documents current `eni` CLI commands
- [ ] `pnpm --filter docs build` succeeds (no broken links or MDX errors)
- [ ] No references to `IMPLEMENTATION_PLAN.md`, `pnpm ralph:*`, or root-level `loop.sh`
