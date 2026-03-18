# Prompt Composability

## Overview

Add `{{#include <path>}}` directive support to `eni plan` and `eni build` prompt resolution. Shared prompt sections are extracted into fragment files that both boilerplate and monorepo prompts can include. One source of truth for shared content, context-specific sections stay in each prompt file.

## Problem Statement

**Who:** Developers using eniem's AI workflow (plan/build loop)
**Problem:** Prompt files (`PROMPT_build.md`, `PROMPT_plan.md`) exist in both `apps/boilerplate/.eni/` and the monorepo root `.eni/`. ~85% of content is duplicated — Path Discovery Rules, Tracer Bullet methodology, Guardrails, Command Reference, Error Recovery are copy-pasted across files. When a section is improved (e.g., adding test requirements), every copy must be manually updated.
**Impact:** Single source of truth for shared prompt content. Boilerplate ships base fragments; users compose them with project-specific context. Updates propagate automatically.

## Scope

### Included
- `{{#include <path>}}` directive resolved during prompt loading
- Recursive include resolution with cycle detection
- Fragment extraction from current monolithic prompts
- Updated boilerplate and monorepo root prompt files using includes

### Excluded
- Conditional sections (`{{#if ...}}`)
- Fragment parameters / arguments
- Dynamic fragment generation
- Changes to `{{VARIABLE}}` template substitution (already exists)
- CLI flags related to prompt composition

### Constraints
- Include resolution happens BEFORE variable substitution (fragments can contain `{{SPEC_NAME}}` etc.)
- Paths are relative to the file containing the directive
- Must work with the existing `eni plan` / `eni build` TypeScript implementation

## User Stories

- [ ] As a developer, I can write `{{#include fragments/path-discovery.md}}` in a prompt file and the fragment content is inlined when the prompt is resolved
- [ ] As a developer, I can include fragments from a relative path (e.g., `{{#include ../apps/boilerplate/.eni/fragments/tracer-bullet.md}}` from the monorepo root)
- [ ] As a developer, included fragments can themselves contain `{{#include}}` directives (recursive)
- [ ] As a developer, I see a clear error if an included file doesn't exist
- [ ] As a developer, I see a clear error if includes form a cycle (A includes B includes A)

## Business Rules

### Include Directive

| Rule | Detail |
|------|--------|
| Syntax | `{{#include <relative-path>}}` on its own line |
| Path resolution | Relative to the directory of the file containing the directive |
| Processing order | All includes resolved first, then `{{VARIABLE}}` substitution |
| Recursion | Allowed, max depth 10 |
| Cycle detection | Track visited file paths (resolved to absolute); error if revisited |
| Missing file | Hard error with message: `Include not found: <resolved-path> (referenced from <source-file>)` |
| Whitespace | The `{{#include}}` line is fully replaced by file contents (no extra blank lines added) |

### Processing Pipeline

```
1. Read prompt file
2. Resolve all {{#include}} directives (recursive, depth-first)
3. Substitute {{VARIABLE}} placeholders
4. Pass assembled prompt to Claude
```

Step 2 is the only new step. Steps 1, 3, 4 already exist.

### Fragment Organization

Fragments live in `apps/boilerplate/.eni/fragments/` — they ship with the product. Project-level prompts (like the monorepo root) include them via relative path.

```
apps/boilerplate/.eni/
  fragments/
    path-discovery.md          # "NEVER guess file paths" rules
    tracer-bullet.md           # Tracer bullet mindset section
    tracer-bullet-phase.md     # Tracer bullet planning explanation (plan only)
    error-recovery.md          # 3-attempt recovery procedure
    guardrails-build.md        # Build mode guardrails list
    guardrails-plan.md         # Plan mode guardrails list
    command-ref-build.md       # bd commands for build
    command-ref-plan.md        # bd commands for plan
    design-field-template.md   # Required design field sections
    refinement-checklist.md    # Iteration 2+ checklist (plan only)
  PROMPT_build.md              # Boilerplate build prompt (uses fragments)
  PROMPT_plan.md               # Boilerplate plan prompt (uses fragments)

.eni/  (monorepo root)
  PROMPT_build.md              # Monorepo build prompt (includes base fragments + monorepo sections)
  PROMPT_plan.md               # Monorepo plan prompt (includes base fragments + monorepo sections)
```

### What Stays in Main Prompts (Not Extracted)

These sections differ between boilerplate and monorepo and remain in each prompt file:

- **Project structure description** — monorepo lists 3 packages, boilerplate has none
- **Validation commands** — monorepo uses turborepo (`pnpm turbo build --filter=...`), boilerplate uses `pnpm build`
- **Worktree setup** — monorepo has `pnpm install` in worktree, boilerplate may not
- **PR creation** — monorepo includes `bd sync` step
- **Path conventions** — monorepo specifies monorepo-relative paths

## Data Model

### Entities

**Include Directive**
| Property | Type | Description |
|----------|------|-------------|
| path | string | Relative path from the include directive to the fragment file |
| sourcefile | string | Absolute path of the file containing the directive |
| resolvedPath | string | Absolute path of the fragment file |

**Resolution Context**
| Property | Type | Description |
|----------|------|-------------|
| visited | Set\<string\> | Absolute paths already processed (cycle detection) |
| depth | number | Current recursion depth |
| maxDepth | number | Maximum allowed depth (10) |

## Technical Design

### Integration Point

