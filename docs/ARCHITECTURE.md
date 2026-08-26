# Architecture

This document records system boundaries that are easy to miss when reading one module. Source, configuration and tests describe current
implementation details. The
[completed migration archive](archive/MIGRATION_VUE_TRES.md) records
sequencing history; [ADRs](adr/README.md) record durable decisions.

## System overview

The production application is Vue 3, Vue Router and TresJS over a single
Three.js `WebGPURenderer` (the only renderer class the app constructs). The
The [completed migration archive](archive/MIGRATION_VUE_TRES.md) records the
phased transition that shipped this topology and the [ADRs](adr/README.md)
record the decisions.

```text
index.html inline splash (classic script, outside the initial graph)
  -> entry-shell.ts (tiny shell)
  -> entry-app.ts
     -> Vue AppShell
        -> Vue Router + lazy semantic route components
        -> UIkit + typed eventBus ports
        -> persistent SceneHost/TresCanvas
           -> renderer factory (one WebGPURenderer)
           -> RenderScheduler + RenderPipeline
              (+ WebGPUPostPipeline TSL graph on WebGPUBackend)
           -> World + stable six slots + lazy route scopes
```

Standalone blog and published builder pages share the brand without loading
the 3D runtime: the SSG pipeline preserves that capability — content-only
documents never hydrate TresJS or Three.js.

The development-only Page Builder remains a separate application under
`admin/`. Its production-safe schema, validation, renderer and compiler remain
under `src/builder/`; the public builds do not import the editor graph.

## Stable product invariants

- The inline splash paints before application, Vue, UIkit, TresJS and Three.js
  code. Enter is enabled only after renderer and initial-scene readiness;
  failure stays explicit and retryable.
- Semantic DOM is the interaction and accessibility layer. The single canvas
  is decorative and `aria-hidden`.
- The world retains six stable slots. Route identity does not redefine slot
  identity.
- `EnvSphere` owns the ambient background. The contact state owns the ground.
- Actual initialized backend determines renderer capability, DPR and post
  quality.
- TSL post quality is enabled only for a non-low native `WebGPUBackend`.
  `WebGLBackend` is an explicit direct-render parity path and does not update
  unused post uniforms or advertise post processing.
- TSL post-graph construction restores renderer tone mapping in a `finally`
  path, so a failed graph build cannot leak partial color-transform state.
- One renderer-loop driver exists. `RenderScheduler` owns demand policy and
  requests bounded work from the one bounded renderer loop adapter;
  settled idle performs no draw work and hidden tabs pause.
- Terminal renderer recovery failure is a hard loop boundary: later scheduler
  invalidation cannot reattach a callback to the failed renderer. The
  WebGLBackend direct-draw fallback temporarily clears scene fog and restores
  the shared scene state in all exit paths.
- Reduced-motion branches synchronously reach the authored final state and
  release render activity; entry title/eyebrow observers do not allocate RAF
  loops or safety timers in reduced-motion mode.
- Works card deformation and reveal transitions follow the same contract:
  transient TSL uniforms settle to rest and visible card opacity reaches its
  target in one update.
- `CinematicNav` treats story parallax as decorative policy state; enabling
  reduced motion clears its CSS shifts synchronously without changing route,
  section or accessibility state.
- `RouteTransition` owns its temporary overlay and timers; router error
  handling disposes that owner so failed navigation cannot retain detached DOM
  or pending callbacks.
- `FullscreenOverlay` only reloads its video element when replacing an actual
  film source; image-only Works handoffs do not trigger empty media resets.
- Persistent `UIMenu` controls rehydrate only the changed UIkit icon after a
  typed sound-toggle event; the shell retains one delegated DOM listener and
  one disposal owner.
- `SfxSystem.dispose()` is terminal for its Web Audio owner; late `play()` calls
  are silent no-ops and cannot allocate a replacement context after teardown.
- `BlurFade.hide()` restores the authored text node and removes reveal-only
  `aria-label`/data state, preventing hidden route owners from retaining span
  DOM and inline animation styles.
- `NoiseText.finalize()` restores clean text only after a non-empty reveal has
  established source state; hiding an unstarted owner preserves authored DOM.
- `ThemeManager.setMode()` is idempotent; unchanged mode requests do not emit
  theme re-application or trigger scene synchronization work.
- `RenderScheduler` stops its loop when a host frame throws, restoring the
  driver invariant that a failed window is not left active; later invalidation
  remains the explicit retry boundary.
- `SceneCoordinator.init()` clears derived config/range caches before rebuilding
  a route, so a reused coordinator cannot resolve the previous page's scene
  contract.
- Terminal renderer recovery emits `jlz:webgl-failed` before the unsupported
  overlay, keeping the bootstrap state machine aligned with the actual failed
  renderer lifecycle.
- `Experience` observes the live reduced-motion media query for the lifetime
  of the runtime. Enabling it cancels ambient breathing and settles the single
  render scheduler; disabling it raises one `motion-preference` invalidation.
  Teardown removes the observer before releasing the runtime owners.
