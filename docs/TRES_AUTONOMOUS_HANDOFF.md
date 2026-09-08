# Vue/Tres implementation handoff

Status: Works iterations 1–3, Services geometry, EnvSphere attachment, and
Contact/Manifesto lazy Tres attachment implemented; physical backend admission
remains pending, audited 2026-09-08.
This is the execution queue for the remaining scene-composition transition.
It supersedes the static-only admission restriction in
`POST_MIGRATION_AUTONOMY_PLAN.md`. Historical evidence is not verification of
future changes. The user explicitly deferred WebGL device-loss testing; that
single test must not block unrelated composition work.

## Objective and completion boundary

Move scene construction, attachment and terminal resource ownership into
Vue/Tres components incrementally. Keep imperative controllers for authored
motion, input, TSL graphs and renderer recovery where appropriate. A wrapper
around an unchanged imperative constructor is an intermediate lifecycle step,
not completed declarative composition. Do not rename that state as completion.

Keep one persistent canvas, scene, WebGPURenderer and RenderScheduler loop.
Keep typed routePage/eventBus/renderDemand, synchronous reduced-motion
settlement, explicit resource ownership and the existing fallback policy.
Full completion requires an owner-by-owner ledger with migrated or explicitly
justified retained responsibility, removal of replaced construction paths,
and evidence for all admitted changes. Completing Works alone does not prove
the entire transition complete. Retiring Experience is conditional on removing
its responsibilities, not a prerequisite name-change exercise.

## Verified baseline and corrections

- Installed: Vue 3.5.41, Tres 5.8.3, Three 0.185.1, Vue Router 5.2.0,
  Vite 8.1.5, Vue plugin 6.0.8, TypeScript 6.0.3. No upgrade is planned.
- Camera, lights, ground and section roots have declarative construction.
- EnvSky declares mesh/geometry but borrows EnvSphere's material.
- ServicesStage retains its imperative motion controller, while Vue/Tres now
  declares its seven parts and three orbital rings; EnvSphereOwner remains an
  explicit retained owner whose attachment is now declarative through
  `primitive`; its pavilion geometry/material construction remains imperative.
- ContactHaloStage and ManifestoInkStage retain their TSL graphs and disposal
  owners, while async `LazyStage` attachment now waits for the Tres primitive
  mount before configuration.
- WorksPlaneStage constructs WorksInstallation inside init after textures
  resolve; both modules currently have static imports. Resource-lazy creation
  is present; module-lazy loading is not established for these two modules.
- WorksInstallation inherits its camera-local coordinates from WorksPlaneStage.
  Keeping the same parent preserves those coordinates; a second transform
  owner is not inherently necessary.
- Existing WorksInstallation test covers project shapes and empty children
  after disposal. It does not establish exactly-once GPU disposal or Vue
  mount/unmount correctness.
- Experience.worksStage.test.ts still seeds a body dataset. Replace this
  fixture with the typed route port when touching it; do not treat it as proof
  that production reads DOM route state.
- Prior statements that no remaining slice is possible, or that documentation
  commits completed the implementation, were unsupported. No Works Vue
  migration was implemented by the last planning commits.
- TresLoop.contract.test.ts characterizes the installed loop. Keep the
  scheduler; manual advance and on-demand invalidate are not synchronous
  replacements for a stopped internal loop. Reassess only in a separate
  measured renderer/clock task, including custom render notifySuccess.

## Start each execution

Read AGENTS.md, the tresjs skill, this file, relevant source/tests and NEXT.md.
Inspect git status and fetch origin before choosing a branch. Never overwrite
unrelated work or blindly pull a changed branch. Check whether PR #206 is still
open; after merge, start a scoped branch from current main. Revalidate versions.
Use the existing sceneHost bridge and LazyStage core; do not add a registry,
event bus or route store. Track a real implementation goal if explicitly asked;
never add an escape clause that makes writing a plan equal implementation.

## Iteration 1: prove the parent/disposal seam

Files: new `src/__tests__/WorksInstallation.tres.test.ts`, existing
`WorksInstallation.lifecycle.test.ts`, `WorksPlaneStage.lifecycle.test.ts`,
`Experience.worksStage.test.ts`; production entry graph unchanged.

1. Mount an actual TresCanvas test using the fake renderer pattern from
   EnvSky.lifecycle.test.ts. Mount an existing parent Group as a primitive,
   then an existing WorksInstallation child. Characterize installed Tres
   attachment, object identity and dispose suppression; do not guess its API.
2. Compare world matrices with the imperative parent/child baseline after
   camera-like parent position/quaternion/scale and installation local pose.
   Include a remount and replacement; assert no duplicate parent/child.
3. Spy on every unique geometry, the two shared materials and InstancedMesh
   disposal. Prove which unmount destroys which resource, with controller
   disposal exactly once. Prove a disposed owner cannot resume animation.
4. Cover async route exit before textures resolve, return/retry, init failure
   and root destroy. Remove the stale dataset fixture in the touched test.

