# Development and verification

## Local setup

```bash
bun install
bunx playwright install chromium
bun run dev
```

Vite prints the local address. Playwright installs its managed Chromium once
and requests a new revision after relevant upgrades.

The current runtime uses `?renderer=webgl` to inspect its classic WebGL2
fallback. After the unified renderer phase is accepted, the same query must
select `WebGPURenderer({ forceWebGL: true })`; documentation and diagnostics
must distinguish `WebGPUBackend`, `WebGLBackend` and the legacy classic path
during transition.

## Current checks

Use focused checks while iterating. The current complete release gate is:

```bash
bun run format:check
bun run lint
bun run type-check
bun run build
bun run budget:build
bun run test:unit
bun run test
```

Do not document future Vue commands until their scripts exist in
`package.json`. The toolchain phase will introduce SFC type checking and Vue
component tests through named Bun scripts and then add them to this gate.

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

Each migration phase selects the relevant checks from
[MIGRATION_VUE_TRES.md](MIGRATION_VUE_TRES.md). The minimum renderer-affecting
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

The representative renderer spike must exercise the actual project feature
set rather than a demo cube: fog, representative TSL materials, CanvasTexture,
instancing, environment/SplashCube, Works texture plane, GLTF/DRACO, complete
TSL post graph, DPR/resize, reduced motion and lazy teardown.

The gate fails on material compilation warnings, renderer errors, loss of fog
or post parity, a second animation loop/context, continuous idle draws,
monotonic GPU/resource growth or a performance-budget regression. The classic
fallback remains until the gate passes.

### Component and accessibility gate

Vue components preserve semantic headings, landmarks, link/button behavior,
route announcements, accessible names and focus restoration. UIkit wrappers
prove exactly one initialization/destruction lifecycle and one focus owner.
Visual snapshots are captured after the splash Enter control unless the splash
is the subject.

### Resource and memory gate

Development diagnostics must expose active render reasons, draw state and
renderer resource counts. Automated/browser soak performs at least twenty
representative route cycles and checks for monotonic growth in:

- canvas and graphics contexts;
- window/document listeners and active timers;
- textures, geometries and renderer programs/pipelines;
- retained route stages and decoded assets;
- JS heap and GPU memory where the browser exposes stable measurements.

A noisy memory metric is recorded with its environment and trend rather than
converted into a false exact threshold. Repeatable monotonic growth is a
release blocker.

In development builds, `window.__jlzRuntimeSnapshot()` returns the same
owner-visible inventory shown in the DevPanel: canvas count, scene geometries,
materials and textures, renderer counters when exposed, and post-pipeline
targets/passes. It intentionally does not invent driver-level WebGPU memory
metrics. For each soak, record one snapshot after five warm-up cycles and after
each twenty-cycle steady-state block; compare like-for-like backend, viewport
and DPR runs.

## Performance budgets

These budgets protect startup and interaction throughout migration:

| Metric                                    | Budget                                                         |
| ----------------------------------------- | -------------------------------------------------------------- |
| Splash startup JavaScript                 | ≤ 5 KB gzip; excludes Vue, TresJS, Three.js, UIkit and World   |
| Shared Three.js delivery                  | ≤ 350 KB gzip until a separately approved budget ADR           |
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
