---
name: refine-specs
version: 1.1.0
description: "Refine and improve existing specifications through loopback analysis. Use when user says '/refine-specs', 'refine specs', 'improve specs', 'review specs', 'specs loopback', 'what's missing in specs', or wants to improve existing spec files quality."
---

# Refine Specifications (Loopback)

You are performing a loopback analysis on existing specifications — studying them against the codebase and best practices, finding gaps, and improving them. This is the key workflow from the Geoffrey Huntley methodology.

## How It Works

1. Study all existing specs
2. Study the existing codebase (if any)
3. Identify what's missing, inconsistent, or doesn't follow best practices
4. Propose improvements to the user
5. Apply approved changes

## Step 1: Locate and Study Specs

Find the specs:
- Check if a `specs/` directory exists in the current working directory
- If found → use it as the specs directory
- If not found → ask the user where the specs are located using AskUserQuestion (e.g., a centralized specs repo path like `../projects-specs/<project>`)
- Look for `README.md` (the specs index) in the resolved directory
- Read every spec file

For each spec, note:
- What topic of concern does it cover?
- Does it pass the one-sentence-without-"and" test?
- How detailed is it? (types, interfaces, behaviors, edge cases)

## Step 2: Study the Codebase

If implementation exists, use parallel subagents to:
- Map the project structure
- Identify what's been implemented vs what specs describe
- Find patterns, types, and conventions already established in code
- Look for functionality that exists in code but isn't captured in specs

## Step 3: Gap Analysis

Report findings in this format:

```
## Specs Loopback Report

### Missing Topics
- [topic not yet covered by any spec]

### Incomplete Specs
- **spec-name.md**: [what's missing — types? behaviors? edge cases? security?]

### Scope Issues
- **spec-name.md**: Covers multiple concerns, should be split into [X] and [Y]

### Over-Specification
- **spec-name.md**: [includes full function bodies / hook implementations / library config objects that should be trimmed to signatures and contracts only]

Flag any spec that includes implementation code beyond public contracts (types, interfaces, function signatures, schemas). Full function bodies, React hook implementations, library configuration objects, and middleware wiring should be trimmed — they encode assumptions about library internals that may be wrong and cause the build agent to copy broken code verbatim instead of reading actual library docs.

### Library Verification
- **spec-name.md**: [references API/function from library X that doesn't exist or has different signature]

For each external library referenced in specs, verify the API matches reality:
- Check installed package versions in package.json / lockfile
- Grep the codebase or node_modules for the referenced APIs
- If the spec references an API that doesn't exist in the installed version, flag it
- If nothing is built yet, check library docs/README for the referenced APIs

### Stale / Inconsistent
- **spec-name.md**: [what doesn't match the codebase or contradicts another spec]

### Code Not in Specs
- [functionality in codebase not captured by any spec]

### Best Practice Gaps
- **spec-name.md**: [missing security considerations, testing strategy, error handling, etc.]

### Build Order
When multiple specs exist, produce an explicit dependency graph and suggested implementation sequence:
- Which specs have no dependencies (build first)?
- Which specs depend on others (build after)?
- Which specs can be built in parallel?

Format:
1. **spec-name.md** (no dependencies)
2. **spec-name.md** (depends on: spec-A)
3. **spec-name.md** + **spec-name.md** (parallel, both depend on: spec-B)
```

## Step 4: Propose Changes

For each finding, propose a specific action:
- **Add**: New spec file for uncovered topic
- **Expand**: Add missing sections (types, behaviors, edge cases)
- **Split**: Break multi-concern spec into separate files
- **Update**: Sync spec with actual codebase state
- **Capture**: Add code patterns/types from codebase into specs

Present the full list and ask the user which changes to apply.

## Step 5: Apply Changes

For approved changes:
- Edit existing spec files
- Create new spec files if needed
- Update `specs/README.md` index
- Keep the same format and conventions as existing specs

## Key Principles

- **Don't assume not implemented.** Always check the codebase before saying something is missing.
- **Specs describe intent; code describes reality.** When they diverge, flag it — don't silently pick one.
- **Include contracts from the codebase, not implementation.** If the implementation has good types, interfaces, or schemas, pull those into specs. Do NOT pull full function bodies, hook implementations, or library config objects — those are implementation details that belong in code, not specs.
- **One topic per file.** If a spec grew to cover multiple concerns, split it.
- **Capture the why.** If you find decisions in code that aren't explained in specs, ask the user and document the reasoning.
- **Keep it actionable.** Every spec should be detailed enough for an agent to implement from scratch.
- **Verify library references.** If a spec references an external library API, verify it actually exists. Specs that encode wrong library assumptions are worse than no spec at all.

## Loopback Prompts

These are the key questions to ask of each spec:

1. What's missing? What doesn't follow best practice?
2. Does the spec match what's actually in the codebase?
3. Are the types/interfaces complete and accurate?
4. **Does this spec include implementation code beyond public contracts?** Full function bodies, hook implementations, library config objects, and middleware wiring should be trimmed to signatures and behavioral descriptions only. The build agent should read actual library docs for implementation details.
5. **Do the external library APIs referenced in this spec actually exist?** Check installed packages or docs. Flag any spec that assumes a library API without verification.
6. Are edge cases and error handling covered?
7. Is the security model specified?
8. Is the testing strategy clear?
9. Could an agent implement this without asking clarification questions?

## Output

After applying changes:

```
Refined N spec files:
1. specs/01-topic.md - [what changed]
2. specs/02-new-topic.md - [NEW: split from topic.md]
...
Updated specs/README.md index.
```
