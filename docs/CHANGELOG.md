# Changelog

## Unreleased

- Reduced-motion settlement now covers Works `CasePlane` deformation and
  `WorksPlaneStage` card reveals, preventing avoidable render-demand tails.
- Story navigation now clears decorative CSS parallax shifts on live
  reduced-motion changes without altering semantic section state.
- Route-transition teardown now removes its temporary overlay and timers on
  router errors, closing a short-lived DOM-owner leak.
- Image-only FullscreenOverlay preloads no longer reinitialize a source-less
  video element, avoiding redundant media events and work.
- UIMenu now refreshes the UIkit sound icon after external sound-toggle events,
  keeping the visible control aligned with persisted mute state.
- SFX teardown is now terminal, preventing late UI events from recreating an
  unowned Web Audio context after `Experience` disposal.
- BlurFade now restores authored text and accessibility state on hide instead
  of retaining per-character animation spans in hidden route content.
- NoiseText no longer clears authored content when hidden before its first
  reveal; active finalization behavior is unchanged.

- Renderer device-loss fallback now clears the retired software-adapter
  replacement before forced-WebGL recreation; a failed second initialization
  no longer double-disposes the first replacement.

- A failed native-WebGPU TSL post graph now transitions its `RenderPipeline`
  to a direct-render fallback instead of retrying graph construction on every
  demand frame and preventing the scheduler from settling.

- The WebGPU post owner now retains and disposes the TSL scene `PassNode` on
  rebuild, graph-construction failure and teardown, releasing its render target
  instead of leaving a detached GPU allocation behind.

- A failed `Experience` frame now clears pending demand and settles the current
  render-loop window, preventing an exception from creating an infinite retry
  loop while preserving a later diagnostic or recovery invalidation.

- Exhausting device-loss recovery now fails closed like other terminal recovery
  errors: the current animation loop is detached before the failure overlay is
  shown.

- `EnvSphere` and `SplashCube` now remove themselves from the Tres-owned scene
  before disposing their GPU resources, closing the direct-owner teardown gap.

- Low-tier native WebGPU now honors the disabled post-processing policy by
  skipping TSL graph construction and rendering the scene directly.

- Tres renderer teardown is now idempotent across manager unmount, SceneHost
  cleanup, recovery replacement and failed initialization paths.
- Cinematic section lights now settle synchronously under reduced motion,
  avoiding intermediate lerp work and stale render demand.
- EnvSphere palette crossfades now settle synchronously when reduced motion is
  enabled while a section transition is already active.
- SplashCube face, jelly and opener reactions now settle synchronously on a
  live reduced-motion change.
- ContactCyprusStage fade and scale transitions now settle synchronously on a
  live reduced-motion change.
- Camera now preserves section FOV framing while cancelling transient pulse,
  shake and cursor displacement on a live reduced-motion change.

- `Experience` now observes live `prefers-reduced-motion` changes instead of
  caching the preference only at startup. Enabling reduction cancels ambient
  breathing and settles the scheduler; disabling it raises one typed catch-up
  demand. The listener is removed during teardown.

- `SplashCube` now snaps to the requested face when reduced motion is enabled;
  section changes no longer leave a skipped cube animation active forever or
  retain the demand-driven render loop.

- Contact typography now receives live reduced-motion changes while mounted;
  glyphs settle immediately when reduction is enabled and resume authored
  motion after it is disabled without a route re-entry.

- Removed an unowned idle sine rotation from `SplashCube`; demand frames no
  longer advance a decorative transform that was absent from the activity
  contract and could jump after settled idle. Jelly, face and opener reactions
  retain their authored motion.

- `EnvSphere` now snaps to the target section palette under reduced motion;
  ambient background colors cannot remain stranded at an intermediate lerp
  value after the scheduler settles.

- SceneHost now follows device-loss renderer replacements through the typed
  bridge; Vue teardown disposes the recovered live renderer rather than only
  the initial instance.

- Contact Cyprus lazy initialization now has a single request-owned prewarm
  continuation; stale entry-route promises cannot prewarm a newer stage or
  schedule an unnecessary render frame.

- Builder card CSS now has one real UIkit owner in the application baseline;
  generated page deltas omit the duplicate import and parity-test the artifact.

- Camera smoothing now has one shared `WorldConfig` fallback; per-section
  authored overrides remain unchanged and `Experience` no longer duplicates the
  transition default.

- Renderer terminal recovery failure now rejects later animation-loop
  reattachment, and the WebGLBackend fallback restores the shared scene fog
  after direct draws, including thrown draws.

