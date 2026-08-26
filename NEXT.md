# Next work

This file is the active outcome queue. The Vue 3, Vue Router and TresJS
migration is complete; its phase history, acceptance gates and removal ledger
are preserved in [`docs/archive/MIGRATION_VUE_TRES.md`](docs/archive/MIGRATION_VUE_TRES.md).
Do not reopen completed migration phases. Current runtime contracts are in
[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md); verification is in
[`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md).

## Active engineering queue

- [x] **Complete documentation reconciliation** — finish the remaining
  README/architecture wording review, keep evidence append-only and ensure
  agent-operation guidance stays separate from project contracts.
- [x] **Harden async route-owner cancellation** — `ExperienceUI` route-change
  promises now use a shared generation/page predicate, so late Works/Contact
  initializers cannot raise demand or touch a stage after a fast route exit;
  renderer recovery, carousel wake, UIkit hydration, overlay reveal, content
  hydration, submenu reconciliation, detached text animation and hash dispatch
  now cancel stale continuations at their owning boundary.
- [x] **Audit scene resource disposal** — `SectionGroups.dispose()` now uses
  owner-local texture slots and generalized Mesh/Points/Line/Sprite disposal;
  lifecycle coverage includes `Points` and `InstancedMesh` exactly-once tests.
- [x] **Close the shared transition QA matrix** — direct entry, in-app route,
  popstate, backend fallback, theme polarity, narrow layout and reduced motion;
  coverage is recorded in `docs/evidence/shared-transition-qa/`.
- [x] **Remove the final DOM route read** — `routePage` owns the current
  `PageId` entirely in memory; Vue route roots own semantic page markers and
  no runtime route state is projected to body/document datasets.
- [x] **Remove the dormant Contact pixel-title owner** — deleted the unused
  `ContactTextStage`/`PixelTextScreen` path and its render-demand flag; Contact
  presentation remains owned by the semantic Vue view and live typography/
  Cyprus stages.
- [x] **Cancel readiness fallback timers** — first-frame readiness now clears
  its bounded timeout, and Experience teardown cancels the gate without
  allowing a destroyed instance to publish `jlz:webgl-ready`.
- [x] **Remove the Camera DOM route read** — camera home-route tuning now uses
  the typed `routePage` port instead of `document.body.dataset.page`.
- [x] **Cancel route-announcer RAF** — `useJlzPage` now invalidates the deferred
  accessibility announcement when a route root unmounts.
- [x] **Coalesce lazy portfolio initialization** — concurrent UI entry points
  now share one owner promise; failures are contained and can retry cleanly.
- [x] **Retry failed carousel initialization** — a rejected home-carousel
  load now clears its owner promise while successful initialization remains
  idempotent.
- [x] **Cancel portfolio readiness RAF** — ExperienceUI teardown now cancels
  the deferred scene-readiness frame and releases its pending continuation.
- [x] **Cancel stale CinematicNav frames** — route track rebinding now clears
  pending scroll/focus RAFs before attaching the new route track.
- [x] **Release CinematicNav button listeners** — navigation button handlers are
  now owned by the navigation instance and removed explicitly during teardown,
  including when detached button DOM is retained by a test or external caller.
- [x] **Clear BakuCarousel teardown state** — the carousel now releases camera
  and card callbacks, nulls its input/timer owners, and resets drag/morph state
  after removing listeners and refcounted textures.
- [x] **Restore ContentReveal theme state** — the section owner now snapshots
  the pre-existing global `uk-light` classes and restores them on idempotent
  teardown, preventing stale theme state across runtime retries or HMR.
- [x] **Reject late Renderer init candidates** — unified WebGPU candidates now
  carry a lifecycle generation guard; a teardown during async init disposes the
  late candidate before it can create a pipeline, canvas owner, or recovery hook.
- [x] **Guard SceneHost fallback teardown** — the persistent Tres root now
  invalidates pending fallback initialization on unmount and disposes a late
  candidate instead of resolving a bridge for a removed Vue root.
- [x] **Cancel stale Works stage GPU setup** — `WorksPlaneStage` now invalidates
  pending texture loads on disposal and releases cache references without
  creating detached `CasePlane`/TSL resources after a route change.
- [x] **Prevent disposed Works stage reinitialization** — a disposed stage now
  rejects subsequent init attempts before starting texture loads.
- [x] **Avoid shared-texture over-release on carousel load failure** — partial
  `BakuCarousel` texture setup now releases only refs acquired by that attempt,
  preserving cache ownership held by other scene owners.
- [x] **Make carousel momentum refresh-rate invariant** — drag momentum now
  applies elapsed-time damping, preserving the same travel profile at 60/90/120Hz.
- [x] **Remove the obsolete Works back-text demand flag** — the deleted pixel
  text owner no longer keeps `/works` in a continuous GPU loop after cards settle.
- [x] **Guard Contact typography after disposal** — late route callbacks can no
  longer reactivate or update a disposed WireframeTypography owner.
- [x] **Close SceneHost live renderer ownership** — successful or stale host
  unmount now disposes the renderer that the Vue root constructed.
- [x] **Make WireframeTypography teardown terminal** — disposed glyph owners
  no longer retain registry entries or accept post-dispose motion/theme calls.
- [x] **Fail closed after renderer recovery failure** — a failed device-loss
  recreation stops the old loop and prevents updates against a disposed renderer.
- [x] **Reject malformed Works navigation indices** — non-finite overlay input
  no longer poisons the shared portfolio/carousel index state.
- [x] **Own overlay autoplay timers across media replacement** — repeated UIkit
  show/shown paths and preload/open replacement cannot leave an orphaned video
  timer alive after overlay teardown or mode changes.
- [x] **Keep Camera motion refresh-rate invariant** — the update step no longer
  floors `dt` to 120 Hz, so shake and organic motion preserve wall-clock timing
  on 144/240 Hz displays.
- [x] **Keep carousel momentum displacement refresh-rate invariant** — the
  60 Hz-authored fling velocity now scales both decay and travel distance by
  elapsed frame time.
- [x] **Protect cache generations during async texture release** — late owners
  pass texture identity when releasing retired in-flight URLs, so a replacement
  WebGPU texture cannot be decremented by an older generation.
- [x] **Suppress stale renderer recovery failure UI** — a rejected device-loss
  recreation after renderer teardown no longer mutates the removed DOM owner.
- [x] **Restore renderer tone mapping after post failure** — a thrown TSL post
  render cannot leave the live WebGPU renderer in a permanently altered color
  transform state.
- [x] **Expose post parameters as a read-only view** — consumers can no longer
  mutate the crossfade manager's live display state through its getter, without
  adding a per-frame object copy.
- [x] **Snapshot typed event dispatch** — owner teardown during an emit no longer
  skips sibling listeners that were subscribed to the same event.
- [x] **Ignore hidden particle owners in render demand** — Contact's quiet
  Agros frame no longer keeps the renderer alive or advances a hidden particle
  clock after its particle group is hidden.
- [x] **Release route-stage references on teardown** — Works and Contact
  stages clear camera/active state and child graphs when disposed.
- [x] **Keep carousel texture releases generation-safe** — Baku and Works
  teardown/catch paths now release by acquired texture identity, not URL alone.
- [x] **Clear the Lab object graph on teardown** — LabGamepad now removes its
  disposed mesh children as well as releasing their GPU resources.
- [x] **Clear the cursor-trail object graph on teardown** — DrawTrail removes
  its disposed ribbon from the owner group and resets activity state.
- [x] **Dispose route WorkCards on owner teardown** — `useJlzPage` now releases
  the module-level card/grid registry on full unmount as well as before route
  replacement, with lifecycle coverage for both paths.
- [x] **Keep Contact prewarm request-owned** — the lazy Cyprus stage now has one
  guarded prewarm continuation; stale entry-route promises cannot prewarm a
  newer Contact stage or add an unnecessary render frame.
- [x] **Guard Contact route activation continuations** — section activation now
  captures the Cyprus request generation, so a pending route callback cannot
  activate a newer stage after a fast Contact route replacement.
- [x] **Cancel stale Contact Cyprus model setup** — a disposed stage now drops
  a pending Draco/GLTF result before attaching meshes or allocating materials.
- [x] **Freeze route animation clocks on idle frames** — `SceneCoordinator`
  now synchronizes route ownership without advancing Works/Contact animation
  state when the demand-driven scheduler has no frame to present.
- [x] **Remove ineffective Projects dynamic import** — ExperienceUI now uses
  the existing static project-data owner instead of a non-splitting import.
- [x] **Keep Contact typography addons route-local** — the lazy Contact
  typography stage now owns `FontLoader` and `TextGeometry` in a separate
  chunk, so other routes do not download those addons; the shared Three.js
  budget excludes only this measured route-local asset.
- [x] **Reduce the shared Three.js vendor below budget** — a scoped bare-
  `three` compatibility entry now re-exports `three/webgpu` and retains only a
  dead-path `WebGLRenderer` symbol required by TresJS 5.8.3. The production
  vendor measures 298.43 kB gzip against the 350 kB gate; WebGPU/WebGLBackend
  runtime and route/lifecycle gates remain green. The exact global alias and
  any removal of the compatibility symbol remain prohibited until upstream
  TresJS ships an equivalent slim entry.
- [x] **Make UIMenu teardown deterministic** — the persistent shell now uses
  one delegated click owner and removes it explicitly instead of retaining
  five anonymous control listeners until DOM garbage collection.
- [x] **Scope FullscreenOverlay listeners** — media/control/poster listeners
  now share one `AbortController` owner and are cancelled atomically during
  teardown, alongside the existing document keyboard and modal cleanup.
- [x] **Clear the bootstrap readiness watchdog** — the 60-second failed-boot
  timer is now owned by `entry-app` and cancelled as soon as readiness or an
  explicit failure arrives, including before a retry.
- [x] **Delegate WorkCards clicks per grid** — card activation keeps its
  debounce and project event contract while each grid owns one listener
  instead of one listener per card; disposal removes the grid owners and
  their release timers together.
- [x] **Keep secondary route views out of startup** — `HomeView` remains the
  eager landing target, while the five secondary Vue route views use explicit
  route-level imports; the measured `app` chunk fell from 10.00 kB to 3.37 kB
  gzip without changing the persistent Tres scene owner.
- [x] **Cancel video poster reveal callbacks** — `FullscreenOverlay` now owns
  and cancels its nested first-frame RAF or `requestVideoFrameCallback` during
  media replacement, modal hide and disposal.
- [x] **Move persistent UIkit hydration to UIMenu** — the shell now hydrates
  its own icons/tooltips at construction; the bootstrap no longer schedules a
  duplicate global idle traversal of `#spa-content`, reducing `entry-app` from
  7.30 kB to 6.99 kB gzip.
- [x] **Scope ContentReveal to the route root** — section activation, lookup
  and UIkit refresh now operate inside `#spa-content`, leaving unrelated
  persistent or detached sections untouched during navigation.
- [x] **Align Experience DOM lookups with the route root** — section eyebrows
  and initial-section activation now use the same `#spa-content` owner, with a
  bootstrap-only document fallback before Vue mounts.
- [x] **Complete route-content DOM scoping** — bootstrap section/page-section
  signals and title observers now use the same route root; splash controls and
  persistent-shell selectors remain intentionally global.
- [x] **Scope WorkCards to the route root** — card discovery, delegated grid
  owners and roving tabindex now stay inside `#spa-content`; detached and
  persistent-shell grids remain outside the route owner.
- [x] **Scope menu template bindings to the route root** — menu discovery,
  preview synchronization and same-page hash targets now resolve within
  `#spa-content`, leaving detached menu markup untouched.
- [x] **Wake demand after fullscreen project navigation** — overlay Prev/Next
  now raises the shared `nav` demand after changing the carousel target, so a
  settled renderer advances the 3D selection without waiting for unrelated
  input.
- [x] **Preserve the carousel card idle guard** — hidden idle cards no longer
  advance cloth time every frame while the carousel is active; visible or
  already-animating cards retain their update path.
- [x] **Scope cinematic hash resolution to the active track** — route hashes
  now resolve inside the current `CinematicNav` track, so detached duplicate
  IDs cannot redirect story navigation.
- [x] **Own the delayed splash title reveal** — the 90 ms curtain handoff is
  cancellable and coalesced, so retry/failure cannot animate stale route DOM.
- [x] **Recover the route transition after navigation errors** — Vue Router
  errors now cancel the covering surface and invalidate pending reveal work,
  preventing a failed lazy route from leaving the UI blocked.
- [x] **Invalidate stale direct-entry hashes** — deferred initial
  `#section-*` dispatch is now owned by a generation gate and is cancelled on
  later navigation or failed boot before renderer readiness.
- [x] **Make BlurFade text-only at the DOM boundary** — per-character spans
  are created with `textContent`, preserving editorial markup as text and
  avoiding an HTML parse during every reveal.
- [x] **Clear stale route reveal timers** — RouteTransition now cancels the
  pending 420 ms reveal timer on cancellation or replacement instead of merely
  ignoring its callback after sequence invalidation.
- [x] **Gate repeated application starts** — concurrent `startApp()` calls now
  share one bootstrap promise; a rejected attempt resets the gate for an
  explicit retry, while existing listeners, timers and observers are cleared
  before rebinding.
- [x] **Dispose route-menu frame owners** — `useJlzPage` now releases the
  menu's app-owned listeners and pending two-frame visibility reconciliation
  before a route root is unmounted; UIkit remains the owner of accordion state.
- [x] **Cancel stale hash-navigation frames** — route hash dispatch now owns
  one cancellable RAF and invalidates it on replacement or router error instead
  of waking an obsolete callback and ignoring it after the fact.
- [x] **Contain failed bootstrap attempts** — incomplete `Experience` and
  `UIManager` owners are disposed exactly once; retry remains available only
  before the one-shot `SceneHost` bridge is imported, while post-bridge errors
  become terminal to protect the single renderer/canvas contract.
- [x] **Reject post-dispose scheduler frames** — `RenderScheduler` now ignores
  callbacks captured before `destroy()` or the settled stop, so released scene
  and GPU owners cannot be touched by a late renderer-loop tick.
- [x] **Own delayed readiness events** — the post-bootstrap `jlz:webgl-ready`
  timer is cancellable and generation-guarded, including reduced-motion's
  zero-delay path, and is cleared on retry/failure/reset.
- [x] **Release retry-owned bootstrap resources** — the injected Less style
  has one explicit owner, and `ErrorTracker` keeps removable window handlers;
  retry cleanup replaces/removes both without duplicating CSS or stale error
  closures.
- [x] **Cancel stale route cover timers** — `RouteTransition` now owns the
  260 ms cover timer, resolves superseded transitions during cancellation and
  releases the timer before a newer navigation or failed route can accumulate
  stale async work.
- [x] **Stop text animation owners during Experience teardown** — active
  `NoiseText` and `BlurFade` instances are registry-backed and disposed before
  the scene/UI owners, so connected route DOM cannot retain RAF or safety
  timeout work after runtime destruction.
- [x] **Release the WorksPortfolio owner** — `ExperienceUI.destroy()` now calls
  the portfolio disposer before dropping its reference; disposal clears the
  project/callback references and navigation becomes a safe no-op.
- [x] **Restore the singleton Input owner** — `Experience.init()` reattaches
  the shared mouse listener after explicit teardown/HMR through an idempotent
  `input.start()`, while `destroy()` remains the sole listener release path.
- [x] **Guard async Experience construction after teardown** — a lifecycle
  generation is checked after renderer/world/prewarm awaits, so a destroyed
  runtime cannot publish readiness or create late `Lights`/`Ground` owners.
- [x] **Settle open FullscreenOverlay teardown** — disposal now routes an open
  modal through idempotent hide cleanup before UIkit destruction, restoring
  media, focus, keyboard and body-scroll state without duplicate `onClose`.
- [x] **Make partial Experience teardown safe** — cleanup now tolerates
  renderer/world failures before `ContentReveal`, `Cursor`, `SceneCoordinator`
  or `StateBus` exist, preserving release of the owners that did initialize.

## Deferred product queue

- [x] **Extend published builder pages** — publish an escaped EN/RU `hreflang`
  matrix with an `x-default` alternate while keeping canonical
  self-referential; remote/network sources remain deferred until an explicit
  security and caching design exists.
- [ ] **Extend the cinematic brand language** — tune motion and TSL response
  across every route while preserving backend and reduced-motion parity.
- [x] **Cross-backend runtime baseline** — desktop and physical Android
  resize/DPR evidence is recorded under `docs/evidence/`.
- [ ] **Finish the UIkit-first style ownership split** — keep component,
  layout and accessibility behavior single-owned by Vue/UIkit adapters.
  - [x] Builder card base radius/shadow and button radius now come only from
    UIkit hooks; project Less retains only builder-specific surface and variant
    rules, preserving separate `cardRadius`/`buttonRadius` tokens.
  - [x] Bootstrap UIkit refresh is scoped to `#spa-content`, preventing a
    document-wide traversal across the splash and persistent shell.
- [ ] **Decide the fate of vendored `references/`** — archive or retain after
  licensing review; do not publish it accidentally.
- [ ] **Configure production SPA/SSG hosting** — verify every route, blog
  document, asset and canonical URL against the selected host.
- [ ] **Turn Works into evidence** — align approved facts and media around the
  same problem, response, role and proof.
- [ ] **Replace placeholder media and contact delivery** — ship measured media
      and a real contact endpoint after the route/resource boundaries are ready.

## Engineering policy

- Do not duplicate route, slot, metadata, preference or render-reason facts.
- Do not add a dependency without an owner, measured value, bundle impact and
  removal/replacement analysis.
- Check official release notes and the tested compatibility matrix before
  upgrading Vue, TresJS, Three.js or supporting packages.
- Prefer one coherent bounded outcome per commit; update this queue with the
  same change that completes the outcome.
- A release cannot pass with resource growth, duplicate animation loops,
  continuous settled draws or weakened startup/performance budgets.
