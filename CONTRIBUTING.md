# Contributing to JUSTLOVEJAZZ

## Start

```bash
git clone https://github.com/la6su/justlovejazz.git
cd justlovejazz
bun install
bun run dev
```

Choose an open outcome from [NEXT.md](NEXT.md) or discuss a new one in an
issue. [AGENTS.md](AGENTS.md) gives the compact project context;
[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) explains the non-obvious runtime
boundaries. Migration history is preserved in the completed
[archive record](docs/archive/MIGRATION_VUE_TRES.md); active work follows
`NEXT.md` and the accepted [ADRs](docs/adr/README.md).

## Change

Work on a focused branch and follow the style and ownership already present in
the affected code. Keep the user-visible result coherent across DOM, scene and
route state. UI work can use the
[project UI skill](skills/justlovejazz-ui/SKILL.md).

Run focused checks while iterating and the gate in
[docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) before a pull request. Use a
[Conventional Commit](https://www.conventionalcommits.org/) and describe the
result and verification in the PR.

## Change discipline

Use a scoped branch from current `main`; inspect remote state before starting.
A pull request or commit completes one bounded outcome and keeps the
application runnable. Do not replace the router, renderer and scene owners in
the same change; keep the current path available until the replacement passes
its named gate, then remove the replaced owner in a separate reviewable
change.

Parallel agents use separate worktrees and branches. They return focused
commits for review and never edit the integration working tree concurrently.

Verify the relevant rows of the [verification
matrix](docs/DEVELOPMENT.md): renderer/backend, navigation, preferences,
input, viewport, lifecycle, runtime and delivery. Do not add commands before
the matching script exists. Vue SFC tooling is installed: run `bun run
type-check:vue` alongside the checks in DEVELOPMENT.md.

## Report an issue

Include the observed behavior, a reproducible path, expected behavior and the
relevant browser/device/renderer context. Screenshots or recordings are the
best reference for visual defects.

Contributions use the repository's [ISC license](LICENSE).
