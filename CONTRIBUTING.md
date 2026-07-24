# Contributing to JUSTLOVEJAZZ

Thank you for contributing! This guide is for human contributors. AI coding
agents should follow [AGENTS.md](AGENTS.md) instead — it is the single source
of truth for agent operating procedures.

## Quick start

```bash
git clone https://github.com/la6su/justlovejazz.git
cd justlovejazz
bun install
bunx playwright install chromium   # one-time E2E browser download
bun run dev                         # start Vite dev server (port 5173)
```

## Before you start

- Read [AGENTS.md](AGENTS.md) for the project overview and hard constraints.
- Check [NEXT.md](NEXT.md) for open tasks, or open an issue to discuss a new
  change.
- Read [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) if your change touches
  runtime, routing, rendering or UI composition.
- Read [docs/RULES.md](docs/RULES.md) for non-negotiable engineering invariants.
- Read [docs/UIKIT3.md](docs/UIKIT3.md) before any UI or Less change.

## Development workflow

1. **Branch** — create a feature branch from `main`:
   ```bash
   git switch -c <your-name>/<topic>
   ```
2. **Implement** — one scoped vertical slice. Reuse existing owners and UIkit
   behavior before adding abstractions.
3. **Verify** — run the full gate:
   ```bash
   bun run format:check
   bun run lint
   bun run type-check
   bun run build
   bun run test:unit
   bun run test
   ```
4. **Polish** — remove superseded code, stale copy and duplicate state.
5. **Commit** — use [Conventional Commits](https://www.conventionalcommits.org/):
   ```
   feat: add ...
   fix: correct ...
   refactor: simplify ...
   docs: update ...
   ```
6. **Push and PR** — open a pull request against `main`. Wait for CI to pass.
   Do not force-push or push directly to `main`.

## Code style

- **TypeScript strict mode** with `noUncheckedIndexedAccess` — always handle
  `undefined` from array access.
- **TSL NodeMaterials** — use `MeshBasicNodeMaterial` /
  `MeshPhysicalNodeMaterial` from `three/webgpu` and TSL functions from
  `three/tsl`. Never raw `ShaderMaterial`.
- **UIkit 3 first** — use documented UIKit components, utility classes and
  Less variables before adding custom CSS. See
  [docs/UIKIT3.md](docs/UIKIT3.md) for the solution priority order.
- **Dispose everything** — listeners, timers and GPU resources belong to
  their owner and must be removed in `dispose()`/`destroy()`.
- **Reduced-motion** — authored animations must snap to settled state
  synchronously; never leave `_needsRender` stuck true.
- **No new abstractions without measured benefit** — prefer deletions and
  merges over new layers.

## Pull request checklist

- [ ] Branch is up to date with `main`
- [ ] `bun run type-check` passes
- [ ] `bun run lint` passes (0 errors; warnings are acceptable if pre-existing)
- [ ] `bun run test:unit` passes
- [ ] `bun run build` succeeds
- [ ] `bun run test` (Playwright E2E) passes
- [ ] Commit messages follow Conventional Commits
- [ ] No unrelated changes in the diff
- [ ] [NEXT.md](NEXT.md) updated (task moved or completed)
- [ ] [WORKLOG.md](WORKLOG.md) updated with the decision (if non-trivial)
- [ ] [docs/CHANGELOG.md](docs/CHANGELOG.md) updated (if user-visible change)

## Reporting issues

Open a [GitHub Issue](https://github.com/la6su/justlovejazz/issues) with:

1. **Summary** — what happened, in one sentence.
2. **Steps to reproduce** — numbered list.
3. **Expected vs actual** — what you expected, what you saw.
4. **Environment** — browser, OS, device (desktop/mobile).
5. **Screenshots/video** — if visual.
6. **Console errors** — if any.

## License

By contributing, you agree that your contributions are licensed under the
project's [ISC license](LICENSE).
