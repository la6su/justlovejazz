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
| Shared UIkit chunk      | 53.66 kB gzip  | ≤ 56.00 kB    | yes     |
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
| Pre-migration (`2026-07-28`) |     2.68 kB |      n/a |         n/a |         337.34 kB |          544.51 kB | classic fallback     |
| Phase 1 toolchain            |     pending |  pending |     pending |           pending |            pending | inert scaffold       |
| Phase 5 Vue shell            |     pending |  pending |         n/a |           pending |            pending | native scene         |
| Phase 7 Tres root            |     pending |  pending |     pending |           pending |            pending | legacy world adapter |
| Phase 10 cutover             |     2.70 kB |      n/a |         n/a |         298.42 kB |                n/a | no legacy paths      |

The initial route gzip is populated from the first clean production build of
the current dependency set (commit `6f02896`, 2026-08-21, build identifiers in
the slice below): **544.51 kB** gzip total, of which 15.70 kB is the route-owned
Contact GLTF/DRACO loader and the shared portion is 528.81 kB. The pre-migration
measurement is a record, not a budget; no initial-route budget value is implied.

The splash budget remains 5 KB gzip. The existing Three.js budget is not
silently expanded to absorb Vue or TresJS. A dependency must replace owned code
or provide measured value, and its chunk must remain attributable.

### Phase 10 delivery recheck — 2026-08-26

Commit `658ce3c` passed `bun run build` and `bun run budget:build` after the
BlurFade performance slice. The current production output measures splash
startup at **2.70 kB gzip**, the lazy Three.js vendor at **298.42 kB gzip**
against the **350.00 kB** gate, and the shared UIkit vendor at **53.66 kB gzip**
against the **56.00 kB** gate. Public media is **18,923.03 kB** in total, with
the known placeholder video at **16,352.70 kB**. Vue and TresJS are not split
into independently attributable vendor chunks in this manifest, so those table
cells remain `n/a` rather than implying a fabricated measurement. The build's
WebSocket `EPERM` messages occur only in the restricted prerender sandbox and
do not change the successful production output.

### UIkit icon-footprint slice — 2026-08-25

Commit `4fd628c` removed the full 162-icon `uikit-icons` plugin from the
production graph. The product now registers the 15 JLZ console icons plus the
single built-in `twitter` icon; the complete official set remains in the
dev-only admin entry. A clean build measured `vendor-ui-BiUtmDsC.js` at
**53.66 kB gzip** (down from **75.80 kB**, approximately 29% lower) and the
new ≤ 56.00 kB gate passed. The shared Three.js guard remains independently
evidence-gated per ADR 0008.

### Phase 0 delivery recheck — 2026-08-15

Commit `6a72b30` passed `bun run build && bun run budget:build`. The production
manifest retained the frozen delivery values: splash startup **2.68 kB gzip**,
shared Three.js **337.34 kB gzip** (12.66 kB headroom) and public media
**19,686.37 kB**. The built Three chunk was
`vendor-three-DRu4w4s9.js`; this hash is an evidence marker, not a new budget.

### Phase 2 initial-route delivery observation — 2026-08-21

A clean production build of the current dependency set (commit `6f02896`,
`bun run build`, 2026-08-21) was measured with the same method as the frozen
rows and the `budget:build` gate (bun `node:zlib`, gzip level 6; node:zlib
returns 539.93 kB for the same files, an implementation delta, not a build
delta):

- the budget gate (`bun run budget:build`) passed: splash startup **2.68 kB**
  / ≤ 5.00 kB, shared Three.js **349.29 kB** / ≤ 350.00 kB
  (`vendor-three-D1iinxLJ.js`) and public media **19,686.37 kB** total
  (informational);
- the initial route JS is the full import closure of built JavaScript from
  the `dist/index.html` entry: entry shell, modulepreload and every statically
  or dynamically reachable chunk, which the entry shell loads as one startup
  burst. The closure is 16 chunks totalling **543.74 kB** gzip; with the
  **0.77 kB** inline splash script the initial route delivers **544.51 kB**
  of JavaScript;
- of that total, **15.70 kB** is the route-owned
  `vendor-three-contact-loaders-BX3b6QUX.js` (Contact GLTF/DRACO loaders,
  attributed to the Contact route by the frozen delivery model), leaving a
  shared initial-route JavaScript of **528.81 kB**;
