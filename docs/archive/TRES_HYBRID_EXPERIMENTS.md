# Bounded TresJS hybrid experiments

Historical experiment record: the decisions and queues below describe their
dated revisions, not current instructions. Use [NEXT](../NEXT.md) for work and
[transition status](TRES_FULL_TRANSITION.md) for current ownership/evidence.

Status: limited hybrid path. Audited and first production slice admitted
2026-09-07. Implementation proceeds one bounded outcome at a time.

## Iteration 1 result — 2026-09-07

Completed: Manifesto root teardown now invalidates and disposes its lazy owner.
`Experience.manifestoStage.test.ts` holds its dynamic import through root
teardown and proves that the late module neither constructs nor attaches a
stage; it also proves live-stage disposal.

Completed: `TresLoop.contract.test.ts` mounts the real installed 5.8.3 manager
with a controlled renderer. It proves that manual `advance()` and on-demand
`invalidate()` do not draw after the internal RAF is stopped, and that
`useLoop` callbacks continue during an active manual RAF without a pending
draw. This agrees with the inspected installed implementation and ADR 0004.
Stop B integration here: no measured runtime bottleneck justifies introducing
the required custom clock/recovery bridge. The production scheduler remains
the one loop driver.

## Iteration 2 decision — 2026-09-07

The first EnvSky assessment stopped the primitive-adapter route: it would have
reparented the imperative EnvSphere owner or added a lifecycle protocol larger
than the removed mesh constructor. A later real Tres spike established a
smaller safe boundary instead. `EnvSphere(false)` retains its palette material
and the five rounded pavilion faces; `EnvSky.vue` declares only the exclusive
sky mesh and `PlaneGeometry`. The material remains borrowed and is disposed by
EnvSphere, never by Tres. `SceneHost` waits for the declared leaf before it
publishes the host bridge, so the first successful world frame is complete.

C is superseded by upstream `88542de`: `Experience/LazyStage.ts` already
centralizes the requested lazy-stage contract for all five route-owned stages
without a second registry. This iteration hardened it further: dynamic-import
factories receive the request guard and return null before class construction
when retired. The deferred Manifesto regression now proves no late stage or
TSL graph is constructed or attached. This preserves the plan's intended
disposal and generation semantics while retaining the upstream flat owner
fields and existing UI/coordinator ports.

## Iteration 3 result — 2026-09-07

Completed: `CinematicLights` is the first production declarative static
subtree. `SceneHost` mounts five built-in light nodes through
`app/scene/CinematicLights.vue` and publishes their typed references through
the existing one-shot host bridge. The imperative `CinematicLights` class is
retained solely as the section-preset, interpolation and reduced-motion
controller. When it adopts host nodes it never detaches or disposes them;
Tres/Vue removes the subtree at host teardown.

This preserves one canvas, one unified renderer, one Tres scene and the
existing `RenderScheduler`/`renderer.setAnimationLoop` owner. It introduces no
new event, registry, renderer, loop or fallback path. The rollback is one
bounded slice: remove the component and optional adopted-node parameter, then
restore the controller's local group construction.

Completed: `GroundPlane` is the second production declarative static subtree.
`SceneHost` owns its one `Mesh`, `PlaneGeometry` and `MeshStandardMaterial`
through `app/scene/GroundPlane.vue`; `GroundPlane` retains only material-state,
theme and section-visibility control. Its adopted-node disposal path leaves
Tres/Vue as the exclusive graph and GPU-resource owner. The same host bridge
and lifecycle generation protect readiness; no render-demand or loop behavior
changes.

## Iteration 4 decision — 2026-09-07

Completed: `EnvSky` is the third production declarative static leaf. Its
focused lifecycle test proves Tres removes the mesh/geometry without disposing
the borrowed palette material. `EnvSphere` owns that material's terminal
disposal and remains the controller for palette interpolation and
reduced-motion settlement. Physical WebGLBackend and hardware WebGPUBackend
gates passed with the same 15 geometry / 29 material scene inventory, one
canvas and zero settled draws.

`EnvSphereOwner.lifecycle.test.ts` mounts the two owners together under the
real Tres canvas and proves the teardown split directly: Tres disposes the sky
geometry, EnvSphere disposes its material exactly once, and neither node stays
attached to the scene.

