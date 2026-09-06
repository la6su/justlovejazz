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

## Migration changes

The Vue/TresJS program uses `tres-vue-dev` as its integration branch. A pull
request or commit should complete one migration phase, experiment or bounded
owner slice. Do not replace the router, renderer and scene owners in the same
change. Keep the current path available until the replacement passes its named
gate, then remove the legacy owner in a separate reviewable change.

Parallel agents use separate worktrees and branches. They return focused
commits for review and never edit the integration working tree concurrently.

A migration change documents and verifies the relevant parts of this matrix:

- automatic WebGPU and forced WebGLBackend;
- direct entry, in-app navigation, hash and popstate;
- normal and reduced motion;
- desktop, narrow layout and real-device DPR when the renderer is affected;
- semantic DOM, focus, route announcements and UIkit wrapper lifecycle;
- listener, timer, async-load and GPU-resource disposal;
- startup, bundle, frame-time and idle-render differences.

Do not add commands to documentation before the matching script exists. After
Vue SFC tooling lands, the release gate will add Vue type and component checks
through the scripts recorded in `package.json`.

## Report an issue

Include the observed behavior, a reproducible path, expected behavior and the
relevant browser/device/renderer context. Screenshots or recordings are the
best reference for visual defects.

Contributions use the repository's [ISC license](LICENSE).