- WebGLBackend quality state now matches its direct-render implementation:
  unused TSL post crossfade and parameter writes are skipped, while native
  WebGPU keeps the existing post path.

- WebGPU TSL post-graph construction now restores the renderer tone mapping
  even when graph creation throws.

- Contact section activation now validates the Cyprus request generation after
  lazy initialization, preventing a stale route callback from activating a
  newer stage or raising redundant render demand.

- ContactCyprusStage now rejects a pending Draco/GLTF result after disposal and
  releases the late model without attaching it or creating detached materials.

- Idle `SceneCoordinator` updates no longer advance Works/Contact animation
  clocks without rendering, preventing invisible-time reveal jumps under the
  demand-driven scheduler.

- `BakuCarousel` now releases only successfully acquired shared texture refs
  when one texture load fails, preventing partial initialization from
  over-releasing a URL still owned by another scene owner.

- `BakuCarousel` momentum damping is now elapsed-time based, keeping post-drag
  travel consistent across 60/90/120 Hz displays.

- Removed the obsolete `/works` back-text render-demand flag after its pixel
  text owner was deleted; settled Works now returns to the demand-driven idle
  loop instead of rendering continuously.

- `ContactTypographyStage` now rejects post-dispose activation, theme and
  update calls, making lazy route teardown safe against late callbacks and
  repeated disposal.

- `SceneHost` now disposes its resolved live renderer on Vue unmount, closing
  the construction owner's GPU resource path in addition to late fallback
  cleanup.

- `WireframeTypography` disposal is now terminal and idempotent; late route
  callbacks cannot reactivate disposed glyph meshes or retain their registry.

- Renderer recovery now fails closed when replacement creation fails: the old
  animation loop is cleared, failure is surfaced, and disposed-renderer calls
  are blocked.

- `WorksPortfolio.goTo()` now rejects non-finite indices, preventing malformed
  overlay events from corrupting carousel navigation state.

- `FullscreenOverlay` now owns one autoplay timer across duplicate show/shown
  callbacks and media replacement, preventing stale video-play callbacks from
  surviving modal teardown or changing the active media mode.

- Camera shake and organic motion now use the actual high-refresh frame delta
  instead of a 120 Hz minimum, preserving wall-clock pacing on 144/240 Hz.

- BakuCarousel momentum now scales displacement as well as damping by elapsed
  time, keeping fling travel consistent across refresh rates.

- Late case-texture releases now verify the acquired texture identity, avoiding
  cross-generation refcount corruption during HMR or root teardown races.

- Device-loss recovery now drops stale rejection side effects after teardown,
  preventing unsupported-state DOM mutation from a disposed renderer owner.

- TSL post-processing now restores the previous renderer tone-mapping mode even
  when a WebGPU render throws.

- Post-processing display parameters are now exposed read-only, preventing
  accidental crossfade-state mutation without adding a per-frame copy.

- Typed EventBus dispatch now snapshots subscribers, preserving the current
  event's listener set when route teardown mutates registrations mid-flight.

- Hidden Contact particle groups no longer report render activity or receive
  drift updates, allowing the quiet Agros section to settle without continuous
  GPU draws or needless CPU work.

- Route-owned Works and Contact stages now release camera references, active
  state and child graphs during teardown, reducing stale-owner retention.

- Carousel and Works texture cleanup now passes acquired texture identities in
  teardown and load-failure paths, protecting replacement cache generations.

- LabGamepad teardown now clears its disposed mesh graph, avoiding stale route
  owners retaining the released geometry/material tree.

- DrawTrail teardown now clears its disposed ribbon and activity state, avoiding
  stale persistent owners retaining the released cursor mesh.

- Published builder styles no longer import UIkit `card.less` twice; the
  application baseline remains the single owner of that component CSS.

- `useJlzPage` now disposes the module-level `WorkCards` registry during route
  owner teardown as well as before route replacement, releasing delegated grid
  listeners and pending card timers on full unmount.

- `BakuCarousel.dispose()` now releases its camera and card callback, clears
  input/timer handler references, and resets interaction/morph state after
  texture and card disposal.

- `ContentReveal.destroy()` now restores the pre-existing `uk-light` state on
  `html` and `body`, preventing a disposed runtime from leaking its global
  theme into a retry or HMR instance.

- `Renderer.init()` now rejects and disposes late unified WebGPU candidates when
  teardown wins the async race, preventing post-dispose pipeline and recovery
  owners from being recreated.

- `SceneHost` now invalidates asynchronous fallback renderer swaps on Vue
  unmount and disposes a late candidate instead of resolving a removed Tres
  root.

