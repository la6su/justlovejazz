# Full Vue/Tres transition

Status: active by product direction, 2026-09-07.

The completed Phase 5–10 migration remains historical context. This document
governs the subsequent transition of remaining scene composition from
imperative owners into Vue/Tres components.

## Invariants

- One persistent `TresCanvas`, one `WebGPURenderer`, one scene and one
  `RenderScheduler` driver remain until the installed Tres 5.8.3 loop contract
  is replaced by stronger measured evidence.
- Vue owns attachment and teardown of declarative resources. A controller may
  update declared Three objects, but may not dispose or reparent them.
- TSL graphs, decoded assets and route-local animation state remain shallow and
  non-reactive at the Vue boundary.
- WebGPUBackend and WebGLBackend stay separate verified paths. The fallback is
  not classic `WebGLRenderer` and does not claim post-processing parity.
- Every slice preserves reduced-motion settlement, typed event-bus contracts,
  route state and zero settled draws.

## Sequence

1. **Viewport boundary** — one application viewport port fans out to camera,
   renderer and live owners. The initial slice is complete: `Sizes` is the only
   window resize listener; `Experience` fans updates to the adopted camera and
   renderer. Next, source that port from the Tres context only after a real
   resize/DPR/recovery gate.
2. **Camera component** — retain the `Camera` controller but declare camera
   construction and static configuration in a dedicated scene component.
   Remove rollback construction only after the component survives renderer
   recovery, resize and root teardown.
3. **Section composition** — move stable groups and static geometry into small
   route-neutral components. Each component must own all of its geometry and
   material resources; no borrowed-material primitive adapters.
4. **Animated owners** — migrate `SplashCube`, particles, carousel and route
   stages only after their lifecycle controls become explicit component inputs.
   No `useLoop` callbacks while the project scheduler owns animation frames.
5. **Renderer and post boundary** — retain the existing renderer wrapper until
   a supported Tres mechanism proves renderer replacement, TSL post rendering,
   device-loss recovery and zero-idle demand behavior on both backends.
6. **Experience retirement** — remove it only after it contains no scene graph
   construction, no lazy-stage identity, no input ownership and no render
   demand policy. Replace one port at a time; do not create a second registry
   or event bus.

## Admission gate for every slice

- Type-check, focused lifecycle tests, full unit suite and production build.
- Physical WebGPUBackend and forced WebGLBackend: visual parity, resize/DPR,
  reduced motion, route cycles and root teardown.
- One canvas, one renderer and one animation-loop driver; no duplicate Three
  runtime or leaked DOM/GPU resource.
- A one-commit rollback point with the prior owner still recoverable.

## Current checkpoint

The viewport fan-out slice has removed the `Camera` and `Renderer` window
resize listeners. `Sizes` publishes one captured viewport snapshot, then
`Experience` synchronizes camera, renderer and active scene owners from that
snapshot. The live gate passed on 2026-09-07 for automatic `WebGLBackend` and
hardware `WebGPUBackend`, including reduced motion, a stopped settled loop,
one canvas and root teardown. Evidence:
`docs/evidence/phase7-live-gate/2026-09-07T14-24-33-825Z-report.json` and
`docs/evidence/phase7-live-gate/2026-09-07T14-25-21-688Z-report.json`.

The camera-component slice is complete. `CinematicCamera.vue` declares the
physical `PerspectiveCamera`, promotes it through Tres's active-camera port,
and hands that same instance to the existing `Camera` controller. The
component test verifies its scene attachment, active status and release on
root teardown. The subsequent physical gate passed for both backends; current
evidence is `docs/evidence/phase7-live-gate/2026-09-07T14-30-19-899Z-report.json`
for WebGLBackend and
`docs/evidence/phase7-live-gate/2026-09-07T14-30-56-995Z-report.json` for
hardware WebGPUBackend.
The renderer and scheduler boundary is unchanged.

The section-root integration gate also passed on 2026-09-07 for automatic
WebGLBackend and hardware WebGPUBackend, including reduced motion, settled
zero-demand and root teardown. Evidence:
`docs/evidence/phase7-live-gate/2026-09-07T14-47-54-134Z-report.json` and
`docs/evidence/phase7-live-gate/2026-09-07T14-48-28-737Z-report.json`.

The 20-cycle route/resource soak passed on WebGLBackend after this integration:
one canvas, bounded scene and renderer resources, stable route frame deltas and
clean root teardown. Evidence:
`docs/evidence/phase10-route-cycle-soak/2026-09-07T14-58-16-759Z-report.json`.

The static-owner review now has a stop/continue decision. `ServicesStage`,
`ParticleBurst` and `SplashCube` all combine animated state with NodeMaterial,
TSL or CPU deformation and explicit disposal. They remain imperative until a
separate lifecycle adapter is measured and tested; the declarative path
continues only for owners with static construction and no private animation or
GPU ownership contract.

The restored orbital-ring composition passed physical WebGLBackend and
hardware WebGPUBackend gates on 2026-09-07, including reduced motion and idle
settlement. Evidence:
`docs/evidence/phase7-live-gate/2026-09-07T19-18-24-949Z-report.json` and
`docs/evidence/phase7-live-gate/2026-09-07T19-19-03-349Z-report.json`.

The EnvSphere bridge exposed and fixed an entry-host forwarding omission that
would have constructed duplicate adopted owners. The corrected physical gates
record the expected single-owner inventory on WebGLBackend and hardware
WebGPUBackend: `docs/evidence/phase7-live-gate/2026-09-07T20-14-02-129Z-report.json`
and `docs/evidence/phase7-live-gate/2026-09-07T20-14-40-284Z-report.json`.

The next static leaf is the pavilion sky. `EnvSky.vue` owns its plane geometry
and mesh through Tres, while `EnvSphere` retains the borrowed basic material,
palette interpolation and terminal disposal. The native `EnvSphere()` default
still constructs its sky for the non-Tres fallback. This remains a narrow
composition change: it neither changes render-loop ownership nor adds an
animation callback.

The EnvSky physical gate passed on 2026-09-07 for automatic WebGLBackend and
hardware WebGPUBackend, including reduced motion, one canvas, stopped settled
loop and clean root teardown. Evidence:
`docs/evidence/phase7-live-gate/2026-09-07T20-20-39-043Z-report.json` and
`docs/evidence/phase7-live-gate/2026-09-07T20-21-17-402Z-report.json`.
