# AGENTS — project entry point

JUSTLOVEJAZZ is a Vite/TypeScript single-page 3D portfolio. It uses Three.js
TSL materials with WebGPU/WebGL2 fallback, UIkit 3 and Bun. The user-facing
language is Russian; code, commits and documentation are English.

## Source of truth and reading order

Current source, configuration and tests win if any document disagrees with
them. Read only the documents relevant to the change, in this order:

1. [NEXT.md](NEXT.md) — select an open task.
2. [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — before changing runtime,
   routing, rendering or UI composition.
3. [docs/RULES.md](docs/RULES.md) — before changing code.
4. [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) — before verification or CI work.
5. [docs/UIKIT3.md](docs/UIKIT3.md) or [docs/BRAND.md](docs/BRAND.md) — only
   for the corresponding UI or content change.
6. [WORKLOG.md](WORKLOG.md) and [docs/CHANGELOG.md](docs/CHANGELOG.md) —
   historical context when needed.

[docs/README.md](docs/README.md) defines the ownership of every maintained
document. Do not update a document merely because another document mentions the
same topic; update its owner.

For UIkit 3 or Less theme work, read [docs/UIKIT3.md](docs/UIKIT3.md) and the
official UIkit component documentation before editing. UIkit is the component,
layout and accessibility baseline; the project does not maintain a parallel
design system.

## Session workflow

```bash
./scripts/session.sh start
# inspect the relevant source and documentation
# implement one scoped task
./scripts/session.sh end
```

`start` and `end` are orientation and worklog helpers. Do **not** use a script
that pushes directly to `main`. Publishing is PR-first and is described below.

Before editing, inspect `git status --short`. Preserve unrelated user changes.
Use `rg` for search, `apply_patch` for edits, and re-index codebase-memory only
after a substantial structural change. The optional index must never be treated
as more authoritative than source.

## Hard constraints

The complete rationale is in `docs/RULES.md`; the rules most likely to cause a
regression are:

- TSL NodeMaterials only; do not introduce raw `ShaderMaterial`.
- Use `renderer.setAnimationLoop`, not an application `requestAnimationFrame`
  render loop.
- Keep the inline splash and keep Enter disabled until `jlz:webgl-ready`.
- Keep EnvSphere as the background owner and the ground plane limited to the
  configured contact section.
- Preserve the six-section model and route/hash navigation contract.
- Keep WebGPU/WebGL fallback capability data based on the renderer actually
  created, not feature detection alone.
- Store and remove listeners, timers and GPU resources with their owner.
- Apply translations and route metadata through the router.

## Documentation policy

- Architecture belongs in `docs/ARCHITECTURE.md`; hard constraints in
  `docs/RULES.md`; local workflow in `docs/DEVELOPMENT.md`.
- `NEXT.md` contains only incomplete work. `WORKLOG.md` records decisions,
  not a duplicate task list. `CHANGELOG.md` records concise released changes.
- Historical completed plans live in Git history, not in the active docs.
- Do not modify `public/basis/README.md` or anything under `references/` unless
  the task explicitly concerns vendored/reference material.

## Verification

Run the proportional checks for every code change. The default full gate is:

```bash
bun run format:check
bun run lint
bun run type-check
bun run build
bun run test:unit
bun run test
```

If Playwright reports that Chromium is missing, install the revision once with:

```bash
bunx playwright install chromium
```

## Git and publishing

Work on a non-`main` branch. The default branch prefix is `codex/`.

```bash
git fetch origin --prune
git switch -c codex/<topic>    # or continue the scoped feature branch
git diff --check
git add <only-scoped-files>
git commit -m "docs: concise description"
git push -u origin HEAD
```

Open a pull request against `main`, wait for required checks, merge only after
they are green, then update the local default branch. Do not force-push, reset
other work, or commit unrelated changes. If GitHub CLI authentication is needed,
run `gh auth status` before attempting PR operations.