Stop before any further EnvSphere migration: its five rounded pavilion faces
still combine `RoundedBoxGeometry` with palette-owned materials. Moving them
would transfer their material and resource-disposal contract across the
controller boundary without a measured benefit. `ServicesStage` and
`WorksInstallation` are also rejected: their topology is coupled to active
camera-local or project-driven animation and TSL NodeMaterials. No fourth
exclusive static subtree was found in the audited owners.

Continue condition: profile or introduce a new exclusive built-in subtree with
a smaller ownership boundary. Do not migrate an existing animated/TSL owner
merely to increase declarative coverage.

Result: continue the limited hybrid path only where a subtree is exclusive,
static in topology and has a smaller ownership boundary than its imperative
equivalent. The scheduler bridge remains stopped without measured benefit.

## Iteration 5 decision — 2026-09-08

The pointer-ink stage audit confirms shared lifecycle mechanics but distinct
rendering contracts. `ContactHaloStage` and `ManifestoInkStage` use different
plane dimensions, TSL subgraphs, palette defaults, damping constants and
reduced-motion artwork. Extracting a base class or factory would centralize
boilerplate while leaving each material, geometry and disposal owner separate;
it would therefore increase abstraction without improving Tres ownership or
runtime behavior. Keep both owners local until a third stage or measured
maintenance/runtime cost justifies a new boundary.

The legacy `Section` objects were a separate confirmed cleanup. Their
StateBus transition data remains useful to `SceneCoordinator`, but they had no
renderable children after `SectionGroups` adoption. The scene/GPU shell was
removed, leaving a plain route-state owner; physical WebGLBackend and hardware
WebGPUBackend gates still report one canvas, settled zero demand and clean
teardown: `docs/evidence/phase7-live-gate/2026-09-07T20-57-19-008Z-report.json`
and `docs/evidence/phase7-live-gate/2026-09-07T20-58-50-811Z-report.json`.

The subsequent opacity-channel removal also passed the 20-cycle WebGL route
soak and the hardware WebGPU live gate:
`docs/evidence/phase10-route-cycle-soak/2026-09-07T21-00-03-653Z-report.json`
and `docs/evidence/phase7-live-gate/2026-09-07T21-04-16-394Z-report.json`.

The remaining `Section` StateBus channels are intentionally retained as a
private transition boundary. They have no renderable or route consumers, but
their completion events synchronize the coordinator's READY/VIEWING/PASSED
state machine. Replacing them would introduce a second animation engine with
no measured Tres or runtime benefit.

The case-study status audit found no publication gate or runtime consumer;
`CaseStudyView` owns the editorial disclosure text directly. The dead status
field was removed from the shared contract and data records without changing
route state or published markup.

The production-only adapter audit found no further removable Tres boundary.
`three-webgpu-compat.ts` remains required by the installed Tres runtime,
`WebGPUPostPipeline` remains reachable through `RenderPipeline`, and the
SceneHost/lazy-stage/route-transition modules all have live consumers.

## Validation baseline — 2026-09-07

This slice passed TypeScript, Vue type checks, ESLint with zero errors,
formatting, build, build budgets and all 109 unit-test files / 707 tests. The
serial browser gate previously ran with 17 passed and 1 skipped, but six unrelated
baseline assertions failed: its expected direct Commissioner preload, DOM work
cards and 44px controls do not match the current shell. This hybrid slice does
not touch those assets, views or Less rules. The mismatch is recorded in
NEXT.md as a separate UI/test decision. Physical WebGPU and forced-WebGL
visual/resource evidence remains a required hardware gate; it is not replaced
by headless tests.

Current runtime evidence: the live gate passed on 2026-09-07 against the
automatic `WebGLBackend` fallback at one canvas, with the settled scheduler
stopped, all demand flags clear, timing captured and root teardown free of
fatal errors. See
[`2026-09-07T01-33-15-181Z-report.json`](evidence/phase7-live-gate/2026-09-07T01-33-15-181Z-report.json).

The native hardware-Chrome path also passed on 2026-09-07 with
`WebGPUBackend`, `isFallbackAdapter=false`, one canvas, 12 post render targets,
one pass, zero settled-loop activity and clean reduced-motion/root teardown.
See
[`2026-09-07T01-35-08-396Z-report.json`](evidence/phase7-live-gate/2026-09-07T01-35-08-396Z-report.json).
The forced-WebGL recovery test reached `WebGLBackend`; its context-loss action
was correctly skipped because this browser could not restore a usable WebGL
framebuffer.