- `SplashCube.rotateToFace()` snaps synchronously under reduced motion because
  `SceneCoordinator` skips decorative cube animation in that mode; no face
  transition may leave `_faceLerp` active or keep render demand alive.
- `SplashCube` also settles face, jelly and opener state synchronously when the
  live reduced-motion preference changes, before scheduler settlement.
- `ContactCyprusStage` settles its route-local fade and scale synchronously on
  the same live preference change; no hidden route owner retains render demand.
- `Camera` settles persistent section FOV framing while cancelling transient
  pulse/shake and cursor displacement on the same live preference change.
- The lazy Contact typography owner receives the same live preference while
  mounted. Its glyphs settle synchronously on enable and resume bob/sway on
  disable, so route re-entry is not required to reconcile motion state.
- `SplashCube` does not claim continuous ambient activity for its decorative
  idle transform; settled scenes remain zero-draw. Only jelly, face and opener
  reactions enter the activity contract, and no unrelated demand frame mutates
  an unowned time-based rotation.
- `EnvSphere.changeSection()` snaps its palette when reduced motion is active;
  normal motion retains the authored interpolation, while reduced-motion
  teardown cannot leave the background between section colors.
- `EnvSphere` also settles an already-running palette crossfade synchronously
  when the live reduced-motion preference changes, before the scheduler pause.
- `CinematicLights` applies the same reduced-motion boundary to section light
  transitions: colors, intensities and key position snap to their targets and
  skip interpolation/orbit work; normal motion retains authored lerp timing.
- A failed native-WebGPU TSL post-graph build is terminal for that
  `RenderPipeline` owner: it disposes the partial graph and uses direct
  rendering thereafter, so the demand scheduler cannot retry the same failure
  indefinitely. A renderer recovery creates a fresh post owner.
- `WebGPUPostPipeline` retains the TSL scene `PassNode` separately from the
  `RenderPipeline` because the pass owns its own render target. Rebuild,
  construction failure and teardown dispose that pass exactly once.
- If the frame owner throws, `Experience` clears the pending demand and marks
  that scheduler window failed, so the loop settles instead of retrying the
  same broken frame indefinitely. A subsequent typed invalidation may retry.
- Exhausting the bounded device-loss recovery budget is terminal: `Renderer`
  clears its callback and detaches the live renderer loop before surfacing the
  explicit failure state.
- Cursor activity, including click bump animation, wakes the shared
  demand-driven scheduler; no cursor animation may mutate state while the loop
  remains settled.
- FullscreenOverlay owns its title BlurFade lifecycle and cancels it during
  teardown even for hidden/preloaded overlays, preventing detached DOM from
  remaining in the animation registry.
- BakuCarousel exposes a typed activity wake port to Experience; pointer/touch
  target changes cannot strand the shared render loop in its settled state.
- Works visual-plane taps route through `WorksPlaneStage.openProject`, so the
  stage remains the sole owner of card pulse state and the shared loop is woken.
- DrawTrail reuses camera-basis scratch vectors during ribbon rebuilds; its
  render-loop path does not allocate transient basis objects per frame.
- WorksPlaneStage reuses its scaled viewport layout scratch object while
  updating visible cards, keeping per-frame layout allocation-free.
- SceneCoordinator returns one synchronously-consumed pooled transform result;
  camera/world metadata does not allocate a nested object graph per frame.
- Experience reuses one `RenderActivity` snapshot for demand predicates; the
  scheduler-facing activity flags do not allocate a new object per frame.
- Renderer reuses one `PostParams` wrapper when forwarding display values to
  the WebGPU pipeline; WebGL direct rendering performs no post work.
- EnvSphere section palette transitions reuse their weight arrays, keeping
  route/section changes allocation-free at the owner boundary.
- Direct scene owners such as `EnvSphere` and `SplashCube` detach themselves
  from the live graph before releasing GPU resources; a destroyed owner cannot
  remain as a child of the Tres-owned scene with invalid GPU state.
- `Camera` and `Cursor` have terminal, idempotent teardown boundaries. After
  disposal, late scheduler frames and external callbacks are inert; `Cursor`
  also releases its activity wake callback and DOM drawing context.
- `EnvSphere` has a terminal, idempotent teardown boundary. After its shared
  ambient materials and geometries are released, late palette, preference and
  frame calls cannot mutate disposed GPU resources.
- `CinematicLights` has a terminal, idempotent teardown boundary. Once its
  detached lights are disposed, late section, preference and frame calls are
  inert and cannot mutate released scene resources.
- `JunniParticles` has a terminal, idempotent teardown boundary. After its
  instanced geometry and TSL material are released, late timeline, blending
  and count-reduction calls cannot rebuild or mutate disposed GPU state.
- `GroundPlane` has a terminal, idempotent teardown boundary. After its contact
  geometry and material are released, late config, theme, transform and
  visibility calls cannot mutate detached GPU resources.