- `WorksPlaneStage` now cancels stale texture-to-card setup after disposal,
  releasing pending texture references without creating detached GPU/TSL card
  resources during rapid route changes.

- Disposed `WorksPlaneStage` instances now reject re-initialization before
  starting texture loads, avoiding redundant route-local network and decode
  work.

- `CinematicNav` now retains and removes its generated button handlers during
  teardown, preventing retained navigation DOM from invoking a disposed
  controller.

- Bootstrap teardown now tolerates renderer/world failure before all
  `Experience` owners exist; optional UI/coordinator/StateBus cleanup no longer
  masks the original error with a secondary exception.

- Open `FullscreenOverlay` instances now execute idempotent hide cleanup before
  UIkit destruction, preventing stale body-scroll/focus state and ensuring the
  per-open close callback fires once during runtime teardown.

- `Experience` now invalidates an async lifecycle generation at teardown and
  checks it after renderer/world/prewarm awaits, preventing late scene-owner
  creation or readiness work after a runtime has been destroyed.

- The shared `Input` singleton now reattaches its mouse listener at
  `Experience.init()`, so explicit teardown/HMR followed by a new Experience
  does not leave Camera and DrawTrail permanently frozen.

- `ExperienceUI.destroy()` now disposes `WorksPortfolio` before releasing it;
  the portfolio clears project/callback references and makes post-teardown
  navigation a no-op.

- `Experience.destroy()` now drains active `NoiseText` and `BlurFade` animation
  owners, cancelling their RAF and safety timers before scene/UI teardown.
  Connected route DOM is restored to its authored final state without retaining
  background animation work.

- Route transition cancellation now clears and settles the owned 260 ms cover
  timer, preventing stale navigation promises and queued work from surviving
  a failed or superseded route.

- Bootstrap retry cleanup now replaces the injected Less style instead of
  accumulating duplicate `<style>` nodes, and `ErrorTracker` can remove its
  window listeners so HMR/retry does not retain stale module closures.

- The delayed `jlz:webgl-ready` handoff is now an owned, generation-guarded
  timer and is cancelled on bootstrap reset/failure, including the
  reduced-motion zero-delay path.

- The single renderer-loop scheduler now rejects late callbacks after
  `destroy()` or settled-stop, closing the post-dispose path to freed scene,
  DOM and GPU resources.

- Bootstrap failures now clean up attempt-local `Experience` and `UIManager`
  owners, and Vue mount rejection explicitly rejects the one-shot SceneHost
  bridge. Retry is limited to the pre-SceneHost boundary; post-bridge failures
  remain terminal so a disposed renderer cannot be recreated over the same
  canvas.

- In-app hash navigation now cancels its superseded RAF at the router owner;
  rapid route changes do not leave stale section-dispatch callbacks to wake on
  the next frame.

- Route-menu lifecycle now owns and cancels pending two-frame visibility
  reconciliation and app-owned listeners before Vue removes the route root;
  detached menu DOM no longer leaves avoidable frame work behind.

- Application bootstrap now has a single-flight start gate. Concurrent
  `startApp()` calls cannot create duplicate Vue/scene owners, and failed
  attempts reset cleanly for retry after their listeners, timers and observers
  are released.