The repaired 20-cycle route soak passed on 2026-09-07 against `WebGLBackend`:
one canvas, every resource cap and per-route trend within bounds, and clean
root teardown. See
[`2026-09-07T02-24-51-314Z-report.json`](evidence/phase10-route-cycle-soak/2026-09-07T02-24-51-314Z-report.json).
The runner now waits for Vue router readiness and per-route semantic markers,
then evaluates resource trends within each route rather than comparing normal
cross-route footprint changes.

## 1. Verified context

Installed matrix: Vue 3.5.41, TresJS 5.8.3, Three.js 0.185.1,
Vite 8.1.5, Vue plugin 6.0.8, TypeScript 6.0.3, Bun 1.3.14.
The broad Tres peer range is not hardware compatibility evidence.

SceneHost owns the persistent canvas, scene, camera and initial renderer
factory. Experience constructs and drives the scene owners; SceneCoordinator
reads them through live getters. The old World primitive is gone despite the
stale SceneHost header. RenderScheduler controls bounded setAnimationLoop
windows through Experience/Renderer. Tres's internal RAF is stopped.

Render demand uses a 14-flag snapshot and a distinct 10-flag ambient-breath
policy. There is no implemented activity-token acquisition API, despite prose
in ARCHITECTURE and the original ADR. The superseding section of ADR 0004
selects the current bounded driver: historical hardware evidence reported
zero idle ticks versus 60/s with Tres manual mode. This audit did not repeat
those hardware measurements.

Zero settled draws applies to genuinely inactive intervals. Normal-motion
ambient breath wakes roughly every 2.5 seconds, and visible ambient stages,
particles and playing showreel can legitimately keep frames active.

## 2. Unsafe or premature recommendations

- Treating advance() as a synchronous frame pump.
- Enabling Tres RAF alongside renderer.setAnimationLoop.
- Assuming on-demand stops RAF, or onBeforeRender means a draw occurred.
- Using default Tres rendering after replacing context.renderer.instance.
- Replacing post rendering with renderer.render(scene, camera).
- Treating EnvSphere as static or all existing materials as NodeMaterials.
- Generalizing asset caching, animation and route ownership into the registry.
- Reopening the completed migration without new measured evidence.

Installed dist/tres.js is decisive for 5.8.3: advance sets frames=1; invalidate
only accepts new work when the on-demand counter is zero. Both rely on a
separate running RAF. Manual mode schedules advance after 100 ms on setup.
Before/after hooks wrap every RAF cycle, including cycles without a draw.
Custom render is still gated by the frame counter in this implementation.
notifySuccess consumes the counter; it is not evidence of presentation.

The manager closes over its original renderer for default rendering, size,
DPR and other property watchers, and disposal. Assigning the public instance
does not rebind those closures. useLoop also obtains a renderer snapshot via
useTres. The current stopped-loop architecture limits the default-render
hazard; size/DPR after replacement still needs a real-manager regression test.
Idempotent renderer disposal already exists in unifiedRenderer and must stay.

## 3. What Tres adds

Declarative attachment and removal for small exclusive subtrees, inspectable
composition, typed component inputs and Vue lifetime integration. It does not
automatically improve GPU frame time, shader compilation, asset cancellation,
resource sharing, backend recovery or demand policy. A primitive wrapping an
existing owner proves attachment integration, not declarative migration.

## 4. Where imperative control remains preferable

Keep WorksPlaneStage, WorksInstallation, BakuCarousel, CasePlane, SplashCube,
ContactCyprusStage, ServicesStage, JunniParticles and WebGPUPostPipeline
imperative initially. They contain finite animation, instancing, TSL state,
texture ownership, camera-local layout, decode races or renderer-bound graphs.
Keep ManifestoInkStage and EnvSphere animation/state logic imperative too.
Never put per-frame vectors, uniforms or Three graphs in deep reactive state.

## 5. Minimal StageRegistry contract

One framework-neutral StageRegistry<TStages> instance belongs to Experience.
It is not a scene graph, global service, event bus or asset cache.

- get<K>(key: K): TStages[K] | null — the current published ready instance.
- ensure<K>(key: K): Promise<TStages[K] | null> — coalesced initialization;
  null means the request was retired before publication; real failures reject.
