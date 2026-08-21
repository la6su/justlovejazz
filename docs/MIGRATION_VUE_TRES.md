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

#### Phase 3 CinematicNav + ContentReveal consumer migrations — 2026-08-21

The remaining small route-page readers moved onto the port in one bounded
slice (both are small UI/theme owners, both verified by the same runtime
smoke):

- `src/UI/CinematicNav.ts` checks `getCurrentPage() !== 'home'` at its two
  former sites (the page-mode guard in the track setup and the
  non-home early return) — the `data-section` / `data-page-section` anchor
  reads are a separate fact and stay.
- `src/Experience/ContentReveal.ts` resolves its page key through
  `getCurrentPage()` when it builds the cached world configs (the old
  `?? 'home'` missing-attribute default is the port's own fallback, so the
  behaviour is unchanged for every reachable value).

1:1 pull reads, guard timing unchanged. Unit suite 149/149, `vue-tsc`
clean, production build size-stable; runtime smoke on home (the active
surface of both owners) boots with the cinematic track live, the intro
section active and zero console errors. Rollback: revert the three reads.

#### Phase 3 Experience coordinator migration — 2026-08-21

The final per-owner migration: `src/Experience/Experience.ts` (the
coordinator, 9 former sites) now reads the page through the port — the
route-change handler's single `newPage` read (carousel/Works/Contact stage
initialization and disposal decisions), the mouse-trail works guard, the
works plane tap guard, the works scroll render-demand decision, the
home-only section-change dispatch guard, the splash-boundary carousel wake
and `getCarousel()`. 1:1 pull reads; the handler still reads the page once
and reuses it. Unit suite 149/149, `vue-tsc` clean, production build
size-stable; runtime smoke: home boot plus in-app SPA navigation
home → `/works` (exercises the coordinator's route-change path end to end)
with the works page live and zero console errors.

With this migration **every scene-side `document.body.dataset.page` read is
gone**: the only remaining references are the port (the single read point)
and the router writer, which stays until Phase 5 replaces it with typed Vue
Router state — at which point the port's source switches and no consumer
changes. Rollback: revert the nine reads.

#### Phase 3 bootstrap state machine slice — 2026-08-21

The explicit bootstrap state machine from the architecture target is now a
pure, framework-neutral contract, ready for the Phase 5 shell migration to
consume:

- `src/core/bootstrapStates.ts` declares the documented states
  (`shell-painted → app-loading → renderer-initializing →
scene-prewarming → ready → entered`, plus `failed`), the complete
  transition table, and pure helpers (`canTransition`, `tryTransition`,
  `isInitializing`). The machine is total: an illegal transition returns
  `null` instead of throwing, so a caller can report the policy event
  without an exception.
- Per the architecture contract, every initialization state (and `ready` /
  `entered` for device loss) may fall to `failed`, and a retry restarts the
  sequence from `app-loading` — the shell is already painted, and the
  retry-disposes-incomplete-renderer rule is application policy layered on
  top of the machine, not part of it. The bounded-rebuild policy (one retry
  per failure) likewise stays out of the machine.
- The current implicit bootstrap in `entry-app.ts` (the `is-ready` class,
  the `jlz:webgl-ready` / `jlz:webgl-failed` events, the `_bootstrapped`
  flag and the 60-second fallback) is unchanged — it is the legacy
  implementation this machine will replace when the splash leaves the
  non-Vue shell in Phase 5. Unit suite 158/158 (9 new tests), `vue-tsc`
  clean. No runtime consumer change in this slice.

Scope limits: the machine is inert until consumed. The `entry-app.ts`
bootstrap and its events migrate behind it in the Phase 5 shell slice, and
the retry/disposal policy is a later consumer concern. Rollback: delete the
contract file and its tests.

#### Phase 3 render-demand decision slice — 2026-08-21

The demand-driven render decision (docs/ARCHITECTURE.md: the loop runs but
draws only while the scene is changing, and settles to idle) is extracted
from the inline `Experience.update()` logic into a pure contract:

- `src/core/renderDemand.ts` models the per-frame decision as side-effect-free
  functions: `anyActivity` (the 14-flag OR used to raise demand and to decide
  whether demand may settle), `idleForAmbientBreath` (the narrower idle check
  for the ~2.5 s ambient-breath timer), `shouldRender`, `demandSettles`, and
  `ambientBreathStep` (the breath accumulator's pure timer math).
- Two deliberately different flag sets are preserved and unit-locked, because
  they are real behavior, not a simplification: `anyActivity` is the
  **14-flag** set used for both the demand-raise and the post-frame settle,
  while `idleForAmbientBreath` is a **10-flag** AND-NOT plus the reduced-motion
  gate that intentionally **excludes** `worksScroll`, `drawTrail`,
  `cubeRotating` and `camPulsing` — those four keep the loop alive on their own
  and must not also trigger the breath. The extracted flag sets were
  cross-checked line-by-line against the three live sites in
  `Experience.update()` (demand-raise, ambient-breath idle, post-frame settle)
  and match exactly.
- The contract is pure and **inert**: `Experience.ts` is unchanged and remains
  the legacy implementation until the loop is rewired to these functions (the
  Phase 7 `RenderScheduler` target owner). 17 new unit tests (175/175),
  `vue-tsc` clean. No runtime consumer change in this slice.

Scope limits: no timing change is possible in this slice because nothing
consumes the contract yet. The `Experience.update()` inline decision migrates
behind these functions in the Phase 7 scheduler slice, and that migration is
where any (intended) behavior change would be reviewed. Rollback: delete the
contract file and its tests.

#### Phase 3 brand token manifest slice — 2026-08-21

The canonical design tokens (the `@jlz-*` block in
`src/assets/_import.less` §1) are mirrored as a typed, framework-neutral
manifest, parallel to the route-manifest and world-slot contracts:

- `src/core/brandTokens.ts` declares all 84 tokens (`BRAND_TOKENS`,
  `BRAND_TOKEN_NAMES`) grouped by the Less sections (color, typography,
  spacing, radius, console surfaces, z-index, motion, layout), plus a strict
  `brandToken`/`isBrandToken` lookup and the six alias relations
  (`BRAND_TOKEN_ALIASES`).
- Direction of truth is **not** flipped: the Less file remains the single
  source of truth. A unit test parses §1 of `_import.less` and compares it
  against the manifest **key-for-key and value-for-value** (alias references
  resolved one level), so any future token added or changed in Less fails the
  suite until the manifest is re-synced. Six tokens in §1 are Less variable
  references (e.g. `@jlz-color-signal-teal: @jlz-color-signal-cool;`); the
  manifest stores the resolved value and records the alias relation so the
  editorial fact stays explicit instead of silently duplicated.
- The builder's generated override layer
  (`src/assets/builder/theme.generated.less`) is a dev-only build artifact
  with authored values and is intentionally outside the manifest; scene
  literal dedup against these tokens is the later Phase 5 "generated
  adapters" consumer.
- The manifest is pure and **inert**: no runtime or Less behavior changes in
  this slice; the production build is byte-size stable (tree-shaken). 8 new
  unit tests (183/183), `vue-tsc` clean.

Scope limits: the manifest is a mirror, not yet a source — the Phase 5
generated adapters (typed manifest → CSS custom properties) are where the
Less file would start being generated from it. Rollback: delete the contract
file and its tests.

#### Phase 3 typed preference port slice — 2026-08-21

The reduced-motion preference already had the right shape — a small
pull-based module every consumer calls — so this slice formalizes
`src/core/motionPolicy.ts` as the **typed motion preference port** and
removes the one dead writer around it:

- `prefersReducedMotion(): boolean` is the single read point; all 11
  scene/UI consumers (World, Experience, Camera, Lights, SplashCube,
  ContactCyprusStage, CinematicNav, RouteTransition, entry-app) read
  through it, none infer the preference from DOM datasets. Reads stay
  pull-based, so the OS preference is current at every decision point and
  the Phase 5 swap to typed Vue state only changes this module's source —
  consumers stay unchanged.
- `syncReducedMotionDataset()` was removed: production code never called it
  (only the unit tests did), and the comment in `entry-app.ts` claiming it
  ran from `entry-shell.ts` was stale — `entry-shell.ts` inlines its own
  synchronous write at shell load. That dataset write stays: it is the
  legacy `documentElement.dataset.reducedMotion` hook that the E2E suite
  reads (`tests/e2e.spec.ts`), the same "writer stays until Phase 5"
  category as the `data-page` dataset.
- 5 dead-writer unit tests removed; `vue-tsc` clean; 178/178 unit suite;
  production build byte-size stable (the dead code was already
  tree-shaken); runtime smoke on home boots with the hook written
  (`data-reduced-motion="0"`) and zero console errors.

Scope limits: the preference port covers reduced motion; if further
preferences (locale, quality) surface, they join this port rather than new
ad-hoc readers. The dataset hook removal is a Phase 5 shell item. Rollback:
restore the function and its tests.

#### Phase 3 route resource scopes slice — 2026-08-21

The route-scoped GPU resource policy (which lazy stage lives on which page,
and when it is disposed) is extracted from the inline
`Experience.ts` route-change handler + `World.forPage` into a pure
contract:

- `src/core/routeResourceScopes.ts` declares the scope inventory
  (`carousel`, `worksPlaneStage`, `contactTextStage`,
  `contactCyprusStage`) with owner page, kind and the editorial note (the
  /works stage owns eight decoded 1440×810 textures — disposing it is what
  keeps a navigation from looking like a GPU leak), plus
  `routeScopeTransition(to)`: a total acquire/dispose decision over every
  `PageId`, and strict lookups (no `home` fallback).
- Two scope classes, deliberately different and unit-locked: the home
  carousel is **persistent** (lazily initialized once; its four project
  textures are shared with the Works plane media, so it is never disposed
  during the session), while the works/contact stages are **route-scoped**
  (acquired on entry, disposed on every other page). Disposal is
  unconditional in the policy — the consumer's no-op guards make disposing a
  never-created stage safe, exactly like the legacy handler's else branches.
- The policy was cross-checked line-by-line against the live
  `_routeChangeCloseOverlayHandler` in `Experience.ts` (home/works/contact
  arms + the unconditional else-branch disposes) and the initial-load
  pre-warming in `World.forPage`; 13 unit tests (191/191) lock it. Section
  resets (`setWorksPlaneStageSection(0)` & co.) are scene-state concerns and
  stay with the consumer, out of this contract.
- The contract is pure and **inert**: no runtime behavior changes in this
  slice; the Phase 8 rewiring moves the handler and `World.forPage` onto
  `routeScopeTransition`. `vue-tsc` clean, size-stable build.

Scope limits: no consumer rewiring; the initial-hash-replay wake
(`ensureCarouselInitialized` at the splash boundary) and the self-healing
lazy init inside `setContactCyprusStageSection` are consumer concerns, not
scope policy. Rollback: delete the contract file and its tests.

#### Phase 3 story progress contract slice — 2026-08-21

The story's progress→section mapping — the rule that keeps the 3D world and
the DOM navigation arriving at the same section in the same neutral point —
is extracted from `World.updateTransform` into a pure contract:

- `src/core/storyProgress.ts` provides two pure functions:
  `clampStoryProgress` (non-finite → 0, clamp to [0, 1]) and
  `sectionIndexAt(progress, sectionCount)` — the **midpoint arrival rule**
  `round(progress × (sectionCount − 1))`.
- This rule is a real, load-bearing fix, not an obvious identity: deriving
  the index from the _from_ range made down-scroll arrivals land at the end
  of a frame while up-scroll arrivals landed immediately after leaving the
  section — a visible, direction-dependent second beat. The midpoint rule is
  a pure function of progress, so a given progress always yields the same
  index regardless of scroll direction. That invariant (plus the exact `.5`
  boundary, where JS rounds up into the next section — the same neutral point
  CinematicNav uses to flip its DOM chapter) is now unit-locked instead of
  living only in a comment.
- Unlike the previous contracts, this one is **consumed immediately**:
  `World.updateTransform` imports `clampStoryProgress` and `sectionIndexAt`
  and reads them at the exact points where it inlined the clamp + round
  before. The read timing is unchanged — this is a 1:1 source-of-fact swap,
  not a deferred rewiring. `World.routeVisuals` integration tests (5/5) and
  the 9 new `storyProgress` unit tests (200/200) lock it.
- `vue-tsc` clean; production build byte-size stable; runtime smoke boots on
  home with zero console errors.

Scope limits: the mapping is the progress→index rule only; the per-section
easing (`_applyEasing`, double-ease for bg/fog) and the lights/fog/env
systems fired on index change stay with the consumer. Rollback: restore the
two inline expressions in `updateTransform` and delete the contract.

#### Phase 3 story slot index single-source slice — 2026-08-21

A self-review of the story navigation surfaced a duplicated-facts point:
`CinematicNav` re-declared the canonical story slot indices as inline
constants (`CONTACT_FOOTER_INDEX = 0`, `FIRST_MAIN = 1`, `LAST_MAIN = 4`,
`MENU_INDEX = 5`) — the same index assignment the canonical six-slot model
already owns in `worldSlots.ts`. Two owners of one fact is the exact class of
bug the slot contract was created to prevent, so this slice makes the slot
tuple the single source:

- `src/core/worldSlots.ts` gains a strict `worldSlotIndex(id) → number |
undefined` lookup (and `isWorldSlotId`). It accepts `string` so DOM
  dataset values can be passed without a cast, and returns `undefined` for
  any id the slot model does not own — the `page-` page-section variants,
  PageIds and route paths are deliberately not slot ids (the namespace
  lesson).
- `CinematicNav` now derives its four index constants from
  `worldSlotIndex` (`lab`/`intro`/`contact`/`menu`) instead of hard-coding
  `0/1/4/5`. The `goToSectionByHash` logic is untouched — a 1:1
  source-of-fact swap with unchanged module-init timing, so the slot-index
  assignment is behavior-identical.
- Unit-locked: the strict mapping round-trips every canonical id to its
  stable index, unknown ids are `undefined` (never a default), and the four
  derived constants equal the former inline literals `0/1/4/5` (the
  regression baseline). `CinematicNav`'s 6 existing tests stay green; 203
  unit tests pass; `vue-tsc` clean; build +~50 B (the new strict helper);
  runtime smoke boots home with zero console errors.

Scope limits: this removes the index duplication in the navigation
constants only; `goToSectionByHash` still resolves the DOM anchor and the
main-section position from the live track (a DOM concern, not a slot fact).
Rollback: restore the four inline constants in `CinematicNav` and delete the
two helpers.

#### Phase 3 typed scene input ports (theme + locale) slice — 2026-08-21

The two remaining scene input ports — **effective theme** and **locale** —
are formalized. `ARCHITECTURE.md` requires that "typed readonly ports carry
route, locale, effective theme, reduced motion and story progress into the
scene"; route, reduced motion and story progress were already in place, so
this slice closes the pair:

- **Effective theme** — `src/core/sectionTheme.ts` owns the
  auto/inverse decision as a pure function
  (`resolveEffectiveTheme(sectionIsLight, mode)`) and the typed shape of the
  scene input port (`ThemeAppliedPort`: `isLight`, `sectionIndex`,
  `sectionId`, `themeChanged`, `mode`, `snap`). The decision used to be an
  inline ternary in `ContentReveal.applyTheme()` and the `jlz:theme-applied`
  payload an ad-hoc untyped `CustomEvent` detail. Now `ContentReveal` reads
  the pure decision at the exact point of the old ternary and builds the
  event detail as `ThemeAppliedPort`; `Experience`'s handler reads the
  detail through the same type. A 1:1 source-of-fact swap: the event is
  dispatched at the same moment with the same values, and the rule is
  unit-locked against the legacy ternary for every input pair.
  Ownership stays split by design: the per-section base polarity lives in
  the WorldConfig phase configs (`PhaseConfig.theme`), the persisted
  user mode in `ThemeManager`, the decision + port shape in this contract,
  and the DOM `uk-light` application + dispatch in `ContentReveal`.
- **Locale** — `i18n.ts` already had the right shape (typed `Lang`,
  pull-based `getLang()`/`t()` reads, a single writer `toggleLang()` that
  persists and publishes `jlz:lang-change`), the same category as the
  motion-preference port; it is now documented as the typed locale port,
  and its unit tests (including the EN/RU dictionary parity guard) lock it.

208/208 unit suite, `vue-tsc` clean, size-stable build, runtime smoke:
section scroll + theme toggle + language switch on home with zero console
errors.

Scope limits: no consumer rewiring beyond the 1:1 type swap; the per-section
base polarity remains a WorldConfig fact until the Phase 7 `WorldRoot` owns
it. Rollback: restore the inline ternary + untyped detail in
`ContentReveal`/`Experience` and delete the contract.

#### Phase 3 story-state contract slice — 2026-08-21

The story has one continuous input (the native track scroll) and two
observers on different clocks: the DOM navigation reacts to scroll _events_
(discrete main-section chapter, side sheets) and the 3D world reads progress
_per frame_ (midpoint arrival over the six slots). Merging the observers
would change arrival timing, so this slice keeps both where they are and
single-sources the _mapping between the scales_, which used to be inlined in
`CinematicNav`:

- `src/core/storyState.ts` is the pure story-state contract:
  `storyProgressFromScroll` (the main→slot rescale, `(1 + p) / 5`),
  `clampStoryPosition` + `mainSectionFromPosition` (the main-section
  rounding rule with the same `.5`-rounds-up convention as the scene's
  midpoint rule), `storyProgressWithSide` / `storySectionIndex` (the
  footer→0 / menu→last-slot edges), and the readonly `StoryState` shape both
  observers converge on.
- `CinematicNav` consumes the functions at the exact points where it inlined
  the rescale, clamp and rounding before — a 1:1 source-of-fact swap with
  unchanged timing (the scroll event still drives the DOM chapter, the frame
  still drives the scene; the per-section CSS variables still receive the
  same clamped continuous position). Its `SideState` set is now an alias of
  the contract's `StorySide`.
- The contract unit-locks the **route/story/scene desync invariant**: at
  every main stop point — and throughout every main span — the DOM main
  index and the scene slot index are the _same number_ (mains 1..4 are slots
  1..4). This is the mapping half of the "route/story/scene desynchronise"
  risk row; the route-manifest and typed-port halves are already in place.
- 12 new unit tests (220/220), `vue-tsc` clean, size-stable build, runtime
  smoke: section scroll presents one consistent section to DOM and scene
  with zero console errors.

Scope limits: a full runtime `StoryController` (a single publisher the DOM
_and_ the scene both subscribe to) would move the DOM chapter from
event-driven to publisher-driven and change arrival timing; it lands with
the Phase 5/7 scene-host rewiring on top of this contract, which owns the
mapping and the typed state it publishes. Rollback: restore the inline
rescale/clamp/rounding in `CinematicNav` and delete the contract.

#### Phase 3 render-demand consumer slice (Phase 7 RenderScheduler wiring)

— 2026-08-21

The per-frame render-demand decision that used to be inlined in
`Experience.update()` is now consumed from the pure `renderDemand.ts`
contract (unit-locked since the contract slice). This is the Phase 7
RenderScheduler consumer migration, done in place because the loop already
lives in `Experience` — only the _decision_ moves, not its timing:

- The 14 per-frame activity flags are collected once into a typed
  `RenderActivity` snapshot at the exact point the flags were read before.
- The demand raise is now `anyActivity(activity)` (the 14-flag OR), the
  render gate is `shouldRender(this._needsRender, activity)` — 1:1 with the
  legacy `if (this._needsRender)` because the OR already raised the flag for
  any active source — and the post-frame settle is `demandSettles(activity)`
  (the 14-flag AND-NOT).
- The ambient-breath timer is now `idleForAmbientBreath(activity,
reducedMotion)` (the narrower 10-flag AND-NOT plus the reduced-motion
  gate; `worksScroll`, `drawTrail`, `cubeRotating` and `camPulsing` stay
  deliberately excluded) advanced by the pure `ambientBreathStep`
  accumulator — same ~2.5 s interval, same "first idle period waits a full
  interval" reset behavior.

220/220 unit suite (the flag sets and their legacy-equivalence baselines
were already unit-locked against the inline logic), `vue-tsc` clean, build
+~0.6 kB raw / +0.24 kB gzip in `chunk-core` (the `renderDemand` module
stops being tree-shaken as an import-free inert file), e2e 18/18 serial,
runtime smoke: section scroll keeps rendering live, the scene settles when
idle, zero console errors.

Scope limits: the loop owner stays `Experience` (one canvas/renderer/loop
owner, ADR 0003) — the Phase 7 `RenderScheduler` target owner takes over the
loop itself when the scene host is rewired in Phase 5/7; this slice only
hands it its decision. Rollback: restore the three inline blocks in
`Experience.update()` (the contract file can stay — it is unit-locked).

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

#### Phase 4 typed builder store slice — 2026-08-21

The first bounded Phase 4 slice single-sources the builder editor's mutable
state: the document, the selected node, the undo/redo history and the
last-saved baseline, which used to be module-level lets plus inline
`commit`/`recordCurrentSnapshot`/`restoreHistory`/dirty-check functions in
the admin entry.

- `src/builder/store.ts` is the framework-neutral state container (no Vue,
  TresJS, Three.js or DOM). It imports the schema for types and validation
  only; the pure builder core (`schema`, `catalog`, `compiler`, `render`) is
  unchanged.
- Two atomic paths are preserved verbatim from the legacy admin logic and are
  the editor's only mutation routes: `commit(change)` (structural edits —
  clone, mutate, validate; a rejected change discards the draft and returns
  the first error, a valid one replaces the document and pushes a capped
  `HISTORY_CAP = 50` snapshot) and `recordSnapshot()` (field edits — the
  consumer mutates the live document, then this validates and pushes only
  when the document actually changed). `restore` drops a stale selection;
  `load` resets history and the saved baseline; `markSaved` / `isDirty` own
  the dirty check; `findNode` / static `findLocationInDocument` own node
  lookup.
- `admin/main.ts` is the 1:1 consumer swap: the same render functions and
  event wiring now read `store.document` / `store.selectedId` and dispatch
  the store actions. The editor-only UI facts (mode, selected style group,
  preview toggles) are not document state and remain editor locals. Read
  timing is unchanged — the editor re-renders after each action exactly when
  the legacy `renderEditor()` ran.
- `src/__tests__/builderStore.test.ts` (14 tests) locks the atomicity (a
  rejected commit leaves document and history untouched), the no-change
  snapshot rule, the stale-selection drop on restore, the out-of-range
  restore no-op, the dirty baseline (only `markSaved`/`load` advance it),
  the history cap (oldest dropped first) and the node-lookup parent/index
  facts against `DEFAULT_BUILDER_DOCUMENT`.
- Verification: 234/234 unit suite (220 + 14 new), `vue-tsc` clean, scoped
  prettier clean, `git diff --check` clean, production build size-stable
  (the store is dev-only and tree-shaken out of `dist`; `BuilderStore`
  absent from every production asset — the public build never imports the
  admin graph, per the non-negotiable contract), serial e2e 18/18, and a
  runtime smoke on the live admin editor (add → "Unsaved changes" → undo →
  "Ready", redo, duplicate/remove/move, and the Style-mode switch) with zero
  console errors.

Scope limits: the admin entry is still the only consumer and still renders
imperatively; the SFC migration (catalogue, outline, inspector, preview and
Style workspace) and the lifecycle-safe preview are later Phase 4 slices.
Rollback: restore the inline lets and functions in `admin/main.ts` and delete
the store and its tests.

#### Phase 4 admin editor style polish slice — 2026-08-21

A dev-only visual and interaction pass over the admin editor (no schema,
save, store or state changes; `page.json` untouched):

- `admin/admin.less`: the Save button is now the accent primary with an
  explicit `:disabled` state (Undo/Redo got the same); the status output
  gains a state dot (green ready, yellow unsaved, red error, neutral note);
  the document outline renders per-level indentation guides and keeps one
  line per node (name ellipsized); hover/press feedback on the element
  catalog and node actions; one shared `:focus-visible` outline for the
  custom controls (the catalog keeps its border-color focus affordance); a
  hairline under the inspector header; thin dark scrollbars for the panels
  and the preview frame; and the `prefers-reduced-motion` block now covers
  every new transition.
- `admin/main.ts` (three small edits): `renderOutline` reports the node depth
  as a `--depth` custom property instead of an inline `paddingLeft` (the CSS
  owns the indentation), `setStatus` writes the `data-state` dot state, and
  `updateDirtyStatus` derives the dirty/ready dot without overwriting an
  error state.
- `admin/index.html`: visible `title` tooltips on the node action buttons.

Verification: scoped prettier, `vue-tsc` clean, 234/234 unit suite,
`git diff --check` clean, production build byte-identical (the admin graph
never enters `dist`), serial e2e 18/18, runtime smoke on the live admin
editor (ready/dirty/error dot states, accent Save enabled only when dirty,
outline guides at every depth, Style mode) with zero console errors.

Rollback: revert the three changed files.

#### Phase 4 admin editor usability slice — 2026-08-21

A dev-only ergonomics pass over the admin editor (no schema, save or store
contract changes; `page.json` untouched). The editor gains the shortcuts and
states a builder page needs, and the duplicated preview-theme literals leave
`admin/main.ts` for a new pure contract:

- `src/builder/themeVariables.ts` (new): the single framework-neutral source
  for the 37 `--builder-*` preview variables — a pure `themeToCssVars`
  mapping from the typed `BuilderTheme` plus the locked card-shadow presets
  (`cardShadowValue`); 6 unit tests pin the variable set and every mapping.
  `applyPreviewTheme` now assigns the mapped result, deleting ~40 lines of
  literals from the editor (no duplicated facts).
- `admin/main.ts`:
  - Keyboard shortcuts — `Ctrl/Cmd+S` save (any focus, prevents the browser
    dialog), `Ctrl/Cmd+Z` / `Ctrl/Cmd+Shift+Z` / `Ctrl/Cmd+Y` undo/redo,
    `Delete`/`Backspace` removes the selected node; all no-ops while the
    caret is in a form control so native text editing keeps its own
    shortcuts.
  - Save flow — the button locks and shows “Saving…” while the request is in
    flight (no double save), then restores its label and the dirty-driven
    state.
  - Outline — each row shows the catalog element glyph and the element
    description as a tooltip; the selected row scrolls into view.
  - Preview — selecting a node scrolls it into view inside the preview frame
    (`prefers-reduced-motion` gets an instant jump).
  - Style workspace — an undo-able “Reset” action commits
    `DEFAULT_BUILDER_THEME` back to the document (a plain `commit`, so
    history and the dirty state track it like any other edit).
- `admin/index.html`: shortcut hints in the Undo/Redo/Save/Remove and
  viewport tooltips; the `#theme-reset` button in the style panel heading.
- `admin/admin.less`: outline glyph styling (incl. the selected state) and
  the Reset text button; both new transitions join the reduced-motion block.

Verification: scoped prettier, `vue-tsc` clean, 240/240 unit suite (29
files, +6 for the theme contract), production build unchanged in size with
the admin graph still absent from `dist`, `git diff --check` clean, serial
e2e 18/18, runtime smoke on the live admin editor (add → dirty dot, `Ctrl+Z`
undo, `Ctrl+Shift+Z` redo, Delete removes the selected row, Style mode +
theme Reset round-trip) with zero console errors and `page.json` untouched.

Rollback: revert the five changed files and delete the two new ones.

#### Phase 4 brand system unification slice (Neon Stage) — 2026-08-21

Owner-approved product decision (ADR 0007): one brand identity, one token
chain. The Neon Stage identity replaces the paper/ink palette across the
product, the blog, the scene fallbacks and the admin editor, and every
parallel color source is deleted so the brand is described once:

- `src/assets/_import.less` §1/§2: the Neon Stage palette (cool near-black
  surfaces, cool ivory text, electric-yellow accent with glow, cool + ember
  signals, cool-paper inverse), three semantic status tokens
  (`color-status-success` plus `warning`/`danger` aliases to the brand
  signals) and the 6–10px radius language. `color-fluid-warm` becomes an
  alias of the accent; `color-cursor-hover` aliases the ember signal.
- `src/assets/console-theme/_import.less`: status colors now reference the
  brand status tokens; the heading scale becomes the golden-ratio
  (φ = 1.618) modular chain 0.875 / 1.414 / 2.288 / 3.702 / 6rem, riding the
  existing mobile-first `html` base (0.85rem mobile → 1rem ≥640px).
- `src/core/brandTokens.ts` + `brandTokens.test.ts`: the typed mirror moves
  to Neon Stage with the 87-token count, the three status tokens and the
  extended alias record (9 documented aliases incl. `color-fluid-warm`);
  the locked literals pin the new core facts.
- Builder layer: `DEFAULT_BUILDER_THEME` and the committed
  `src/builder/generated/page.json` are re-themed to Neon Stage (8px control
  radii), and `theme.generated.less` / `components.generated.less` are
  regenerated through `compiler.ts` (never hand-edited).
- Parallel color sources removed: `main.less` caption chips,
  `_paper-ink-language.less` (launchers, captions, inverse overrides),
  `blog.less` accent fallback and the `Cursor.ts` cached fallbacks now read
  the token chain; the `entry-app.ts` 3D-failed state keeps its inline
  fallback but paints from the same tokens.
- `admin/admin.less`: all ~60 ad-hoc hex values replaced with `--jlz-*`
  runtime variables (status dots onto the new status tokens, accent states
  onto the brand accent/glow), and the dead `var(--builder-*, fallback)`
  literals simplified — the preview always applies `--builder-*` through
  `themeToCssVars`, so the fallbacks were unreachable.

Verification: scoped prettier, `vue-tsc` clean, 240/240 unit suite (29
files), production build clean with the admin graph absent from `dist`,
`git diff --check` clean, serial e2e 18/18, runtime smoke on the live
product page and the admin editor with zero console errors and
`page.json` byte-identical to the committed artifact.

Rollback: revert the change set (ADR 0007 is superseded, not rewritten).

#### Phase 4 golden-ratio scale rendering + admin preview modes slice — 2026-08-21

Follow-up to ADR 0007: the φ chain existed only in the console-theme UIkit
globals, while every rendered display composition bypassed it with ad-hoc
`clamp()` endpoints, and the admin preview viewport modes (desktop / tablet /
mobile) were broken — the `width` transition on the preview frame fought the
`auto` grid track and never settled, so the frame stayed full-width in every
mode.

- `src/assets/_import.less` §1/§2: seven new `@jlz-type-step-*` tokens own
  the φ chain (0.875 / 1.414 / 2.288 / 3.702 / 6 / 9.708 / 15.707rem; each
  step ≈ previous × 1.618), rem-based on the mobile-first html base
  (0.85rem → 1rem ≥ 640px). `brandTokens.ts` mirrors them (87 → 94 tokens);
  the parity test pins the new count.
- `src/assets/console-theme/_import.less`: the UIkit heading sizes now
  reference the step tokens instead of re-declaring the chain literals.
- Product display `clamp()`s (`_content.less`, `main.less`,
  `_cinematic-language.less`, `blog.less`) snap their endpoints onto the
  step tokens; body-tier text and micro mono labels stay off the display
  chain.
- `admin/admin.less`: the `width` transition on
  `.jlz-admin-preview-frame` (and its dead reduced-motion line) is removed —
  the viewport switch now applies instantly (desktop 861px / tablet 820px /
  mobile 390px verified in the live editor). The editor shell stays
  desktop-only by owner decision; only the preview frame is responsive.

Verification: scoped prettier, `vue-tsc`, 240/240 unit suite (29 files),
production build with the admin graph absent from `dist`, `git diff --check`
clean, serial e2e 18/18, live smoke: product page renders φ clamp endpoints
(zero console errors) and the admin preview switches desktop → tablet → mobile →
tablet with the correct frame widths (fluid / 820px / 390px).

Rollback: revert the change set.

#### Phase 4 admin preview typography and brand language slice — 2026-08-21

The builder preview rendered headings with UA defaults (identical in every
viewport mode, smaller than body copy — the saved document used
`size: "small"` on display headings), and carried no brand language, so the
editor looked utilitarian next to the product.

- `admin/admin.less`: the preview now typesets with the same φ chain (ADR 0007) expressed in `cqi` units against the preview frame
  (`container-type: inline-size`), so heading bands, body tier, meta, form
  controls and section rhythm scale with the desktop / tablet / mobile
  frame instead of the editor window. The builder's explicit `uk-heading-*`
  size class wins over the HTML level default, mirroring the product.
- Brand signatures (Neon Stage, ADR 0007) now render in the preview: soft
  text glow on display headings, mono tracked uppercase meta, `S 01`
  section index labels with 1px dividers, accent glow on the primary
  button hover/focus and on links, 1px card borders with accent hover.
  Reduced-motion suppresses the new transitions.
- `src/builder/style-showcase.ts`: the Base / typography sample now shows
  all five implemented size tiers (2xlarge … small) so the scale is visible
  in the Style panel.
- `src/builder/generated/page.json`: the hero headings use the display
  tiers (`h1 xlarge`, `h2 large`) so the stored document matches the
  product's hierarchy.

Verification: scoped prettier, `vue-tsc`, 240/240 unit suite (29 files),
production build with the admin graph absent from `dist`, `git diff --check`
clean, serial e2e 18/18, live smoke: preview measures 59.2 / 42.7 px for the
hero xlarge heading at the 859 / 388 px frames with the correct band
hierarchy (zero console errors, document restored after the smoke edits).

Rollback: revert the change set.

#### Phase 4 console-minimal unified style system slice — 2026-08-21

Owner direction: one unified, refined, future-proof style system shared by
the product and the admin preview — console minimalism (flat surfaces,
square corners, 1px lines, φ scale, mono details, accent as color without
glow). The preview also had to stop diverging from the front.

- `src/assets/_import.less` + `src/core/brandTokens.ts`: every radius token
  now resolves to `0` (square corners; `radius-full` stays 0.125rem for dot
  indicators only) and `card-shadow` is `none` — the interface is flat, the
  φ type scale and 1px lines carry the language. Both sides share the same
  token pipeline, so the admin preview and the product surface inherit it.
- `admin/index.html`: the admin shell now preloads the same Commissioner
  variable font as the product. The preview previously fell back to a system
  font, which was the root cause of the preview "not matching the front".
- `admin/admin.less`: the preview's accent-glow treatment and the `S 01`
  section-counter/divider hack (which broke the reported layout) are
  removed; cards are flat with 1px borders and an accent border on hover.
  The preview grid is now laid out by container queries against the preview
  frame (960px pivot mirroring the compiled page's `uk-child-width-1-N@m`)
  instead of window media queries, so every simulated viewport is WYSIWYG of
  the built output; gaps follow the builder spacing token.
- `src/builder/catalog.ts` / `src/builder/render.ts`: the heading catalogue
  gains the `2xlarge` tier (the UIkit display tier the scale already owned)
  and grids render `data-columns` for the container layout.
- `src/builder/style.ts` / `src/builder/generated/page.json` / regenerated
  `src/assets/builder/theme.generated.less`: the builder theme defaults are
  square and flat (`radius`/`buttonRadius`/`cardRadius` 0px, `cardShadow`
  none); the stored document's hero moves to `2xlarge` (step-5 ceiling =
  96px display). Heading weight/transform stay 800/uppercase — measured from
  the live product display face.

Verification: both Less entries compile; live smoke — preview hero renders
96 px / 800 / uppercase in Commissioner at the 1029 px desktop frame (2
grid columns), 96 px single column at the 820 px tablet frame (mirroring the
`@m` pivot), 59.2 px single column at the 390 px mobile frame; product
tokens resolve to square corners and `none` shadows with zero console
errors; scoped prettier, `vue-tsc`, 240/240 unit suite (29 files),
production build with the admin graph absent from `dist`, `git diff --check`
and serial e2e all green.

Rollback: revert the change set.

#### Phase 4 builder catalog and Figma-style inspector slice — 2026-08-21

Owner direction: the left catalog must expose every component the product
actually composes, and the right inspector must be reworked into a
Figma-style grouped property panel; everything stays unified on one
UIkit 3 theme.

- `src/builder/schema.ts`: the element type union gains `link`, `icon`,
  `list`, `divider` (all container-free, validated through the same
  whitelist/depth/id rules).
- `src/builder/catalog.ts`: the catalogue is now grouped
  (`BUILDER_CATALOG_GROUPS`: Layout / Typography / Elements) and every
  definition owns `fieldGroups` instead of a flat field list — the same
  data drives the inspector sections. The icon element whitelists the exact
  console icon set registered in `src/assets/console-icons.ts` (15 names)
  and exposes a `ratio` scale (0.7 / 1 / 1.2 / 1.4).
- `src/builder/render.ts`: the four new types render to product markup —
  `uk-list` (hyphen / divider / ordered), 1px `uk-divider` hairline,
  `uk-link-muted`/`uk-link-reset` text links, and `uk-icon` spans with a
  sanitized ratio. Untrusted props fall back to safe defaults.
- `admin/main.ts`: the left panel renders the grouped catalogue (mono
  group kickers); the inspector renders Figma-style rows — a 92px label
  column with compact controls, stacked textareas, mono group headers
  (Content / Typography / Layout / Style / Link), and the selected node's
  stable id as a header badge. The Style workspace reuses the same grouped
  panel language. The preview registers the console icon set
  (`registerConsoleIcons`) so `uk-icon` is WYSIWYG of the product.
- `admin/admin.less`: grouped catalog/inspector styles in the
  console-minimal language (square corners, 1px lines, no glow).

Verification: scoped prettier, `vue-tsc`, unit suite green (new builder
tests cover the grouped catalogue, the safe fallbacks for all four new
types, and the optional list/divider component pipeline), live smoke —
every new type added through the UI renders in the preview at all three
viewport modes (icon 20 → 28 px at ratio 1.4, ordered list, hairline
divider, muted link), zero console errors, document restored via Ctrl+Z.

Rollback: revert the change set.

#### Phase 4 secondary accent and Style workspace rework slice — 2026-08-21

Owner direction: rework the Style workspace (both sidebars) and add the
missing secondary accent color; keep chasing interface minimalism (remove
borders where they do no structural work).

- `src/assets/_import.less` + `src/core/brandTokens.ts`: a new
  `jlz-color-accent-secondary` token joins §1/§2 and the typed manifest
  (aliased to `signal-cool`); the inverse polarity follows the lightened
  cool signal.
- `src/builder/style.ts`: the theme gains `accentSecondary` (default
  `#5eb0ff`), the Global group owns the new Secondary accent color field,
  and every style group declares a UIkit glyph (`icon`) for the rail. The
  group set grows to 16 so it covers every element family the catalogue
  composes: Heading, Text, Grid, Link, Icon, List and Divider join Base,
  Button, Card, Section, Form and Navbar (a unit test pins the catalogue →
  style-group coverage).
- `src/builder/themeVariables.ts` + `src/builder/compiler.ts`: the preview
  contract grows to 47 variables (`--builder-accent-secondary` plus
  heading/text line heights, grid gutter, link/icon colors, list gap and
  divider color/spacing) and the generated theme Less emits the authored
  secondary accent, link colors, list rhythm and `hr` tokens.
- `admin/main.ts` + `admin/style-icons.ts`: the Style rail renders a glyph
  and field count per group; the right panel groups properties by concern
  (Colors / Values) with the group's id badge. The shell registers the
  official `uikit-icons` set (a separate UMD plugin) so rail glyphs resolve
  — the product build never imports the admin shell. The style preview
  always renders the complete component set (the former "Preview all UI
  components" toggle is gone); selecting a group marks its sample active
  and scrolls it into view instead of hiding the rest.
- `admin/admin.less`: decorative chrome borders and glows removed (viewport
  switcher, sidebars, node-action buttons, id badge, tone controls, save
  halo, preview frame shadow); structural hairlines remain.
- `src/builder/style-showcase.ts`: the Global swatch row shows the
  secondary accent.

Verification: scoped prettier, `vue-tsc`, unit suite green (47-variable
contract, alias registry 95 tokens / 10 aliases, generated-theme assert,
catalogue → style-group coverage), production build with the admin graph
absent from `dist`, live smoke — sixteen rail groups with glyphs and
counts, all sixteen component samples stay visible while the selected
group is outlined and scrolled into view, the Heading sample shows the
full six-level display scale, divider/heading edits update the
preview live and are undo-able via Ctrl+Z to the saved baseline, the
secondary card/section/button read as the secondary accent's 1px line
(outlined card, hairline section, ghost button filling on hover, inverse
tone remapped) in both the preview and the shipped `_builder-page.less`
layer, inspector rows stay one compact line with descriptions in
hover tooltips and color rows ending in a round borderless-border dot
(pinned to one column; the hex track shrinks to 0 so long labels cannot
push the dot past the panel), form controls keep only their bottom
underline, and the catalog and outline rows share the Style rail's
official UIKit glyph set — 18px hydrated SVGs on the same icon family.
Computed chrome borders read 0px (toolbar, right-panel heading, preview
frame, showcase sample dividers, tooltips) while buttons, preview cards
and the round swatch keep theirs; the rails share one trailing-padding
and 38px row-height rhythm,
zero console errors.

Rollback: revert the change set.

#### Phase 4 structural editor commands slice — 2026-08-21

The first step of the SFC migration: the editor's structural edits move out
of the DOM entry into a pure, framework-neutral module so the SFC panels can
dispatch them (and tests can lock them) without a document object.

- `src/builder/commands.ts` owns the five structural actions — `addElement`,
  `moveSelected`, `duplicateSelected`, `removeSelected`, `resetTheme` — as
  pure functions of a `BuilderStore`. Each returns the store's atomic
  `CommitResult`, so a rejected edit is reported exactly as before. `makeId`
  (the type-prefixed stable node id) moves with them. The legacy semantics
  are preserved verbatim, including the store contract details the smoke
  tests rely on: a boundary move or a blocked remove still records the
  attempted commit, and a removed node selects its parent before any
  sibling.
- `admin/main.ts` is a 1:1 consumer swap: the inline command closures and
  `makeId` are gone, and the five thin wrappers dispatch the commands and
  keep the editor's status/re-render contract (`runCommand`).
- `src/__tests__/builderCommands.test.ts` (13 tests) locks placement
  (root section, selected container, selected node's parent, last-root
  fallback), selection (the new/duplicated node, the parent after removal,
  the last-root guard), move boundaries, the deep-clone fresh-id rule and
  the undo-able theme reset against a minimal valid document.

Verification: scoped prettier, `vue-tsc` clean, 257/257 unit suite
(244 + 13 new), `git diff --check` clean, production build clean with the
admin graph absent from `dist`, serial e2e 18/18, and a live-admin smoke
(add a Heading → "Unsaved changes" with Save enabled → Ctrl+Z → "Ready")
with zero console errors.

Rollback: restore the inline closures and `makeId` in `admin/main.ts` and
delete the module and its tests.

#### Phase 4 SFC editor slice — 2026-08-21

The remaining Phase 4 work: the admin editor (catalogue, outline, inspector,
preview and the Style workspace) is now a Vue SFC, and `admin/main.ts` is a
thin mount point. The builder core stays pure — the rendered page and the
style showcase are still the string contracts of `render.ts` /
`style-showcase.ts`; the SFC hosts them via `v-html` and keeps the editor
affordances as DOM effects.

- `src/admin/useAdminEditor.ts` is the framework-facing editor core as a
  composable: it owns the single `BuilderStore` instance, the mode /
  viewport / style-group / tone state, the status and dirty contract, the
  save/load endpoints, the structural command dispatch and the editor
  shortcuts. Because the store is a plain (non-reactive) class, the
  composable keeps a revision counter that every action bumps; the panel
  computeds read it, so the templates repaint exactly when the legacy
  `renderEditor()` ran. DOM effects are injected (`updateIcons`,
  `setProperty`, `toggleClass`, `scrollIntoView`) so the composable is
  unit-testable in jsdom and a future lifecycle-safe preview can reuse one
  implementation.
- `src/admin/AdminApp.vue` is a 1:1 template port of the old `index.html`
  shell — the same ids and classes, so `admin/admin.less` is untouched.
  Static chrome (toolbar, catalog, tabs, tone and viewport groups) is
  template markup; the document outline, the preview (`v-html` of the pure
  renderer) and both inspector variants (element fields and the Style
  group's colors/values) are reactive over the store. The field set
  remounts on selection / history changes so inputs always start from the
  store's values, matching the legacy uncontrolled-render contract.
- The preview keeps its lifecycle-safe effects in one owner:
  `applyPreviewState` re-applies the `--builder-*` theme variables and the
  `is-selected` class after every action (a `v-html` swap wipes child
  classes, and a theme-only change does not alter the preview string at
  all), and the composable's `onMounted` / `onUnmounted` register and remove
  the document-level keydown and beforeunload listeners — no orphan
  listeners or timers across unmount.
- `admin/main.ts` is the mount point: it injects the admin stylesheet,
  registers the console and style-nav icon sets, and mounts `AdminApp` on
  `#jlz-admin`. `admin/index.html` now carries only the mount node.
- `src/__tests__/adminEditor.test.ts` (9 tests) covers the composable
  (load / fallback, add through command dispatch, Ctrl+Z undo, theme sync
  with the hex peer, selection) and an `AdminApp.vue` jsdom mount (catalogue
  and outline render, catalogue click adds a node, Style mode renders the
  16-group workspace).

Verification: scoped prettier, `vue-tsc` clean, 266/266 unit suite
(257 + 9 new), `git diff --check` clean, production build (592 ms) with the
admin graph absent from `dist`, serial e2e 18/18, and a live-admin smoke:
add a Divider → "Unsaved changes" with the node selected in outline, preview
and inspector → Ctrl+Z → "Ready"; Style mode accent edit (hex + swatch in
sync, `--builder-accent` applied) → Ctrl+Z → variables restored; preview
click selects the heading and reveals the node actions; viewport switch
updates the frame; zero console errors.

Rollback: the previous imperative entry is one commit back; restoring
`admin/main.ts`, `admin/index.html` and deleting `src/admin/` reverts the
slice. The commands slice (previous section) is unaffected.

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

#### Phase 5 AppShell + Vue Router candidate slice — 2026-08-21

The first Phase 5 step: the public app can now mount Vue after the inline
splash shell and let Vue Router own navigation, selected by the
`VITE_JLZ_VUE_ROUTER=1` candidate flag. The legacy DOM router in
`src/router.ts` stays the production default until the candidate gate passes
and the cleanup commit flips the default.

- `src/app/routes.ts` derives the `RouteRecordRaw[]` from the Phase 3 route
  manifest (no re-declared mapping): one record per manifest entry plus a
  catch-all that renders `home` under an unknown stale URL. `pageForPath`
  is the lenient initial-load resolution; in-app navigation stays strict —
  the candidate's anchor click capture handler and `jlz:navigate` listener
  strict-resolve against the manifest before pushing, so an unknown link is
  a no-op exactly as with the legacy router.
- `src/app/AppShell.vue` is the root SFC mounted on `#app` (the splash stays
  outside the Vue mount). It is intentionally thin: the static chrome
  (skip link, route announcer, splash loader) stays in `index.html` and
  moves in as the route and navigation SFC slices land.
- `src/app/PageView.vue` is the documented temporary primitive adapter for
  the route records: it hosts the string-template page contract
  (`src/pages`) in `#spa-content` and ports the legacy `renderView`
  side-effect sequence verbatim — the `dataset.page` write on body/html,
  WorkCards disposal before the DOM swap, home intro activation, i18n +
  per-page meta on every render, the route announcer on page change, the
  menu toolbar init, UIkit hydration and the `jlz:route-change`
  notification. Its removal phase is the per-route SFC migration + the
  Phase 5 cleanup commit.
- `src/app/index.ts` is the navigation owner: `createWebHistory` handles
  `popstate`, the section-hash dispatch ports the legacy contract (initial
  load defers `jlz:goto-section-by-hash` until `jlz:webgl-ready`; in-app
  hash navigations dispatch on the next frame), and the `jlz:lang-change`
  re-apply stays. The entry branch (`src/entry-app.ts`) inlines the flag
  check and pulls the candidate graph only through a dynamic `import('./app')`,
  so the default production build carries no Vue Router code at all.
- `src/__tests__/vueAppRouter.test.ts` (5 tests) locks the record/manifest
  bijection, the lenient fallback, and an `AppShell` + `PageView` mount over
  a real memory-history router (home render + `jlz:route-change` + meta,
  unknown direct entry, in-app push re-render).

Verification: scoped prettier, `vue-tsc` clean, 271/271 unit suite
(266 + 5 new), `git diff --check` clean, default production build with the
candidate and admin graphs both absent from `dist` (verified by marker
grep), flag-on build carrying the candidate chunk, serial e2e 18/18 on the
default build, and a live candidate smoke through the Caddy proxy
(`VITE_JLZ_VUE_ROUTER=1` dev server): direct entry `/` and `/works`,
in-app `jlz:navigate` to `/manifesto`, `history.back()` popstate to
`/works`, unknown route as a strict no-op, in-app `#section-*` hash
dispatching `jlz:goto-section-by-hash`, EN/RU re-apply, the route announcer
live region, per-page `<title>` and `dataset.page`, and a stable scene
canvas across every navigation (the native renderer is never recreated).
Zero console errors on the candidate path.

Rollback: delete `src/app/`, the `entry-app.ts` branch, the `env.d.ts`
extension and the test file; the legacy router is the untouched default.

#### Phase 5 semantic-route SFC slice (home + 5 content pages) — 2026-08-22

Bounded slice per the phase scope: the six public route records now point at
semantic route SFCs instead of the `PageView` string-template adapter.

- `src/app/views/*` are 1:1 ports of the legacy string templates
  (`src/pages/*`): `HomeView` (six cube-face sections incl. the `data-section`
  3D contract), `ServicesView`, `WorksView` (four authored compositions over
  `PROJECTS`), `ManifestoView`, `LabView`, `ContactView`. `NavMenu.vue` and
  `ContactFooter.vue` are the shared overlays (`mode: 'home' | 'content'`
  prop) ported from `src/sections/nav/template.ts` and
  `src/sections/lab-overlay/template.ts`; `navItems.ts` is the typed
  `NAV_ITEMS` port.
- `src/app/routes.ts` records now carry the SFC components directly
  (`meta.page` moved into the composable layer); `pageForPath` and the
  strict/lenient split are unchanged. `PageView.vue` is retained only as the
  documented temporary primitive adapter — no route target — pending the
  cleanup commit.
- `src/app/useJlzPage.ts` is the per-page lifecycle composable: the ported
  `renderView` side-effect sequence (dataset write, WorkCards disposal before
  the DOM swap, home intro activation, `applyTranslations` + `applyMetaTags`
  on every render, announcer only on a real page change, menu toolbar init,
  scoped `UIkit.update` + idle re-pass, `jlz:route-change`) now runs on
  `onMounted`/`onBeforeUnmount` with a scoped UIkit adapter instead of the
  document-wide update — the Phase 5 "UIkit lifecycle adapters" scope item.
  i18n/meta are applied by the SFC lifecycle (route provider), not by an
  imperative post-navigation hook.
- `src/app/index.ts` resolves the initial navigation before the mount and
  renders a fresh client app: the build-time `prerender-index` output in
  `#app` keeps the home route shell available before JS boots (SEO, the
  no-scene contract, the domcontentloaded e2e assertions) and is replaced by
  the SFC render on mount — a deliberate replace, not a hydration: the
  prerendered HTML is not a clean hydration target for Vue's condensed
  client render (whitespace text nodes, class-attribute drift).
- `src/entry-app.ts` gains the `?no-scene=1` no-scene bootstrap: it boots the
  UI layer and fires `jlz:webgl-ready` on a DOM-only world without pulling
  the Three/Experience graph — the evidence path for the candidate gate item
  "prerendered semantic route content remains available without scene
  startup".
- `src/__tests__/appSfcParity.test.ts` (6 tests) locks SFC ↔ string-template
  DOM parity per route (parsed-`<section>` fingerprint: structure +
  non-class attributes + text). `src/__tests__/vueAppRouter.test.ts` now
  asserts the SFC component per record. `tests/e2e.spec.ts` adds the
  no-scene boot + in-app navigation test and the direct content-route entry
  test (prerendered home sections must be gone once the router lands).

Verification: scoped prettier, `vue-tsc` clean, 279/279 unit suite
(271 + 6 parity + 2 prerender-adoption), `git diff --check` clean, default
production build with `jlz-admin` and `pathMatch` both absent from `dist`
(marker grep) and the prerendered home shell intact in `index.html`, flag-on
build carrying the candidate chunk only, serial e2e (incl. the two new
tests) on the default build, and the live candidate gate through the Caddy
proxy (`VITE_JLZ_VUE_ROUTER=1` dev server): direct entry `/` and `/works`,
in-app `jlz:navigate`, menu sub-link click (SPA, no reload), `#section-*`
hash dispatching the active section, `history.back()` popstate, the route
announcer on page change, EN/RU re-apply, the inverse-theme toggle,
keyboard Tab/Enter through the menu sheet, the `?no-scene=1` DOM-only boot
with in-app navigation and zero canvases, and a stable marked canvas pair
across every navigation (the native renderer is never recreated). Zero
console errors on the candidate path.

Rollback: the candidate flag off keeps the legacy router + string templates
as the untouched default; the SFCs and the composable are additive.

#### Phase 5 flip — Vue Router becomes the production default — 2026-08-22

The full candidate gate passed (live through the Caddy proxy + the
automated suites above), so the switch landed: `src/entry-app.ts` mounts
the Vue app by default and selected the legacy DOM router through the
build-time rollback flag `VITE_JLZ_LEGACY_ROUTER=1` (replacing the
`VITE_JLZ_VUE_ROUTER=1` candidate flag). The default production build
carries the Vue Router graph as the dynamic `app` chunk; `jlz-admin`
remains absent from `dist`. The e2e suite runs its 20 tests against the
Vue router path (default build). The rollback flag and the legacy path
were removed in the Phase 5 cleanup commit (below).

Flip contracts preserved while the legacy path stayed in the tree:

- the route-transition overlay (`.jlz-route-transition`) is now ported
  onto the router via `RouteTransition.cover()/reveal()` phases wired to
  `router.beforeEach`/`afterEach`; the initial navigation skips the cover
  (the legacy first render never ran a transition — nothing to cover);
- in-app navigation awaits the router's ready promise before pushing, so
  a `jlz:navigate` in the startup gap still lands as a history `push`
  (a push committed against the start entry would otherwise degrade to a
  replace and lose the first back slot);
- the e2e `waitForRouter` helper now waits for the navigation owner's
  first-page proof (`data-page` on `<html>`, set on both paths in the
  same task as the listener registration) instead of `main.less` alone.

Verification: `vue-tsc` clean, 279/279 unit, default build with
`jlz-admin` absent and the `app` chunk present, rollback-flag build
carrying both graphs, serial e2e 20/20 on the default (Vue) build, admin
smoke (status Ready, Control+z rollback after `document.body.focus()`,
no Save), and a live default-path smoke through the Caddy proxy (the dev
server restarted without the old candidate flag).

Rollback: while the legacy path stayed in the tree, a
`VITE_JLZ_LEGACY_ROUTER=1` build/serve restored the legacy DOM router.
The Phase 5 cleanup commit (below) removed the flag and the legacy path.

#### Phase 5 cleanup — legacy router, string templates and flag removed — 2026-08-22

With the flip stable, the legacy path was removed:

- `src/router.ts` (the legacy DOM router) deleted; `src/entry-app.ts`
  mounts the Vue app unconditionally via a dynamic `import('./app')` — the
  only edge into the Vue graph, so the router + route SFCs stay in a
  separate lazy `app` chunk and the initial entry chunk shrank to ~6.5 kB;
- `src/pages/*` (the string page/section templates) and `src/app/PageView.vue`
  (the string-template adapter) deleted;
- the `VITE_JLZ_LEGACY_ROUTER` build flag and its `ImportMetaEnv`
  declaration removed (`src/env.d.ts`);
- `RouteTransition.run()` (used only by the legacy router) removed — the
  phased `cover()`/`reveal()` API wired to the router guards is the sole
  transition owner;
- the build-time home prerender (`vite.config.ts` `prerender-index`) now
  sources the home SFC instead of the string templates: a new prebuild
  step (`scripts/prerender-home.mjs`, run by the `build` script before
  `vite build`) SSRs `HomeView.vue` to `prerender/home.html` through a
  throwaway Vite middleware server + `renderToString`, and the plugin
  inlines that file into `index.html`. The prerendered shell is still
  replaced — not hydrated — by the Vue client on mount, so the SFC is the
  single source of truth for the pre-JS home content;
- the SFC↔template parity suite (`src/__tests__/appSfcParity.test.ts`) and
  the string-template suite (`src/__tests__/pages.test.ts`) deleted — the
  templates they compared against are gone, and the SFCs are now validated
  by the e2e + unit suites and the live gate.

Verification: `vue-tsc` clean, 268/268 unit (11 tests removed with the
parity + template suites), `git diff --check` clean, `bun run build` with
the prerender prebuild (dist `index.html` carries the 6 prerendered home
sections), inverted dist grep (`jlz-admin` absent, `pathMatch` present in
the `app` chunk), serial e2e 20/20 on the default (Vue) build, and a live
default-path smoke through the Caddy proxy.

### Phase 6 — unified production renderer

Entry: Phase 2 is accepted.

Scope:

- move production to one `WebGPURenderer` and one TSL post graph on
  `WebGPUBackend`;
- calculate capabilities after initialization;
- **Fixed decision (2026-08-22):** on Three r185 the TSL `RenderPipeline` is
  WebGPU-only, and the `WebGLBackend` `NodeBuilder` cannot compile the GLSL
  fallback's raw `ShaderMaterial` passes (`fromMaterial` returns `null` for
  `ShaderMaterial` — no node class exists for raw GLSL). Version-gating a
  Three release that admits TSL post on `WebGLBackend` is not possible today,
  so the project retains the bounded GLSL fallback as the explicit
  forced-WebGLBackend post owner: it runs only on the dev-forced
  `?renderer=webgl` QA path (which constructs the classic `WebGLRenderer` and
  is stripped from production builds). Production constructs `WebGPURenderer`
  only; on `WebGLBackend` (auto-fallback) it renders the scene directly
  without post — the same direct-render contract Phase 2 accepted for the
  forced `WebGLBackend` path. The GLSL fallback's deletion is tracked against
  a future Three release that admits TSL post on `WebGLBackend` (Phase 10
  scope, rechecked at each Three bump);
- replace the secondary PMREM/WebGL context with a renderer-native or prebaked
  environment path;
- add bounded device-loss recovery;
- pass candidate parity while the classic path remains available, switch the
  migration flag to the target, then delete the classic path in a separate
  cleanup commit within this phase.

Status (2026-08-22):

- Slice 1 (done, `3c594bd`): the fixed decision is recorded above; PMREM uses
  the renderer-native TSL generator on `WebGPURenderer` and the classic
  generator only on the dev-forced `?renderer=webgl` path. The secondary
  offscreen WebGL PMREM context is removed.
- Slice 2 (done): the unified renderer runs behind the candidate flag
  `VITE_JLZ_UNIFIED_RENDERER=1` (`src/core/rendererBackend.ts` holds the pure
  policy: `planUnifiedBackend` + bounded `deviceLostAction`). With the flag
  set, `Renderer.init()` constructs `WebGPURenderer` only, inspects the actual
  backend after async init, re-creates the instance with `forceWebGL: true` on
  a software (SwiftShader) adapter (same class — never a classic
  `WebGLRenderer`), and calculates `DeviceCapability` mode from the actual
  backend. Bounded device-loss recovery (budget 1) disposes the pipeline +
  renderer, re-creates on the same canvas, rebuilds the pipeline, re-attaches
  the animation loop via the `Renderer.setAnimationLoop` owner boundary, and
  re-runs `setupEnvironment()` through the `jlz:renderer-recovered` event
  (the PMREM texture dies with the lost device). Flag off = today's behavior;
  the flag literal is stripped from default builds (dead-code eliminated).
- Slice 3 (open): candidate gate — every public route on a flag-ON build
  (automatic WebGPU + forced WebGLBackend), then the flag flip and the
  phase-exit cleanup commit.

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

| Contract                 | Current owner                                                                                                                                                                                                                     | Target owner                                                                 | Migration phase |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- | --------------- |
| splash readiness/failure | `index.html`, `entry-app.ts` + `bootstrapStates.ts` pure contract (inert until consumed)                                                                                                                                          | inline shell + bootstrap state machine                                       | 3, 5            |
| routes/hash/meta         | `routeManifest.ts`, `router.ts`, `pageMeta.ts`                                                                                                                                                                                    | route manifest + Vue Router                                                  | 3, 5            |
| scene route-page reads   | `routePage.ts` port (all scene consumers migrated: `World.ts`, `BakuCarousel.ts`, `CinematicNav.ts`, `ContentReveal.ts`, `Experience.ts`)                                                                                         | typed route port owned by the app providers                                  | 3, 5            |
| six world slots          | `worldSlots.ts` tuple + strict `worldSlotIndex` (consumed by `WorldConfig.ts`, `SplashCube.ts`, `CinematicNav.ts` slot-index constants)                                                                                           | domain tuple + `WorldRoot`                                                   | 3, 7, 8         |
| render demand            | `renderDemand.ts` pure decision contract (consumed: `Experience.update()` 1:1 swap — OR/breath/settle; `Experience._needsRender` stays the flag)                                                                                  | `RenderScheduler`                                                            | 3, 7            |
| motion preference        | `motionPolicy.ts` typed port (11 consumers); `entry-shell.ts` dataset hook for E2E/CSS (dead `syncReducedMotionDataset` removed 2026-08-21)                                                                                       | typed preference state owned by the app providers                            | 3, 5            |
| brand/runtime tokens     | `brandTokens.ts` manifest (87 tokens, mirrors `_import.less` §1 key-for-key, unit-locked; Less stays source of truth; ADR 0007 Neon Stage identity — status tokens + φ type scale; every parallel color source removed)           | typed manifest + generated adapters                                          | 3, 5            |
| motion preference        | `motionPolicy.ts` typed port (11 consumers; dead `syncReducedMotionDataset` writer removed); `entry-shell.ts` dataset hook for E2E/CSS                                                                                            | typed preference state owned by the app providers                            | 3, 5            |
| backend fallback         | `Renderer.ts`                                                                                                                                                                                                                     | `RendererFactory`                                                            | 2, 6            |
| post-processing          | dual `RenderPipeline` paths                                                                                                                                                                                                       | TSL graph (`WebGPUBackend`) + forced-WebGL fallback per the Phase 6 decision | 2, 6            |
| route GPU resources      | `World` lazy stages + `routeResourceScopes.ts` pure policy contract (inert until consumed)                                                                                                                                        | route resource scopes                                                        | 3, 8            |
| effective theme          | `sectionTheme.ts` pure decision + typed `ThemeAppliedPort` (consumed: `ContentReveal`/`Experience` 1:1 swap); base polarity = WorldConfig phase, mode = ThemeManager                                                              | typed theme state owned by the app providers                                 | 3, 5            |
| locale                   | `i18n.ts` typed port (`getLang`/`t` pull reads, `toggleLang` single writer, `jlz:lang-change` push)                                                                                                                               | typed locale state owned by the app providers                                | 3, 5            |
| story progress→section   | `storyProgress.ts` pure midpoint rule (consumed: `World.updateTransform` 1:1 swap, timing unchanged)                                                                                                                              | story progress contract owned by the app providers                           | 3, 5            |
| effective theme port     | `sectionTheme.ts` pure auto/inverse decision + typed `ThemeAppliedPort` (consumed: `ContentReveal` emitter, `Experience` handler; 1:1 swap)                                                                                       | typed theme state owned by the app providers                                 | 3, 5            |
| locale port              | `i18n.ts` typed port (`getLang`/`t` pull reads, single writer `toggleLang`, `jlz:lang-change` push; unit-locked incl. EN/RU parity)                                                                                               | typed locale state owned by the app providers                                | 3, 5            |
| story-state mapping      | `storyState.ts` pure contract (main→slot rescale, rounding rule, side edges; consumed 1:1 by `CinematicNav`; the DOM/scene desync invariant unit-locked)                                                                          | one `StoryController` publishing the typed `StoryState`                      | 3, 5, 7         |
| semantic UI              | string templates + UI classes                                                                                                                                                                                                     | Vue route/features + UIkit adapters                                          | 4, 5            |
| builder                  | pure core (`schema`/`catalog`/`compiler`/`render`) + `builder/store.ts` typed document/selection/history/baseline container + `builder/themeVariables.ts` preview variable contract (`admin/main.ts` only renders and dispatches) | Vue builder app (SFCs) over the same store                                   | 4               |
| static content           | standalone pages                                                                                                                                                                                                                  | shared SSG pipeline                                                          | 9               |

### Removal ledger

| Legacy element                           | Remove after                                                                                                                             | Status  |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| manual router and route `innerHTML`      | Phase 5 cleanup after parity — `src/router.ts` deleted 2026-08-22                                                                        | done    |
| scene `document.body.dataset.page` reads | Phase 3 per-owner port migration — all scene consumers migrated 2026-08-21; the dataset write stays (router + CSS scoping) until Phase 5 | done    |
| string page/section templates            | Phase 5 cleanup — `src/pages/*` + `PageView.vue` deleted 2026-08-22; prerender now sources the home SFC                                  | done    |
| classic `WebGLRenderer` fallback         | Phase 6 phase-exit cleanup                                                                                                               | pending |
| GLSL `ShaderMaterial` post chain         | Phase 6 phase-exit cleanup                                                                                                               | pending |
| raw `jlz:*` window bridge                | all consumers use typed ports                                                                                                            | pending |
| monolithic `Experience` coordination     | Phase 8 owner migrations                                                                                                                 | pending |
| legacy World adapters                    | Phase 8 completion                                                                                                                       | pending |
| migration flags and shims                | Phase 10                                                                                                                                 | pending |

## Definition of done

The migration is done when the target topology is the only production path;
all phase gates pass; both renderer backends, real mobile hardware and the full
interaction/accessibility matrix have evidence; budgets are met; the removal
ledger is empty; and root plus `docs/` Markdown contain no current-runtime
claims about removed implementations.