- Hardened async lifecycle ownership across renderer recovery, route/carousel
  wakes, UIkit hydration, overlay/content/submenu reveals and detached
  `NoiseText`/`BlurFade` animations; lazy portfolio initialization is now
  cancelled on UI teardown, and stale hash navigation callbacks are
  invalidated by the next route transition. Contact's lazy Cyprus load now
  contains failures after cleanup instead of producing unhandled rejections.
  The lazy Lab experiment owner follows the same handled-failure and retry
  policy. Final Experience teardown now routes Contact Cyprus cleanup through
  its invalidating owner method, so late Draco results cannot re-enter a
  disposed scene. The Works stage now follows the same invalidating owner
  boundary during final Experience teardown.
  Contact Typography initialization now has the same contained-failure and
  retryable owner policy. Environment PMREM staging now releases temporary
  CanvasTexture and generator resources on both success and failure.
  Contact Cyprus GLTF/material preparation now rolls back partially processed
  scenes before propagating a load failure. BakuCarousel card staging now
  rolls back partial CasePlane construction and releases shared texture refs
  when material setup fails. The lazy WorksPlaneStage now applies the same
  transactional card staging and refcount rollback.
  The shared case-texture cache now isolates new consumers from in-flight
  entries already claimed by global teardown.
  First-frame readiness now owns and clears its bounded fallback timer; final
  Experience teardown cancels that gate without publishing readiness from a
  destroyed instance.
  Camera home-route tuning now reads the typed route-page port instead of the
  body dataset, closing the remaining scene-owner route-state projection.
  Route-root teardown now cancels the deferred route-announcer RAF, preventing
  stale title writes after a fast navigation.
  ExperienceUI portfolio loading now uses a single-flight owner promise and
  contains import failures so concurrent entry points cannot duplicate UI or
  leak an unhandled rejection.
  Failed home-carousel initialization now clears its cached promise, allowing
  a later route wake to retry while successful initialization stays idempotent.
  ExperienceUI teardown now cancels the deferred portfolio readiness RAF and
  resolves its owner wait without creating late UI resources.
  CinematicNav route rebinding now cancels pending scroll and focus RAFs before
  attaching the next route track, preventing stale callbacks on new DOM.
  ExperienceUI now consumes the existing static Projects dependency; the
  ineffective dynamic import was removed from the build graph.
  Contact's lazy typography stage now keeps `TextGeometry` in a dedicated
  route-local chunk, and the build-budget check measures only the shared
  Three.js vendor asset.
  UIMenu now owns one delegated click listener and removes it explicitly on
  teardown, reducing the persistent shell's listener surface.
  FullscreenOverlay now scopes its media, control and poster listeners under
  one abortable owner, so teardown cannot leave detached callbacks behind.
  The entry bootstrap now cancels its 60-second readiness watchdog on ready,
  failure or retry instead of retaining an unnecessary timer after startup.
  WorkCards now delegates activation to one listener per grid while retaining
  per-card debounce state and deterministic disposal.
  Secondary route views now load through explicit route-level chunks, keeping
  non-landing semantic pages out of the startup app graph; `app` measured
  3.37 kB gzip versus 10.00 kB before the split.
  A scoped `three` compatibility entry now routes bare imports through
  `three/webgpu` while preserving TresJS's unreachable `WebGLRenderer` symbol;
  shared Three delivery fell to 298.43 kB gzip and the delivery budget passes.
  FullscreenOverlay now cancels first-frame poster reveal callbacks during
  media replacement, modal hide and disposal instead of relying only on a
  generation guard.
  Persistent UIMenu now owns its scoped UIkit hydration; the bootstrap no
  longer schedules a duplicate global idle update over `#spa-content`, and
  `entry-app` measures 6.99 kB gzip versus 7.30 kB before the change.
  ContentReveal now scopes section activation and UIkit refresh to the active
  route root, preventing unrelated document sections from being traversed or
  deactivated during route transitions.
  Experience's section eyebrow and initial activation lookups now use the same
  route-root boundary, keeping scene/UI synchronization out of persistent DOM.
  Bootstrap section/page-section signals and title observers now use that same
  route root, while splash and persistent-shell controls remain global by
  ownership.
  WorkCards now discovers cards and delegated grid owners inside that route
  root, preventing detached or persistent-shell grids from receiving route
  listeners or roving-tabindex state.
  Menu template bindings now resolve the active nav, preview elements and
  same-page hash targets inside that route root as well.
  Fullscreen project Prev/Next now raises the shared `nav` demand after
  changing the carousel target, preventing a settled renderer from waiting for
  unrelated input before advancing the 3D selection.
  BakuCarousel now preserves CasePlane's idle guard for hidden cards, avoiding
  unnecessary per-frame cloth-uniform advancement while retaining visible and
  in-flight card animation.
  CinematicNav hash resolution now searches the active route track, preventing
  detached duplicate IDs from intercepting story navigation.
  The delayed splash title reveal now has an explicit cancellable owner;
  repeated Enter events coalesce and retry/failure paths cannot animate stale
  route DOM.
  RouteTransition now exposes a cancellation path wired to Vue Router errors,
  returning a covering overlay to idle when a lazy route rejects.
  Deferred direct-entry section hashes now use a cancellable generation gate,
  so a later route or failed boot cannot dispatch stale navigation after
  `jlz:webgl-ready`.
  BlurFade now creates its character spans through DOM APIs, keeping translated
  or editorial markup inert and avoiding an innerHTML parse per animation.
  RouteTransition now clears the pending reveal timer on cancellation or
  replacement, removing stale delayed work rather than only ignoring it.
- Scoped bootstrap UIkit refresh to `#spa-content`, removing the remaining
  document-wide traversal from the application shell.
- Established the staged Vue 3, Vue Router and TresJS migration architecture,
  including a representative WebGPU/WebGLBackend gate, persistent scene root,
  demand-render scheduler, explicit GPU resource ownership and rollback points.
- Added architecture decisions and an internal collaboration protocol for
  bounded delegated work without sharing integration authority or secrets.
