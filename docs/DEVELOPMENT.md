# Development and verification

## Local setup

```bash
bun install
bunx playwright install chromium
bun run dev
```

Vite prints the local address. Playwright installs its managed Chromium once
and requests a new revision after relevant upgrades.

The runtime constructs one renderer class — `WebGPURenderer` — and the
software-adapter policy (`planUnifiedBackend`) re-creates it with
`forceWebGL: true` (the same class, `WebGLBackend`) when only a software WebGPU
adapter is available. Diagnostics distinguish `WebGPUBackend` and
`WebGLBackend`. (The dev-forced classic `?renderer=webgl` QA flag was removed
in Phase 10; the automatic software-adapter fallback is retained.)

## Current checks

Use focused checks while iterating. The current complete release gate is:

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

`type-check:vue` is required whenever Vue SFCs or Vue-facing TypeScript
contracts change. `test:serial` is the deterministic browser gate; the
parallel `bun run test` command is useful for exploratory runs but is not the
release evidence command on this workstation.

The Playwright command builds and serves the application. CI configuration in
`.github/workflows/lighthouse.yml` remains the source for hosted checks and
Lighthouse behavior. Run the migration release e2e gate serially
(`bun run test:serial`) — two timing-sensitive tests (section-anchor attach
after an in-app route change; `data-state="idle"` after history `goBack`)
flake under the parallel default on loaded dev machines, while passing in
isolation and in the serial run.

For interface work, load
[the project UI skill](../skills/justlovejazz-ui/SKILL.md) for the
route/theme/input matrix.

## Migration verification

The completed migration record is archived at
[`archive/MIGRATION_VUE_TRES.md`](archive/MIGRATION_VUE_TRES.md). Current
renderer-affecting
matrix is:

Run `bun run type-check:vue` whenever a Vue SFC changes. It complements the
existing TypeScript check; it does not replace the release gate.

| Area       | Required evidence                                                    |
| ---------- | -------------------------------------------------------------------- |
| Backend    | automatic WebGPU and forced WebGLBackend; software-adapter policy    |
| Navigation | direct entry, in-app, hash and popstate                              |
| Preference | EN/RU, normal/inverse, reduced motion, sound                         |
| Input      | mouse, wheel/trackpad, touch, keyboard and focus                     |
| Viewport   | desktop, narrow layout and real mobile DPR                           |
| Lifecycle  | mount, exit during async load, destroy and twenty route cycles       |
| Runtime    | no uncaught/GPU/material errors, one canvas/loop, settled zero draws |
| Delivery   | startup graph and separate Vue/Tres/Three/UIkit chunk reports        |

### Renderer gate

The live renderer gate (`bun scripts/phase7-live-gate.ts` against the dev
server) exercises the production World — the representative feature set:
fog, TSL materials, CanvasTexture, instancing, environment/SplashCube, Works
texture plane, GLTF/DRACO, the complete TSL post graph, DPR/resize, reduced
motion and lazy teardown — and asserts the readiness handshake, settled idle
(zero draws) and the disposal contract (the Phase 7 evidence).

The gate fails on material compilation warnings, renderer errors, loss of fog
or post parity, a second animation loop/context, continuous idle draws,
monotonic GPU/resource growth or a performance-budget regression. The
dev-forced classic `?renderer=webgl` QA owner (with its labelled GLSL post
chain) was removed in Phase 10; the automatic software-adapter policy
(`WebGPURenderer` on `WebGLBackend`) remains the retained fallback.

### Component and accessibility gate

Vue components preserve semantic headings, landmarks, link/button behavior,
route announcements, accessible names and focus restoration. UIkit wrappers
prove exactly one initialization/destruction lifecycle and one focus owner.
Visual snapshots are captured after the splash Enter control unless the splash
is the subject.

### Resource and memory gate

