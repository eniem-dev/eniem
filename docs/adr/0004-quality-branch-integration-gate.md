# 0004. `quality` branch as integration gate before `main`

Date: 2026-05-06
Status: Accepted

## Context

Most repos PR feature branches directly into `main`, with `main` being both the integration target and the release source. Eniem ships three release artefacts (CLI to npm, boilerplate sync to a customer repo, docs to Vercel/Netlify), and a broken `main` blocks all three.

Feature work also varies in scope: a CLI flag fix and a multi-feature auth refactor land in the same week, and we want to batch validate them before triggering releases.

## Decision

Use a long-lived `quality` branch as the integration target. Feature branches PR into `quality`. A merge from `quality` to `main` is the explicit release trigger: conventional commits on the merge drive CLI publish, boilerplate tag-and-sync, and docs deploy.

`.looper/config.json` carries `BASE_BRANCH=quality` so the AFK build loop targets the integration branch automatically.

## Consequences

Easier:
- A broken release is a recoverable problem on `quality`, not an outage on `main`.
- Multiple unrelated changes can be batched into one release without coordinating individual PRs.
- The merge from `quality` to `main` is a deliberate human action — no surprise releases from a feature merge.

Harder:
- One extra PR step per change. Velocity cost is real for trivial fixes.
- Two long-lived branches means more rebase / merge conflict management, especially for hotfixes.
- New contributors will instinctively branch from `main`; the convention has to be loud in `AGENTS.md`.

## Alternatives considered

- **Trunk-based on `main`** — simpler, faster. Rejected because a regression on `main` triggers three release artefacts simultaneously; the blast radius is too high.
- **Release branches per release** — cleaner historical record, but heavier process for a single-team repo and breaks the "one branch is always shippable" model that the AFK loop depends on.