- Defined migration budgets for framework delivery, idle rendering, route
  resource soaks, dependency admission and removal of superseded production
  paths.

- Moved the pixel-rasterised route title from `/works` to the lazy `/contact`
  scene. The standalone Works route now presents case planes without the Baku
  cube or a competing text layer; Contact owns the title's reveal, language and
  theme synchronisation. Its effective polarity is cached across lazy route
  creation, and its marquee keeps rendering after the one-shot wipe settles
  (except with reduced motion).
- Rebuilt `/contact` as a route-specific transmission board: semantic actions
  sit in one local macOS-style console module with restrained blur and window
  chrome, while the animated 3D title carries the visible heading.
- Replaced the Works BackText font with self-hosted Press Start 2P (Cyrillic
  included) and moved existing menu/button flex layout to UIKit utilities,
  reducing `main.less` to 2048 lines without adding a parallel component layer.
- Synchronized `/works` semantic captions with the real Three.js case planes:
  both layers now use the same normalized desktop/mobile positions and 16:9
  bounds, preserving visible gutters without stretching focusable controls.
- Reworked `/works` around one visual media owner. Semantic DOM case buttons
  now provide captions and keyboard targets only; the eight hidden duplicate
  `<img>` elements and their unused custom card styles were removed. This
  reduces both the CSS surface and decoded-image memory pressure.
- Works back text now renders the title only as crisp pixel-rasterised canvas
  type. It uses Junni's 1 s delayed, 2 s ease-out centre vertical wipe on
  route arrival and on section changes, independently from card fades.
- Made Works plane composition camera-frustum-relative. Desktop spreads the
  pair across the viewport; portrait uses width-led cards with an outer gutter
  and matching DOM captions instead of full-width controls.
- Dispose the inactive Works stage on route exit so its eight case textures,
  canvas and per-plane materials can be released. GPU-driver reclamation still
  needs runtime profiling after repeated route visits.
- Reduced `main.less` from 2205 to 2025 source lines by deleting custom media
  card overrides that no longer had a rendering owner.
- Disabled non-essential UIkit Nav height animation and reconcile its existing
  ARIA state after a click, preventing mobile submenus from remaining hidden
  when the menu sheet was hidden during component initialisation.

- Reduced the emitted shared UIkit stylesheet by removing nine components and
  three utilities with no repository markup usage. Standalone blog CSS falls
  from 165.86 kB to 108.27 kB (21.53 kB to 16.77 kB gzip).
- Works BackText now uses self-hosted Press Start 2P with Cyrillic coverage as
  the intentional pixel signature. It renders at 2× source resolution before
  nearest-neighbour upscale, so the character stays legible instead of
  becoming oversized blocks.
- Fixed direct section links so they preserve the route and use
  `CinematicNav`’s authoritative scroll state.
- Project case studies now open as full-screen still-image overlays; video is
  reserved for the explicit Showreel action.

This is a concise release-level record. Architecture decisions belong in
[`adr/`](adr/), active outcomes in [`NEXT.md`](../NEXT.md), and completed plans
remain available through Git history.

## 2026-07-25 — Revert to flat plane (junni approach) — text now visible (PR #181)

- Reverted CylinderGeometry → flat PlaneGeometry (20×8, 8×4 segments).
  Junni reference confirmed: flat plane, not cylinder. Camera perspective
  creates the curve effect.
- Position: (0, 0, -7) behind cards. No rotation — PlaneGeometry faces +Z.
- Kept all shader logic: UV scroll, vertical wipe, alpha boost, DoubleSide,
  Pixelify Sans, continuous rendering.
- VLM-verified: "SELECTED WORKS" visible in pixel font; text changes per section.

## 2026-07-25 — Fix back-text visibility: orientation + DoubleSide + continuous render (PR #180)

- Fixed cylinder orientation: `DoubleSide` so concave surface renders toward
  camera. Reduced radius 20→12, increased arc 0.8→1.2 rad for full-width.
- Alpha boost: luminance × 3.0 clamped to [0,1] for visible pixel text.
- Continuous rendering on /works: `worksScrollActive` flag keeps UV scroll
  - wipe animating even when cards have settled (on-demand rendering fix).
- World.update() bypass: works stage updates even when `!needsRender`.
- VLM-verified: "SELECTED WORKS" visible in pixel font behind cards.

## 2026-07-25 — Works BackText: curved plane + pixel font + synced wipe (PR #179)

- **Curved plane:** Replaced flat PlaneGeometry with CylinderGeometry
  (radius=30, arc=0.55 rad) — wraps across full viewport like junni reference.