The `eni plan` / `eni build` commands already have a prompt resolution step that reads the file and substitutes variables. Include resolution slots in before substitution:

```typescript
// In the prompt loading function:
async function resolvePrompt(promptPath: string, variables: Record<string, string>): Promise<string> {
  // Step 1: Read file
  let content = await readFile(promptPath, 'utf-8');

  // Step 2: Resolve includes (NEW)
  content = await resolveIncludes(content, promptPath, new Set(), 0);

  // Step 3: Substitute variables (EXISTING)
  for (const [key, value] of Object.entries(variables)) {
    content = content.replaceAll(`{{${key}}}`, value);
  }

  return content;
}
```

### Include Resolution Function

```typescript
async function resolveIncludes(
  content: string,
  sourcePath: string,
  visited: Set<string>,
  depth: number,
): Promise<string> {
  if (depth > 10) {
    throw new Error(`Include depth exceeded 10 (from ${sourcePath})`);
  }

  const absoluteSource = resolve(sourcePath);
  if (visited.has(absoluteSource)) {
    throw new Error(`Circular include detected: ${absoluteSource}`);
  }
  visited.add(absoluteSource);

  const sourceDir = dirname(absoluteSource);
  const includePattern = /^\{\{#include\s+(.+?)\}\}$/gm;

  const matches = [...content.matchAll(includePattern)];
  for (const match of matches.reverse()) {
    const includePath = resolve(sourceDir, match[1].trim());

    if (!existsSync(includePath)) {
      throw new Error(`Include not found: ${includePath} (referenced from ${sourcePath})`);
    }

    let fragment = await readFile(includePath, 'utf-8');
    fragment = await resolveIncludes(fragment, includePath, new Set(visited), depth + 1);
    content = content.slice(0, match.index!) + fragment + content.slice(match.index! + match[0].length);
  }

  return content;
}
```

## Example: Monorepo Build Prompt After Refactor

```markdown
# Build Mode

You are in BUILD mode. Implement one task from beads, validate, and commit.

**Epic filter:** `{{EPIC_NAME}}` (empty = all ready tasks)

**Monorepo structure:**
- `apps/boilerplate` — Main product (Next.js 15, @eniem/boilerplate)
- `apps/docs` — Documentation site (Next.js 16, @eniem/docs)
- `packages/cli` — CLI scaffolding tool (Ink 5, eniem-cli)

{{#include ../apps/boilerplate/.eni/fragments/path-discovery.md}}

## Phase 0: Worktree Setup
[monorepo-specific worktree setup — stays here]

## Phase 0.5: Blocked Task Pre-Check
[stays here — small, not worth extracting]

## Phase 1–2: Check & Claim
[stays here]

## Phase 3: Implement & Validate

{{#include ../apps/boilerplate/.eni/fragments/tracer-bullet.md}}

### Validation (Turborepo)
1. Run `Verify:` command from task notes
2. `pnpm turbo build` — must pass
3. `pnpm turbo typecheck` — must pass
4. `pnpm turbo lint` — must pass
5. `pnpm test` — must pass

## Phase 4–5: Commit, PR, Archive
[monorepo-specific — stays here]

{{#include ../apps/boilerplate/.eni/fragments/error-recovery.md}}
{{#include ../apps/boilerplate/.eni/fragments/guardrails-build.md}}
{{#include ../apps/boilerplate/.eni/fragments/command-ref-build.md}}
```

## Edge Cases

| Scenario | Expected Behavior |
|----------|-------------------|
| Include file doesn't exist | Hard error: `Include not found: <path> (referenced from <source>)` |
| Circular include (A → B → A) | Hard error: `Circular include detected: <path>` |
| Depth > 10 | Hard error: `Include depth exceeded 10 (from <path>)` |
| Include directive not on its own line | Not matched — treated as literal text |
| Empty fragment file | Directive line replaced with empty string (no error) |
| Fragment contains `{{VARIABLE}}` | Works — variables are substituted after all includes resolve |
| Multiple includes of same fragment | Allowed (each gets inlined separately) |
| Include path with `..` traversal | Allowed — resolved via `path.resolve()` |
| Windows backslash paths | Use `path.resolve()` which handles OS-specific separators |

## Acceptance Criteria

### Include Resolution

- [ ] **Given** a prompt with `{{#include fragments/foo.md}}`, **when** resolved, **then** the directive is replaced with the contents of `fragments/foo.md`
- [ ] **Given** a fragment that itself contains `{{#include}}`, **when** resolved, **then** nested includes are resolved recursively
- [ ] **Given** a fragment with `{{SPEC_NAME}}`, **when** the prompt is fully resolved, **then** the variable is substituted correctly (includes before variables)
- [ ] **Given** an include pointing to a nonexistent file, **when** resolved, **then** a clear error is thrown with both paths
- [ ] **Given** A includes B and B includes A, **when** resolved, **then** a circular include error is thrown
- [ ] **Given** includes nested 11 levels deep, **when** resolved, **then** a depth exceeded error is thrown

### Fragment Extraction

- [ ] **Given** the refactored prompts, **when** all includes are resolved, **then** the assembled output is identical to the current monolithic prompts (minus whitespace differences)
- [ ] **Given** a boilerplate user (no monorepo), **when** they use the default `PROMPT_build.md`, **then** it works with fragments from `.eni/fragments/`

## Unresolved Questions

None — design is straightforward. The only variable is exactly which sections to extract vs. keep inline, which can be decided during implementation based on actual duplication.