- the Contact GLTF's runtime-fetched DRACO companions
  (`draco_decoder-fzg4nYZr.wasm` plus wrapper scripts, **174.42 kB**) load only
  with that route's model and are outside the JavaScript import closure.

Build identifiers: entry `index-DduP7327.js`, app `entry-app-CRovsRz7.js`,
shared Three.js `vendor-three-D1iinxLJ.js`. The shared Three.js headroom
against the 350 kB cap has narrowed from 12.66 kB (2026-07-28, 337.34 kB) to
**0.71 kB**: any further shared-chunk growth now requires a separately
reviewed budget decision before it can land.

## Runtime matrix

Frame-time evidence must come from real hardware rather than headless CI.
Record p50/p95 frame time and idle render activity for `/`, `/works` and
`/contact` using:

- WebGPU (`WebGPURenderer`) and the `WebGLBackend` software-adapter fallback;
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
check on the desktop host (DPR 1), not mobile-hardware evidence. The Phase 2
representative gate is now accepted: the physical Android resize/DPR evidence
is recorded below, while the full-route mobile frame-time matrix remains a
later Phase 6/10 delivery measurement.

## Migration runtime and memory comparison

Record `/`, `/works` and `/contact` on automatic WebGPU and the forced fallback
for each renderer milestone. Before Phase 6 acceptance the forced fallback is
the current classic WebGL2 renderer; afterwards it is
`WebGPURenderer({ forceWebGL: true })` and is labelled `WebGLBackend`.

| Milestone        | Backend | Route/state               |     p50 |     p95 | Settled draws | Resource soak      | Device/context                                                                                                  |
| ---------------- | ------- | ------------------------- | ------: | ------: | ------------: | ------------------ | --------------------------------------------------------------------------------------------------------------- |
| Phase 0 freeze   | partial | automatic and forced home |     n/a |     n/a |           n/a | owner-visible pass | `20c4d63`, desktop RTX 4060 Ti and Android DPR 2.75 WebGPU confirmed; teardown listener/timer inventory pending |
| Phase 2 accepted | pass    | representative full graph |   16.70 |   16.80 |             0 | plateau + teardown | Android `22101320G`, desktop RTX 4060 Ti, WebGPUBackend and forced WebGLBackend; resize/DPR evidence 2026-08-25 |
| Phase 6 renderer | pending | full route matrix         | pending | pending |    0 required | 20 routes          | record                                                                                                          |
| Phase 10 cutover | pass    | full route matrix         |     n/a |     n/a |    0 required | 20 routes          | `2026-08-25T09-32-03-390Z-report.json`, allPassed=true                                                          |

Resource soak tracks canvas/context count, listeners, timers, decoded assets,
textures, geometries, programs/pipelines, retained route scopes, JS heap and GPU
memory where a stable counter exists. Run five declared warm-up cycles so lazy
pipelines and bounded caches can reach their documented caps, then measure
twenty steady-state cycles. No counter may trend upward after warm-up, and root
destroy must return root-owned resources to baseline after an explicit
GC/driver-settle observation window. Exact heap values can be noisy; record raw
runs and fail repeatable trends rather than one sample.

Development builds expose `window.__jlzRuntimeSnapshot()` so soak automation
can collect the same owner-visible values as the DevPanel: separate renderer
canvas and document canvas counts, scene geometries/materials/textures,
renderer counters where Three.js exposes them, and post-pipeline targets/passes.
The renderer count is the one-canvas invariant; the document count includes the
intentional 2D cursor canvas. Browser APIs do not expose a portable
driver-level WebGPU memory counter, so that value remains explicitly unavailable
rather than being guessed.

### Phase 10 route-cycle acceptance recheck — 2026-08-25

The recorded report
[`docs/evidence/phase10-route-cycle-soak/2026-08-25T09-32-03-390Z-report.json`](evidence/phase10-route-cycle-soak/2026-08-25T09-32-03-390Z-report.json)
completed five warm-up and twenty steady-state cycles across the six SPA
routes with `allPassed: true`. It observed one persistent canvas, zero fatal
errors, no monotonic increases in the gated scene/renderer/resource series,
stable `/works` and `/contact` continuous-route frame deltas, and a settled
loop on settle-able routes. `rendererPrograms` is explicitly unavailable from
this backend and `heapUsed` is flat in headless Chromium; both remain recorded
as non-gating noisy metrics rather than being treated as invented proof.

