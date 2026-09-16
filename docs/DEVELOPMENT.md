# Development and verification

## Setup and release gate

```bash
bun install
bunx playwright install chromium
bun run dev
```

Run focused checks while editing. The complete runtime release gate is:

```bash
bun run format:check
bun run lint
bun run type-check
bun run type-check:vue
bun run build
bun run budget:build
bun run test:unit
bun run test:serial
```

`package.json` owns commands; `playwright.config.ts` owns browser/server setup.
The normal browser suite builds and serves on port 4173, but may reuse an
existing server locally: stop a stale server before collecting release evidence.
Use the serial suite for release results; parallel timing tests have flaked on
this workstation. Hosted checks are in `.github/workflows/lighthouse.yml`.
Documentation-only changes need formatting and local reference checks. Runtime
checks follow the changed behavior; full checks belong to runtime publication.

## Build outputs

`bun run build` checks TypeScript, prerenders home/blog, publishes builder
pages, generates the sitemap, then runs Vite. Edit Vue/content/data sources,
not generated `prerender/`, blog/builder HTML or `public/sitemap.xml`.
Review intended generated diffs; preserve unrelated changes.

## Browser verification

- `?no-scene=1` checks semantic DOM without a renderer; it proves no GPU behavior.
- `?force-webgl-backend=1` forces WebGLBackend **in development only**.
  Production preview ignores it; confirm the actual backend in every report.
- Pass the splash Enter control before normal route screenshots.
- Cover changed routes by direct entry, in-app navigation, hash and history;
  EN/RU, auto/inverse, normal/reduced motion; keyboard/focus, pointer and touch;
  desktop/narrow layouts and real mobile DPR where relevant.
- Renderer/lifecycle changes also need actual WebGPU and WebGLBackend checks,
  async teardown, warm route cycles, idle frame deltas and resource trends.
  Settled routes stop the loop; explicit continuous effects are measured separately.

`window.__jlzHost` exposes backend facts. DEV `window.__jlzRuntimeSnapshot()`
reports loop/demand, scene/renderer resources and CPU frame timing. CPU timing
is not GPU timing. Count the scene's `canvas.canvas` separately from the 2D
cursor canvas. Missing counters and flat heap readings are not leak evidence.

## Budgets

`scripts/check-build-budgets.ts` enforces gzip level 6, decimal bytes:

| Artifact                                   |         Limit |
| ------------------------------------------ | ------------: |
| Splash scripts and initial module/preloads |   5,000 bytes |
| Shared Three.js vendor                     | 350,000 bytes |
| UIkit vendor                               |  56,000 bytes |

The current checker does **not** enforce separate Vue/Tres/route limits.
Inspect their delivery when imports, entries or dependencies change; do not
hide regressions by moving bytes between chunks. Runtime targets on measured
hardware are worst active-burst p95 ≤16.7 ms desktop / ≤33.3 ms mobile and
zero draws on settled routes. Use the [measurement protocol](evidence/README.md#measurement-protocol).

Change budgets only with a measured rationale in the task scope; do not raise
them just to pass a check. The pending Three review is in [NEXT](../NEXT.md).

## Dependencies and evidence

Before upgrading: inspect official compatibility/release information and the
installed types, state the concrete need, pin the tested matrix, measure
bundle/startup impact and verify both backend paths. Do not add overlapping
helpers or remove the scoped Three entry without equivalent delivery evidence.

[Evidence tools](evidence/README.md) provide targeted renderer, soak, visual
and bundle reports. State commit, environment, backend and skips with each
result. Headless success does not establish physical hardware parity or
WebGL device-loss restoration; the latter remains deferred in NEXT.

## Git delivery

When requested, publish one scoped non-default branch and PR with a Conventional
Commit. Inspect the final diff and `git diff --check`; report verification and
material limitations. Keep history in Git and unfinished outcomes in NEXT.
