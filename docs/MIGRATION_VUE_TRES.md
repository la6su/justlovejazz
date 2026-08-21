# Vue and TresJS migration

This document is the executable plan for moving the whole JUSTLOVEJAZZ
codebase to Vue 3, Vue Router and TresJS while preserving the product and
runtime contracts that already work. Architecture describes the system,
ADRs record why decisions were made, and `NEXT.md` names the currently active
outcomes.

The migration is incremental. Every phase must leave a runnable application,
have an explicit acceptance gate and remain reversible without undoing later
unrelated work.

## Goal

The target system has:

- Vue 3 as the application and component platform for the public site and the
  development-only Page Builder;
- Vue Router as the sole public navigation, history, hash and route-metadata
  owner;
- one persistent TresJS scene root and one Three.js `WebGPURenderer`;
- `WebGPUBackend` when hardware WebGPU is usable and `WebGLBackend` when it is
  not, including an explicit `forceWebGL` QA path;
- TSL NodeMaterials and one TSL post-processing graph on `WebGPUBackend`;
  on Three r185 `RenderPipeline` is WebGPU-only, so the forced `WebGLBackend`
  QA path renders the identical node-material scene directly until the open
  Phase 6 decision (version-gated TSL post or retained bounded GLSL fallback)
  selects the target post owner;
- one demand-driven render scheduler and one renderer-loop driver;
- semantic, prerendered route content above an `aria-hidden` canvas;
- bounded route resource scopes with deterministic cancellation and disposal;
- no production dependency on legacy string templates, the manual router,
  classic `WebGLRenderer`, GLSL `ShaderMaterial` post passes or the raw DOM
  event bridge.

Migration is complete only when the legacy paths have no production callers,
the two-backend and accessibility matrices pass, performance stays within the
agreed budgets and the documentation describes the shipped system rather than
the transition.

## Current and target topology

```text
Current
index.html splash
  -> entry-shell.ts
  -> entry-app.ts
     -> manual router + string templates + UIkit.update
     -> Experience -> Renderer + World + UI classes
        -> WebGPURenderer/WebGPUBackend
        -> classic WebGLRenderer fallback

Target
index.html inline splash
  -> tiny shell
  -> lazy Vue application
     -> AppShell.vue
        -> Vue Router -> lazy semantic route components
        -> UIkit Vue adapters
        -> persistent SceneHost.vue
           -> TresCanvas
              -> RendererFactory -> one WebGPURenderer
              -> Tres manual loop adapter -> one renderer-loop driver
              -> RenderScheduler -> invalidate/activity -> advance()
              -> UnifiedTSLPipeline
              -> WorldRoot -> six slots + lazy route scopes
```

The splash remains outside the Vue mount and outside the initial Vue, TresJS,
Three.js and UIkit dependency graphs. The scene root outlives route components;
navigation never recreates the canvas, renderer, shared scene or shared world.

## Non-negotiable contracts

1. `index.html` paints the splash before application dependencies load.
2. Enter is enabled only after the renderer and initial scene are ready;
   initialization failure remains visible and retryable.
3. The canonical world tuple remains `lab`, `intro`, `about`, `works`,
   `contact`, `menu`. Route identity and slot identity are separate types.
4. `EnvSphere` owns the ambient background. The contact state owns the ground.
5. The renderer backend, DPR and feature tier are derived after async renderer
   initialization, not from `navigator.gpu` alone.
6. One renderer-loop driver exists. The selected target is a bounded
   `renderer.setAnimationLoop` driver, which runs only while dirty or active
   and stops at settled idle/hidden tab. Tres's internal loop is stopped when
   that driver owns rendering. No scene subsystem starts its own loop.
7. Settled idle performs no draw calls. Reduced motion reaches the same final
   state synchronously and releases every activity token.
8. Vue owns DOM structure. UIkit owns only the behavior of wrapped UIkit
   components. Scene code does not query route state from the DOM.
9. The canvas is decorative and `aria-hidden`; readable content, headings,
   navigation and actions remain semantic DOM.
10. Every listener, timer, async load, DOM node and GPU allocation has one
    documented owner and one terminal cleanup path.
11. An async resource that resolves after its scope closes is disposed rather
    than attached.
12. The public build never imports `admin/` or its editor state.

## Target ownership

```text
src/
  app/                 Vue bootstrap, AppShell, providers and router
  domain/              framework-neutral route, slot and preference contracts
  features/            public feature components and controllers
  scene/
    renderer/           renderer factory and backend inspection adapter
    scheduler/          invalidation and bounded frame activities
    post/               backend-independent TSL post graph
    world/              persistent slots and route-owned scene scopes
    resources/          cancellation, cache and disposal policies
    legacy/             temporary migration adapters only
  ui/
    uikit/              lifecycle-safe Vue wrappers
    primitives/         project-owned semantic UI components
  builder/              framework-neutral schema, validation and compiler
admin/                  Vue Page Builder application; development-only
```

Dependency rules:

- `domain/` imports no Vue, TresJS, Three.js or browser globals;
- UI components never retain or dispose Three.js objects;
- scene owners never create, remove or query semantic DOM;
- route, locale, theme, reduced-motion and story state enter the scene through
  typed readonly ports;
- scene output is expressed as typed intents such as `openProject`, `navigate`
  and `runtimeFailed`;
- use of unstable Three.js backend fields and compatibility casts is confined
  to one renderer adapter;
- temporary adapters live under `legacy/`, name their consumers and carry a
  removal phase.

## Core target designs

### Route manifest

One typed route manifest supplies Vue Router records, lazy components,
metadata and i18n keys, menu links, SSG routes, sitemap entries, route-scene
loaders and initial hash/story state. Route components do not duplicate route
IDs or metadata tables.

### Bootstrap state machine

```text
shell-painted
  -> app-loading
  -> renderer-initializing
  -> scene-prewarming
  -> ready
  -> entered

any initialization state -> failed -> retry
```

Reduced motion may shorten transitions but cannot skip states. Only `ready`
enables Enter. A retry creates a fresh bounded renderer attempt and cannot
reuse a partially initialized candidate.

### Renderer factory

The target renderer algorithm is:

1. Create `WebGPURenderer`; use `forceWebGL: true` for the forced QA route.
2. Await initialization.
3. Inspect the actual backend and classify the adapter as `hardware`,
   `software` or `unknown` through one compatibility adapter.
4. If WebGPU resolved to a software adapter, dispose the candidate and create
   a new `WebGPURenderer({ forceWebGL: true })`.
5. Inspect the forced fallback too; if neither attempt meets the measured
   minimum tier, enter the explicit degraded or failed state.
6. Freeze `RuntimeCapabilities` from actual backend, adapter class, tier,
   limits and DPR.
7. Attach one TSL post graph and expose a readiness latch to the Tres adapter;
   do not equate synchronous renderer-factory return with initialized backend.
8. On unrecoverable initialization failure, publish `failed` and keep the
   splash closed.
9. On device loss, allow one controlled rebuild before publishing failure.

The final system has no classic `WebGLRenderer`, `WebGLNodesHandler`, GLSL
post-processing chain or feature behavior selected before actual backend
initialization.

### Render scheduler

The scheduler API is intentionally independent of Vue reactivity:

```ts
invalidate(reason): void
beginActivity(reason): () => void
registerFrameTask(owner, update): () => void
pause(): void
resume(): void
dispose(): void
```

Activity reasons are a typed union. Owners receive and release tokens instead
of mutating a shared boolean. The scheduler updates registered active tasks and
requests a frame only while dirty or active. Hidden tabs pause advancement;
resume causes one invalidation. Diagnostics expose active reasons, p50/p95
active-burst frame time, loop ticks, draw count and settled idle state.

