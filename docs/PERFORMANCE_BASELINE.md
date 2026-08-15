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

| Milestone        | Backend | Route/state               |     p50 |     p95 | Settled draws | Resource soak      | Device/context                                                                                                  |
| ---------------- | ------- | ------------------------- | ------: | ------: | ------------: | ------------------ | --------------------------------------------------------------------------------------------------------------- |
| Phase 0 freeze   | partial | automatic and forced home |     n/a |     n/a |           n/a | owner-visible pass | `20c4d63`, desktop RTX 4060 Ti and Android DPR 2.75 WebGPU confirmed; teardown listener/timer inventory pending |
| Phase 2 spike    | partial | representative loop graph |   16.70 |   16.80 |             0 | smoke only         | Android `22101320G`, three foreground windows per WebGPUBackend and WebGLBackend; desktop and resource plateau pending |
| Phase 6 renderer | pending | full route matrix         | pending | pending |    0 required | 20 routes          | record                                                                                                          |
| Phase 10 cutover | pending | full route matrix         | pending | pending |    0 required | 20 routes          | record                                                                                                          |

Resource soak tracks canvas/context count, listeners, timers, decoded assets,
textures, geometries, programs/pipelines, retained route scopes, JS heap and GPU
memory where a stable counter exists. Run five declared warm-up cycles so lazy
pipelines and bounded caches can reach their documented caps, then measure
twenty steady-state cycles. No counter may trend upward after warm-up, and root
destroy must return root-owned resources to baseline after an explicit
GC/driver-settle observation window. Exact heap values can be noisy; record raw
runs and fail repeatable trends rather than one sample.

Development builds expose `window.__jlzRuntimeSnapshot()` so soak automation
can collect the same owner-visible values as the DevPanel: canvas count, scene
geometries/materials/textures, renderer counters where Three.js exposes them,
and post-pipeline targets/passes. Browser APIs do not expose a portable
driver-level WebGPU memory counter, so that value remains explicitly unavailable
rather than being guessed.

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

### Phase 2 Tres unified-renderer factory observation — 2026-08-15

The development-only Tres factory spike ran in headed Chrome 151 on the same
Ubuntu Sway RTX 4060 Ti workstation. Automatic policy created
`WebGPURenderer -> WebGPUBackend`, obtained a usable adapter and device, retained
one canvas and emitted no runtime or page error. Three r185 does not expose the
adapter requested inside its backend, so renderer inspection records its
hardware/software class as unknown instead of inferring non-fallback. The same factory with
`forceWebGL` created `WebGPURenderer -> WebGLBackend`, also with one canvas and
no runtime or page error. This proves construction, single Tres-owned async
initialization, backend inspection and manual-frame handoff only; it does not
yet admit the representative TSL/post graph or establish Phase 2 performance
and resource budgets.

The follow-up fixed 800×450 loop-driver A/B sampled 90 render invocations and one second of
idle per driver. Tres manual mode retained 60 idle ticks per second on both
backends. A bounded `setAnimationLoop` driver retained zero idle ticks, with
WebGPU p50/p95 16.7/16.8 ms and forced WebGLBackend 16.7/18.5 ms; manual measured
16.7/17.0 ms and 16.7/17.1 ms respectively. No run emitted a runtime/page error.
This is one observation, so the bounded driver is a candidate rather than a
selection. Repeat at least three equal windows per backend with the
representative TSL/post graph and record median plus worst p95 before admission.

### Phase 2 representative fallback observation — 2026-08-15

The development-only representative Tres route rendered its fogged
`MeshBasicNodeMaterial` scene through `WebGPURenderer -> WebGLBackend` in the
local in-app browser. The visible scene completed without a runtime error. This
is not a performance result and does not prove the WebGPU-only TSL post path;
that branch needs the physical hardware browser before it can enter the active
burst benchmark.

The same route was then exercised in physical Google Chrome 151 on the Ubuntu
Sway RTX 4060 Ti session. Automatic policy completed as `WebGPUBackend` with
the TSL post path; forced `?backend=webgl` completed as `WebGLBackend` with the
intentional direct fallback. Neither produced a runtime or shader error. This
is a renderer-feasibility observation only: it does not yet contain comparable
active-burst timings or a resource soak. The active Chrome flags were not
captured, so reproduce this result with the same browser configuration before
using it as a cross-machine comparison.