Development diagnostics must expose active render reasons, draw state and
renderer resource counts. The automated soak tool
(`scripts/phase10-route-cycle-soak.ts`, Phase 10 acceptance) performs five
warm-up route cycles and at least twenty steady-state route cycles over the
six SPA routes and checks for monotonic growth in:

- canvas and graphics contexts (exactly one `canvas.canvas` DOM element);
- window/document listeners and active timers (proxied by the DOM node count);
- textures, geometries and renderer programs/pipelines;
- retained route stages and decoded assets (scene traversal counts);
- JS heap and GPU memory where the browser exposes stable measurements.

The settle gate is route-aware: settle-able routes must end the settle window
with the single loop driver stopped (`loopActive === false`, zero settled
draws); the by-design continuous routes (the `/works` back-text UV scroll,
visible ambient motion and visible particle fields — the state-based
`renderDemand.ts` flags) keep the loop alive, and the soak gates their frame
delta between consecutive visits of the same route instead (a growing per-visit
frame rate is accumulating animation work).

A noisy memory metric is recorded with its environment and trend rather than
converted into a false exact threshold (e.g. headless Chromium's flat
`performance.memory` reading is noted, not silently dropped). Repeatable
monotonic growth is a release blocker.

In development builds, `window.__jlzRuntimeSnapshot()` returns the same
owner-visible inventory shown in the DevPanel: canvas count, scene geometries,
materials and textures, renderer counters when exposed, post-pipeline
targets/passes, the single loop driver's diagnostics (`loopActive`, `frames`)
and the exact demand state behind the settle decision (`needsRender`,
cursor-settled, the 14-flag `renderDemand.ts` activity snapshot). It
intentionally does not invent driver-level WebGPU memory metrics. The soak
tool records one snapshot after each route cycle (warm-up + steady) plus a
root-destroy snapshot, writes a machine-readable report to
`docs/evidence/phase10-route-cycle-soak/`, and records the actual backend
readiness line, fixed viewport and measured DPR in every report. A run that
cannot capture the backend or DPR fails instead of producing incomplete
evidence that could be mistaken for a like-for-like comparison.

## Performance budgets

These budgets protect startup and interaction throughout migration:

| Metric                                    | Budget                                                         |
| ----------------------------------------- | -------------------------------------------------------------- |
| Splash startup JavaScript                 | ≤ 5 KB gzip; excludes Vue, TresJS, Three.js, UIkit and World   |
| Shared Three.js delivery                  | ≤ 350 KB gzip until a separately approved budget ADR           |
| Shared UIkit delivery                     | ≤ 56 KB gzip; product graph registers only used extended icons |
| Idle draw activity                        | zero draw calls and zero active scheduler reasons when settled |
| Active-burst frame time on tested desktop | p95 ≤ 16.7 ms                                                  |
| Active-burst frame time on tested mobile  | p95 ≤ 33.3 ms                                                  |

Vue runtime, TresJS integration, hydrated route chunks and UIkit have separate
reports and limits during Phase 1. Do not hide dependency regressions inside
the Three.js budget or raise an existing budget to make a framework fit.
Those measured limits become numeric blocking gates before Vue or Tres takes
production ownership in Phases 5 and 7.

Changes to entry points, imports, dependencies, renderer ownership or render
startup require production-build inspection. Persistent visual layers share
the scheduler, avoid per-frame allocation and release resources through their
scope.

Hardware-dependent runtime measurements and their required context live in
[PERFORMANCE_BASELINE.md](PERFORMANCE_BASELINE.md).

## Dependency and version policy

Before adding or upgrading Vue, TresJS, Three.js or a supporting package:

1. read the current official release notes and compatibility declarations;
2. record the exact tested matrix and pin it in the lockfile/package manifest;
3. state the owned problem and why platform/current dependencies are
   insufficient;
4. measure production gzip, startup and runtime impact;
5. avoid overlapping helpers and remove superseded dependencies/code;
6. run both renderer paths and the relevant component/resource gates.

`latest` is research input, not a versioning strategy. A stable compatible
matrix with evidence is preferred to independently newest packages.