- release<K>(key: K): void — retire the generation, detach and dispose its owner.
- dispose(): void — terminally close all entries, including pending loads.

Typed definitions supply create(): Promise<T>, attach(T): void and
dispose(T): void. A factory owns partial construction cleanup until it returns
T; the registry owns a returned instance, including stale results and attach
failure. Attach initializes the latest route/theme/motion/size/camera state,
then publishes and raises existing typed demand. Do not capture those inputs
before awaiting a load. Failure clears the current pending entry for retry;
an older finally/catch must not clear a newer entry.

The first registry supports one ephemeral key, contactHalo. No generic update,
resize, scene, priority, retain/cache, resource-refcount or event API. Existing
ExperienceUI methods and coordinator getters forward to this one source of
identity; they must not retain duplicate mutable stage fields. Dynamic imports
cannot be physically aborted: generation invalidation is mandatory. Factories
that later adopt decoders must also own their partial results and cancellation.

## 6. Experiment A: declarative static subtree

Status: completed in `611b95e` (2026-09-07).

Target: only EnvSphere's pavilion-sky mesh geometry/attachment. This is a
static leaf within a moving palette owner, not a rewrite of EnvSphere.

Proposed files:

- src/app/scene/EnvSky.vue (new).
- src/app/SceneHost.vue.
- src/Experience/World/EnvSphere.ts.
- src/**tests**/EnvSky.lifecycle.test.ts (new).
- src/**tests**/EnvSphere.motion.test.ts; SceneHost.lifecycle.test.ts.

Minimal slice completed: replace only creation/add/removal of the sky mesh and
its PlaneGeometry(140, 96). Position, renderOrder=-1001, culling, existing
material class and palette writes are unchanged. `EnvSphereOwner` publishes an
`EnvSphere(false)` instance; the existing SceneHost one-shot bridge waits for
the child after that owner becomes available. No primitive parent adapter,
second registry or acknowledgement protocol was added.

Ownership: EnvSky/Tres owns the exclusive mesh attachment and declared
geometry; EnvSphere retains sole ownership of the borrowed material and all
palette state. Borrowed resources use dispose=null and are never declared as
new material constructors. No shared geometry/material traversal disposal.
Verify real Tres node removal as well as full root teardown. Root teardown is
synchronous after the scheduler has stopped; `EnvSky` owns no material
disposal, and `EnvSphereOwner` performs the one terminal material disposal.

Backend: same live renderer, factory, direct WebGL and WebGPU post paths.
No material modernization in the same diff. Reduced motion and demand stay
in EnvSphere/Experience; add no useLoop callback. After Vue attachment/update,
raise the existing dirty demand once through the typed port, because Tres's
own invalidation cannot wake the stopped project driver. First app readiness
must await the declared leaf's attachment before its successful world frame.

Tests: geometry/material ownership, theme transition, live reduced motion,
first-frame completeness and backend visual baseline. GPU counts/draws match
the original leaf. Roll back the entire A slice with `611b95e`. Expected gain
is evidence and clearer composition; runtime gain is not claimed. Remaining
risk is limited to cross-owner mount/unmount ordering.

Run the first spike outside the production entry graph. If admitted, replace
the old construction branch; do not ship permanent dual implementations.

## 7. Experiment B: RenderScheduler to Tres advance bridge

Start with src/**tests**/TresLoop.contract.test.ts (new), using real installed
Tres with a controlled fake renderer/RAF. Do not mock the methods being tested.
This characterization is valuable even if no application integration follows.

Compare manual+advance with on-demand+invalidate:

| Property                               | Manual                         | On-demand                         |
| -------------------------------------- | ------------------------------ | --------------------------------- |
| Request                                | advance sets one pending frame | invalidate adds work only at zero |
| Executes synchronously                 | no                             | no                                |
| Needs Tres RAF running                 | yes                            | yes                               |
| Stops idle RAF automatically in 5.8.3  | no                             | no                                |
| Implicit invalidation                  | startup delayed advance        | props/attachment/resize           |
| Match to explicit project frame policy | closer                         | weaker                            |

Manual is closer semantically, but neither is a drop-in driver replacement.
With current setAnimationLoop retained, calling advance yields either no draw
(Tres stopped) or two drivers (Tres running). That variant is rejected.