- `SectionGroups` has a terminal, idempotent teardown boundary. After its
  recursive scene-resource disposal completes, late slot lookup returns no
  owner; carousel-first disposal ordering remains authoritative.
- `CasePlane` has a terminal, idempotent teardown boundary. After its
  per-card NodeMaterial is released, late reveal/motion/frame calls are inert;
  the shared card geometry and cache-managed texture are never disposed by the
  card owner.
- `Section` has a terminal, idempotent StateBus boundary. Once its state and
  opacity channels/listener are removed, late transitions cannot recreate or
  mutate those channels, and the detached section cannot re-enter the scene.
- `WorksPortfolio` has a terminal, idempotent callback boundary. After project
  metadata and carousel callback release, late navigation is inert and cannot
  mutate the retired index.
- `Cursor.drawCircle()` reuses one owner-scoped ring-point buffer and color
  view. The active pointer path remains allocation-free while theme refreshes
  mutate only the cached values.
- Camera spring state and scratch math objects are owner-scoped. Multiple
  wrapper instances may be constructed during recovery or tests without
  sharing cursor-follow history or mutable Three.js temporaries; the
  externally owned `PerspectiveCamera` remains undisposed by the wrapper.
- `DrawTrail` creates its TSL uniform set and color/opacity node closures per
  owner. Trail time, velocity and energy are never shared across route-stage
  instances; geometry/material disposal remains explicit at that owner.
- `ParticleBurst` creates its trace time/duration uniforms and TSL node
  closures per owner. Triggering one intro burst cannot advance another
  burst's shader timeline; terminal geometry/material disposal remains
  unchanged.
- `BakuCarousel.dispose()` is terminal and idempotent. Public controls,
  scheduled snapping and late render updates are inert after route teardown;
  `isAnimating` settles false and no retired carousel can wake the shared
  demand scheduler.
- `WorksPlaneStage.dispose()` is terminal and idempotent. Route controls,
  resize/camera binding, hit-tests, shader prewarm and frame updates are inert
  afterward; async texture setup still re-checks disposal before creating
  cards or retaining cache references.
- `SplashCube.dispose()` is terminal and idempotent. Late section, theme,
  material and frame callbacks cannot mutate freed cube resources; all three
  animation predicates return false after teardown so the persistent scene
  host cannot retain demand.
- `ContactCyprusStage.dispose()` is terminal and idempotent. Camera binding,
  route activation, prewarm, resize and update calls are inert after Contact
  teardown; its async Draco/GLTF load still disposes a late scene before it
  can attach to the route owner.
- Native WebGPU post processing is conditional on the selected quality policy;
  low-tier instances render the scene directly and do not construct a TSL
  `PassNode` graph whose effects are disabled.
- Unified renderer instances have an idempotent disposal boundary because Tres
  retains its own manager cleanup callback while SceneHost and `Renderer` own
  recovery/unmount cleanup. Failed renderer initialization is disposed before
  the scene-host bridge rejects.
- Route resources, listeners, timers, async work and GPU allocations have one
  owner and one terminal cleanup path.
- `RouteTransition` owns both cover and reveal timers. Cancellation clears the
  active timer and settles its cover promise, so failed or superseded
  navigation cannot retain a stale 260 ms continuation.
- `NoiseText` and `BlurFade` register only active animation instances. The
  `Experience` teardown drains both registries before releasing scene/UI
  owners, cancelling RAF and safety timers even while their DOM remains
  connected.
- `ExperienceUI` owns `WorksPortfolio` for its full lifetime and calls
  `dispose()` before releasing it. The portfolio drops project and callback
  references and guards empty navigation, so a late UI event cannot retain or
  invoke a destroyed owner.
- The exported `Input` singleton is restartable: `Experience.init()` calls its
  idempotent `start()` after a previous `destroy()`, restoring the shared mouse
  listener for Camera and DrawTrail without constructing a second singleton.
- `Experience.init()` and `buildWorld()` carry a lifecycle generation across
  long async work. `destroy()` invalidates it; every renderer/coordinator/
  prewarm continuation checks the token before publishing state or creating
  final scene owners.
- `FullscreenOverlay.dispose()` settles an open UIkit modal through the same
  idempotent hide owner used by normal close before aborting listeners and
  destroying the component. This restores media, focus, keyboard and body
  scroll state and invokes only the current per-open callback.
- `Experience.destroy()` is partial-init safe: optional DOM, coordinator and
  state-bus owners are released only when they exist, while mandatory
  scheduler/renderer/camera/size/audio owners still release on every failed
  bootstrap path.
- UIkit remains the layout/component/accessibility baseline where retained;
  project styles express the 3D shell and authored compositions.
- Published Builder cards and buttons keep UIkit as the owner of base geometry
  through `.hook-card()`/`.hook-button()`; builder-specific Less must not
  restate their radius or shadow, so separate `cardRadius`/`buttonRadius`
  tokens remain effective.