- **Pixel font with Cyrillic:** Pixelify Sans (self-hosted, 49KB per weight)
  — full А-Я + а-я support. Loaded via FontFace API with monospace fallback.
- **Vertical wipe synced with card reveal:** textScreen visibility driven
  dynamically from average card reveal — wipe expands as cards arrive,
  contracts as they depart.
- **Full-width scaling:** curved screen scales dynamically in resize()
  based on viewport aspect ratio.
- JS heap: 15 MB stable.

## 2026-07-25 — Works BackText (junni pattern) + 3D card scaling (PR #178)

- **WorksTextScreen rewritten to junni BackText pattern:** flat plane (was
  cylinder), UV horizontal scroll, vertical wipe reveal from center outward,
  alpha discard for crisp text edges, RepeatWrapping for tiling.
- **3D card scaling improved:** aspect-ratio-based `_aspectScale` multiplier
  (16:9=1.0, clamped [0.7, 1.4]) — cards fill viewport width on ultrawide
  and narrow screens. Text screen scales dynamically in `resize()`.
- **Grid:** added `uk-flex uk-child-width-1-1 uk-child-width-auto@m` for
  better responsive expansion.
- JS heap: 13-14 MB stable across all routes + section changes.

## 2026-07-25 — Works 3D template rework + memory churn fix (PR #177)

- **Memory fix: reverted route-exit disposal.** PR #176's
  `disposeWorksPlaneStage()` on route exit caused TSL shader recompilation
  churn — each /works visit recreated 8 CasePlane TSL materials +
  WorksTextScreen, and the GPU driver doesn't immediately free disposed
  shader programs. After 2-3 /works visits, this accumulated ~100MB.
  Fix: keep WorksPlaneStage alive (like BakuCarousel) — just hide it.
- **WorksTextScreen: i18n integration + smaller canvas.** Replaced
  hardcoded copy with i18n keys — the 3D text screen now shows translated
  text and updates on language toggle. Canvas reduced 2048×768 → 1024×384
  (saves ~4.7 MB).
- **Works template: removed HTML .jlz-works-statement.** The section
  title + lead are now rendered ONLY by the 3D WorksTextScreen behind the
  work cards. No more duplicate DOM layer. Grid uses `uk-flex-middle` to
  center cards with the 3D layer.
- **CSS: removed all .jlz-works-statement rules (~55 LOC).**
- main.less: 2308 → 2227 (−81 LOC). JS heap stable at 11-17 MB.

## 2026-07-25 — Deep CSS refactoring + memory leak fixes (PR #176)

- **Memory: route-exit disposal for WorksPlaneStage** — added
  `disposeWorksPlaneStage()` to World, called when leaving /works. Frees
  ~40-50 MB of GPU textures + canvas + TSL materials.
- **Memory: refcounted texture cache** — `caseTexture.ts` now caches
  textures by URL with refcounting. Saves ~12 MB duplicate GPU textures.
- **Memory: mouse-trail rAF cancel** — stored rAF id, cancel in `destroy()`.
- **CSS: scanline tombstone removed (28 LOC)** — dead `::before` rules.
- **CSS: h1..h6 heading selector removed (22 LOC)** — migrated to UIKit variable.
- **CSS: [data-lab-overlay] dead rule removed (7 LOC)**.
- **CSS: 6 × redundant `font-family` removed (6 LOC)**.
- main.less: 2399 → 2308 (−91 LOC). JS heap stable at 13-14 MB.

## 2026-07-24 — Inverse theme fix + CSS minimization + 3D works text screen (PR #174)

- Fixed inverse theme bug: clicking brand from /works (inverse) to home now
  correctly applies the intro section's inverse theme. Root cause:
  ContentReveal missed the initial `jlz:route-change` (fired before
  Experience.init). Added `applyInitialTheme()` in constructor + always
  send `themeChanged: true` so 3D layer re-syncs.
- Minimized main.less: 2486 → 2399 lines (−87 LOC). Removed ~20
  UIKit-duplicating rules (box-sizing, body reset, nav resets, button hook
  duplicates, dead `.jlz-visually-hidden`, `!important` overrides replaced
  with markup utility classes).
- Added 3D curved text screen on /works: `WorksTextScreen.ts` renders the
  section title as a holographic transparent layer behind the work cards.
  CylinderGeometry segment + TSL material with canvas-texture sampling,
  reveal-driven alpha, time pulse, and inverse-theme color flip.
- Inverse theme audit: verified all 6 pages + fullscreen overlay in both
  auto and inverse modes. No contrast issues.