Only if characterization justifies proceeding, an isolated integration slice
would touch src/app/scene/TresDemandBridge.vue (new), src/app/sceneHost.ts,
src/app/SceneHost.vue, src/Experience/Experience.ts and
src/Experience/Renderer.ts. RenderScheduler's policy remains unchanged; its
LoopDriver is supplied by the adapter. No Vue/Tres imports enter core.

The alternate adapter must become the sole clock: setLoop(callback) stores the
scheduler callback and starts Tres; setLoop(null) clears it and stops Tres.
In the one Tres before-loop hook, advance arms this cycle; custom render invokes
the stored scheduler callback with a compatible monotonic timestamp. That
callback still calls Experience.update and its existing pipeline exactly once.
It can stop the driver when settled. Do not update scene state in both hooks.
Do not call renderer.setAnimationLoop in this variant, including recovery.

Custom takeover must call notifySuccess exactly once after a completed cycle,
including an intentional no-draw skip, but never falsely publish application
first-render readiness on skip/error/recovery. Existing update() swallows errors
and Renderer.update() may skip during recovery, so an explicit internal outcome
(drawn/skipped/failed) is needed before this integration can be trusted.

This changes clock integration and recovery coupling: it is not a tiny
advance() substitution. The saved renderer callback recovery path must be
disabled for this adapter and resume through the same typed recovery demand.
Use the live Renderer wrapper; never the useLoop renderer snapshot or Tres's
default render closure after replacement. Retained manager size/DPR closures
are a separate blocker if they touch a disposed renderer; stop rather than
patch node_modules, proxy the renderer or remount the canvas.

Reduced motion: preserve synchronous settlement and verify final presented
pixels, pending 100 ms advance, hidden-tab resume and repeated motion toggles.
Demand: zero settled RAF callbacks and draws; no extra startup or recovery draw.
Disposal: remove hook registrations, clear callbacks, stop loop before owners;
never dispose the renderer from the bridge. Component remount must not retain
old custom render callbacks. Backend recovery, showreel scene selection and
tone-mapping restoration remain mandatory.

Tests: real Tres counter/hooks/timeout semantics; scheduler, SceneHost,
renderer recovery and post lifecycle suites; live hardware frame timing.
Rollback: keep the production scheduler unchanged if characterization fails;
otherwise revert the isolated B integration slice. Expected runtime benefit is
unproven; integration risk is high. No production B cutover without measurable
benefit and all existing contracts passing.

## 8. Experiment C: one lazy stage

Files: src/core/StageRegistry.ts (new), src/Experience/Experience.ts,
src/**tests**/StageRegistry.test.ts (new),
src/**tests**/Experience.contactHalo.test.ts (new), and existing
ExperienceUI.lifecycle.test.ts / ContactHaloStage.lifecycle.test.ts.

Replace only the contactHalo field/promise/request lifecycle triplet and its
ensure/dispose implementations. Keep ExperienceUI's existing ports and the
coordinator's live getter. Registry definitions remain in Experience, keeping
the stage implementation behind its existing dynamic import. No eager import
barrel. Existing caseTexture and Lab manifest remain untouched.

Experience owns the registry, the registry owns the stage lifecycle, and the
stage owns its material/geometry according to its existing contract. Before
final renderer teardown, terminally close the registry. Stale success disposes
its returned stage without attachment or demand; stale failure cannot damage
the replacement. Check any module-shared geometry separately; the registry is
not its implicit owner.

Attach samples current theme/reduced motion/route and raises one existing dirty
demand only after successful publication. No new frame clock or backend work;
stage rendering keeps the current WebGPU/direct WebGL paths. Reduced-motion
state must be correct on first visible frame even if changed during import.

Test concurrent ensure, release during import, enter/leave/enter, stale success,
stale rejection, construction/attach failure, retry, terminal destroy and exact
resource release. Run twenty route cycles. Roll back only the C slice.
Expected gain: one tested race policy and fewer duplicated lifecycle branches.
Risk: low-to-medium for Halo; do not generalize to Works/GLTF/retained Lab yet.

## 9. Success and rollback metrics

Hard gates: one canvas, one live renderer, one scene-loop driver; retired
renderers never used; no GPU/shader/runtime errors; unchanged fallback policy;
no duplicate resource disposal; no route/event/semantic DOM changes.