### Historical Phase 0 renderer observation — 2026-08-15 (superseded)

The following Phase 0 entries preserve pre-cutover evidence. They describe the
then-supported classic `WebGLRenderer` auxiliary path and must not be read as
the current architecture. Current renderer behavior and acceptance evidence are
recorded in [ADR 0010](adr/0010-close-unified-renderer-decision.md),
`docs/ARCHITECTURE.md` and the Phase 10 soak report above.

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

### Historical Phase 0 hardware WebGPU observation — 2026-08-15 (superseded)

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

### Phase 2 SplashCube representative observation — 2026-08-21

The mandatory SplashCube representative gate was verified through the existing
development-only route, including the secure HTTPS proxy access path
(`https://project.6la.ru/__spikes/tres-representative`). Production code, the
visual protocol and the dependency set are unchanged by this observation.

- Automatic policy completed as `WebGPURenderer -> WebGPUBackend` with the
  `tsl-post` render path: one renderer, one canvas, no runtime, shader or
  material error, and no continuing render demand after settle.
- Forced `?backend=webgl` completed as `WebGPURenderer -> WebGLBackend` with
  the deliberate `direct-webgl-fallback` render path: one renderer, one
  canvas, no runtime, shader or material error, and the same settle and
  dispose behaviour.
- Reduced motion completed on both backend paths without continuing render
  demand.
- Unmount and scope disposal ran without residual activity; the scope releases
  the production `SplashCube` exactly once.
- A dated qualitative visual inspection (two browser screenshots captured
  through the same HTTPS proxy on 2026-08-21, one per backend path) confirms
  the representative scene is visibly rendered on both backends: the mint TSL
  torus knot, the `EnvSphere` pavilion edges and the remaining production
  owners are present on neither an empty canvas nor a broken composition. The
  forced-WebGL frame reads flatter because it deliberately skips the TSL post
  graph. These captures are dated qualitative evidence only; they are not a
  pixel-level comparison, not a reference baseline and not a pixel-diff input.

This is runtime-compatibility evidence for the SplashCube owner on both
backends (PBR material and jelly-geometry compilation, one renderer/canvas,
bounded settle and clean disposal), supplemented by qualitative visual
presence on both backends. It contains no pixel-level visual comparison: at
the time of that run the referenced screenshot/diff tooling did not exist yet.
The tooling landed later the same day and the pixel-level visual parity gate
was closed by the "Phase 2 Vue/Tres visual parity observation — 2026-08-21"
recorded below, which includes the SplashCube scope. No frame-time,
resource-plateau or real-mobile measurement was made in this observation.

### Phase 2 desktop loop-driver pacing observation — 2026-08-21

The selected bounded `setAnimationLoop` driver was measured on the remote
desktop host through the secure HTTPS proxy at
`https://project.6la.ru/__spikes/tres-loop?driver=renderer-loop`: Chrome
151.0.7922.137 (Linux x86_64), 1267×1297 CSS viewport, DPR 1, NVIDIA Lovelace
non-fallback WebGPU adapter, 60 Hz display.

| Backend path                            | Windows (fresh mounts) | Burst ticks | Idle ticks | p50      | p95      |
| --------------------------------------- | ---------------------- | ----------: | ---------: | -------- | -------- |
| `WebGPUBackend -> tsl-post`             | 3                      |     90 each |          0 | 16.70 ms | 16.80 ms |
| `WebGLBackend -> direct-webgl-fallback` | 3                      |     90 each |          0 | 16.70 ms | 16.80 ms |

The median and worst p95 are 16.80 ms for each backend. The worst p95 is 0.10
ms above the frozen 16.7 ms desktop target; the host's single refresh quantum
is 16.67 ms, and every median/p95 delta is a single-quantum frame. That frozen
target was calibrated on the higher-refresh reference host of 2026-07-28, so on
this 60 Hz host the numeric delta is a refresh-quantization artifact rather
than pacing degradation. The target text is not changed by this observation;
the 60 Hz host delta is recorded here as a budget-review note.