After Phase 7, the scheduler targets the one renderer-loop integration admitted
by the Phase 2 gate. The leading candidate, a bounded `setAnimationLoop` port,
would start for dirty/active work, stop after the settled frame and remain
stopped while hidden. Before that cutover, the current Experience loop remains
the one driver. Phase 7 stops Tres's internal loop and replaces the Experience
driver atomically rather than running two drivers during compatibility.

### Scene and resource scopes

`WorldRoot` persists for the application lifetime. The six slot containers are
stable; route-specific layers mount into explicit scopes with:

- an `AbortController` or generation token;
- listener and timer teardown;
- a registry of GPU disposables;
- a cache policy of `ephemeral`, `bounded-cache` or `shared-refcounted`;
- an invalidation after successful attachment;
- immediate disposal of late async results.

Existing owners first enter TresJS through explicit primitives. A primitive is
not considered migrated until its creation, frame work and disposal have a
single new owner. Automatic disposal is used only for resources actually
created declaratively by TresJS.

### Vue and UIkit

Vue owns route DOM and application state. UIkit behavior is isolated in small
wrappers that initialize after `nextTick` and destroy on unmount. Global
`UIkit.update()` is not used as a permanent reconciliation strategy. One modal
has one focus trap; Vue and UIkit never compete for it.

Pinia is not required by default for the public application. Small providers
cover locale, theme, sound, reduced motion, readiness, story and overlay state.
The Page Builder may adopt Pinia if its history, selection and document state
benefit from the devtools and transaction boundary.

### Page Builder and content delivery

The Page Builder becomes the first complete Vue application. The schema,
validation, escaping, compiler and generated Less stay framework-neutral.
The editor uses a trusted component registry rather than arbitrary `v-html`.

Public routes and blog documents converge on a prerendered/SSG content
pipeline. Routes that do not need 3D do not hydrate `SceneHost` and do not load
TresJS or Three.js. "Whole-project migration" means one component and content
architecture, not forcing the GPU runtime onto static pages.

## Phased execution

### Phase 0 — decision record and baseline freeze

Scope:

- land this plan and the ADR set;
- capture the current build manifest, screenshots and renderer diagnostics;
- freeze current route, DOM, accessibility, resource and performance evidence;
- create the migration traceability and removal ledgers.

Candidate gate:

- the current release gate passes;
- WebGPU and forced-WebGL screenshots exist for representative routes;
- current budgets are recorded without being weakened;
- every later phase has an owner, gate and rollback point.

Rollback: documentation and evidence only; no production runtime changes.

### Phase 1 — version and toolchain scaffold

Scope:

- select and pin a compatible Vue, Vue Router, TresJS and Three.js matrix;
- prove and record the Tres manual-mode loop and `advance()` contract;
- add the Vue Vite plugin, SFC declarations, `vue-tsc`, component-test support
  and separate bundle reporting;
- add an inert development-only Vue/Tres entry with no production ownership.

Acceptance:

- existing application output and entry graph are unchanged;
- current tests and build pass;
- Vue/Tres versions and upgrade policy are recorded;
- exactly one target loop driver and async renderer-readiness handshake are
  selected for the representative spike;
- the inert entry proves TypeScript, HMR and test tooling.

Rollback: remove the isolated entry and dependency/tooling commit.

### Dependency and version policy

"Latest" means the newest stable, mutually compatible release set proven by
official Vue, TresJS and Three.js documentation and the representative spike;
it does not mean independently upgrading one renderer package past its peer
range. Phase 1 records the tested matrix and exact lockfile resolution. Renderer
stack upgrades happen in dedicated PRs with both-backend, size and soak
evidence.

Every dependency needs one named owner and a measurable job. Prefer platform,
Vue, TresJS and Three.js capabilities already in the graph. Do not add a helper
for a small local function, a second state/event system, a second asset loader
or a duplicate animation abstraction. When a package replaces project-owned
code, remove the superseded path at the same phase gate or record its exact
removal phase in the deletion ledger.

No compatibility layer is permanent by default. Its entry condition, callers,
metrics and deletion condition are recorded when it is introduced. Production
must finish with one route manifest, one renderer factory, one render scheduler,
one asset ownership policy and one implementation of each scene owner.

Registry and official-documentation discovery on 2026-08-15 produced this
Phase 1 matrix. It was installed and verified by the isolated spike; no package
is imported by the production entry graph yet:

| Package                     | Stable candidate | Admission note                                   |
| --------------------------- | ---------------: | ------------------------------------------------ |
| `vue` / `@vue/compiler-sfc` |         `3.5.41` | keep runtime and compiler exact-match            |
| `vue-router`                |          `5.2.0` | validate route and lazy-chunk contracts          |
| `@vitejs/plugin-vue`        |          `6.0.8` | compatible with the current Vite 8 line          |
| `@tresjs/core`              |          `5.8.3` | official WebGPU API remains experimental         |
| `@tresjs/cientos`           |          `5.8.1` | optional; add only with a measured helper        |
| `three`                     |        `0.185.1` | validate all TSL and WebGPU imports in the spike |
| `@types/three`              |        `0.185.4` | keep declarations aligned with Three             |
| `vue-tsc`                   |         `3.3.10` | Phase 1 SFC type gate                            |
| `@vue/test-utils`           |         `2.4.11` | component tests on existing jsdom environment    |
| `@vue/server-renderer`      |         `3.5.41` | exact Vue match; prerender without scene runtime |

`@tresjs/post-processing` and Pinia are intentionally absent. The project owns
a unified TSL post graph and does not yet need a second application store.
Official TresJS 5.8.3 documentation enables WebGPU through a custom
`TresCanvas` renderer factory; therefore renderer creation, initialization,
software-adapter handling and forced-WebGL QA remain project-owned contracts.
The first spike runs on the current Bun `1.3.14`, Node `24.16.0`, TypeScript
`6.0.3` and Vite `8.1.5`; Phase 1 records the final peer ranges and exact
lockfile resolution before production code imports the stack.

The spike adds `@vitejs/plugin-vue`, `vue-tsc`, `@vue/test-utils` and one
inert SFC/router/Tres probe under `src/spikes/vue/`. Its unit test proves SFC
transform, Vue reactivity, Router memory history and Tres module resolution;
`bun run type-check:vue` is the SFC type gate. The production build does not
import the probe, Vue, Router or Tres. After the Three `0.185.1` upgrade, the
lazy Three chunk measured **349.28 kB gzip** against the **350 kB** cap. This
0.72 kB headroom is a Phase 1 constraint: no additional Three/Tres helper may
enter production without replacing code or restoring budget headroom.

Installed TresJS declarations confirm that `renderMode: 'manual'` renders only
when `advance()` is called, while the `renderer` option is a synchronous factory
returning a renderer instance. The Phase 1 adapter probe therefore separates
four states: synchronous renderer creation, awaited `renderer.init()`, actual
backend/software-adapter inspection, and application-ready notification. Tres
`ready` must never be treated as proof that the WebGPU device and TSL graph are
ready. The probe is intentionally framework-neutral and is not mounted by the
production entry.

The development-only page at `/__spikes/tres-manual` also exercises the real
Tres canvas on hardware. With `render-mode="manual"`, it reached
`manual-ready`, retained one canvas and emitted two render events during mount:
the explicit `advance()` requested by the probe and Tres 5.8.3's built-in
100 ms bootstrap `advance()`. Installed Tres source also proves that its renderer
manager awaits `renderer.init()` before it emits `ready`; the application must
inspect the backend after that event instead of initializing the renderer twice.
The probe produced no Tres element-registration, HMR or runtime integration
errors after applying the official Tres template compiler options. A Vue
compile-feature warning remains in Vite's development dependency prebundle;
it is tooling noise rather than a renderer failure and no deprecated Vite
prebundle override is retained to suppress it.

