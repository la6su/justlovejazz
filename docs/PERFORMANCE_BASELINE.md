# Performance baseline

This document freezes the pre-migration evidence and records comparable
measurements for every Vue/TresJS milestone. It separates reproducible delivery
budgets from hardware-dependent runtime measurements. Run
`bun run build && bun run budget:build` after entry graph, dependency, Three.js
or media changes.

Do not overwrite pre-migration values. Add dated results with the commit,
device and backend so improvements and regressions remain attributable.

## Static delivery

Measured from the written production assets on 2026-07-28 with gzip level 6:

| Path                    | Baseline       | Budget        | CI gate |
| ----------------------- | -------------- | ------------- | ------- |
| Splash startup scripts  | 2.68 kB gzip   | ≤ 5.00 kB     | yes     |
| Shared Three.js chunk   | 337.34 kB gzip | ≤ 350.00 kB   | yes     |
| Contact loader chunk    | 15.44 kB gzip  | route-owned   | no      |
| `public/assets` media   | 19.70 MB total | informational | no      |
| Placeholder video alone | 16.35 MB       | replace       | no      |

Splash startup includes the built shell entry, its static JavaScript
modulepreloads and executable inline splash code. The Contact-only GLTF/DRACO
implementations are isolated from the shared Three.js delivery and fetched
with that route. The shared chunk has about 12.7 kB of gzip headroom, so changes
to its import graph still require production-build inspection. Media remains
informational until approved replacements define a delivery budget; the gate
reports its total and largest file without normalising the current placeholder
as an acceptable limit.

### Migration delivery comparison

Keep framework and renderer costs separate. Populate a row only from a clean
production build.

| Milestone                    | Splash gzip | Vue gzip | TresJS gzip | Shared Three gzip | Initial route gzip | Notes                |
| ---------------------------- | ----------: | -------: | ----------: | ----------------: | -----------------: | -------------------- |
| Pre-migration (`2026-07-28`) |     2.68 kB |      n/a |         n/a |         337.34 kB |  record in Phase 0 | classic fallback     |
| Phase 1 toolchain            |     pending |  pending |     pending |           pending |            pending | inert scaffold       |
| Phase 5 Vue shell            |     pending |  pending |         n/a |           pending |            pending | native scene         |
| Phase 7 Tres root            |     pending |  pending |     pending |           pending |            pending | legacy world adapter |
| Phase 10 cutover             |     pending |  pending |     pending |           pending |            pending | no legacy paths      |

The splash budget remains 5 KB gzip. The existing Three.js budget is not
silently expanded to absorb Vue or TresJS. A dependency must replace owned code
or provide measured value, and its chunk must remain attributable.

### Phase 0 delivery recheck — 2026-08-15

Commit `6a72b30` passed `bun run build && bun run budget:build`. The production
manifest retained the frozen delivery values: splash startup **2.68 kB gzip**,
shared Three.js **337.34 kB gzip** (12.66 kB headroom) and public media
**19,686.37 kB**. The built Three chunk was
`vendor-three-DRu4w4s9.js`; this hash is an evidence marker, not a new budget.

## Runtime matrix

Frame-time evidence must come from real hardware rather than headless CI.
Record p50/p95 frame time and idle render activity for `/`, `/works` and
`/contact` using:

- WebGPU and forced `?renderer=webgl`;
- desktop and narrow mobile DPR;
- normal and reduced motion.

The current targets remain p95 ≤ 16.7 ms on tested desktop hardware and p95 ≤
33.3 ms on tested mobile hardware. Record the device, browser, backend and DPR
with every result so later comparisons remain meaningful. In development, open
the `JLZ · dev` panel after entering the experience; `p50 ms` and `p95 ms`
retain the latest bounded render burst while `fps: 0` and `rendering: false`
confirm that demand-driven idle has settled.

### Local desktop reference

First-pass measurements on 2026-07-28 used the Codex in-app browser on the
local macOS host at a 1280×720 canvas and DPR 1. The browser reported a real,
non-fallback `WebGPUBackend`; its adapter model was unavailable. Values are a
directional reference from one bounded sample window, not a cross-device
acceptance result:

| Backend | State             | p50     | p95     | Settled state              |
| ------- | ----------------- | ------- | ------- | -------------------------- |
| WebGPU  | Intro entry       | 9.7 ms  | 13.9 ms | 0 fps, `rendering: false`  |
| WebGPU  | Intro → Works     | 10.2 ms | 13.2 ms | active Works render reason |
| WebGL2  | Intro entry       | 6.9 ms  | 7.6 ms  | 0 fps, `rendering: false`  |
| WebGL2  | Intro → Works     | 7.0 ms  | 9.1 ms  | active Works render reason |
| WebGPU  | Direct `/works`   | 8.4 ms  | 9.8 ms  | route remains active       |
| WebGL2  | Direct `/works`   | 6.9 ms  | 7.6 ms  | route remains active       |
| WebGPU  | Direct `/contact` | 8.1 ms  | 9.5 ms  | route remains active       |
| WebGL2  | Direct `/contact` | 7.0 ms  | 7.5 ms  | route remains active       |

Both backends passed the desktop p95 target in this reference run. Production
direct-entry QA for `/works` and `/contact` also passed on desktop and at a
390×844 narrow viewport without browser errors. That viewport remains a layout
check on the desktop host (DPR 1), not mobile-hardware evidence. Complete the
matrix with real mobile DPR measurements before treating runtime performance as
fully baselined.

## Migration runtime and memory comparison

Record `/`, `/works` and `/contact` on automatic WebGPU and the forced fallback
for each renderer milestone. Before Phase 6 acceptance the forced fallback is
the current classic WebGL2 renderer; afterwards it is
`WebGPURenderer({ forceWebGL: true })` and is labelled `WebGLBackend`.