Continue when parent transform and cleanup behavior are demonstrated. A failed
spike requires a smaller reproduction and revised implementation, not a claim
that Vue ownership is impossible. Commit the passing characterization alone.

### Iteration 1 result — 2026-09-08

Completed in `WorksInstallation.tres.test.ts`. Installed Tres 5.8.3 attaches
the primitive stage once, preserves the installation's inherited camera-local
matrix, and permits remounting the same identity after root teardown. Its
primitive unmount does not dispose child geometries, shared materials or the
instanced buffer; `WorksInstallation.dispose()` releases each exactly once.
`Experience.worksStage.test.ts` now uses the typed `routePage` fixture rather
than a retired body dataset. Focused Works tests, TypeScript and Vue type
checks pass. Iteration 2 may now move attachment through the existing host
bridge; it must not assume that Tres will dispose the controller resources.

## Iteration 2: integrate lazy Works attachment

Files: `src/app/SceneHost.vue`, `src/app/sceneHost.ts`,
`src/Experience/Experience.ts`, `src/Experience/World/WorksPlaneStage.ts`,
new `src/app/scene/WorksStageOwner.vue`, and bridge/Works lifecycle tests.
Update entry-app host forwarding only if SceneHostReady changes.

Use one shallow slot in the existing host bridge for the active Works stage.
Experience remains the sole request identity owner through LazyStage; it
publishes/clears that slot. The Vue component mounts the same stage object
under Tres with automatic recursive disposal disabled as verified in iteration

1. Remove the competing Experience scene.add/remove path for that stage.
   Initially installation stays its existing child, retaining camera-local space.
   This step transfers stage attachment, not geometry construction.

Make attachment awaitable at the existing LazyStage boundary if required:
configure/readiness must not run before Vue commits the parent. Extend the
existing attach contract rather than creating a parallel manager. Recheck the
request generation after every await. Clear old slots by identity so stale
completion cannot clear a replacement. On exit/root destroy, stop controller
updates synchronously, detach through Vue, then release owned resources;
verify unmount ordering rather than relying on hook names. Keep the disposal
path idempotent and cover host-first as well as runtime-first teardown.

Required lifecycle order: request -> publish -> Vue mount acknowledgment ->
load/configure -> render invalidation. Cancel at every asynchronous boundary.
No GPU resources before Works activation. Wake the existing render demand once
after the committed visual change; never start useLoop or a new RAF.

Continue only when rapid Works/home/Works, failed loading and root teardown
pass and both actual backends render correctly. Revert the slice if it adds
duplicate attachment, resources, idle draws or stale route activation.

### Iteration 2 result — 2026-09-08

Completed with `WorksStageOwner.vue`, the existing `SceneHostReady` bridge and
the Works lazy-stage contract. Vue/Tres now attaches and detaches the same
lazy `WorksPlaneStage` instance through a shallow object boundary; Experience
no longer adds or removes that stage from the scene directly. The controller
still constructs cards and the installation only after `/works` activation,
and remains its only TSL, texture, motion and GPU-disposal owner. Component,
bridge and rapid-disposal lifecycle coverage passes locally. Physical Works
backend and route-soak evidence is still required before milestone admission.

## Iteration 3: declarative WorksInstallation composition

Files: new `src/app/scene/WorksInstallation.vue`, WorksStageOwner.vue,
WorksInstallation.ts, WorksPlaneStage.ts, their tests and ownership ledger.

Declare the installation root/assembly, three torus arcs, trace and instanced
ticks below the SAME Works stage parent. Preserve dimensions, initial poses,
48 instance matrices, two shared material identities and current draw count.
Pass typed node references to the controller; replace child-index discovery
with explicit arcs/trace/ticks references. Remove superseded new Mesh/geometry
construction and controller detach/clear for adopted nodes in the same slice.

Keep the current TSL materials initially with one explicit owner and prove
that Tres does not dispose borrowed shared resources. Tres owns declared
geometry; the controller owns motion state. After this passes, transfer
material creation/disposal to the component in a separate commit if needed;
never allow both owners to dispose the same material or instanced buffers.
Do not change project art direction, palette or shader graphs in this slice.

Test unchanged camera-relative matrices at wide/portrait sizes, all project
modes, theme changes, synchronous reduced-motion snapping, normal settlement,
late init cancellation, exactly-once disposal and resource plateau. Record
before/after construction owners; a primitive-only wrapper is not the final
result. Each integrated slice has a single-commit rollback, not a permanent
runtime fallback flag.

### Iteration 3 result — 2026-09-08

Completed locally with `WorksInstallation.vue`. The installation is now a
controller, while Vue/Tres declares its assembly, three arcs, trace and
48-instance tick scale below the Vue-mounted Works stage. The component
explicitly prevents Tres from disposing borrowed NodeMaterials, disposes its
own geometries and instance buffer on unmount, and leaves the two materials to
the controller exactly once. A nested primitive spike exposed a Three proxy
violation, so the declared assembly is directly nested under the stage rather
than introducing a second `Object3D` primitive. Focused lifecycle coverage,
the full unit suite, type checks, production build, budgets and serial browser
suite pass locally. Physical Works WebGPU/forced-WebGL visual, route-cycle and
reduced-motion evidence remains pending and must be collected before final
admission.