The first hardware A/B made manual mode unlikely as the final driver. Its
current bootstrap `advance()` remains versioned behavior, and its internal rAF
loop retained about 60 ticks per second after render invocations settled. The
bounded `setAnimationLoop` adapter stopped at zero idle ticks. Physical
representative evidence below selects it for the future scheduler integration;
scene owners must not introduce their own `requestAnimationFrame` loops.
Application readiness remains a later latch that awaits renderer initialization,
actual-backend inspection, TSL graph readiness and the first successful frame.

### Phase 2 — representative renderer feasibility gate

This is not a rotating-box demo. The spike covers fog, a representative TSL
material, instancing and time uniforms, the existing `EnvSphere` environment
owner, the real production `SplashCube`, a real project cover texture through
the shared ref-counted cache with the existing `CasePlane`,
`ContactCyprusStage` GLTF/DRACO, the TSL post graph (admitted on
`WebGPUBackend` only; Three r185 documents `RenderPipeline` as WebGPU-only, so
the forced `WebGLBackend` path renders the identical scene directly),
reduced-motion propagation, lazy mount/unmount and software-adapter handling.

The real `SplashCube` owner was added to the representative scope on
2026-08-16. Its two-backend verification (material, geometry and
jelly-deformation compilation, one renderer/canvas, settled idle, disposal,
reduced-motion behaviour and qualitative visual presence on both backend
paths) ran on 2026-08-21; the screenshot/diff tooling landed later the same
day and the pixel-level visual parity it defines was closed by the visual
parity slice of 2026-08-21 (the SplashCube scope is included in that
comparison; the runtime run itself only claimed qualitative presence).

Acceptance:

- both `WebGPUBackend` and forced `WebGLBackend` render without the classic
  renderer;
- the chosen Tres lifecycle proves renderer initialization, actual-backend
  inspection, TSL pipeline readiness and a successful first render in order;
- fog and every representative material compile without console errors,
  including the production `SplashCube`;
- the agreed visual-difference threshold defined in `PERFORMANCE_BASELINE.md`
  ("Benchmark and visual protocol") passes for the representative scope;
- settled idle returns to zero draws;
- desktop and real-mobile p95 active-burst measurements stay within budget;
- after declared cache warm-up, repeated mount/unmount reaches a stable
  resource plateau and root destroy returns root-owned resources to baseline.

Failure response: keep the current production renderer, file the failing
contract with a reduced reproduction, redesign or upgrade the TSL/backend
adapter, and repeat this phase. Later renderer/Tres cutover phases remain
blocked; the Vue DOM migration may continue independently.

Rollback: the spike stays outside the production route graph until accepted.

#### Phase 2 factory slice — 2026-08-15

The first development-only slice now uses the same `WebGPURenderer` class for
both policies: automatic WebGPU with Three's WebGL2 fallback, and explicit
`forceWebGL` for QA. The factory remains synchronous; installed TresJS 5.8.3
owns and awaits the one async `init()` call, then the application inspects the
actual backend before advancing the manual renderer. The obsolete local
`three/webgpu` ambient declaration was removed because it shadowed the current
official Three declarations and omitted `canvas`, `forceWebGL`, `backend` and
async initialization.

The official Tres custom-renderer integration was exercised at
`/__spikes/tres-unified` in the isolated `tres-spike` Vite mode:

- headed Chrome 151 on the RTX 4060 Ti: `WebGPUBackend`, usable adapter/device,
  one canvas and no runtime/page error; adapter class remains unknown because
  Three r185 does not expose its internally requested adapter;
- forced query `?backend=webgl`: `WebGLBackend`, one canvas, two observed manual
  bootstrap/advance renders and no runtime/page error;
- headless automatic policy: unavailable/unstable headless device correctly
  selected `WebGLBackend`; this is fallback evidence, not hardware-WebGPU proof.

Three's general WebGPU guide recommends mapping both `three` and
`three/webgpu` to the WebGPU build. That mapping cannot be applied directly to
TresJS 5.8.3 because its runtime still imports classic `WebGLRenderer`, which
the WebGPU build does not export. The tested official Tres path works without
the mapping and emitted no duplicate-Three warning, so no project-owned hybrid
module or alias is introduced. This compatibility boundary must be rechecked
on every Tres/Three upgrade.

The fixed 800×450 hardware loop-driver A/B sampled 90 render invocations followed by one
second of settled idle on each backend. On `WebGPUBackend`, manual mode measured
p50/p95 **16.7/17.0 ms** with **60 idle ticks**, while the bounded renderer loop
measured **16.7/16.8 ms** with **0 idle ticks**. On forced `WebGLBackend`, manual
measured **16.7/17.1 ms** with **60 idle ticks**, and the bounded renderer loop
measured **16.7/18.5 ms** with **0 idle ticks**. All four runs completed 90 render
invocations with no runtime/page error. This one-window result makes the bounded
renderer loop a candidate because of idle behavior; it does not select it. The
representative TSL/post graph must repeat at least three equal windows per
backend and record median plus worst p95 before production cutover.

#### Phase 2 representative loop-driver selection — 2026-08-15

The loop probe was upgraded from a cube to the same fogged representative scope:
TSL material/post on WebGPU, the direct fallback on WebGLBackend, `EnvSphere`,
`ParticleBurst`, the shared Works texture and `ContactCyprusStage` GLTF/DRACO.
It replaces Tres's manual render function so manual advancement and the bounded
renderer loop can address the same resource graph without a second canvas or
loader path.

On the foreground physical Android `22101320G`, three valid 90-invocation
windows were recorded for automatic `WebGPUBackend` and three for forced
`WebGLBackend`. Every window had 90 burst ticks, zero idle ticks, p50 16.70 ms
and p95 16.80 ms. Thus the median and worst p95 are both 16.80 ms for each
backend, below the 33.3 ms mobile target. This selects the bounded
`setAnimationLoop` port for the later scheduler integration. It does not
establish desktop pacing, hidden-tab resume, dynamic resize, production-route
performance or the resource-plateau gate.

#### Phase 2 representative fog/material fallback slice — 2026-08-15

`/__spikes/tres-representative` is an isolated development route that attaches
a fogged `MeshBasicNodeMaterial` torus knot to the Tres-owned scene and releases
its mesh, geometry, material and post pipeline on unmount. The local in-app
browser selected `WebGLBackend`; the direct fallback render completed visually
with no runtime error. This narrows the prior fog concern: it is not reproduced
by this minimal node-material scene. It is fallback evidence only.

The scene resources are isolated behind a small scope with a unit-tested
teardown contract. A pure backend guard admits the WebGPU-only post pipeline
only for an actual `WebGPUBackend`; a fallback backend cannot silently enter
that path. This is lifecycle/fallback-contract evidence, not a substitute for
the physical WebGPU compilation gate.

In the automatic `WebGPUBackend` branch the same probe invokes the existing TSL
post pipeline after renderer readiness. Three r185 documents `RenderPipeline`
as WebGPU-only, so forced `WebGLBackend` deliberately uses direct rendering
instead of claiming identical TSL post support. Hardware Chrome must still
compile and render the WebGPU branch before this slice is admitted. A warning
about multiple Three instances appeared only in the in-app fallback browser;
the previously tested headed RTX factory did not emit it, so this remains a
separate reproducibility check rather than evidence of a production duplicate.

The physical Chrome extension session subsequently admitted this reduced gate
on the RTX 4060 Ti: automatic policy produced `WebGPUBackend` with `tsl-post`,
and `?backend=webgl` produced `WebGLBackend` with the deliberate direct fallback.
Both reported `complete`; neither emitted a runtime or shader error. The only
console output was the known development Vue feature-flags warning. This admits
fog plus the minimal node material/post contract, but not the remaining
environment, assets, DPR, motion, loop-benchmark or resource-soak requirements.
The Chrome command-line and `chrome://flags` state were not captured, so this
evidence applies to the user's current Chrome configuration and is not a claim
that WebGPU is enabled under every default Linux GPU configuration.