## 2026-07-24 — CSS minimization + /works texture fix (PR #173)

- Fixed invisible textures on /works: `prewarmShaders()` called
  `WebGPURenderer.compileAsync()` which crashed TSL node build and corrupted
  CasePlane material state. Made `prewarmShaders` a no-op — WebGPURenderer
  compiles shaders lazily during the first render.
- Deleted ~280 lines of dead CSS: `.jlz-joystick*` (16 rules + media queries
  - reduced-motion entries), `.jlz-scroll-hint*`, `#pageLoader`, `#jlj-enter`,
    `.canvas`. Migrated 7 `var(--jlz-joystick-size)` references to
    `var(--jlz-bottom-controls)`.
- Replaced 8 `.jlz-*` CSS rules that duplicated UIKit utilities with native
  UIKit classes (`uk-text-uppercase`, `uk-flex-*`, `uk-width-1-1`,
  `uk-margin-auto-left`, `uk-text-right`, `uk-flex-wrap`, `uk-flex-column`).
- `main.less`: 2776 → 2495 lines (−10.1%). `main` chunk: 159 → 155 KB.

## 2026-07-24 — Audit cleanup and PI agent preparation (PR #171 + #172)

- Deleted `PlaneTransition.ts` entirely (zero callers) + no-op
  `resetTransition()` methods on BakuCarousel and WorksPlaneStage.
- Deleted dead SplashCube transition path (`setTransition`, `_transitionT/Dir`,
  40-line zero-computation block in `update()`).
- Deleted `Experience._showreelPlayHandler` (listened for
  `jlz:showreel-play` which was never dispatched).
- Deleted `World.setRenderer`/`_renderer` + per-frame call (SplashCube
  ignored the renderer param).
- Deleted `main-app.ts` — inlined `bootstrap()` into `entry-app.ts:boot()`.
- Removed 15+ dead APIs across 10 files (NarrativePhase enum, Section
  ppParams/splash/update, WorldConfig.ambient, CasePlane.setParallax,
  JunniParticles dead getters, EnvSphere.hasVisibleAmbientMotion,
  Experience.instance static, Input.instance static, RenderPipeline
  setGlobalBorder + dead getters, WebGPUPostPipeline.resize).
- Deleted `tests/smoke-bg.mjs`, 5 dead console-icons, `contentBottom` alias,
  inlined `WorldConfig.raw()` helper.
- **Fixed B-1 (critical):** reduced-motion + opener never settled → continuous
  rendering. `triggerOpener()` now snaps `openerPhase='done'` under
  reduced-motion.
- **Fixed B-2 (critical a11y):** FullscreenOverlay focus trap — focus now
  moves into modal on open, Shift+Tab wraps to last focusable, focus restored
  to trigger on close.
- Fixed B-3: per-open `OverlayOptions.onClose` replaces mutable
  `overlay.onClose` field.
- Fixed B-4: `CinematicNav._bindTrack` clears stale `_restoreFocus` +
  `_inactiveTimer` on route change.
- Fixed pre-existing `WorksPlaneStage.compileAsync` type errors.
- Added `aria-pressed` on UIMenu language toggle.
- Deleted duplicate close-button binding in `initMenuToolbar` (Bug F).
- Removed duplicate 60s timeout in `index.html` (B-11).
- Added public getters `SplashCube.isOpenerActive`, `SplashCube.isRotating`,
  `Camera.isPulsing` — removed 7 `as unknown as` casts in Experience.ts.
- Rewrote `docs/UIKIT3.md` — removed dead Quantum Flares vendor-layer
  references, documented actual `console-theme/` architecture.
- Updated all docs to reflect `main-app.ts` removal and PR #171 changes.
- Created PI agent files: `CLAUDE.md`, `.github/copilot-instructions.md`,
  `.cursor/rules/`, `CONTRIBUTING.md`, `CODEOWNERS`, issue/PR templates.

## 2026-07-23 — Final transition, texture and overlay fixes

- Fixed card overlap during /works section change — invisible cards now
  fade out in place instead of sliding into the new secondary slot.
- Replaced the CasePlane radial reveal mask with a clean opacity fade —
  no directional wipe from a corner.
- Removed the duplicate footer play button — the big-play overlay is the
  sole play/pause control in the fullscreen overlay.
- Removed ACES tone mapping from both post-processing paths (WebGL2 +
  WebGPU) so case textures render with faithful original colors.
- Neutralised the warm shadow tint in WorldConfig DEFAULTS.

## 2026-07-21 — Unified shader transition and per-instance materials

- Gave each `CasePlane` its own `MeshBasicNodeMaterial` and TSL uniform
  nodes; removed the module-level shared material/texture/state that made
  every carousel card render the last card's image.
