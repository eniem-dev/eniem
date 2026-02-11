# Clean Up Old Repos

## Overview
Close issues/PRs on the customer-facing boilerplate repo, archive the CLI and docs repos, and update their READMEs.

## Job to Be Done
Signal that development has moved to the monorepo. Prevent confusion from stale issues/PRs on the customer repo.

## Requirements

### Must Have
- [ ] Close all open issues on `eniem-dev/eniem-boilerplate`
- [ ] Close all open PRs on `eniem-dev/eniem-boilerplate`
- [ ] Archive `eniem-dev/eniem-cli` repo
- [ ] Archive `eniem-dev/eniem-doc` repo
- [ ] Update README on `eniem-cli` before archiving: "Development has moved to the eniem monorepo"
- [ ] Update README on `eniem-doc` before archiving: "Development has moved to the eniem monorepo"

## Constraints
- Do NOT archive `eniem-boilerplate` — it's the customer-facing sync target
- Do NOT reset git history on `eniem-boilerplate` — keep existing history
- Update READMEs BEFORE archiving (can't push to archived repos)

## Acceptance Criteria
- [ ] `gh issue list -R eniem-dev/eniem-boilerplate --state open` returns empty
- [ ] `gh pr list -R eniem-dev/eniem-boilerplate --state open` returns empty
- [ ] `eniem-dev/eniem-cli` is archived
- [ ] `eniem-dev/eniem-doc` is archived
- [ ] Archived repos have updated READMEs

## Edge Cases
- If no open issues/PRs exist, commands exit cleanly

## Out of Scope
- Modifying customer repo content (handled by sync workflow)
- Revoking access or changing permissions
- Deleting repos (archive only)

## Technical Hints
- **Close issues**: `gh issue list -R eniem-dev/eniem-boilerplate --state open --json number -q '.[].number' | xargs -I {} gh issue close {} -R eniem-dev/eniem-boilerplate`
- **Close PRs**: `gh pr list -R eniem-dev/eniem-boilerplate --state open --json number -q '.[].number' | xargs -I {} gh pr close {} -R eniem-dev/eniem-boilerplate`
- **Archive**: `gh repo archive eniem-dev/eniem-cli --yes`
- Update READMEs via: clone → edit → commit → push → then archive

## Test Requirements
- [ ] Test: `gh issue list -R eniem-dev/eniem-boilerplate --state open` returns 0 results
- [ ] Test: `gh repo view eniem-dev/eniem-cli --json isArchived` returns true
- [ ] Test: `gh repo view eniem-dev/eniem-doc --json isArchived` returns true