#### Phase 2 environment owner slice — 2026-08-15

The representative scope now mounts the existing `EnvSphere` rather than
recreating its rounded-pavilion geometry or section palette. Its teardown is
part of the same idempotent resource scope as the node-material mesh. Both the
automatic `WebGPUBackend -> tsl-post` path and forced `WebGLBackend -> direct`
fallback completed in physical Chrome without runtime/shader errors.

This uncovered a development-only bundling defect: Vite's dependency optimizer
pre-bundled `three`, `three/webgpu` and `RoundedBoxGeometry` independently, and
the addon then triggered Three's duplicate-instance warning. The `tres-spike`
mode now excludes these ESM entry points from optimization, preserving their
shared native `three.core.js` graph. The same physical rerun produced no new
duplicate-Three warning. This mode is dev-only; the production entry and bundle
budget remain unchanged.

#### Phase 2 instancing/time owner slice — 2026-08-15

The same scope mounts the existing `ParticleBurst`, which is an
`InstancedMesh` driven by project-owned TSL time uniforms. It is triggered and
advanced once before the representative render so the time-uniform path is part
of shader compilation, without adding a second animation loop. Its geometry and
node material are released by the scope's idempotent teardown. Physical Chrome
completed both the automatic `WebGPUBackend -> tsl-post` path and forced
`WebGLBackend -> direct` fallback with no runtime or shader error.

#### Phase 2 Works texture owner slice — 2026-08-15

The representative scope now loads the existing Ebb Vibes cover through the
shared ref-counted `caseTexture` cache and attaches the existing `CasePlane`.
It exercises the plane's map binding, TSL cloth uniforms, reveal and wobble
before rendering. The scope releases its material and its texture reference on
teardown; a late texture completion releases immediately instead of adding a
plane to a disposed scene. Physical Chrome completed the automatic WebGPU TSL
post path and forced WebGL fallback with no runtime or shader error. This is a
single texture-owner feasibility result; concurrent consumers and route-level
resource soak remain later gates.

#### Phase 2 Contact GLTF/DRACO owner slice — 2026-08-15

The representative scope now reuses `ContactCyprusStage`, the existing owner
of `/assets/gltf/cyprus_3d.glb` and its local `/assets/draco/` decoder path.
The active Tres camera is supplied through its established camera port before
the asynchronous load starts; the scope then activates and advances the stage
once before its first representative render. No second GLTF loader, decoder
configuration or material replacement path was introduced.

If the scope has already been disposed by the time loading resolves, it calls
`stage.dispose()` and declines attachment. Normal teardown likewise delegates
model geometry/material cleanup to the stage owner. This is an explicit
late-result ownership contract; a repeated mount/unmount resource plateau is
still required before Phase 2 is accepted.

Physical Chrome completed the real model on both paths: automatic
`WebGPUBackend -> tsl-post` and forced `WebGLBackend -> direct-webgl-fallback`.
Neither session emitted a runtime or shader error; the only console output was
the existing Vue development feature-flags warning. This establishes asset
feasibility, not resize/DPR, reduced-motion, timing or soak acceptance.

#### Phase 2 reduced-motion slice — 2026-08-15

The probe reads the established `motionPolicy` rather than creating a
component-local media-query owner. Its capped Tres DPR range is `[1, 2]`; size
changes are forwarded only to `ContactCyprusStage.resize`, then render the
already-owned graph once. The Vue watcher is stopped by the scope teardown.

In headed Chrome, a temporary `prefers-reduced-motion: reduce` emulation made
both automatic `WebGPUBackend -> tsl-post` and forced
`WebGLBackend -> direct-webgl-fallback` complete with the probe reporting
`reduced` and no runtime or shader error. The emulation was cleared after each
test. This proves the preference reaches the existing scene owner, but it is
not a real-device DPR/resize acceptance: the external-browser viewport override
did not alter that attached Chrome viewport. Physical mobile resize/DPR evidence
therefore remains an explicit open gate.

#### Phase 2 physical mobile DPR/fallback slice — 2026-08-15

The same complete representative route was opened through a temporary USB ADB
reverse tunnel on the physical Android device `22101320G` (1080×2400 physical
pixels, density 440). The probe reported a renderer pixel ratio of `2.00`, the
configured Tres cap, and visually completed the real GLTF/DRACO scene under
both policies: automatic `WebGPUBackend -> tsl-post` and forced
`WebGLBackend -> direct-webgl-fallback`. The temporary device port mapping was
removed after the test.

This admits initial high-DPR mobile rendering and fallback feasibility. It does
not prove a dynamic resize event, mobile frame-time budget, console cleanliness
or resource plateau; those gates remain separate.

#### Phase 2 representative lifecycle smoke soak — 2026-08-15

Headed Chrome completed five warm-up mounts followed by twenty consecutive
mount/unmount cycles of the complete representative scope, including the real
Works texture and Contact GLTF/DRACO owners. Samples after cycles 10, 15, 20
and 25 each reached `complete` on `WebGPUBackend -> tsl-post`; no runtime or
shader error occurred. This exercises the idempotent scope teardown through
actual navigation, but it is deliberately only a smoke soak: the attached
external-browser surface did not expose usable JS heap or GPU-resource counters.
Do not turn this result into a no-leak claim; a later owner-visible resource
plateau remains required for Phase 2 acceptance.

#### Phase 2 SplashCube representative verification — 2026-08-21

The mandatory SplashCube gate was verified through the existing development-only
representative route, including the secure HTTPS proxy access path
(`https://project.6la.ru/__spikes/tres-representative`), without production
code, visual-protocol or dependency changes:

- automatic policy: `WebGPURenderer -> WebGPUBackend` with the `tsl-post`
  render path, `complete`, one renderer and one canvas, no runtime, shader or
  material error, and no continuing render demand after settle;
- forced `?backend=webgl`: `WebGPURenderer -> WebGLBackend` with the
  deliberate `direct-webgl-fallback` render path, `complete`, one renderer and
  one canvas, no runtime, shader or material error, and the same settle and
  dispose behaviour;
- reduced motion was checked on both backend paths and completed without
  continuing render demand;
- unmount and disposal ran without residual activity; the scope teardown
  releases the production `SplashCube` exactly once;
- a dated qualitative visual inspection (two browser screenshots captured
  through the same HTTPS proxy on 2026-08-21, one per backend path) confirmed
  the representative scene is visibly rendered on both backends: the mint TSL
  torus knot, the `EnvSphere` pavilion edges and the remaining production
  owners are present, with no empty canvas and no broken composition. These
  captures are qualitative evidence only, not a pixel-level comparison and
  not a reference baseline.

This admits the SplashCube representative runtime compatibility: PBR material
and jelly-geometry compilation on both backends, one renderer/canvas, bounded
settle, clean disposal and qualitative visual presence on both backend paths.
It is not a pixel-level visual-parity claim by that run: the screenshot/diff
tooling landed later the same day (see the visual-parity slice below), and the
SplashCube scope is covered by the pixel-level comparison recorded there.

#### Phase 2 desktop pacing + hidden-tab resume slice — 2026-08-21

The selected bounded `setAnimationLoop` driver was paced against the
representative scope through `/__spikes/tres-loop?driver=renderer-loop` on the
remote desktop host (Chrome 151.0.7922.137 on Linux x86_64, 1267×1297 CSS
viewport, DPR 1, NVIDIA Lovelace non-fallback WebGPU adapter, 60 Hz display),
over the secure HTTPS proxy, without production code, visual-protocol or
dependency changes:

- three valid 90-invocation windows per backend, each a fresh mount: automatic
  `WebGPUBackend -> tsl-post` and forced `WebGLBackend ->
direct-webgl-fallback`. All six windows completed with 90 burst ticks, zero
  idle ticks, p50 16.70 ms and p95 16.80 ms; the median and worst p95 are both
  16.80 ms for each backend;
- hidden-tab pause/resume ran once per backend as a real visibility change
  (opening a second tab genuinely hides the spike page). The WebGPU burst froze
  at frame 4 and the WebGL burst at frame 11: after two seconds hidden,
  `visibilityState: hidden` with zero additional frames. Re-activating the tab
  let both bursts complete at exactly 90 draws, 90 ticks and zero idle ticks,
  with median/p95 unchanged;
- zero idle ticks after settle confirms the driver clears
  `renderer.setAnimationLoop` when the window settles, and the one-driver
  invariant holds (the manual-mode TresCanvas internal loop stays stopped);
- every run reported zero console errors (only the known dev-only Vue
  feature-flags warning).

The 60 Hz display's single refresh quantum is 16.67 ms; the measured
median/p95 deltas (16.70/16.80 ms) are single-quantum frames. The worst p95
(16.80 ms) sits 0.10 ms above the frozen 16.7 ms desktop target recorded in
`PERFORMANCE_BASELINE.md`: that target was calibrated on the higher-refresh
reference host of 2026-07-28 and lies below the measured vsync floor of this
60 Hz host, so no median or p95 frame exceeds one refresh quantum. The frozen
target text is unchanged; the 60 Hz host delta is recorded as a budget-review
note in `PERFORMANCE_BASELINE.md`.

This closes the desktop pacing and hidden-tab resume gate for the selected
bounded driver: vsync-locked pacing with zero idle ticks and correct
pause/resume on both backend paths. It does not establish production-route
frame-time budgets, real-mobile resize/DPR behaviour or the resource-plateau
gate.

#### Phase 2 initial-route delivery observation — 2026-08-21

The open initial-route gzip item was populated from the first clean production
build of the current dependency set (commit `6f02896`, `bun run build`,
2026-08-21), without code or dependency changes:

- the budget gate passed: splash startup 2.68 kB / 5.00 kB and shared Three.js
  349.29 kB / 350.00 kB;
- the initial route delivers **544.51 kB** of JavaScript gzip (the full import
  closure of built JS from the entry — 543.74 kB across 16 chunks — plus the
  0.77 kB inline splash script), of which 15.70 kB is the route-owned Contact
  GLTF/DRACO loader and the shared portion is 528.81 kB; the runtime-fetched
  DRACO wasm companions (174.42 kB) load only with the Contact route's model;
- the shared Three.js headroom against its 350 kB cap has narrowed to 0.71 kB,
  so further shared-chunk growth requires a separately reviewed budget
  decision.

The measurement method, build identifiers and the headroom warning are
recorded in the `PERFORMANCE_BASELINE.md` slice of the same date.

#### Phase 2 Vue/Tres resource plateau + root teardown slice — 2026-08-21

The owner-visible resource plateau and root-destroy-to-baseline gate was
measured on the Vue/Tres representative scope (full scope including the
production SplashCube, Works case texture and Contact stage) through a
development-only resource-soak probe at
`https://project.6la.ru/__spikes/tres-resource` on the remote desktop host
(Chrome 151.0.7922.137, Linux x86_64, DPR 1, NVIDIA Lovelace, 60 Hz), without
production code or dependency changes:

- per backend (`WebGPUBackend -> tsl-post` and forced
  `WebGLBackend -> direct-webgl-fallback`) the runner recorded one post-load
  snapshot, one unmeasured warm-up cycle and five measured steady-state
  cycles; every steady-state sample was identical on every owner-visible
  counter (one canvas, 17 scene objects, 12 geometries, 12 materials, 1
  texture, 12 renderer geometries, 16/3 renderer textures, one/zero TSL post
  pipeline) — the scope plateaus after the declared warm-up with zero growth;
- `info.render.frameCalls` grew by exactly one frame per cycle on the WebGPU
  path and two per cycle on the WebGL path: bounded render demand;
- root teardown (Vue app unmount running the real dispose path and releasing
  the probe-owned renderer) returned every root-owned counter to baseline on
  both backends: canvases 1→0, scene and renderer counters to 0, post
  pipeline to 0, and `frameCalls` unchanged across a 500 ms post-teardown
  read (no surviving render demand); the development hooks were removed with
  the probe;
- every run reported zero console errors (only the known dev-only Vue
  feature-flags warnings).

The declared bounded caches are one Works case texture, one Contact stage
model, one node material and one TSL post pipeline (WebGPU path). The
development probe and its `__spikes/tres-resource` route are dev-only; the
single-canvas invariant holds. The full observation, counters and the
`renderer.info.programs` null fact are recorded in the
`PERFORMANCE_BASELINE.md` slice of the same date.

#### Phase 2 visual parity slice — 2026-08-21

The pixel-level visual-parity gate for the complete representative scope was
executed on the remote desktop host (Chrome 151.0.7922.137 on Linux x86_64,
1267×1297 CSS viewport, DPR 1, NVIDIA Lovelace non-fallback adapter, 60 Hz,
motion normal) against commit `6f02896` without production code or dependency
changes:

- the referenced repository screenshot/diff tooling now exists as
  `scripts/visual-parity.ts` (raw-CDP capture of the probe canvas plus a
  per-pixel L2 sRGB delta with the protocol threshold 0.1 and the protocol
  budget of at most 0.5% of unmasked pixels);
- the reference-frame naming convention is fixed and machine-readable
  (`<commit7>-<scope>-<backend>-<cycles>c-<utc:YYYYMMDDTHHMMZ>.png`, diff and
  report siblings), and all frames, the diff image, the mask overlay and the
  JSON report are stored under `docs/evidence/visual-parity/` together with a
  per-frame metadata sidecar;
- both backend paths were captured at an identical deterministic state
  (fresh mount, `ready`, then exactly 30 owner-driven `update(1/60)` cycles —
  the probe scene has no internal timers or wall-clock reads, so equal cycle
  counts are equal scene state): automatic `WebGPUBackend` and forced
  `WebGLBackend`, both rendered directly through the identical scene graph in
  development-only `?parity=1` mode because the WebGPU-only TSL post graph is
  an intentional backend-conditional enhancement already covered by the
  qualitative two-backend evidence of 2026-08-21 (post parameters are render
  state and would differ by design);
- the measured comparison: 800×450 canvas surface, no approved masks,
  1070 of 360000 pixels (0.297%) above the 0.1 perceptual threshold — within
  the 0.5% budget; mean delta 0.00093, maximum delta 0.967; the difference
  map shows the excess confined to anti-aliased silhouettes of the torus knot
  and a small area of the Contact GLTF model, which is backend rasterisation
  difference, not a composition difference.

This closes the pixel-level visual-parity gate for the complete representative
scope, including the SplashCube runtime scope admitted on 2026-08-21, under
the frozen metric and storage rule of `PERFORMANCE_BASELINE.md`. The full
observation, artifact inventory and the parity-mode scoping note are recorded
in the `PERFORMANCE_BASELINE.md` slice of the same date. The comparison is a
same-state two-backend parity measurement; it makes no legacy-parity claim
(the legacy reference frames predate this tooling and are not part of this
gate) and no reduced-motion visual claim.

#### Phase 2 desktop dynamic resize/DPR event observation — 2026-08-21