- UIkit hydration is scoped to the owner that just changed: route mounts update
  the page root, while `ContentReveal` updates only the active section and its
  UIkit ancestor chain; no section change performs a document-wide traversal.
- Shared navigation controls consume the canonical `jlz-nav-control-shadow`
  brand token; component Less must not reintroduce a hardcoded shadow value.
- Scroll layout, snapping, overflow and reduced-motion scroll behavior are
  selected from Vue-owned route roots (`data-page-view="home|content"` and
  `.jlz-page`); the
  `data-page` projection is not a layout owner.
- No phase may weaken startup, frame-time, memory or delivery budgets merely
  to accommodate framework overhead.

## Routes and world slots

The typed route manifest (`src/core/routeManifest.ts`, exposed to the app by
`src/app/routes.ts`) is the single input for Vue Router records, lazy
components, metadata/i18n keys, menu links, SSG paths, sitemap,
route-scene loaders and initial hash/story commands.

The canonical slots are:

| Index | ID        | Product role     | Route owner                     | Scene owner         |
| ----: | --------- | ---------------- | ------------------------------- | ------------------- |
|     0 | `lab`     | Contact finale   | `sections/lab*`                 | stable slot 0 scope |
|     1 | `intro`   | Story frame 1    | `sections/intro`                | stable slot 1 scope |
|     2 | `about`   | Story frame 2    | `sections/about`                | stable slot 2 scope |
|     3 | `works`   | Story frame 3    | `sections/works`                | stable slot 3 scope |
|     4 | `contact` | Story frame 4    | `sections/contact`              | stable slot 4 scope |
|     5 | `menu`    | Navigation sheet | `sections/menu`, `sections/nav` | stable slot 5 scope |

The public Contact finale intentionally occupies the runtime `lab` slot.
`/lab` is a separate route whose experiments load through isolated scopes.
`src/core/worldSlots.ts` is now the single framework-neutral readonly source
of the six-slot model; `WorldConfig.ts` and `SplashCube` consume it instead
of re-declaring the slot ids, face rotations and story ranges.
`WorldConfig.DEFAULT_CAMERA_SMOOTHING` is likewise the single fallback for
camera arrival smoothing; authored phase overrides stay in each `PhaseConfig`.

`CinematicNav` owns four story frames plus the Contact and Menu sheets. It
accepts router/hash/input commands and remains the native story source;
`StoryController` translates its typed snapshots for subscribers. Vue Router
never scrolls the story DOM independently of that controller.
Each generated navigation button has a named handler retained by the
`CinematicNav` owner; `dispose()` removes those handlers before releasing the
button collection, so retained or detached button DOM cannot call a disposed
navigation instance.

## Current ownership

| Concern              | Owner                                                                                |
| -------------------- | ------------------------------------------------------------------------------------ |
| Bootstrap            | `entry-shell.ts`, `entry-app.ts`                                                     |
| Routes and content   | `app/routes.ts`, `routeManifest.ts`, `sections/*/template.ts`                        |
| Renderer and loop    | `Experience/Renderer.ts`, `RenderPipeline.ts`, `RenderScheduler.ts`, `SceneHost.vue` |
| World composition    | `SceneCoordinator.ts`, `WorldConfig.ts`, `Experience/Scene/SectionGroups.ts`         |
| Navigation and UI    | `CinematicNav.ts`, `UIMenu.ts`, `UIManager.ts`                                       |
| Project presentation | `WorksPlaneStage.ts`, `FullscreenOverlay.ts`                                         |
| Contact presentation | Vue semantic contact views + `ContactTypographyStage.ts`                             |
| Preferences/events   | `ThemeManager.ts`, `i18n.ts`, `EventBus.ts`                                          |

The current renderer is always `WebGPURenderer` (the only renderer class the
app constructs). When the resolved WebGPU adapter is software (or WebGPU is
unavailable), the automatic software-adapter policy re-creates the same class
with `forceWebGL: true`, landing on `WebGLBackend`. `WebGPUBackend` runs the
TSL post graph (`RenderPipeline` + `WebGPUPostPipeline`); `WebGLBackend`
renders the node-material scene directly (the classic `WebGLRenderer`, nodes
compatibility handler and GLSL `ShaderMaterial` passes were removed in
Phase 10 slice 2 2026-08-22).

`RenderScheduler` combines demand rendering with bounded animation reasons;
the per-frame raise/settle decision reads the typed
`RenderActivity` flags through the `src/core/renderDemand.ts` contract (the
12-flag OR and the narrower ambient-breath idle set are unit-locked). Route
replacement releases DOM behavior; `Experience.destroy()` closes the shared
runtime. `/works` and `/contact` own lazy scene stages that dispose or cache
according to their current measured policy.

## Ownership

### Application and content

- `app/` owns the Vue bootstrap, `AppShell`, the persistent `SceneHost.vue`,
  `entry-shell.ts` / `entry-app.ts` own the pre-Vue shell and the post-splash
  application bootstrap, and Vue Router records (`routes.ts`) own the lazy
  semantic route views.