In controlled settled intervals require zero scene draws and zero owner-loop
callbacks. Record ambient-breath frames separately; test normal visible
animations separately rather than declaring them idle. Test reduced-motion
zero-draw settlement and final pixels. Count actual render calls, not only
scheduler frame counters or notifySuccess.

Compare at least three identical warmed runs per backend/device for startup,
first visible stage, frame p50/p95 and counts. Proposed experiment stop threshold:
repeatable p95 increase over 5% or 1 ms (whichever is larger), or startup over
5%; this is a proposed comparison rule, not a measured existing budget. Existing
build budgets remain hard gates. No unexplained monotonic resource growth over
twenty cycles; root teardown returns exclusive resources to baseline, with
declared shared resources accounted separately.

## 10. Test expansion and audit evidence

Focused baseline: 17 files / 122 tests passed on 2026-09-07, covering
renderScheduler, renderDemand, SceneHost lifecycle, sceneHostBridge,
Experience lifecycle/works/contactTypography/lab/motion, WorksPlaneStage,
WorksInstallation, EnvSphere, SplashCube, WebGPUPostPipeline,
Renderer.deviceLossLifecycle, rendererBackend and unifiedRenderer lifecycle.
No new hardware, build-budget or full release evidence was gathered.

SceneHost.lifecycle currently mocks Tres, so extend coverage with the real
manager before making RAF, disposal or replacement claims. Extend
scripts/phase7-live-gate.ts, scripts/phase10-route-cycle-soak.ts and
tests/e2e.spec.ts for the selected slice; retain splash Enter before screenshots.
Also extend SceneCoordinator.motionParity, Experience.rendererRecovery and
RenderPipeline lifecycle coverage where those boundaries change. Use both
type checks, focused unit tests, build budgets, and the full development release
gate before admitting a milestone. Physical WebGPU plus forced WebGL evidence
is mandatory for rendering changes; headless tests are not a substitute.

Resolved follow-up: `Experience.destroy()` calls
`disposeManifestoInkStage`; `Experience.manifestoStage.test.ts` holds the
dynamic import through root teardown and proves the late owner is neither
constructed nor attached. `LazyStage` passes the generation guard into its
factory, so this protection happens before TSL/GPU resource construction.

Other findings: SceneHost and renderDemand comments describe removed primitive
and continuous-loop behavior; ServicesStage disposal authority is described
and invoked in both Experience and SceneCoordinator, although Experience nulls
the field before coordinator teardown, avoiding a double call on that path.
Do not call this a confirmed double-dispose bug. Renderer replacement watcher
behavior and reduced-motion final-pixel presentation need integration tests.

## 11. Forbidden first-slice changes

No dependency/version upgrades, second canvas/renderer/loop/event bus, generic
resource registry, caching policy, all-owner conversion, shader modernization,
compute, MRT, HMR work, backend-policy changes, pipeline rewrite, route-state
rewrite, or public DOM changes. No mass cleanup or obsolete fallback revival.
Do not mix A, B and C in one implementation diff. No permanent experiment flags.

## 12. Recommendation and three short iterations

Recommendation: limited hybrid path. Preserve the production scheduler.

1. Completed: lifecycle baseline and B0. Manifesto teardown is guarded by a
   deferred-import regression; B remains stopped.
2. Completed: the lazy-stage lifecycle goal is met by the existing `LazyStage`
   core, with no duplicate registry.
3. Completed: static cinematic lights are the first admitted declarative
   subtree. Continue only after physical WebGPU and forced-WebGL evidence; stop
   if lifecycle, visual or demand metrics regress.

Next-model handoff: read AGENTS.md, this document and current sources; inspect
git status. Do not treat later iterations as permission to batch a migration.
Report changed owners, tests actually run, missing hardware evidence and a
stop/continue result. Keep pending outcomes in NEXT.md and remove completed
ones there.

Primary API references (read alongside installed declarations/implementation):

- https://docs.tresjs.org/api/composables/use-loop
- https://docs.tresjs.org/api/composables/use-tres-context
- https://docs.tresjs.org/api/components/tres-canvas
- https://docs.tresjs.org/api/advanced/primitives

Historical local evidence: [ADR 0004](adr/0004-preserve-demand-rendering.md)
and [completed migration](archive/MIGRATION_VUE_TRES.md).