- Added `PlaneTransition.ts` as the single source of truth for the
  plane-to-fullscreen handoff, replacing ~90 lines of duplicated inline
  transition code in `BakuCarousel` and `WorksPlaneStage`.
- Fixed the fullscreen overlay reveal: `FullscreenOverlay` now adds the
  `is-entered` class (with a 120 ms fallback timer) so the CSS clip-path
  transition actually fires for showreel and project opens.
- Re-prefixed `.jlz-fs-dialog` selectors with `.jlz-fs-overlay` so they
  match UIkit's modal-full specificity instead of being overridden.
- Fixed a DevPanel regression that called a non-existent
  `Experience.navigatePortfolio` method and broke `type-check`.
- Retired the historical audit reports (`docs/AUDIT.md`,
  `docs/AUDIT-FULL.md`), the abandoned `REFACTOR-WORKLOG.md`, the stale
  `docs/PLAN-studio-console-theme.md` and the duplicate lower-case
  `worklog.md`. Their durable decisions now live in this changelog and
  `WORKLOG.md`; everything else stays in Git history.

## 2026-07-20 — Audit remediation (Phase A + B)

- Removed four no-op methods from `EnvSphere` (`attachToScene`,
  `setSectionColors`, `setBlend`, `setActiveSection`) and all call
  sites; the mesh is self-rendering and section weights drive the blend.
- Simplified `WorksPortfolio` from a Three.js class with a never-rendered
  `Group` to a plain object + factory function, eliminating the `three`
  import and the `dispose()` no-op.
- Fixed IntersectionObserver leak in `entry-app.ts` — the observer is now
  stored in a module-level variable and disconnected on re-init (HMR).
- Added a `content.contains(btn)` guard to the inline 60 s timeout in
  `index.html` so it no longer overwrites the retry link if
  `entry-app.ts` has already shown its own error UI.
- Extracted duplicated sound-preference localStorage reads from three
  modules into `getSoundMuted()` / `setSoundMutedPreference()` in
  `SfxSystem.ts` — single source of truth.
- Added a focus trap to `FullscreenOverlay` so Tab/Shift+Tab stays within
  the modal dialog while it is open (WCAG 2.1.1).
- Moved the module-level `particleTexture` load in `works/scene.ts` into
  `createSection3()` for proper GPU-resource ownership (RULES.md compliance).

## 2026-07-18 — Cinematic vertical navigation

- Reframed the standalone Blog as an editorial featured-story index and made
  Lab's research catalogue explicit about isolated, separately loaded scenes.
- Replaced the joystick with native vertical scroll/swipe, snap frames and a
  compact chapter control beside Contact.
- Removed the decorative progress-driven TSL fluid field; EnvSphere and the
  cube now carry the 3D atmosphere without competing with the copy.
- Reframed Menu as a responsive top sheet and the internal section-0 slot as a
  Contact finale with a styled Telegram action.
- Removed CRT scanlines/noise while restoring the shared curved CRT frame;
  raised splash and full-modal layers above application chrome and refined the
  fullscreen transition.
- Established Onest Variable typography with Latin/Cyrillic subsets and an
  editorial Works stage; fixed project-card opening and inverse overlay
  contrast, then unified the interface around a dark console baseline.
- Updated the splash copy within its concentric square geometry and centered
  Enter control; expanded Menu with Lab and a direct Blog route, refined UIkit
  controls and restricted delayed 3D type to the lower Contact/Manifesto frame.
- Replaced the random splash particle burst with a lightweight geometric
  square-frame handoff that continues the entry composition into the 3D scene.

## 2026-07-15 — Runtime hardening and documentation consolidation

- Fixed hash/dotnav routing, section state completion and home carousel
  initialization after content-page deep links.
- Made renderer capability settings follow the final WebGPU/WebGL backend.
- Improved timer cleanup and small accessibility details; refreshed E2E
  selectors and added StateBus regression coverage.
- Consolidated documentation around explicit owners, current routes and the
  current topbar/menu/theme model.

## 2026-07-14 — Rendering parity and audit remediation

- Improved glass-cube parity and visual quality across WebGPU and WebGL2.
- Addressed lifecycle, navigation, render and performance findings from a
  project audit.
- Added sustained-low-FPS particle reduction and retained on-demand rendering.

## 2026-07-12 — SPA content and metadata

- Added route-aware EN/RU content and metadata.
- Introduced the Works page's interactive case-study cards and shared project
  overlay.
- Enforced the splash/Enter readiness contract and contact-only ground plane.