One controlled hidden-tab run per backend used a real visibility change
(opening a second tab): the burst froze at frame 4 (WebGPU) and frame 11
(WebGL) with `visibilityState: hidden` and zero additional frames after two
seconds hidden; re-activating the tab let each burst complete at exactly 90
draws, 90 ticks and zero idle ticks, with median/p95 unchanged. All runs
reported zero console errors (only the known dev-only Vue feature-flags
warning).

### Phase 2 Vue/Tres resource plateau + root teardown observation — 2026-08-21

The Vue/Tres representative scope (full scope: TSL torus-knot mesh, EnvSphere,
ParticleBurst, production SplashCube, Works case texture, Contact stage, and
one TSL post pipeline on the WebGPU path) was measured on the remote desktop
host through the secure HTTPS proxy at
`https://project.6la.ru/__spikes/tres-resource`: Chrome 151.0.7922.137 (Linux
x86_64), 1267×1297 CSS viewport, DPR 1, NVIDIA Lovelace non-fallback WebGPU
adapter, motion preference normal. A development-only resource-soak probe
(`ResourceSoakProbe`) exposes three owner-visible hooks —
`window.__jlzTresSnapshot()` (resource counts), `window.__jlzTresCycle()`
(one bounded steady-state frame: owner update ticks plus one render through
the active path) and `window.__jlzTresDestroy()` (real root teardown: Vue app
unmount running the same dispose path as unmount navigation, releasing the
probe-owned renderer). The hooks are removed with the probe.

Per backend the runner recorded one post-load snapshot, one unmeasured
warm-up cycle, five measured steady-state cycles, and the root teardown:

| Counter (owner-visible) | WebGPU after warm-up, all 5 steady-state samples | WebGL after warm-up, all 5 steady-state samples |
| ----------------------- | ------------------------------------------------ | ----------------------------------------------- |
| Canvases                | 1                                                | 1                                               |
| Scene objects           | 17                                               | 17                                              |
| Scene geometries        | 12                                               | 12                                              |
| Scene materials         | 12                                               | 12                                              |
| Scene textures          | 1                                                | 1                                               |
| Renderer geometries     | 12                                               | 12                                              |
| Renderer textures       | 16                                               | 3                                               |
| TSL post pipeline       | 1                                                | 0 (deliberate direct fallback)                  |

All five steady-state samples were identical on every resource counter for
both backends: the scope plateaus after the declared warm-up with zero growth
across cycles. The declared bounded caches are one Works case texture, one
Contact stage model, one node material and one TSL post pipeline (WebGPU
path); the WebGL path renders the identical scene without the WebGPU-only post
graph. `renderer.info.render.frameCalls` grew by exactly one frame per cycle
on the WebGPU path (15→19) and by two per cycle on the WebGL path (4→12):
bounded render demand, one render pass per cycle per path.
`renderer.info.programs` is not exposed by the r185 WebGPURenderer info
surface on either backend and is recorded as null rather than estimated.

Root teardown (`window.__jlzTresDestroy()` on each backend): canvases fell
from 1 to 0, all scene counters to 0, renderer geometries and textures to 0,
the post pipeline to 0, and `info.render.frameCalls` to 0; the development
hooks were removed with the probe. A 500 ms post-teardown read of the
retained (disposed) renderer reference showed `frameCalls` unchanged (delta
0): no render demand survives the root teardown. Every run reported zero
console errors (only the known dev-only Vue feature-flags warnings). The
single-canvas invariant holds: the Vue/Tres representative scope owns exactly
one canvas, in contrast to the legacy runtime's two (main plus the secondary
WebGL environment renderer).

This observation is limited to the development representative scope on the
remote desktop host; it makes no production-route or real-mobile claim.

### Phase 2 Vue/Tres visual parity observation — 2026-08-21

The pixel-level visual-parity comparison for the Vue/Tres representative
scope was executed against commit `6f02896` on the remote desktop host
(Chrome 151.0.7922.137, Linux x86_64, pinned 1267×1297 CSS viewport, DPR 1,
NVIDIA Lovelace non-fallback WebGPU adapter, 60 Hz, motion preference normal)
through the secure HTTPS proxy, without production code or dependency changes:

- tooling: `scripts/visual-parity.ts` now provides the repository
  screenshot/diff tool referenced by the protocol — a raw-CDP capture of the
  probe canvas (fresh tab, pinned device metrics, `[data-status]` ready wait,
  deterministic in-page state, bounding-box screenshot with a per-frame
  metadata sidecar) plus a per-pixel diff (L2 distance of the sRGB channels
  normalized to [0,1]; exceed when delta > 0.1; pass when at most 0.5% of
  unmasked pixels exceed);
- reference-frame naming convention (machine-readable, all artifacts under
  `docs/evidence/visual-parity/`): frames
  `<commit7>-<scope>-<backend>-<cycles>c-<utc:YYYYMMDDTHHMMZ>.png` (each with
  a `.png.meta.json` sidecar), diff
  `<commit7>-<scope>-<backendA>-vs-<backendB>-<cycles>c-<utc>-diff.png`,
  plus `<diff base>-report.json` and `<diff base>-mask.png`;
- state: both backend paths (automatic `WebGPUBackend` and forced
  `WebGLBackend`) were captured at an identical deterministic state — fresh
  mount, `ready`, then exactly 30 owner-driven `update(1/60)` cycles
  (`rendererFrameCalls` 60 per path, symmetric). The probe scene has no
  internal timers or wall-clock reads, so equal cycle counts are equal scene
  state. The capture used the development-only `?parity=1` mode, which skips
  the WebGPU-only TSL post pipeline on the WebGPU path so that both backends
  render the identical scene graph directly; the post graph is an intentional
  backend-conditional enhancement (its parameters are render state) and is
  covered separately by the qualitative two-backend SplashCube evidence of
  2026-08-21.

Measured result (800×450 canvas surface, 360000 pixels, no approved masks —
no temporal grain, cursor or video is present in the probe scene): 1070
pixels (0.297%) exceed the 0.1 perceptual threshold — within the 0.5%
budget; mean delta 0.00093, maximum delta 0.967. The stored difference map
confining the excess to anti-aliased silhouettes of the TSL torus knot and a
small area of the Contact GLTF model: this is backend rasterisation
difference, not a composition difference. Stored artifacts (frames,
metadata, diff, mask overlay, JSON report with `pass: true`):

- `docs/evidence/visual-parity/6f02896-representative-scope-webgpu-c030-20260821T0610Z.png` (+ sidecar)
- `docs/evidence/visual-parity/6f02896-representative-scope-webgl-c030-20260821T0610Z.png` (+ sidecar)
- `docs/evidence/visual-parity/6f02896-representative-scope-webgpu-vs-webgl-c030-20260821T0610Z-diff.png`
- `docs/evidence/visual-parity/6f02896-representative-scope-webgpu-vs-webgl-c030-20260821T0610Z-mask.png`
- `docs/evidence/visual-parity/6f02896-representative-scope-webgpu-vs-webgl-c030-20260821T0610Z-report.json`

Scope limits: this is a same-state two-backend parity measurement of the
representative development scope on the desktop host. It makes no legacy-parity
claim (no legacy reference frames exist in this convention) and no
reduced-motion or real-mobile visual claim.

### Phase 2 Vue/Tres desktop dynamic resize/DPR event observation — 2026-08-21

The dynamic resize event path of the Vue/Tres representative scope was
observed on the remote desktop host (Chrome 151.0.7922.137, Linux x86_64,
NVIDIA Lovelace non-fallback WebGPU adapter, 60 Hz, motion preference normal)
at `https://project.6la.ru/__spikes/tres-resource` (automatic
`WebGPUBackend -> tsl-post`), dev tree of commit `6f02896`, without production
code or dependency changes. Real OS window resizes were driven through CDP
`Browser.setWindowBounds` (original bounds recorded and restored exactly),
plus one page-level DPR emulation step. The probe exposes a development-only
resize-event counter (each size-watcher fire runs `ContactCyprusStage.resize`
plus `postPipeline.resize()` plus one re-render); `renderer.info.render.frameCalls`
is per-frame in three r185 (reset by every render) and is therefore not used
as a render counter at rest.