The dynamic resize event path of the Vue/Tres representative scope was
observed on the remote desktop host (Chrome 151.0.7922.137 on Linux x86_64,
NVIDIA Lovelace non-fallback adapter, 60 Hz, motion normal, dev tree of
commit `6f02896`) at `https://project.6la.ru/__spikes/tres-resource` (automatic
`WebGPUBackend -> tsl-post`), without production code or dependency changes:

- real OS window resizes were driven through CDP `Browser.setWindowBounds`
  (the original window bounds were recorded and restored exactly): CSS
  viewport 1172×1297 → 620×670 → 1004×750 → restored 1172×1297;
- each actual CSS size change fired the probe's size watcher (development
  counter 0 → 2 → 4; two events per resize, one per changed-dimension phase),
  and every event ran the existing path: `ContactCyprusStage.resize` plus
  `postPipeline.resize()` plus exactly one re-render through the active path;
- the canvas CSS and backing size followed the clamped section
  (`min(800px, 100vw)` × `min(450px, 60vh)`): 800×450 → 620×402 → 800×450 →
  800×450, DPR 1 throughout;
- restoring the window after the grow produced no extra events (the section
  CSS size was already 800×450): the path is demand-driven and renders
  nothing it was not asked to;
- every owner-visible resource counter (1 canvas, 17 scene objects, 12
  geometries, 12 materials, 1 texture, 12 renderer geometries, 16 renderer
  textures, 1 post pipeline) was identical before, after each resize and after
  the restore; zero console errors across the run; `data-status` stayed
  `ready` throughout;
- a page-level DPR emulation (`Emulation.setDeviceMetricsOverride` with
  `deviceScaleFactor: 2`) changed `window.devicePixelRatio` to 2 but produced
  no CSS size change, so no watcher event fired and the canvas backing size
  stayed 800×450: Tres sizing follows CSS layout, and the capped
  `dpr: [1, 2]` prop is applied at setup/resize rather than from a mid-session
  emulation change. This is emulation-limited evidence, not a real-display
  DPR finding; mount-time physical DPR (renderer pixel ratio 2.00) was
  already admitted by the 2026-08-15 physical mobile slice.

This admits the desktop half of the resize-event gate: a dynamic resize event
reaches the scene owner and re-renders the already-owned graph once per event
with no resource growth and no console errors. It makes no real-mobile claim;
the remaining gate delta is physical mobile resize/DPR events, which the
owner deferred on 2026-08-21 pending the device. The full observation is
recorded in the `PERFORMANCE_BASELINE.md` slice of the same date.

#### Phase 2 open gates

The slices above admit only their stated scopes. These gates remain open and
must all pass with hardware evidence before Phase 2 is accepted:

- Dynamic resize/DPR event behaviour on real mobile hardware. The desktop
  resize-event observation of 2026-08-21 admits the desktop half and narrows
  the gate to the mobile-only delta; the owner deferred the remaining run on
  2026-08-21 pending the physical Android device.

### Phase 3 — framework-neutral contracts

Scope:

- introduce the route manifest, world-slot tuple and bootstrap state machine;
- introduce typed preferences, story and scene ports;
- introduce one typed brand-token manifest that generates UIkit/Less variables,
  CSS custom properties and the serializable scene token subset;
- implement the scheduler and route resource scopes behind legacy adapters;
- remove direct DOM route reads from scene code through those adapters.

Acceptance:

- production behavior is visually unchanged;
- pure contracts and scheduler state transitions have unit tests;
- generated UI and scene tokens match the current implementation and have no
  manually duplicated runtime values;
- current runtime can switch back to legacy adapters.

Rollback: select the legacy adapter implementation.

#### Phase 3 route manifest slice — 2026-08-21

The first framework-neutral contract of Phase 3 is the **route manifest**: a
single pure source of truth for the application's public paths.

- `src/core/routeManifest.ts` now owns the path → `PageId` mapping
  (`ROUTE_MANIFEST`), its strict (`resolveRoute`, `isRoutePath`) and lenient
  (`resolvePage`, `home` fallback) resolvers, and `MANIFEST_PAGES`. It is
  pure — no DOM, `window` or globals — so it unit-tests without a browser.
- The legacy router (`src/router.ts`) no longer re-declares the mapping. It
  resolves against the manifest: initial load uses the lenient resolver, and
  in-app navigation (history push, anchor clicks) uses the strict resolver so
  an unknown link stays a no-op rather than silently landing on `home`. This
  makes `router.ts` the legacy adapter the manifest resolves through, the
  target shape Phase 5's Vue Router will reuse.
- `src/__tests__/routeManifest.test.ts` locks the contract: every public path
  maps to its page, the manifest covers every `PageId` exactly once
  (bijection), unknown paths fail the strict lookup, and the lenient resolver
  falls back to `home`. The full unit suite is 133/133 and the production
  build emits byte-identical chunks to the pre-change build (the manifest
  inlines with no bundle impact).

Scope limits: this is a contract extraction only. Production behaviour is
unchanged, no consumer has migrated yet, and the scene code still reads route
facts from DOM datasets — that removal is a later Phase 3 slice behind these
adapters. The world-slot tuple landed later the same day (slice below); the
bootstrap state machine, typed ports, scheduler and brand-token manifest
remain open. Rollback: revert `router.ts` to its local `ROUTES` map; the
manifest is inert until consumed.

#### Phase 3 world-slot tuple slice — 2026-08-21

The second Phase 3 contract is the **canonical world-slot tuple**: the
framework-neutral readonly source of the six-slot model described in
`docs/ARCHITECTURE.md` ("Routes and world slots").

- `src/core/worldSlots.ts` owns the slot facts in stable index order: slot
  IDs (`lab`, `intro`, `about`, `works`, `contact`, `menu`), product roles,
  contiguous-fifths story ranges, DOM section anchors and SplashCube face
  rotations, plus clamped `worldSlotAt` / `worldSlotById` lookups and
  `WORLD_SLOT_IDS` / `WORLD_SLOT_COUNT`. It is pure — no DOM, Three or
  globals.
- `src/core/WorldConfig.ts` now derives the home scenes' `domSection` and
  `range` from the tuple (the home array keeps only per-section authored
  overrides), and `makeContentScenes` reuses the tuple's frame count and
  story geometry (`content-${idx}` DOM anchors stay the content-page
  namespace). The stale slot table in `src/sections/_shared/constants.ts`
  now points at the tuple instead of re-declaring the match rule.
- `SplashCube.FACE_ROTATIONS` is derived from the tuple as `readonly
number[]` — the authored values are unchanged (locked by the regression
  baseline in the tests).
- `src/__tests__/worldSlots.test.ts` locks the contract (bijection over the
  six IDs, fifths tiling 0…6/5, legacy-literal face rotations, clamped
  lookups) and both consumers (home world config, SplashCube, content-page
  scenes). Unit suite 143/143; `vue-tsc` clean.
- Runtime smoke on the live dev proxy (Chrome 151, remote desktop host):
  home and `/works` both boot with the route DOM rendered (6 sections), the
  1267×1297 scene canvas live, zero console errors; the 120×120 splash
  preview canvas is the documented intentional legacy boundary. Production
  build: net gzip delta ≈ +0.46 kB in `chunk-core` (the contract and
  lookups) and ≈ −0.22 kB where duplicated literals were removed
  (`chunk-core-world`, `entry-app`).

Scope limits: scene code still reads route facts from `document.body.dataset`
— that removal is a later Phase 3 slice behind typed ports. The `sec_*` phase
config IDs consumed by `Lights.ts` and `PostProcessingManager.ts` are a
separate phase namespace and were intentionally not touched here. Rollback:
revert the two consumers to their inline literals; the tuple is inert until
consumed.

#### Phase 3 route-page port + World consumer migration — 2026-08-21

The first removal of direct DOM route reads from scene code. The contract is
the **typed route-page port** and the first scene consumer moved onto it is
the scene root owner.