- `UIMenu` owns UIkit hydration for the persistent shell; route roots own their
  scoped UIkit update through `useJlzPage`, so bootstrap does not traverse the
  whole content tree a second time.
- `ContentReveal` resolves and activates sections only within `#spa-content`,
  keeping route theme/section ownership separate from persistent shell DOM.
- Experience's DOM-facing section signals use that same root boundary; the
  document fallback exists only before the Vue route shell is mounted.
- Bootstrap's route-content observers follow the same boundary; only splash and
  persistent-shell controls intentionally resolve from the document root.
- `WorkCards` discovers cards and owns delegated grid listeners only within
  `#spa-content`; detached and persistent-shell grids remain outside that route
  owner. `useJlzPage` disposes this module-level registry both before the next
  route settles and when the owning Vue route unmounts, so detached grids do
  not retain listeners or debounce timers through root teardown.
- The menu template adapter resolves its nav bindings, preview synchronization
  and same-page hash targets within `#spa-content`; detached menu markup is not
  an application owner.
- Fullscreen project navigation raises the shared `nav` demand after changing
  the carousel target; demand-driven rendering must not rely on unrelated input
  to advance a settled scene.
- BakuCarousel advances CasePlane time only for visible or already-animating
  cards while active; hidden idle cards retain the CasePlane idle guard.
- BakuCarousel teardown removes its window input owners and releases the
  camera/card callback references before resetting motion state, so a disposed
  carousel cannot retain the Experience UI closure or stale interaction state.
- BakuCarousel texture initialization tracks each successful cache acquisition;
  a partial load failure releases only those refs, never decrementing a shared
  URL owned by WorksPlaneStage or another carousel.
- BakuCarousel momentum uses elapsed-time damping calibrated at 60 Hz, so
  refresh-rate changes do not alter the carousel's post-drag travel duration.
- ContentReveal owns the global `uk-light` mutations it performs: it snapshots
  the pre-existing `html` and `body` class state and restores both on teardown,
  so a retry or HMR cycle cannot inherit a previous runtime's theme.
- Renderer async initialization publishes a candidate only after its lifecycle
  generation remains current; stale WebGPU candidates are disposed immediately
  and cannot create a pipeline or device-loss recovery owner after teardown.
- SceneHost owns a generation for its asynchronous fallback swap; unmount
  invalidates that generation and disposes a late candidate before it can
  replace Tres's renderer or resolve the one-shot bridge.
- SceneHost also retains the resolved renderer as its live construction owner;
  unmount disposes it, including the path where the initial candidate loses the
  lifecycle race before fallback resolution.
- WorksPlaneStage marks itself disposed before releasing route resources; a
  pending texture batch releases its cache references and exits before creating
  cards, preventing stale WebGPU/TSL setup after leaving `/works`.
- WorksPlaneStage also refuses initialization after disposal, preventing a
  stale route owner from restarting texture decoding or cache acquisition.
- ContactCyprusStage prewarming is published only by its guarded lazy-owner
  continuation. The entry bootstrap does not attach a second promise callback,
  so a stale Contact request cannot make a later stage visible or add an extra
  warm-up frame.
- ContactTypographyStage marks itself disposed before releasing its
  WireframeTypography resources; late route callbacks cannot reactivate or
  update the disposed owner, and repeated teardown is idempotent.
- WireframeTypography makes disposal terminal: it clears its glyph registry,
  marks motion inactive and ignores later activation, theme and update calls.
- Renderer device-loss recovery fails closed: if replacement creation fails,
  the old loop is cleared, an explicit unsupported state is shown, and update/
  resize calls cannot touch the disposed renderer.
- WorksPortfolio ignores non-finite `goTo` input before modulo arithmetic, so
  malformed overlay events cannot propagate `NaN` into carousel navigation.
- FullscreenOverlay owns one autoplay timer: scheduling coalesces it, and media
  replacement or disposal clears it before the next video-play continuation.
- Camera clamps only negative or stall-sized deltas; it does not impose a
  fixed 120 Hz minimum step, preserving motion timing on high-refresh displays.
- BakuCarousel momentum treats velocity as 60 Hz frame units and scales both
  decay and displacement by elapsed time, so a fling has the same travel at
  different refresh rates.
- Ref-counted case-texture releases from late async owners include texture
  identity; retired in-flight generations cannot release a replacement URL
  entry created after global teardown.
- Renderer recovery checks its lifecycle generation in the failure path too;
  a teardown-raced rejection cannot surface unsupported UI or touch a disposed
  renderer instance.
- Renderer fallback recovery clears the retired software-adapter replacement
  before starting forced-WebGL creation, so a failed second attempt cannot
  dispose the same GPU owner twice.
- WebGPU post rendering restores the renderer's prior tone-mapping state in a
  `finally` block, including when TSL render throws during device loss.
- PostProcessingManager exposes its live display values as a read-only view;
  Renderer snapshots them into its existing per-frame pipeline params object.
