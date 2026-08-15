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
- TSL NodeMaterials and one TSL post-processing graph on both backends;
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
6. One renderer-loop driver exists. After the Tres cutover, no project owner
   calls `renderer.setAnimationLoop`; the scheduler requests manual Tres frames
   through one `advance()` adapter. No scene subsystem starts its own
   `requestAnimationFrame` loop.
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

After Phase 7, the scheduler does not own `renderer.setAnimationLoop`.
TresCanvas runs in the manual mode proven by the representative spike and is
the only renderer-loop integration; the scheduler calls its single `advance()`
port when work is dirty or active. Before that cutover, the current Experience
loop remains the one driver. Phase 7 replaces the driver atomically rather than
running both during compatibility.

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
Phase 1 candidate matrix. It is a spike input, not installation approval:

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

### Phase 2 — representative renderer feasibility gate

This is not a rotating-box demo. The spike includes fog, representative TSL
materials, CanvasTexture, instancing, time uniforms, the environment and
SplashCube path, a Works texture plane, GLTF/DRACO, the complete TSL post
graph, resize/DPR, reduced motion, lazy mount/unmount and software-adapter
handling.

Acceptance:

- both `WebGPUBackend` and forced `WebGLBackend` render without the classic
  renderer;
- the chosen Tres lifecycle proves renderer initialization, actual-backend
  inspection, TSL pipeline readiness and a successful first render in order;
- fog and every representative material compile without console errors;
- the agreed visual-difference threshold passes;
- settled idle returns to zero draws;
- desktop and real-mobile p95 active-burst measurements stay within budget;
- after declared cache warm-up, repeated mount/unmount reaches a stable
  resource plateau and root destroy returns root-owned resources to baseline.

Failure response: keep the current production renderer, file the failing
contract with a reduced reproduction, redesign or upgrade the TSL/backend
adapter, and repeat this phase. Later renderer/Tres cutover phases remain
blocked; the Vue DOM migration may continue independently.

Rollback: the spike stays outside the production route graph until accepted.

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

- move production to one `WebGPURenderer` and one TSL post graph;
- calculate capabilities after initialization;
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
- no `ShaderMaterial` post pass remains;
- consumer search and the full focused suite pass after cleanup.

Rollback: retain the old renderer only through the candidate gate. After
cleanup, rollback means reverting the Phase 6 switch and cleanup commits, not
shipping two renderer implementations indefinitely.

### Phase 7 — persistent TresCanvas and legacy world adapter

Scope:

- make `SceneHost` a persistent Tres root;
- give a custom renderer factory, camera and scene exactly one owner;
- activate the proven async renderer initialization/readiness handshake and
  replace the Experience loop with the single Tres manual-mode adapter;
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

## Agent and branch workflow

`tres-vue-dev` is the integration branch. Codex, Pi/OMP and other agents do not
edit the same working tree concurrently. A remote agent receives a dedicated
worktree and branch, returns a focused commit and has no merge authority.

The durable read-only integration is a local MCP STDIO bridge exposing the
bounded `omp_consult` tool. It starts OMP in an isolated profile under an
unprivileged container account through a forced SSH gateway. Filesystem rights
and the gateway are the security boundary; write tools and agent subtask tools
remain disabled until a later, explicitly approved stage.

[AGENT_PIPELINE.md](AGENT_PIPELINE.md) defines the Queen/Worker roles, OMP
transport, task-packet schema, Qwen context-window budget, worktree protocol and
output contracts. It is mandatory for remote-worker tasks.

## Migration ledgers

The following ledgers are updated in this document during implementation.

### Traceability

| Contract                 | Current owner                 | Target owner                           | Migration phase |
| ------------------------ | ----------------------------- | -------------------------------------- | --------------- |
| splash readiness/failure | `index.html`, `entry-app.ts`  | inline shell + bootstrap state machine | 5               |
| routes/hash/meta         | `router.ts`, `pageMeta.ts`    | route manifest + Vue Router            | 3, 5            |
| six world slots          | `WorldConfig.ts`, `World.ts`  | domain tuple + `WorldRoot`             | 3, 7, 8         |
| render demand            | `Experience._needsRender`     | `RenderScheduler`                      | 3, 7            |
| brand/runtime tokens     | Less files + scene literals   | typed manifest + generated adapters    | 3, 5            |
| backend fallback         | `Renderer.ts`                 | `RendererFactory`                      | 2, 6            |
| post-processing          | dual `RenderPipeline` paths   | unified TSL graph                      | 2, 6            |
| route GPU resources      | `World` lazy stages           | route resource scopes                  | 3, 8            |
| semantic UI              | string templates + UI classes | Vue route/features + UIkit adapters    | 4, 5            |
| builder                  | `admin/main.ts`               | Vue builder app                        | 4               |
| static content           | standalone pages              | shared SSG pipeline                    | 9               |

### Removal ledger

| Legacy element                       | Remove after                   | Status  |
| ------------------------------------ | ------------------------------ | ------- |
| manual router and route `innerHTML`  | Phase 5 cleanup after parity   | pending |
| string page/section templates        | Phase 5 matching-slice cleanup | pending |
| classic `WebGLRenderer` fallback     | Phase 6 phase-exit cleanup     | pending |
| GLSL `ShaderMaterial` post chain     | Phase 6 phase-exit cleanup     | pending |
| raw `jlz:*` window bridge            | all consumers use typed ports  | pending |
| monolithic `Experience` coordination | Phase 8 owner migrations       | pending |
| legacy World adapters                | Phase 8 completion             | pending |
| migration flags and shims            | Phase 10                       | pending |

## Definition of done

The migration is done when the target topology is the only production path;
all phase gates pass; both renderer backends, real mobile hardware and the full
interaction/accessibility matrix have evidence; budgets are met; the removal
ledger is empty; and root plus `docs/` Markdown contain no current-runtime
claims about removed implementations.