## Remaining owner queue after Works

Create one bounded task per owner; do not promise all are static or trivial.

| Order | Owner/files                                             | Responsibility to extract                                            | Required specific evidence                                           |
| ----- | ------------------------------------------------------- | -------------------------------------------------------------------- | -------------------------------------------------------------------- |
| 1     | ServicesStage + ServicesStageOwner                      | Declared assembly and orbit geometry; retain motion controller       | Ring composition, shared NodeMaterials, theme/motion/disposal        |
| 2     | EnvSphere + EnvSphereOwner + EnvSky                     | Remaining pavilion meshes/geometry; unify palette-material ownership | RoundedBox topology, all palettes, shared material teardown          |
| 3     | ContactHaloStage, ManifestoInkStage, ContactCyprusStage | One lazy component boundary at a time                                | Font/assets cancellation, section state, late completion             |
| 4     | CasePlane, BakuCarousel                                 | Mesh construction and lazy media scope                               | Texture cache refs, pointer/overlay, project transitions             |
| 5     | SplashCube, ParticleBurst, DrawTrail, JunniParticles    | Explicit node inputs and component lifetime                          | CPU deformation/instances, pointer activity, zero-demand settling    |
| 6     | SectionGroups, SceneCoordinator, Experience             | Remove replaced construction and lifecycle paths                     | Canonical slots, route config, coordinator references, root teardown |

### Retained-owner audit — 2026-09-08

- `ContactCyprusStage` remains imperative: its Draco/GLTF load, material
  replacement, camera-local normalization and prewarm form one asset owner.
- `CasePlane` and `BakuCarousel` remain imperative: per-instance TSL uniforms,
  shared geometry, texture retain/release, pointer drag and momentum are one
  coupled controller boundary.
- `SplashCube` remains imperative: WebGPU physical transmission graph, opener
  state and explicit cube/root disposal cannot be split without a second
  material owner.
- `ParticleBurst`, `DrawTrail` and `JunniParticles` remain imperative: their
  instancing or CPU deformation is advanced by the existing scheduler and each
  owns mutable buffers/materials that require deterministic teardown.
- Manual WebGPU route checks for `/contact` and `/manifesto` passed after the
  async Tres attachment slice. Forced-WebGL and automated route-soak evidence
  remain separate release gates.

For each owner, append actual files, before/after owner matrix, tests, commit
and backend evidence to TRES_FULL_TRANSITION.md. Renderer, post pipeline and
Sizes remain separate decision items: retain while they own required recovery,
post rendering and viewport fan-out. Their retention is not missing scene
composition work, and deleting their names is not success.

## Verification and delivery

Focused commands (use actual filenames once added):

```bash
bun run test:unit src/__tests__/WorksInstallation.lifecycle.test.ts src/__tests__/WorksPlaneStage.lifecycle.test.ts src/__tests__/Experience.worksStage.test.ts
bun run type-check:vue
bun run type-check
```

Before an integrated milestone:

```bash
bun run format:check
bun run lint
bun run type-check
bun run type-check:vue
bun run test:unit
bun run build
bun run budget:build
bun run test:serial
git diff --check
```

Run the dev server, then use scripts/phase7-live-gate.ts and
scripts/phase10-route-cycle-soak.ts with JLZ_DEV_BASE. The live gate currently
primarily exercises home: extend or supplement it to enter Works through
the typed navigation facade, pass the splash Enter control and visit all four
rooms. Do not cite a home screenshot as Works validation. Run hardware WebGPU
and forced WebGL separately, record actual backend, viewport/DPR, normal and
reduced motion, idle frame delta, route resource plateau and root teardown.
Use the existing force-webgl-backend development query. Read each script's
environment options before invoking it; don't invent flags.

WebGL device-loss restoration is DEFERRED BY USER, never PASS. Other backend
visual/lifecycle tests remain required. If hardware is unavailable, continue
independent characterization and mark integration evidence pending; do not
report full migration completion or silently waive unrelated tests.

Commit scoped tested changes, push the non-default branch and verify CI for
that exact SHA. Update NEXT.md and this checkpoint in the same implementation
change. Do not commit repeated planning-only updates as progress on code.

## Copyable prompt for the implementation model

Read docs/TRES_AUTONOMOUS_HANDOFF.md and execute iteration 1, then iterations
2 and 3 autonomously, one tested commit at a time. WebGL device-loss testing
is deferred by the user. Preserve all other runtime contracts. Start with
the actual worktree and remote state. Do not stop at proposing a seam: prove
it with the installed Tres runtime and implement it. Do not substitute a
documentation commit for implementation, claim that TSL or lazy loading makes
migration impossible without a failing reproduction, or mark the full goal
complete after one slice. Report completed code, exact tests and remaining
evidence honestly. Continue independent work when a hardware gate is pending.