- EventBus emits from a subscriber snapshot, so `off()`/`clear()` during a
  handler affects future events without truncating the current dispatch.
- Render demand and particle updates require the particle object to remain
  visible; hidden Contact particle groups cannot keep settled frames alive or
  consume animation updates.
- Route-owned Works and Contact stages clear camera references, active flags and
  child graphs during disposal so stale async owners cannot retain scene state.
- BakuCarousel and WorksPlaneStage release shared case textures with the
  acquired texture identity; retired cache generations cannot decrement a
  replacement URL entry.
- LabGamepad clears its child graph after disposing geometry and materials, so
  stale route owners cannot retain disposed mesh trees.
- DrawTrail clears its ribbon child and activity state during disposal, so the
  persistent scene owner cannot retain a disposed cursor mesh.
- The builder compiler treats `card` as an application-baseline UIkit component;
  `_import.less` owns the real import, published page Less emits only component
  deltas, and generated artifacts are parity-tested to prevent drift.
- Contact section activation captures the same Cyprus request generation before
  awaiting lazy initialization; a stale route callback cannot call `setActive`
  or raise render demand on a newer stage.
- ContactCyprusStage marks itself disposed before route resources are released;
  a GLTF result that resolves after disposal is traversed and released without
  being attached, avoiding detached materials and geometry setup.
- `SceneCoordinator.update(_, false)` is a state-sync-only path for route
  owners: it never advances Works or Contact animation clocks without a frame,
  preserving the demand-driven invariant that authored time advances only when
  the resulting frame can be presented.
- CinematicNav resolves `#section-*` targets inside its currently bound route
  track, keeping detached and persistent-shell IDs outside story ownership.
- `entry-app` owns the delayed splash title handoff; its timer is cancellable
  and coalesced across Enter/retry/failure transitions before title observation
  begins.
- `entry-app` exposes one start gate: concurrent or repeated `startApp()` calls
  share the active bootstrap attempt. A rejected attempt resets the gate for a
  later retry, and `resetBootstrapBindings()` aborts DOM listeners, event-bus
  subscriptions, watchdogs, splash timers and title observation before the
  next attempt binds them again.
- `initMenuToolbar()` returns the disposer for the app-owned menu bindings;
  `useJlzPage` invokes it before route-root unmount. Pending visibility RAFs are
  cancelled together with subsection/toggle listeners, while UIkit-owned
  accordion behavior remains outside this disposer.
- `RouteTransition` is cancelled from the Vue Router error port; failed async
  navigation must invalidate pending reveal work and return the transition
  surface to `idle`.
- Direct-entry `#section-*` handoff is generation-owned until readiness; later
  navigation and router errors invalidate the deferred event before it can
  reach `CinematicNav`.
- In-app hash dispatch owns one cancellable frame through
  `createSingleFrameOwner`; a later navigation or router error cancels the
  pending continuation physically and invalidates its callback token.
- A failed `entry-app` attempt disposes its local `Experience` and `UIManager`
  owners before publishing failure. Retry is allowed only before the one-shot
  `SceneHost` bridge is imported; once that bridge is in play, failure is
  terminal rather than creating a second renderer/canvas owner.
- `RenderScheduler` checks both its destroyed and active-loop state inside the
  frame callback itself. Removing the callback from the driver is not the only
  guard: a callback already captured by a renderer or swap-chain tick must not
  reach scene owners after teardown or a settled frame.
- `entry-app` owns the delayed `jlz:webgl-ready` event through a generation-
  guarded timer. Reset and failure clear the timer before replacing bindings;
  a zero-delay reduced-motion event follows the same owner and cancellation
  contract.
- Retry-owned bootstrap resources have explicit owners: the injected Less
  `<style>` is replaced/removed through `createStyleOwner`, and
  `ErrorTracker.dispose()` removes its window handlers before a retry. Terminal
  post-SceneHost failures retain diagnostics without creating another owner.
- BlurFade treats title content as text at the DOM boundary and creates spans
  without `innerHTML`; translated/editorial markup cannot become live nodes.
- RouteTransition owns at most one pending reveal timer and clears it when a
  newer transition or router error invalidates the previous handoff.
- `core/` owns the framework-neutral contracts (route manifest, world slots,
  typed event ports, i18n, theme, motion policy) and imports no Vue or TresJS.
- `sections/` owns the per-route content templates consumed by the route views;
  `UI/` owns the DOM feature controllers (cinematic navigation, menu, works
  plane, fullscreen overlay).
- `builder/` retains framework-neutral schema, validation, escaping and
  compilation; `admin/` is the development-only Vue editor application.

Vue owns the DOM structure. UIkit components are mounted through typed
wrappers that initialize after mount and dispose before unmount; neither Vue
nor UIkit owns a competing focus trap.

### Scene and renderer

- one persistent `SceneHost.vue` owns the only Tres root for the public
  runtime;
- one renderer factory owns creation, initialization, backend inspection,
  the automatic software-adapter policy and device-loss recovery;