- `src/core/routePage.ts` is the single place that reads the route page from
  the DOM (`getCurrentPage`, `isCurrentPage`). It is the Phase 3 legacy
  adapter: the router still writes `document.body.dataset.page` (CSS scoping
  and legacy consumers depend on it until Phase 5); when Vue Router provides
  the page as typed state, this module switches its source and scene
  consumers stay unchanged. Reads are pull-based, so every consumer reads the
  page at exactly the moment it did when it read the dataset — the migration
  changes the source of the fact, not any timing.
- The port validates against the manifest's page set (`MANIFEST_PAGES`),
  because the dataset carries a _PageId_ (`'services'`), not a route _path_
  (`'/services'`); the strict path resolvers in `routeManifest.ts` operate on
  a different namespace. A missing attribute or a non-manifest value
  resolves to `home`, the same default the router resolves unknown input to.
- `src/core/World.ts` (the scene root owner) now reads the page through the
  port at all 22 former sites (init page key, `syncRouteVisuals`, stage
  activation, works/contact guards, Lab gamepad visibility). No other
  consumer has migrated yet: `Experience.ts`, `CinematicNav.ts`,
  `ContentReveal.ts` and `BakuCarousel.ts` are separate bounded slices, one
  owner per change.
- `src/__tests__/routePage.test.ts` locks the port semantics (plain page,
  qualified-value normalization, missing attribute, non-manifest value,
  `isCurrentPage`); the existing `World.routeVisuals.test.ts` keeps locking
  the consumer behaviour through the same dataset it now reaches via the
  port. Unit suite 149/149; `vue-tsc` clean.
- Runtime smoke on the live dev proxy (Chrome 151, remote desktop host):
  home, `/works` (full load **and** in-app SPA navigation from home through
  the menu link), `/lab` and `/contact` all boot with the scene live and
  zero console errors. Production build is size-stable (net gzip delta
  ≈ +0.07 kB).

Scope limits: `World.ts` was the only migrated consumer at this point; the
remaining scene readers still touch `document.body.dataset` and are tracked as
per-owner slices (BakuCarousel migrated the same day, slice below). The
dataset itself stays (router writer + CSS scoping) until Phase 5. Rollback:
revert `World.ts` to its dataset reads; the port is inert until consumed.

#### Phase 3 BakuCarousel consumer migration — 2026-08-21

The second per-owner migration onto the route-page port, following the
smallest reader first: `src/Experience/World/BakuCarousel.ts` now checks
`getCurrentPage() !== 'home'` at both of its former dataset sites (the
pointer-drag intercept and the control click handler) — the home-only guard
that keeps the carousel's window listeners from blocking WorkCard clicks on
content pages. 1:1 pull reads, so the guard timing is unchanged. Unit suite
149/149, `vue-tsc` clean, production build size-stable; runtime smoke on
home shows both carousel controls live and zero console errors. Rollback:
revert the two reads.

### Phase 4 — Vue Page Builder

Scope:

- migrate catalogue, outline, inspector, preview and Style workspace to SFCs;
- introduce a typed builder store and lifecycle-safe preview;
- preserve the pure builder core and dev-only save plugin.

Acceptance:

- feature parity for selection, history, editing, preview and save;
- schema round-trip and generated Less golden tests pass;
- invalid values and Less failures retain atomic rollback;
- the admin graph is absent from production `dist`.

Rollback: retain the existing admin entry until the Vue editor gate passes.

### Phase 5 — Vue public shell and router

Scope:

- mount Vue after the inline splash shell;
- introduce `AppShell` and Vue Router; consume the Phase 3 route manifest for
  the route announcer, transitions, i18n/meta providers and UIkit adapters;
- prerender the public route shell and semantic route content without loading
  the scene runtime;
- migrate semantic routes and navigation one bounded component at a time;
- keep the native `Experience` persistent behind a typed compatibility port.

Candidate gate:

- direct entry, in-app navigation, hash navigation and popstate pass;
- focus restoration and route announcement pass;
- EN/RU, theme polarity, reduced motion and all input methods pass;
- prerendered semantic route content remains available without scene startup;
- routes never recreate the native renderer.

Phase-exit acceptance: consumer search finds no production manual-router,
route-`innerHTML` or replaced string-template path, and the focused suite passes
after their cleanup commit.

Rollback: a build-time flag selects the old DOM router only through the
candidate gate. After cleanup, revert the Phase 5 switch and cleanup commits.

### Phase 6 — unified production renderer

Entry: Phase 2 is accepted.

Scope:

- move production to one `WebGPURenderer` and one TSL post graph on
  `WebGPUBackend`;
- calculate capabilities after initialization;
- **Open decision, fixed before phase-exit:** on Three r185 the TSL
  `RenderPipeline` is WebGPU-only, so the exit rule "no `ShaderMaterial` post
  pass remains" is unreachable on the forced `WebGLBackend` QA path today.
  Either version-gate a Three release that admits TSL post on `WebGLBackend`,
  or retain the bounded GLSL fallback as the explicit forced-WebGL post owner
  until that support is confirmed;
- replace the secondary PMREM/WebGL context with a renderer-native or prebaked
  environment path;
- add bounded device-loss recovery;
- pass candidate parity while the classic path remains available, switch the
  migration flag to the target, then delete the classic path in a separate
  cleanup commit within this phase.

Candidate gate:

- every public route passes automatic WebGPU and forced WebGLBackend QA;
- splash readiness, idle, performance and resource gates pass.

Phase-exit acceptance:

- no production import or construction of classic `WebGLRenderer` remains;
- the post owner matches the fixed decision: either no `ShaderMaterial` post
  pass remains, or the retained bounded GLSL fallback is the only non-TSL post
  path and is labelled the forced-WebGLBackend owner;
- consumer search and the full focused suite pass after cleanup.

Rollback: retain the old renderer only through the candidate gate. After
cleanup, rollback means reverting the Phase 6 switch and cleanup commits, not
shipping two renderer implementations indefinitely.

### Phase 7 — persistent TresCanvas and legacy world adapter

Scope:

- make `SceneHost` a persistent Tres root;
- give a custom renderer factory, camera and scene exactly one owner;
- activate the proven async renderer initialization/readiness handshake and
  replace the Experience loop with the single driver selected in Phase 2;
- attach the existing World through an explicit primitive adapter;
- split `Experience` into bootstrap, scene coordination and former UI features.

Acceptance:

- exactly one canvas, renderer and renderer-loop driver exist;
- route navigation does not remount the scene root;
- readiness is published only after renderer initialization, actual-backend
  inspection, Tres context mount and the initial World's first successful
  render; factory return alone cannot satisfy readiness;
- backend parity, idle and disposal results match Phase 6.

Rollback: switch `SceneHost` to the native-world host; no scene owner is deleted
in this phase.

### Phase 8 — migrate scene owners

Migrate one bounded owner per reversible slice:

1. lights and ground;
2. stable section groups;
3. `EnvSphere`;
4. `SplashCube`;
5. particles and trail;
6. `BakuCarousel`;
7. Works stages;
8. Contact text and model stages;
9. Lab experiments;
10. overlay/scene interaction and removal of the last legacy post binding.

Each slice requires two-backend visual parity, reduced-motion settling,
resource disposal and a performance comparison before its legacy owner is
removed.

Acceptance: legacy `World`, `SectionSceneFactory` and the scene-coordination
part of `Experience` have no production callers.

Rollback: revert the individual owner slice and remount its primitive adapter.

### Phase 9 — publishing and static content consolidation

Scope:

- render approved builder documents through a trusted Vue registry;
- make route metadata and sitemap consume the manifest;
- move blog pages into the shared SSG content pipeline without loading 3D;
- remove the final one-page builder publishing restriction.

Acceptance:

- public documents have static semantic HTML, canonical metadata and minimal
  route payloads;
- admin code remains absent from production;
- blog FCP and SEO do not regress.

Rollback: keep existing standalone blog and generated document paths until the
SSG output is proven equivalent.

### Phase 10 — legacy removal and hardening

Audit the phase-specific deletion ledger rather than postponing earlier
removals. Phases 5, 6 and 8 must already have deleted the manual router,
classic renderer/post chain and legacy World owners when their gates passed.
Phase 10 removes only residual migration flags, compatibility shims,
instrumentation that has completed its job, and obsolete tests/documentation
after consumer searches prove absence.

Acceptance:

- the full release gate and documentation audit pass;
- the complete desktop/mobile, backend, input, theme, locale and reduced-motion
  matrix passes;
- after five declared warm-up cycles, at least twenty steady-state route cycles
  stay within cache caps and show no listener, canvas, texture, geometry,
  program or memory trend; root destroy returns owned resources to baseline;
- no migration adapter, feature flag or removal-ledger item remains.

Rollback: the last accepted phase tag is the release fallback; hardening and
removal are separate commits so they can be reverted independently.

## Verification matrix

Every affected vertical slice selects relevant rows from this matrix:

| Dimension     | Required cases                                                              |
| ------------- | --------------------------------------------------------------------------- |
| Renderer      | automatic WebGPU, forced WebGLBackend, software-adapter policy              |
| Route         | direct entry, in-app, hash, popstate, retry after failure                   |
| Viewport      | desktop, narrow layout, real mobile DPR                                     |
| Input         | mouse, wheel/trackpad, touch, keyboard, focus navigation                    |
| Preference    | EN/RU, normal/inverse, reduced motion, sound on/off                         |
| Lifecycle     | initial mount, route exit, late async result, 20 route cycles, root destroy |
| Visual        | splash when relevant; otherwise enter then capture each affected route      |
| Accessibility | semantic headings, landmarks, names, focus, announcer, canvas hidden        |
| Performance   | bundle diff, startup, p50/p95, idle draws, GPU/resource counts              |

GPU/browser tests must fail on material compilation, renderer, device-loss and
uncaught runtime errors. DOM smoke tests may use a smaller error policy but are
not evidence of renderer parity.

## Budgets

Existing budgets are preserved through the migration:

- splash startup JavaScript: at most 5 KB gzip;
- shared Three.js delivery: at most 350 KB gzip until a separately reviewed
  budget decision replaces it;
- tested desktop p95: at most 16.7 ms;
- tested mobile p95: at most 33.3 ms;
- settled idle: zero draw calls and zero active scheduler reasons.

Track Vue runtime, TresJS integration, initial hydrated route, route chunks,
decoded textures and route-cycle resource growth separately. Do not hide a
regression by combining framework and renderer chunks or silently raising an
existing limit.

## Risk register

| Risk                                         | Control                                                                                   |
| -------------------------------------------- | ----------------------------------------------------------------------------------------- |
| WebGLBackend cannot compile the target graph | Phase 2 gate and reduced reproductions; old production renderer stays until accepted      |
| TresJS/Three WebGPU APIs change              | exact compatible version pins, one compatibility adapter and upgrade-only PR verification |
| synchronous Tres factory hides async init    | project readiness latch and Phase 2/7 first-render sequencing gate                        |
| two animation loops                          | one proven loop driver; assert loop ticks, callbacks, canvases and draws                  |
| both renderer attempts use software          | independent adapter classification and explicit degraded/failed state                     |
| Vue/Tres double disposal                     | ownership table, explicit primitive policy and idempotence tests                          |
| async resources arrive after exit            | abort/generation scope and immediate late-result disposal                                 |
| TSL recompilation grows driver memory        | declared cache caps, warm-up and 20 steady-state cycles                                   |
| hydration mismatch                           | serializable domain state, deterministic IDs and client-only SceneHost boundary           |
| UIkit and Vue compete for DOM/focus          | narrow wrappers and one behavior owner per component                                      |
| route/story/scene desynchronise              | route manifest plus one StoryController and typed scene port                              |
| splash startup regresses                     | isolated shell entry and modulepreload inspection                                         |
| the long-running branch becomes unreviewable | small conventional commits, phase checkpoints and removal ledger                          |

## Branch workflow

`tres-vue-dev` is the integration branch. Contributors use dedicated worktrees
and branches, return focused commits for review, and do not edit the integration
working tree concurrently. No contributor has merge authority by default.

## Migration ledgers

The following ledgers are updated in this document during implementation.

### Traceability

| Contract                 | Current owner                                                                                                                  | Target owner                                                                 | Migration phase |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------- | --------------- |
| splash readiness/failure | `index.html`, `entry-app.ts`                                                                                                   | inline shell + bootstrap state machine                                       | 5               |
| routes/hash/meta         | `routeManifest.ts`, `router.ts`, `pageMeta.ts`                                                                                 | route manifest + Vue Router                                                  | 3, 5            |
| scene route-page reads   | `routePage.ts` port (consumers: `World.ts`, `BakuCarousel.ts`; `Experience.ts`, `CinematicNav.ts`, `ContentReveal.ts` pending) | typed route port owned by the app providers                                  | 3, 5            |
| six world slots          | `worldSlots.ts` tuple (consumed by `WorldConfig.ts`, `SplashCube.ts`)                                                          | domain tuple + `WorldRoot`                                                   | 3, 7, 8         |
| render demand            | `Experience._needsRender`                                                                                                      | `RenderScheduler`                                                            | 3, 7            |
| brand/runtime tokens     | Less files + scene literals                                                                                                    | typed manifest + generated adapters                                          | 3, 5            |
| backend fallback         | `Renderer.ts`                                                                                                                  | `RendererFactory`                                                            | 2, 6            |
| post-processing          | dual `RenderPipeline` paths                                                                                                    | TSL graph (`WebGPUBackend`) + forced-WebGL fallback per the Phase 6 decision | 2, 6            |
| route GPU resources      | `World` lazy stages                                                                                                            | route resource scopes                                                        | 3, 8            |
| semantic UI              | string templates + UI classes                                                                                                  | Vue route/features + UIkit adapters                                          | 4, 5            |
| builder                  | `admin/main.ts`                                                                                                                | Vue builder app                                                              | 4               |
| static content           | standalone pages                                                                                                               | shared SSG pipeline                                                          | 9               |

### Removal ledger

| Legacy element                           | Remove after                                                                                                                          | Status      |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| manual router and route `innerHTML`      | Phase 5 cleanup after parity                                                                                                          | pending     |
| scene `document.body.dataset.page` reads | Phase 3 per-owner port migration (`World.ts`, `BakuCarousel.ts` done; `Experience.ts`, `CinematicNav.ts`, `ContentReveal.ts` pending) | in progress |
| string page/section templates            | Phase 5 matching-slice cleanup                                                                                                        | pending     |
| classic `WebGLRenderer` fallback         | Phase 6 phase-exit cleanup                                                                                                            | pending     |
| GLSL `ShaderMaterial` post chain         | Phase 6 phase-exit cleanup                                                                                                            | pending     |
| raw `jlz:*` window bridge                | all consumers use typed ports                                                                                                         | pending     |
| monolithic `Experience` coordination     | Phase 8 owner migrations                                                                                                              | pending     |
| legacy World adapters                    | Phase 8 completion                                                                                                                    | pending     |
| migration flags and shims                | Phase 10                                                                                                                              | pending     |

## Definition of done

The migration is done when the target topology is the only production path;
all phase gates pass; both renderer backends, real mobile hardware and the full
interaction/accessibility matrix have evidence; budgets are met; the removal
ledger is empty; and root plus `docs/` Markdown contain no current-runtime
claims about removed implementations.