| Step                                    | CSS viewport | DPR | Canvas CSS × backing | Resize events (cumulative) |
| --------------------------------------- | ------------ | --- | -------------------- | -------------------------- |
| B0 baseline                             | 1172×1297    | 1   | 800×450              | 0                          |
| B1 shrink                               | 620×670      | 1   | 620×402              | 2                          |
| B2 grow                                 | 1004×750     | 1   | 800×450              | 4                          |
| B3 DPR emulated 2× (no CSS size change) | 1024×860     | 2   | 800×450              | 4 (unchanged)              |
| B4 window restored                      | 1172×1297    | 1   | 800×450              | 4 (unchanged)              |

Every actual CSS size change fired the size watcher (two events per resize —
width phase and height phase — because the clamped section
`min(800px, 100vw) × min(450px, 60vh)` changed in both dimensions), and every
event re-rendered once through the active path. The emulated-DPR step changed
`window.devicePixelRatio` to 2 without a CSS size change, so no event fired
and the backing size stayed 800×450: Tres sizing follows CSS layout and the
capped `dpr: [1, 2]` prop is applied at setup/resize. Restoring the window
after the grow fired no extra events (the section CSS size was already
800×450): the path is demand-driven. All owner-visible resource counters
(1 canvas, 17 scene objects, 12 geometries, 12 materials, 1 texture, 12
renderer geometries, 16 renderer textures, 1 post pipeline) were identical
across B0–B4, zero console errors occurred, and the probe stayed `ready`
throughout.

Scope limits: this is desktop evidence for the resize-event path; it makes no
real-mobile claim. The physical-mobile resize/DPR gate delta (real device
resize events and physical DPR) was owner-deferred on 2026-08-21 pending the
device; mount-time physical DPR (renderer pixel ratio 2.00 on the Android
device `22101320G`) was already admitted by the 2026-08-15 physical mobile
slice.

### Historical Phase 0 physical mobile WebGPU observation — 2026-08-15 (superseded)

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

### Visual evidence status

The protocol above is the source of truth for visual gates: the metric (at
most 0.5% of pixels above a 0.1 perceptual threshold outside approved masks)
and the evidence storage rule are fixed here and are not re-decided per phase.
Current factual state:

- the referenced repository screenshot/diff tooling exists as
  `scripts/visual-parity.ts` (landed 2026-08-21): raw-CDP canvas capture with
  per-frame metadata sidecars, and a per-pixel diff implementing the protocol
  metric (threshold 0.1, budget 0.5% of unmasked pixels) with diff/mask/report
  output;
- the reference-frame naming convention is fixed as a machine-readable scheme:
  frames `<commit7>-<scope>-<backend>-<cycles>c-<utc:YYYYMMDDTHHMMZ>.png`,
  diff `<commit7>-<scope>-<backendA>-vs-<backendB>-<cycles>c-<utc>-diff.png`,
  siblings `<diff base>-report.json` and `<diff base>-mask.png`; all artifacts
  live under `docs/evidence/visual-parity/`; the benchmark record fields
  (commit, build hash, browser, device, backend, adapter class, viewport, DPR,
  power state and motion preference) are carried in the per-frame sidecar;
- the first Phase 2 representative-scope comparison was recorded on
  2026-08-21 (see the dated observation above) and passed the protocol metric,
  so the Phase 2 two-backend visual-parity gate is closed; future slices
  reuse the same tool and naming convention.

The threshold and storage rule above have been the source of truth all along;
what was missing on 2026-08-21 (tooling and naming convention) is now in
place, so the protocol is executable end-to-end.

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

### Phase 2 physical mobile resize/DPR gate — 2026-08-25

The current `tres-vue-dev` build was served from pct104 through an SSH + ADB
USB tunnel to the physical Android 14 device Xiaomi `22101320G`. Chrome
reported a 392×766 CSS viewport at DPR 2.75 and a real `WebGPUBackend`.
DevTools device metrics then changed the same mobile page to 360×740 at DPR
2.5 and restored 392×766 at DPR 2.75. Both changes fired the resize listener,
updated the renderer backing canvas, and marked the demand scheduler with
`lastInvalidation: resize`; the loop returned to settled idle after each
change. Scene and renderer resource counters were identical before, during
and after the two changes, and no JS or renderer errors were observed.

This closes the physical mobile resize/DPR event delta when combined with the
desktop resize evidence above. The machine-readable report is
`docs/evidence/mobile-resize-gate/2026-08-25T13-20-00Z-report.json`.