- one framework-neutral render scheduler owns invalidation and bounded
  activity tokens; its one bounded `setAnimationLoop` driver is active only
  while dirty or active and stops at settled idle;
- `RenderPipeline` runs the TSL post graph on `WebGPUBackend`; on
  `WebGLBackend` the node-material scene renders directly (the classic
  renderer and GLSL post chain were removed in Phase 10 slice 2);
- the world owns the stable six-slot containers;
- route scene scopes own abort/generation state and their GPU resources;
- no `scene/legacy/` adapters remain (removed in Phase 10 slice 1).

Scene code does not query `document.body.dataset`, translations or router
state. Typed readonly ports carry route, locale, effective theme, reduced
motion and story progress into the scene. Scene code emits typed intents and
runtime failures; it does not mutate route DOM.
The story-side port follows the same boundary: `CinematicNav.getSide()` flows
through `Experience` and `SectionGroups` into the Works `BakuCarousel`. The
`cinematicSheet` body dataset remains a UI/CSS projection written by the
navigation owner; scene input never reads it.
Renderer recovery also crosses an explicit owner port: `sceneHost.replaceRenderer()`
updates both the Tres context and the SceneHost live-renderer slot, keeping Vue
unmount disposal aligned with the renderer currently driven by `Experience`.
`SceneCoordinator` receives the current `PageId` through an injected getter;
the application boundary owns the typed in-memory route port, while Vue route
roots own their semantic `data-page-view` markers. The coordinator itself has
no DOM route dependency.
`ExperienceUI` consumes that same page port for navigation and lazy-owner
gates, so UI feature logic also remains independent of the route DOM source.
`Experience` receives the page getter from `entry-app.ts` and uses it for
route-sensitive owner/lifecycle decisions; renderer host options do not carry
route state.
`CinematicNav` receives that same getter from `ExperienceUI`; its semantic
section-anchor queries remain unchanged, while route mode uses only typed `PageId`.
`ContentReveal` receives the same getter from `Experience`; it uses the port
only for selecting cached world configuration. Its DOM queries remain limited
to semantic section anchors and do not become a second route-state source.

### Dependency direction

```text
core contracts (route manifest, world slots, typed event ports)
  <- app/ (Vue bootstrap + route views + providers)
  <- UI/ (DOM controllers)
  <- Experience/ (scene, renderer, world)

builder domain
  <- admin/ (Vue editor)
```

Application UI and scene are sibling layers above the framework-neutral core
contracts; they communicate through the typed eventBus ports, and the only
cross-imports are type-level and shared-effect seams. One manifest or
contract replaces each duplicated fact before the old copies are removed.

## Bootstrap and failure handling

The bootstrap is an explicit state machine:

```text
shell-painted
  -> app-loading
  -> renderer-initializing
  -> scene-prewarming
  -> ready
  -> entered

any initialization state -> failed -> retry
```

The splash is not a Vue component. A retry disposes the incomplete renderer
attempt before creating a new one. `ready` is published only after the actual
backend, pipeline, camera and initial world are usable. Device loss allows one
bounded rebuild; a repeated failure returns to the explicit failure state.

## Renderer design

The factory creates `WebGPURenderer`, awaits initialization, inspects the
actual backend and freezes a `RuntimeCapabilities` value. A synchronous
Tres renderer factory callback is not itself readiness evidence: `ready`
publishes only after the adopted renderer's first successful render. The
automatic software-adapter policy uses `forceWebGL: true`: a software
WebGPU adapter (or unavailable WebGPU) disposes the software candidate and
re-creates the same `WebGPURenderer` class on `WebGLBackend` — never a
separate classic renderer class.

Capabilities record backend (`webgpu` or `webgl2`) separately from adapter
classification (`hardware`, `software` or `unknown`). Forced WebGL is evaluated
again; it is not assumed to be hardware. If both attempts are software or miss
the measured minimum tier, bootstrap enters an explicit degraded or failed
state instead of promising a premium path.

The TSL graph owns scene render, refraction, chromatic response, bloom,
grading, grain, vignette, border, fog and output color transform on
`WebGPUBackend` (the `RenderPipeline` + `WebGPUPostPipeline` path). On
`WebGLBackend` the same node-material scene renders directly: the classic
renderer, nodes compatibility handler, GLSL post passes and second PMREM
WebGL context were removed in Phase 10 slice 2 2026-08-22.

Unstable backend inspection and Three.js compatibility casts are confined to
one adapter. Library versions are pinned as an officially supported and tested
Vue/TresJS/Three matrix. Upgrades occur in focused changes that run both
backend suites.

## Render scheduling

The scheduler uses typed invalidation and activity reasons rather than a set of
shared booleans. An owner acquires an activity token for a bounded animation
and releases it on completion or disposal. Frame tasks update only while their
owner is active. The scheduler targets one bounded
`renderer.setAnimationLoop` adapter. It starts when work becomes dirty or
active and calls `setAnimationLoop(null)` after the settled frame and while the
document is hidden. Tres's internal loop is stopped when this driver takes
ownership. No scene owner starts its own `requestAnimationFrame` loop.