| Milestone        | Backend | Route/state               |     p50 |     p95 | Settled draws | Resource soak | Device/context                                                                                     |
| ---------------- | ------- | ------------------------- | ------: | ------: | ------------: | ------------- | -------------------------------------------------------------------------------------------------- |
| Phase 0 freeze   | partial | automatic and forced home |     n/a |     n/a |           n/a | pending       | `7f9db89`, Chrome 151 / RTX 4060 Ti at 1440×900 DPR 1; real-mobile and full inventory soak pending |
| Phase 2 spike    | pending | representative scene      | pending | pending |    0 required | 20 mounts     | record                                                                                             |
| Phase 6 renderer | pending | full route matrix         | pending | pending |    0 required | 20 routes     | record                                                                                             |
| Phase 10 cutover | pending | full route matrix         | pending | pending |    0 required | 20 routes     | record                                                                                             |

Resource soak tracks canvas/context count, listeners, timers, decoded assets,
textures, geometries, programs/pipelines, retained route scopes, JS heap and GPU
memory where a stable counter exists. Run five declared warm-up cycles so lazy
pipelines and bounded caches can reach their documented caps, then measure
twenty steady-state cycles. No counter may trend upward after warm-up, and root
destroy must return root-owned resources to baseline after an explicit
GC/driver-settle observation window. Exact heap values can be noisy; record raw
runs and fail repeatable trends rather than one sample.

### Phase 0 renderer observation — 2026-08-15

At commit `6a72b30`, the 1280×720 DPR 1 in-app-browser run did not expose a
hardware WebGPU adapter. Automatic startup initialized `WebGPURenderer` with
`WebGLBackend`, then deliberately recreated the classic `WebGLRenderer`; after
Enter, the home route showed one canvas and its DOM/scene composition.

Forced `?renderer=webgl` logged the expected classic WebGL2 path, removed the
splash after the Enter button reached `is-ready`, and showed the matching home
composition with one canvas and no console error. An earlier black capture was
invalid: its Enter click occurred before that readiness guard and was correctly
ignored by the inline handler. This evidence does not validate a hardware
WebGPU path, real-mobile DPR, frame timing or resource soak; those remain Phase
0 requirements.

### Phase 0 hardware WebGPU observation — 2026-08-15

At commit `7f9db89`, Google Chrome `151.0.7922.108` in the Ubuntu Sway desktop
session exposed a non-fallback WebGPU adapter on the local NVIDIA RTX 4060 Ti
16 GB. The 1440×900 DPR 1 local-development home run waited for the splash
Enter control to reach `is-ready`, entered successfully, and reported no
console or page errors. Renderer diagnostics confirmed
`WebGPURenderer -> WebGPUBackend`, `isRealWebGPU=true`, and the premium TSL
world path.

The successful home view contained two canvases. This is a known current
architecture boundary, not a WebGPU fallback: the persistent primary renderer
uses `WebGPUBackend`, while a secondary legacy `WebGLRenderer` creates the
procedural environment map for glass reflections. Phase 2 must replace or
isolate that auxiliary renderer behind the unified TSL contract; Phase 6 may
remove it only after visual, performance and resource-soak parity pass.

This closes the hardware-WebGPU availability gap. It does not substitute for a
real-mobile DPR/device run, route frame-time measurements, or the full
resource-inventory soak described above.

### Phase 0 physical mobile WebGPU observation — 2026-08-15

The same local development build was opened over an ADB USB reverse tunnel on
a physical Android 14 device (`22101320G`) in Chrome `151.0.7922.137`. The
device reported a 392×766 CSS-pixel viewport at DPR 2.75 (1080×2400 physical
display, 440 dpi). In the secure localhost context, `navigator.gpu` returned a
non-fallback adapter with mobile texture compression and `shader-f16` support.

After the splash Enter control reached `is-ready`, the application completed
its home entry with no console or page error. Its diagnostics confirmed
`WebGPURenderer -> WebGPUBackend`, `isRealWebGPU=true`, the premium TSL path,
and the same known two-canvas boundary: a primary WebGPU renderer plus the
secondary legacy WebGL environment-map renderer. The captured composition is
visually intact at the physical mobile DPR.

This closes the real-mobile DPR/device availability gap. It does not establish
mobile p50/p95 frame-time budgets or the full resource-inventory soak.

### Benchmark and visual protocol

- Record commit, production build hash, browser version, device/GPU, backend,
  adapter class, viewport, DPR, power state and motion preference.
- Warm shaders and route caches with one unmeasured route cycle, then collect
  at least three equal active-burst windows per route/backend. Report every run,
  the median and worst p95; the worst p95 must meet the target.
- Measure settled idle separately as loop ticks, draw calls and active reasons;
  frame-time budgets do not describe a state with zero draws.
- Capture visual parity at identical state and compare with the repository
  screenshot tool. Outside approved masks for temporal grain, cursor and video,
  at most 0.5% of pixels may exceed a 0.1 perceptual threshold. Store the diff
  and masks with the evidence; an intentional visual change requires product
  approval rather than a wider migration tolerance.
- Repeat resource tests after cache warm-up and again after root destroy;
  declare every bounded cache cap in the evidence.

## Performance design rules

- One canvas, renderer and renderer-loop driver for the shared experience.
- Zero scene draw calls and zero scheduler activities after settled idle.
- No per-frame object allocation in persistent tasks.
- Route assets load lazily and use explicit ephemeral, bounded-cache or
  shared-refcounted policies.
- Shader/pipeline warm-up is measured rather than hidden in first interaction.
- Dependency upgrades include build-size and both-backend frame comparisons.
- Budgets change only through a separately reviewed architecture decision with
  product and hardware evidence.
