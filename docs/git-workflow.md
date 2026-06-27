# Git workflow

How we develop FitFlow from now on: **one feature per branch**, documented in **`docs/features-implementation/`**, merged to **`main`** when ready.

## Branching

| Rule | Detail |
|------|--------|
| **Base branch** | `main` — always deployable; protected in GitHub when possible |
| **Feature work** | Create a branch from `main` for every feature or fix |
| **Naming** | `feature/<short-name>` or `fix/<short-name>` (e.g. `feature/app-nav-bar`, `fix/booking-429`) |
| **Merge** | Open a PR → review → merge to `main` (squash or merge commit — team preference) |
| **No direct commits to `main`** | Except hotfixes agreed with the team |

### Typical flow

```bash
git checkout main
git pull origin main

git checkout -b feature/my-feature
# … implement …
git add .
git commit -m "Add my feature"
git push -u origin feature/my-feature
```

Then open a Pull Request on GitHub and merge when CI passes and the feature doc is updated.

## Feature documentation (required)

For **every new feature**, add a change log file:

```
docs/features-implementation/<feature-name>-changes.md
```

Use kebab-case for `<feature-name>` (same as the branch slug when possible).

### What to include

Copy [`features-implementation/_template-changes.md`](./features-implementation/_template-changes.md) and fill in:

- **Goal** — why we built it
- **Scope** — API, web, worker, shared, infra
- **Key files** — paths a reviewer should read
- **How to test** — manual smoke steps
- **Follow-ups** — deferred items

Update [`features-implementation/README.md`](./features-implementation/README.md) index when you add a file.

### Relationship to other docs

| Doc | Purpose |
|-----|---------|
| `docs/features-implementation/*-changes.md` | Per-feature context for development & review |
| `docs/changes.md` | Milestone / session history (broader archive) |
| `docs/implementation-notes.md` | MVP checklist and technical gotchas |

## Pull request checklist

- [ ] Branch is up to date with `main`
- [ ] `pnpm typecheck` passes locally
- [ ] `docs/features-implementation/<feature>-changes.md` added or updated
- [ ] Index updated in `docs/features-implementation/README.md`
- [ ] No secrets in commits (`.env` stays gitignored)

## Repository

- **Remote:** `git@github.com:yedyharova22/fitflow.git`
- **Default branch:** `main`

Automatic deployment from `main` is described in [`ci-cd.md`](./ci-cd.md).