The loop-driver selection is settled: the Phase 2 hardware A/B made the
bounded driver the leader over Tres manual mode (one-window observation:
Tres 5.8.3 retained about 60 idle rAF ticks per second while the bounded
driver retained zero), and the release gates confirm settled idle — zero
draw calls and zero active scheduler reasons — on both backends. Vue
reactivity may request invalidation but never wraps or replaces the frame
callback. Runtime assertions and diagnostics report canvas count,
loop-driver count, active reasons, ticks, draws and p50/p95 frame time.

## Resource lifecycle

Every route scene scope includes cancellation, a disposable registry and an
explicit policy:

- `ephemeral` — dispose on scope exit;
- `bounded-cache` — retain a measured fixed set for repeat navigation;
- `shared-refcounted` — dispose after the last owner releases it.

Late async results are disposed immediately. Vue unmount alone is insufficient
for GPU work; the scene scope closes first, then the component releases its
port. Shared resources are never implicitly disposed by a primitive adapter.
State-machine channels are owner-scoped too: `Section.dispose()` removes its
StateBus state/opacity channels after cancelling animations and listeners, so
the singleton bus cannot retain route state across a runtime teardown.
The `ParticleBurst` owner follows the same terminal rule: after disposal its
trigger/update ports are inert and its instanced geometry/material are released
exactly once.

Migration acceptance includes twenty route cycles without monotonic growth in
canvas/context, listener, timer, texture, geometry, program or memory counts.

## Rendering and route-specific behavior

`/works` continues to own only its lazy case-plane stage; the shared cube does
not compete with case media. `/contact` continues to own its camera-local text
and model stages while semantic DOM supplies readable content and actions.
Locale and effective-theme updates arrive through typed ports. Route exit
closes the corresponding scope even if an async decode is still in progress.

## Events and preferences

The typed `EventBus.ts` is the single port surface for every `jlz:*`
application event: all seventeen ports are declared in `AppEvents` with exact
payload types, `on()` returns an unsubscribe closure, and `emit()` reaches no
window listeners (the raw window bridge was removed in Phase 10 slice 3
2026-08-22). Non-module producers — the inline splash script and out-of-app
scripts — reach the bus through the `window.__jlzEmit` facade. Locale, theme
mode/effective polarity, sound, reduced motion and readiness additionally flow
through their typed core ports (`i18n`, `ThemeManager`, `SfxSystem`,
`motionPolicy`).

A central store is not required for the public app; the Page Builder may use
one for transactional editor state.

## Performance and dependency policy

- New dependencies require an explicit owner, current official compatibility
  evidence, a comparison with local code and a measured bundle/runtime cost.
- Prefer platform, Vue, TresJS and Three.js capabilities before adding helpers.
- Do not retain duplicate libraries or compatibility packages after a migration lands.
- Separate Vue, TresJS, Three.js and UIkit chunks/budgets so regression sources
  remain visible.
- The Vite graph resolves only bare `three` through
  `src/three-webgpu-compat.ts`; package subpaths stay on their official
  exports. This is a TresJS 5.8.3 delivery boundary, not a second renderer or
  runtime fallback, and is covered by ADR 0009.
- Demand-driven idle, startup graph, frame time and memory/resource soak are
  release gates rather than post-migration cleanup.
- `NoiseText` keeps one owner-scoped character buffer for its bounded reveal;
  each tick may allocate only the unavoidable joined DOM string, and teardown
  cancels both RAF and safety timeout through the shared registry.
- `BlurFade` caches its authored span rotations for the lifetime of a reveal;
  frame ticks update styles without reparsing per-span metadata, and the same
  registry owns cancellation and final DOM restoration.
- Removing code is part of each owner migration; a transition cannot finish
  with two routers, loops, post pipelines or state sources.

## Testing boundaries

- pure unit tests cover manifests, slot invariants, state machines, scheduler
  and resource policies;
- Vue component tests cover semantics, focus, locale/theme and UIkit wrappers;
- router tests cover history, direct entry and hash/story commands;
- renderer contract tests exercise automatic and forced backends and fail on
  GPU/material/device errors;
- visual QA enters through the splash before route capture;
- real hardware supplies performance and memory evidence that headless CI
  cannot prove.

## Editorial model

The site demonstrates the studio's capability. Routes use the rhythm
capability → problem → response → proof without becoming a repeated card
template. Works contains authored cases, Blog explains process, and Lab holds
isolated experiments. Framework migration does not change that product model.

## Non-goals

- Do not move the inline splash into Vue.
- Do not load the 3D runtime on content-only pages without product evidence.
- Do not replace UIkit JS, add a public global store or raise budgets as an
  implicit part of framework adoption.
- Do not rewrite all Three.js owners declaratively at once.
- Do not keep legacy and target implementations indefinitely for convenience.