The representative environment owner was then mounted through the same scoped
probe. Both automatic WebGPU and forced WebGLBackend completed successfully.
After the `tres-spike` dev optimizer excluded the Three ESM entry points, the
rerun emitted no new duplicate-Three warning. This confirms one runtime graph
for the probe; it is not a resource-plateau measurement yet.

The existing time-driven `ParticleBurst` instanced owner also completed on both
backends through the representative scope, with no runtime or shader error.
This proves its one-time uniform/update compilation only; sustained animation
and active-burst timings remain pending the loop-driver gate.

The shared-cache Works texture owner (`CasePlane` plus a real project cover)
also completed through both representative backends without runtime or shader
errors. It is an async asset-feasibility observation, not a concurrent-cache or
resource-plateau result.

The same scoped route then loaded the production `ContactCyprusStage` asset
through its existing GLTF/DRACO owner. Automatic `WebGPUBackend -> tsl-post`
and forced `WebGLBackend -> direct-webgl-fallback` both completed without
runtime or shader errors. This records real-model asset compatibility only;
resize/DPR, reduced-motion, active-burst timing and lifecycle-plateau evidence
remain outstanding.

Temporary Chrome media emulation then confirmed the established reduced-motion
policy reaches the representative scope on both backends. The probe completed
with `reduced` state under automatic WebGPU and forced WebGLBackend without a
runtime or shader error. That is a preference-propagation result, not a real
DPR/resize or performance measurement.

The physical Android 14 device `22101320G` then rendered the complete
representative GLTF/DRACO scope over a temporary USB reverse tunnel. Its
1080×2400 display at density 440 reached the configured renderer DPR cap of
2.00. The visible probe completed automatic `WebGPUBackend -> tsl-post` and
forced `WebGLBackend -> direct-webgl-fallback`. This is mobile compatibility
evidence only: it contains no active-burst timings, dynamic resize event or
resource-count plateau.

A lifecycle smoke soak then ran five warm-up mounts and twenty mount/unmount
cycles of the complete representative scope in headed Chrome. Every recorded
steady-state sample (cycles 10, 15, 20 and 25) completed through
`WebGPUBackend -> tsl-post` without a runtime or shader error. The attached
browser did not expose usable JS heap or GPU resource counters, so this is not
a resource-plateau or no-leak result; it only confirms the real teardown path
survives repeated navigation.

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

### Phase 0 physical mobile owner-visible resource soak — 2026-08-15

At commit `20c4d63`, the physical Android device completed five warm-up
storyline transitions followed by twenty steady-state transitions across
Studio, Services, Works and Manifesto. The development-only
`window.__jlzRuntimeSnapshot()` was read after warm-up and after each five
steady-state transitions. The four steady-state samples were identical:

| Resource                     | Warm-up and all steady-state samples |
| ---------------------------- | ------------------------------------ |
| Canvases                     | 2                                    |
| Scene geometries             | 18                                   |
| Scene materials              | 25                                   |
| Scene textures               | 9                                    |
| Renderer geometries          | 18                                   |
| Renderer textures            | 28                                   |
| Post render targets / passes | 0 / 0 (one WebGPU TSL pipeline)      |

No console or page error occurred. Renderer geometries rose from 12 at first
entry to 18 during warm-up, then plateaued; this is recorded as lazy pipeline
initialization rather than a steady-state leak. The browser exposes no portable
driver-level WebGPU memory value, and the current snapshot does not yet count
window/document listeners or active timers. Those explicit root-teardown
lifecycle counters were the final Phase 0 evidence gap and are resolved by the
root-teardown observation below.

### Phase 0 physical mobile root teardown — 2026-08-15

On the same device, the development-only `window.__jlzRuntimeDestroy()` hook
called the real `Experience.destroy()` implementation after the runtime was
ready. Chrome DevTools recorded two canvases before teardown and zero after it.
The development snapshot and teardown hooks were both removed. Direct listener
inspection recorded `window` listeners falling from 55 to 22 and `document`
listeners from 7 to 2; the retained values are the page/browser baseline, while
the removed listeners are owned by the runtime and its UI adapters.

The owner implementation cancels its animation loop and pending rAF, clears
known resize/pulse/debounce/dev-panel timers, releases pipeline/renderer/world
resources, and removes their handlers before this measurement. Browser DevTools
does not expose a portable aggregate timer counter; the teardown contract is
therefore evidenced by those explicit owner cleanup paths plus the verified DOM
and listener deltas, rather than a fabricated timer number.

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
