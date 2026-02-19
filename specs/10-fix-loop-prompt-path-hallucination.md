# Fix Loop Prompt Path Hallucination

## Overview

When Claude runs inside the ENI loop (`loop.sh plan` / `loop.sh build`), it hallucinates file paths — guessing names like `eni/...`, `eniam/...` instead of searching the actual codebase first. This spec adds a directory tree injection hook and explicit anti-hallucination instructions to the boilerplate-level prompt files, so Claude always works with real paths.

## Problem Statement

**Who:** Developers running `loop.sh plan` or `loop.sh build` at monorepo root or in `apps/boilerplate`
**Problem:** Claude invents file paths instead of discovering them via Glob/Grep, leading to broken beads designs (wrong file references) and failed implementations (editing non-existent files)
**Impact:** Wasted loop iterations, broken beads issues with fictional paths, manual cleanup required

## Scope

### Included
- Add a SessionStart hook that injects a directory tree into Claude's context (both root and boilerplate levels — depth 4 at root, depth 3 at boilerplate)
- Add anti-hallucination rules to `apps/boilerplate/.eni/PROMPT_plan.md`
- Add anti-hallucination rules to `apps/boilerplate/.eni/PROMPT_build.md`
- Update design field template in PROMPT_plan.md to enforce absolute paths from project root
- Register the tree hook in both `.claude/settings.json` (root) and `apps/boilerplate/.claude/settings.json`

### Excluded
- Changes to `loop.sh` itself (the bash script logic is fine)
- Changes to the TypeScript loop engine in `packages/cli`
- Sentinel detection fixes (not in scope)
- General prompt quality improvements beyond path hallucination

### Constraints
- Must work with `claude --dangerously-skip-permissions -p` (pipe mode)
- Hook must be fast (< 1s) to not slow down loop iterations
- Tree output must exclude: `node_modules`, `.next`, `dist`, `.git`, `.beads`, `coverage`, `.turbo`, `.worktrees`
- Hook must degrade gracefully if `tree` command is not installed

## User Stories

### Primary Flow

- [ ] As a developer running `loop.sh plan`, I expect Claude to reference only real file paths in the beads design fields, so that `loop.sh build` can act on them without guessing
- [ ] As a developer running `loop.sh build`, I expect Claude to find actual files before editing, so that implementations target real code paths

### Secondary Flows

- [ ] As a developer starting a manual Claude session in `apps/boilerplate`, I get the directory tree injected at startup, so Claude knows the project structure from the start
- [ ] As a developer starting a manual Claude session at the monorepo root, I get the directory tree injected at startup, so Claude knows the full monorepo structure

## Business Rules

### Path Discovery Rules
- Rule 1: Claude MUST use Glob or Grep to discover file paths before referencing them in beads design fields or code edits
- Rule 2: Claude MUST NOT hardcode or guess paths based on naming conventions alone
- Rule 3: All file paths in beads design fields MUST be verified to exist (or marked as `(create)` for new files with a verified parent directory)

### Tree Injection Rules
- Rule 1: Tree is injected once at SessionStart, not on every prompt
- Rule 2: Monorepo root uses depth 4 (to reach the same detail level as `apps/boilerplate` subfolder contents); boilerplate uses depth 3
- Rule 3: If `tree` is not installed, fall back to `find` + formatted output
- Rule 4: Standard directories are excluded (node_modules, .next, dist, .git, .beads, coverage, .turbo, .worktrees)
- Rule 5: The hook script accepts an optional `TREE_DEPTH` env var (or reads a default based on whether a `apps/` directory exists at the project root)

## Data Model

N/A — no data entities. This is a prompt engineering and hook configuration change.

## UI/UX Specification

### Hook Output Format

The startup hook should output a markdown section that appears in Claude's context:

```
## Project Structure

<tree>
(3-level tree output here)
</tree>
```

### Prompt Anti-Hallucination Block

Added to both PROMPT_plan.md and PROMPT_build.md:

```markdown
## Path Discovery Rules (CRITICAL)

**NEVER guess or invent file paths.** Always verify paths exist before referencing them.

Before referencing ANY file path:
1. Use Glob to find files matching a pattern
2. Use Grep to search for specific code
3. Verify the file exists before adding it to a beads design field or editing it

Wrong: `src/features/credits/components/CreditsBadge.tsx` (guessed)
Right: Run `Glob("**/CreditsBadge*")` first, then use the actual path returned

For new files (create): verify the parent directory exists first.
```

### Design Field Template Update (PROMPT_plan.md)

Update the `## Files` section example to use absolute paths from project root:

```markdown
## Files
- `src/features/example/components/ExampleComponent.tsx` (modify) — verified via Glob
- `src/features/example/schemas/example.schema.ts` (create) — parent dir verified
```

## Edge Cases

### Error Scenarios

| Scenario | Expected Behavior |
|----------|-------------------|
| `tree` command not installed | Fall back to `find . -maxdepth N` formatted output (N=4 at root, 3 at boilerplate) |
| Project root is a worktree | Hook detects worktree root and runs tree from there |
| Very large directory tree | Depth limited to 3; excluded dirs keep output manageable |

### Boundary Conditions

| Condition | Expected Behavior |
|-----------|-------------------|
| Hook runs in pipe mode (`-p`) | SessionStart hooks still fire; output appears in context |
| Multiple hooks configured | New hook runs alongside existing `inject-commit-context.sh` |
| Empty project (fresh clone) | Tree shows minimal structure; still useful |

## Acceptance Criteria

### Directory tree injection hook

- [ ] **Given** a developer starts a Claude session in `apps/boilerplate`, **when** the session starts, **then** a 3-level directory tree appears in Claude's context under "## Project Structure"
- [ ] **Given** a developer starts a Claude session at the monorepo root, **when** the session starts, **then** a 4-level directory tree of the monorepo appears in Claude's context under "## Project Structure"
- [ ] **Given** `tree` is not installed, **when** the hook runs, **then** it falls back to `find`-based output without error
- [ ] **Given** the hook runs, **when** output is generated, **then** node_modules, .next, dist, .git, .beads, coverage, .turbo, and .worktrees are excluded

### PROMPT_plan.md anti-hallucination

- [ ] **Given** Claude is in plan mode, **when** it creates beads issues, **then** every file path in the design field has been discovered via Glob/Grep (not guessed)
- [ ] **Given** Claude creates a beads issue with a `## Files` section, **when** the path references an existing file, **then** it uses the absolute path from project root (e.g., `src/features/...` not `features/...` or `path/to/...`)

### PROMPT_build.md anti-hallucination

- [ ] **Given** Claude is in build mode, **when** it implements a task, **then** it verifies file paths exist before attempting edits
- [ ] **Given** Claude needs to create a new file, **when** it writes the file, **then** it has verified the parent directory exists first

## Open Questions

- [ ] Should the hook also inject a `prisma/schema.prisma` summary (model names) to help Claude reference correct entity names?
- [ ] Should we add a post-plan validation step that checks all paths in beads design fields actually exist?
