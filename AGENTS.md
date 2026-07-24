# AGENTS — project entry point

JUSTLOVEJAZZ is a Vite + TypeScript single-page 3D portfolio. It uses Three.js
TSL NodeMaterials with WebGPU/WebGL2 fallback, UIkit 3, and Bun. The
user-facing language is Russian; code, commits and documentation are English.

This file is the **single source of truth for all AI coding agents**. Other
agent-specific files (`CLAUDE.md`, `.github/copilot-instructions.md`,
`.cursor/rules/`) reference this file to avoid duplication.

## Quick reference

| What | Where |
|------|-------|
| Open tasks | [NEXT.md](NEXT.md) |
| Architecture | [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) |
| Hard rules | [docs/RULES.md](docs/RULES.md) |
| Dev workflow + verification | [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) |
| UIkit 3 + Less conventions | [docs/UIKIT3.md](docs/UIKIT3.md) |
| Brand voice + visual intent | [docs/BRAND.md](docs/BRAND.md) |
| Doc ownership map | [docs/README.md](docs/README.md) |
| Decision journal | [WORKLOG.md](WORKLOG.md) |
| Release history | [docs/CHANGELOG.md](docs/CHANGELOG.md) |
| Active detailed plan | [docs/PLAN-showreel-shader-plane.md](docs/PLAN-showreel-shader-plane.md) |

## Reading order

Current source, configuration and tests win if any document disagrees with
them. Read only the documents relevant to the change, in this order:

1. **[NEXT.md](NEXT.md)** — select an open task.
2. **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** — before changing runtime,
   routing, rendering or UI composition.
3. **[docs/RULES.md](docs/RULES.md)** — before changing code.
4. **[docs/DEVELOPMENT.md](docs/DEVELOPMENT.md)** — before verification or CI.
5. **[docs/UIKIT3.md](docs/UIKIT3.md)** or **[docs/BRAND.md](docs/BRAND.md)** —
   only for the corresponding UI or content change.
6. **[WORKLOG.md](WORKLOG.md)** and **[docs/CHANGELOG.md](docs/CHANGELOG.md)**
   — historical context when needed.

[docs/README.md](docs/README.md) defines the ownership of every maintained
document. Do not update a document merely because another document mentions
the same topic; update its owner.

## Hard constraints

The complete rationale is in [docs/RULES.md](docs/RULES.md); the rules most
likely to cause a regression are:

- **TSL NodeMaterials only** — do not introduce raw `ShaderMaterial`.
- **`renderer.setAnimationLoop`** — not an application `requestAnimationFrame`
  render loop.
- **Inline splash** — keep it in `index.html`; keep Enter disabled until
  `jlz:webgl-ready`.
- **EnvSphere** is the background owner; ground plane is contact-section only.
- **Six-section model** — preserve section order and route/hash navigation.
- **WebGPU/WebGL fallback** — base capability on the renderer actually created,
  not feature detection alone.
- **Dispose everything** — listeners, timers and GPU resources belong to their
  owner and must be removed in `dispose()`/`destroy()`.
- **Reduced-motion** — authored animations must snap to settled state
  synchronously; never leave `_needsRender` stuck true.
- **UIkit 3 first** — use documented UIKit components, utility classes and Less
  variables before adding custom CSS. See [docs/UIKIT3.md](docs/UIKIT3.md).
- **Typed events** — use `eventBus.emit()` for `jlz:webgl-ready/failed`,
  `jlz:section-change`, `jlz:route-change`. Other `jlz:*` events are local DOM
  contracts via `window.dispatchEvent`.
- **Translations + metadata** — apply through the router only.

## Session workflow

```bash
./scripts/session.sh start
# inspect the relevant source and documentation
# implement one scoped task
./scripts/session.sh end
```

`start` and `end` are orientation and worklog helpers. Do **not** use a script
that pushes directly to `main`. Publishing is PR-first.

Before editing, inspect `git status --short`. Preserve unrelated user changes.
Use `rg` (ripgrep) for search. Re-index codebase-memory only after a
substantial structural change; the optional index must never be treated as
more authoritative than source.

## How to make a change

1. **Plan** — choose one open outcome from [NEXT.md](NEXT.md). Define its
   user-visible result, constraints and proportional verification. Create a
   `docs/PLAN-*.md` only if the change spans multiple independent phases.
2. **Build** — implement one vertical slice. Reuse current owners and UIkit
   behavior before adding abstractions. Prefer deletions and merges over new
   layers.
3. **Verify** — run focused tests while iterating, then the full gate (below).
   Visually inspect desktop/mobile, both theme polarities, keyboard and
   reduced motion. Check WebGPU/WebGL2 when rendering behavior changes.
4. **Polish** — remove superseded code, stale copy and duplicate state. Re-run
   affected checks after cleanup.
5. **Record** — remove completed work from [NEXT.md](NEXT.md), write the
   durable decision in [WORKLOG.md](WORKLOG.md), add a concise release note
   only for a user-visible or operational change.

## Verification gate

Run the complete local gate before a pull request:

```bash
bun run format:check
bun run lint
bun run type-check
bun run build
bun run test:unit
bun run test
```

CI (`.github/workflows/lighthouse.yml`) runs the same gate plus Lighthouse on
every push and PR to `main`. All checks must pass before merge.

If Playwright reports that Chromium is missing:

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
git commit -m "<type>: concise description"
git push -u origin HEAD
```

Open a pull request against `main`, wait for required checks, merge only after
they are green, then update the local default branch. Do not force-push, reset
other work, or commit unrelated changes.

### Commit message conventions

Use [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` — new user-visible feature
- `fix:` — bug fix
- `refactor:` — code restructuring without behavior change
- `docs:` — documentation only
- `test:` — test additions or fixes
- `chore:` — tooling, deps, config
- `perf:` — performance improvement

Scope is optional: `feat(works):`, `fix(overlay):`.

## Documentation policy

- Architecture belongs in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md); hard
  constraints in [docs/RULES.md](docs/RULES.md); local workflow in
  [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md).
- [NEXT.md](NEXT.md) contains only incomplete work. [WORKLOG.md](WORKLOG.md)
  records decisions, not a duplicate task list.
  [docs/CHANGELOG.md](docs/CHANGELOG.md) records concise released changes.
- Historical completed plans live in Git history, not in the active docs.
- Do not modify `public/basis/README.md` or anything under `references/`
  unless the task explicitly concerns vendored/reference material.
