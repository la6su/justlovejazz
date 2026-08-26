# Next work

This file is the active outcome queue. The Vue 3, Vue Router and TresJS
migration is complete; its phase history, acceptance gates and removal ledger
are preserved in [`docs/archive/MIGRATION_VUE_TRES.md`](docs/archive/MIGRATION_VUE_TRES.md).
Do not reopen completed migration phases. Current runtime contracts are in
[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md); verification is in
[`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md).

## Active engineering queue

- [x] **Initialize StateBus before renderer demand** — the animation state
      owner is constructed before async renderer/Tres setup, so an early resize
      invalidation cannot enter `Experience.update()` with an undefined bus.

- [x] **Harden the renderer-recovered handoff** — `Experience` installs its
      recovery listener before async initialization, ignores late events after
      destroy, and swaps PMREM environment textures only after replacement
      generation succeeds.

- [x] **Restore tone mapping after TSL graph build failure** — the shared
      renderer state is restored even when `TSLRenderPipeline` construction throws.

- [x] **Synchronize reduced-motion changes** — Experience now observes the
      live media preference, settles ambient work when reduction is enabled and
      raises one typed demand when normal motion is restored.

- [x] **Settle cube face transitions under reduced motion** — `SplashCube`
      now snaps section rotations instead of leaving `_faceLerp` active while the
      reduced-motion scene coordinator intentionally skips cube animation.

- [x] **Synchronize Contact typography motion preference** — an already-active
      glyph stage now settles or resumes its authored motion when the OS setting
      changes, without requiring route re-entry.

- [x] **Remove orphaned idle cube wobble** — deleted a time-based transform that
      was updated only on unrelated demand frames and was not owned by any activity
      signal; authored jelly, face and opener reactions remain unchanged.

- [x] **Snap EnvSphere under reduced motion** — section palette changes now
      reach their authored color synchronously instead of stopping mid-lerp when
      the reduced-motion scheduler settles.

- [x] **Route story-side state through the scene owner boundary** —
      `CinematicNav.getSide()` now supplies the typed Menu/Contact/center state to
      `BakuCarousel`; the UI `cinematicSheet` dataset remains a projection only.

- [x] **Track recovered renderers in the Vue host** — device-loss replacement
      instances now update the SceneHost-owned renderer slot, so a later Vue
      unmount disposes the live GPU owner instead of the stale initial instance.

- [x] **Read the WebGPU fallback fact from the live device** — r185 backend
      inspection now uses the WebGPU-standard `GPUDevice.adapterInfo` shape,
      so a confirmed software adapter can reach the existing `forceWebGL`
      recreation policy instead of remaining permanently unknown.

- [x] **Make fallback recovery disposal exactly-once** — a failed forced-WebGL
      recreation no longer reaches the catch cleanup with an already-disposed
      software-adapter replacement.

- [x] **Dispose failed recovery replacements** — device-loss recovery keeps the
      replacement renderer under local ownership through post-swap setup and
      bridge callbacks, so any late failure disposes the new GPU owner exactly
      once before terminal failure.

- [x] **Bound TSL graph-build failure** — a native WebGPU post-graph failure
      disables only the failing post owner and falls back to direct rendering,
      preventing repeated graph construction from keeping demand alive forever.

- [x] **Own TSL scene-pass render targets** — `WebGPUPostPipeline` retains the
      `PassNode` created for the scene capture and disposes it on rebuild, graph
      failure and teardown, preventing detached render targets from surviving a
      route change or renderer recovery.

- [x] **Make post resource counters owner-backed** — `WebGPUPostPipeline` now
      enumerates its live scene-pass and Bloom render targets, and
      `RenderPipeline` forwards those counts to the existing runtime snapshot;
      resource soak baselines are no longer hard-coded zero on native WebGPU.

- [x] **Stop the loop after an update failure** — an exception in the frame
      owner clears pending demand and makes the current scheduler window settle;
      a later invalidation may still perform one diagnostic or recovery attempt.

- [x] **Fail closed after exhausted device-loss recovery** — once the bounded
      recreation budget is spent, the retired loop callback is cleared and the
      current renderer receives `setAnimationLoop(null)` before the failure state
      is surfaced.

- [x] **Detach direct scene owners on disposal** — `EnvSphere` and `SplashCube`
      now remove themselves from the Tres-owned scene before releasing GPU
      resources, preventing disposed objects from remaining in the live graph.

- [x] **Honor low-tier post policy** — native WebGPU low-tier rendering now
      skips the TSL full-screen graph and uses direct scene rendering, matching
      `supportsPostProcessing()` instead of paying for disabled effects.

- [x] **Make Tres renderer teardown idempotent** — unified renderers and the
      persistent SceneHost now tolerate Tres manager disposal, application cleanup
      and late failed-init cleanup without double-disposing the underlying owner.

- [x] **Snap CinematicLights under reduced motion** — section-driven light
      colors, intensities and key position now settle to their authored targets
      immediately, while normal motion retains the existing interpolation.

- [x] **Settle EnvSphere on live motion-policy changes** — an active ambient
      palette crossfade now snaps to its target before the scheduler is stopped.

- [x] **Settle SplashCube on live motion-policy changes** — face rotation,
      jelly displacement and opener scale now reset to authored final state before
      the scheduler is stopped.

- [x] **Settle ContactCyprusStage on live motion-policy changes** — route-owned
      fade and scale transitions now snap before scheduler settlement.

- [x] **Settle Camera on live motion-policy changes** — section framing is
      preserved, transient pulse/shake is cancelled, and cursor displacement is
      removed before scheduler settlement.

- [x] **Settle Works card motion under reduced motion** — CasePlane wobble,
      scroll motion and edge warp now settle synchronously, while Works reveals
      snap to their target without retaining render demand.

- [x] **Settle story parallax under reduced motion** — `CinematicNav` now
      clears decorative section shifts on live policy changes while preserving
      semantic section state and navigation behavior.

- [x] **Dispose route-transition ownership** — `RouteTransition` now releases
      its overlay and timers through an explicit lifecycle boundary; router errors
      use that boundary instead of retaining stale DOM work.

- [x] **Avoid redundant overlay media reloads** — image-only FullscreenOverlay
      opens and preloads no longer call `video.load()` when no film source exists.

- [x] **Refresh dynamic UIkit sound icons** — UIMenu now rehydrates the
      changed icon node after external sound-toggle events, keeping EN/RU shell
      controls visually synchronized.

- [x] **Close SFX after disposal** — `SfxSystem` now has a terminal disposed
      guard so late UI events cannot recreate an orphaned `AudioContext`.

- [x] **Restore BlurFade authored DOM on hide** — hidden titles now collapse
      per-character spans and accessibility metadata back to their source text.

- [x] **Preserve NoiseText before first show** — hiding an unstarted owner no
      longer erases authored content while finalization remains clean for active
      reveals.

- [x] **Make theme mode writes idempotent** — same-mode requests no longer
      persist or emit redundant theme-change work across DOM and scene owners.

- [x] **Fail closed after scheduler host errors** — a thrown frame owner no
      longer strands the animation loop active; a later typed invalidation can
      retry the bounded window.

- [x] **Refresh coordinator route caches** — reinitializing the shared
      SceneCoordinator now invalidates page-specific config and range caches.

- [x] **Publish terminal renderer failure** — exhausted or failed device-loss
      recovery now emits the typed bootstrap failure event before surfacing the
      fallback UI.

- [x] **Wake cursor click feedback** — click activity now invalidates the
      settled demand-driven loop before animating the cursor bump.

- [x] **Cancel hidden overlay title reveals** — FullscreenOverlay teardown now
      releases BlurFade even when a preloaded overlay never entered the modal.

- [x] **Wake carousel pointer motion** — BakuCarousel input now invalidates the
      shared demand-driven loop for touch drags and explicit carousel controls.

- [x] **Unify Works visual taps** — visual plane pointerup now uses
      `WorksPlaneStage.openProject`, preserving the wobble owner and dirty wake.

- [x] **Remove DrawTrail frame allocations** — camera basis scratch vectors are
      now reused across ribbon rebuilds instead of allocated per render frame.

- [x] **Remove Works layout frame allocations** — WorksPlaneStage reuses its
      scaled viewport layout scratch object for visible cards.

- [x] **Cache Works reduced-motion policy per stage** — the per-card update
      path now reads an owner-local preference snapshot instead of querying
      `matchMedia()` for every card on every frame; the observer is disposed
      with the lazy route owner.

- [x] **Cache CinematicLights reduced-motion policy** — section transitions and
      the per-frame orbit now read the owner-local policy snapshot; live
      `setReducedMotion()` updates remain the single reconciliation boundary.

- [x] **Cache Contact Cyprus motion policy** — the lazy Agros fade/scale frame
      path now reads an owner-local snapshot while live preference changes
      continue to settle the route owner synchronously.

- [x] **Cache Camera motion policy** — cursor follow, organic shake and FOV
      update paths now read the owner-local snapshot; `setReducedMotion()`
      remains the live transition boundary.

- [x] **Propagate CasePlane motion policy from owners** — carousel and lazy
      Works stages forward live preference changes to cards, removing the
      per-card `matchMedia()` call from the cloth frame path while preserving
      synchronous reduced-motion settling.

- [x] **Cache SceneCoordinator motion policy** — frame-path owner predicates
      now read the synchronized coordinator snapshot, while Experience remains
      the single live media-query observer and propagation boundary.

- [x] **Gate EnvSphere work by render demand** — ambient palette interpolation
      now advertises an explicit animation signal and advances only while a
      frame can be presented; section changes keep the demand window alive
      until the palette reaches its target.

- [x] **Skip unchanged ground material writes** — `GroundPlane` now compares
      effective color/opacity before touching its material; section interpolation
      and explicit theme synchronization remain the only dirty boundaries.

- [x] **Stop settled light-transition writes** — `CinematicLights` now gates
      converged color/intensity/position lerps while preserving its intentional
      volumetric orbit and reduced-motion snap behavior.

- [x] **Skip unchanged SplashCube blend writes** — final theme/world color is
      computed in owner-local scratch state and uploaded only when it differs;
      role, reduced-motion and disposal boundaries remain unchanged.

- [x] **Rebuild DrawTrail only on geometry changes** — static pointer decay now
      updates uniforms without rebuilding the ribbon; pointer history and camera
      basis changes still rebuild the camera-facing geometry.

- [x] **Skip unchanged Cyprus presentation writes** — the lazy Contact stage
      now writes material opacity and model scale only when their effective state
      changes; visibility and reduced-motion settlement remain synchronous.

- [x] **Skip unchanged section opacity writes** — cached scene meshes now update
      material opacity only when the computed section fade changes; visibility,
      carousel activation and transition easing remain authoritative.

- [x] **Skip unchanged StateBus channel writes** — numeric transform channels
      preserve missing-channel and animation semantics while avoiding redundant
      Map writes during settled opacity reconciliation.

- [x] **Cache settled ground transform inputs** — the ground owner skips even
      the lerp calculation when the same section pair and eased `t` recur; theme
      sync and changed transitions remain immediate.

- [x] **Stop settled post crossfades** — the real-WebGPU post manager now skips
      six-value interpolation after all targets settle and snaps exact values at
      the epsilon boundary; preset interruption and reduced motion remain live.

- [x] **Cache settled WebGPU post handoff** — `RenderPipeline` now updates TSL
      uniforms only after post parameters, section grade or scene ownership is
      dirty; direct WebGLBackend rendering remains unchanged.

- [x] **Skip settled WebGPU cache preparation** — scalar and grade tuple copies
      are now performed only in the same dirty handoff, preserving first-render
      priming and scene/camera rebuild invalidation.

- [x] **Cache Renderer post source values** — real-WebGPU `scaleIntensity` and
      wrapper writes now run only when manager values change or a new pipeline is
      created; the direct WebGLBackend path stays untouched.
- [x] **Own the unsupported renderer overlay** — failure-state DOM is now
      idempotent and removed with `Renderer.dispose()`, including repeated
      device-loss failures.
- [x] **Skip settled BakuCarousel rewrites** — preserve one reconciliation pass
      while avoiding repeated 12-card transform/uniform writes on demand frames
      caused by other active scene owners.
- [x] **Skip settled WorksPlaneStage rewrites** — preserve route/card
      reconciliation while avoiding repeated camera-local layout and uniform
      writes until camera, viewport, section or motion state changes.

- [x] **Scope Works cloth updates to active cards** — idempotent CasePlane
      reveal/motion/transition setters and per-card activity gating stop a
      settled sibling from advancing its time uniform during another card's
      pulse; layout, reveal and camera invalidations remain full reconciliation
      boundaries.

- [x] **Expose DEV frame-owner timing evidence** — the existing runtime
      snapshot now includes a fixed-size CPU timing ring for scene,
      camera/lights, renderer and total rendered frames; GPU timing remains
      explicitly hardware-gated and is not inferred from CPU measurements.
- [x] **Short-circuit settled DrawTrail work** — identical pointer/camera
      demand frames no longer perform basis extraction, unprojection or trail
      uniform writes; pointer and camera changes still wake the owner.
- [x] **Stop Tres's internal loop at SceneHost ready** — `TresCanvas` now uses
      on-demand mode without manual delayed `advance()`, and its loop is
      stopped before the RenderScheduler bridge can yield or unmount.

- [x] **Keep Works camera handoff idempotent** — repeated per-frame binding of
      the same camera no longer dirties the settled route layout; a real camera
      replacement still invalidates the card reconciliation pass.

- [x] **Reuse settled SceneCoordinator transforms** — repeated demand frames
      with unchanged story progress and route revision return the pooled result
      without repeating group, ground or opacity reconciliation.

- [x] **Isolate WebGPU post-pass teardown failures** — a throwing `PassNode`
      disposal clears its owner reference and cannot prevent the remaining TSL
      graph cleanup or a later idempotent dispose.

- [x] **Skip settled Contact camera pose writes** — the lazy Cyprus stage now
      tracks camera position/quaternion and only reapplies its camera-local
      transform while the pose or authored fade/prewarm state changes.

- [x] **Give SectionGroups particle owners terminal teardown** — `JunniParticles`
      now disposes itself before the generic subtree sweep, preventing late
      updates and duplicate geometry/material disposal.

- [x] **Skip settled SplashCube owner work** — unrelated demand frames no
      longer advance cube time or repeat material/transform reconciliation once
      jelly, face, opener and blend state have settled.

- [x] **Cache CinematicNav scroll policy** — programmatic section navigation
      reads the owner-local reduced-motion snapshot instead of re-querying the
      media preference on every scroll request.

- [x] **Start Camera FOV demand settled** — a newly constructed camera no
      longer reports an unrequested pulse, avoiding a false initial render
      window before the first authored section transition.

- [x] **Cache SplashCube motion policy** — opener and face reactions reuse the
      synchronized owner snapshot instead of re-querying media state after
      live preference propagation.

- [x] **Cache EnvSphere motion policy** — section palette changes reuse the
      ambient owner's synchronized preference snapshot while live toggles still
      settle or resume the transition boundary explicitly.

- [x] **Cache Contact typography motion policy** — lazy stage activation reuses
      the propagated preference snapshot instead of re-querying media state
      after a live toggle.

- [x] **Use Experience motion snapshot for camera shake** — section context
      changes now use the runtime owner policy instead of an out-of-band media
      query during the transition path.

- [x] **Make ParticleBurst reduced-motion safe at the owner boundary** — the
      splash GPU burst now rejects new triggers and cancels active work when
      reduced motion is enabled, independent of the calling UI path.

- [x] **Settle BakuCarousel on reduced-motion changes** — live policy changes
      now finish morph/scroll state, cancel momentum and release drag demand
      before SceneCoordinator pauses decorative updates.

- [x] **Settle WorksPlaneStage on reduced-motion changes** — lazy card reveals
      and camera-local layouts now snap before the route owner stops advancing,
      preventing an intermediate Works frame from retaining demand.

- [x] **Settle DrawTrail on reduced-motion changes** — cursor ribbon energy and
      uniforms now clear at the GPU owner boundary, so a paused coordinator
      cannot leave a stale trail activity flag keeping the loop alive.

- [x] **Apply SplashCube world blend at the motion boundary** — a live
      reduced-motion toggle now applies the already-computed material blend
      synchronously instead of waiting for the decorative update path.

- [x] **Settle post crossfades on reduced-motion changes** — the post owner now
      snaps display parameters to the active preset before the shared scheduler
      stops, preventing a half-applied bloom/vignette/grain state.

- [x] **Cover post-owner motion forwarding** — Experience regression coverage
      now locks the exact boolean handoff from the live preference observer to
      the renderer post owner.

- [x] **Snapshot SceneCoordinator route state per update pass** — the active
      world update now reads the injected page identity once instead of
      repeating it across owner branches; navigation remains live on the next
      synchronous frame.

- [x] **Snapshot repeated scene owners per update pass** — active frames now
      reuse one Baku and one Contact Cyprus owner read while preserving the
      same update/visibility ordering and lazy owner boundary.

- [x] **Snapshot scene groups per update pass** — carousel visibility and
      particle drift now reuse one stable `SectionGroups.groups` reference
      instead of re-reading the group owner in the same active frame.

- [x] **Snapshot SceneCoordinator route owners per transform pass** — the
      six-group visibility loop now reuses one route page and carousel owner
      read, preserving the live getter boundary while removing repeated reads
      from every group on a demand frame.

- [x] **Pool SceneCoordinator transform results** — per-frame camera/world
      metadata now reuses one owner-scoped result graph.

- [x] **Pool Experience activity snapshots** — render-demand flags now reuse
      one owner-scoped snapshot instead of allocating per frame.

- [x] **Pool renderer post parameters** — real-WebGPU `Renderer.update()` now
      reuses its `PostParams` wrapper per frame.

- [x] **Reuse EnvSphere transition weights** — section palette transitions now
      mutate owner-scoped arrays instead of allocating replacement arrays.

- [x] **Align WebGLBackend quality state** — direct-render fallback no longer
      advertises or updates the unused TSL post graph; native WebGPU retains the
      crossfade and post parameter path.

- [x] **Keep renderer failure terminal** — device-loss recovery failure now
      rejects later loop reattachment, and WebGLBackend fog clearing is restored
      after each direct fallback draw.

- [x] **Single-source camera smoothing defaults** — `WorldConfig` owns the
      shared fallback used by `Experience`; authored per-section overrides remain
      in the canonical phase configuration.

- [x] **Complete documentation reconciliation** — finish the remaining
      README/architecture wording review, keep evidence append-only and ensure
      agent-operation guidance stays separate from project contracts.

- [x] **Reconcile current Vue builder and renderer ADRs** — `PAGE_BUILDER.md`
      now describes the shipped Vue editor and EN/RU registry, ADR 0003 is
      explicitly superseded by ADR 0010, and historical classic-renderer
      measurements are marked as superseded in `PERFORMANCE_BASELINE.md`.

- [ ] **Profile the next runtime owner on real backends** — capture a bounded
      WebGPU/WebGLBackend frame trace and draw/resource counters before changing
      an owner whose motion is intentional; headless unit coverage alone is not
      sufficient evidence for the next performance slice. The phase7 gate now
      captures the trace on the local WebGLBackend path; a hardware WebGPU run
      remains required before this item can close.

- [ ] **Verify browser device-loss recovery on WebGLBackend** — the e2e probe
      now drives a real `WEBGL_lose_context` event and checks the production
      recovery handoff, one-canvas ownership and fatal-error boundary through
      the production `window.__jlzHost` evidence seam. Headless Chromium now
      preflights context restoration and skips when its restored framebuffer is
      unusable; execute the probe on a WebGL-capable browser before accepting
      recovery as integration-proven.

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
- [x] **Single-own builder card CSS** — published Less no longer emits a second
      `card.less` import already owned by the application baseline; the baseline
      now contains the real import and generated deltas are parity-tested.
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
- [x] **Reuse NoiseText frame buffers** — the bounded typewriter owner now
      reuses its character array across RAF ticks; only the final DOM string is
      rebuilt for each visible frame.
- [x] **Cache BlurFade rotation metadata** — reveal ticks now reuse the
      authored per-span rotation values instead of parsing `data-rot` on every
      frame.
- [x] **Refresh Phase 10 delivery evidence** — the current production build
      and budget measurements are recorded in `docs/PERFORMANCE_BASELINE.md`,
      including explicit `n/a` attribution where the manifest has no separate
      Vue/TresJS vendor chunks.
- [x] **Align Page Builder migration wording** — `docs/PAGE_BUILDER.md` now
      describes the shipped Vue registry and static publishing boundary instead of
      treating Phases 5 and 9 as future work or implying a runtime HTML fallback.
- [x] **Close the Phase 10 soak summary** — the performance baseline now links
      the accepted 20-cycle route evidence instead of leaving the cutover row in
      `pending` after the JSON report had already passed.
- [x] **Release StateBus section channels** — `Section.dispose()` now removes
      its state/opacity channels and `StateBus.off()` drops empty listener buckets,
      preventing singleton-owned route state from surviving teardown.
- [x] **Make ParticleBurst teardown terminal** — disposed intro light frames
      now reject late triggers/updates, clear their segment metadata and release
      geometry/material exactly once.
- [x] **Make camera and cursor teardown terminal** — late scheduler frames and
      external HMR callbacks now become inert after `Camera.destroy()` or
      `Cursor.destroy()`; teardown is idempotent and cursor wake callbacks are
      released.
- [x] **Pool cursor redraw geometry** — active cursor frames reuse the fixed
      ring-point records and cached theme-color view instead of allocating a point
      array and palette object on every canvas redraw.
- [x] **Invalidate cursor palette at the theme boundary** — the persistent
      canvas cursor refreshes its CSS color cache only for a real theme change
      and forces exactly one redraw while settled; subsequent idle frames keep
      the existing demand and allocation guards.
- [x] **Isolate Camera owner state** — spring damping and Three.js scratch
      objects now belong to each Camera wrapper instead of shared module state;
      concurrent recovery/HMR instances cannot advance one another's camera.
- [x] **Isolate DrawTrail TSL uniforms** — each trail owns its time, velocity
      and energy uniforms and node closures; independent trail owners no longer
      overwrite one another's GPU signal state.
- [x] **Isolate ParticleBurst TSL uniforms** — each intro burst owns its time
      and duration uniforms and node closures; concurrent splash owners no longer
      share animation progress.
- [x] **Make BakuCarousel teardown terminal** — late controls, updates and
      snap callbacks become inert after disposal; the shared demand loop cannot
      be woken or mutated by a retired carousel.
- [x] **Make WorksPlaneStage teardown terminal** — late route controls,
      hit-tests, updates and prewarm calls become inert after disposal while the
      existing async texture cancellation boundary remains intact.
- [x] **Make SplashCube teardown terminal** — late section/theme/material
      callbacks and frame updates become inert after persistent scene teardown;
      animation predicates settle false and disposal is idempotent.
- [x] **Make ContactCyprusStage teardown terminal** — late camera, route,
      prewarm, resize and frame calls become inert after Contact teardown while
      the existing late Draco/GLTF cleanup remains authoritative.
- [x] **Make EnvSphere teardown terminal** — late palette changes, reduced-motion
      updates and frame callbacks become inert after the shared ambient owner has
      released its GPU resources; repeated disposal is safe.
- [x] **Make CinematicLights teardown terminal** — late section, preference and
      frame calls become inert after the light owner releases its scene resources;
      repeated disposal cannot touch detached lights.
- [x] **Make JunniParticles teardown terminal** — late GPU timeline, blending and
      auto-reduce count calls become inert after particle geometry/material release;
      repeated disposal is safe.
- [x] **Make GroundPlane teardown terminal** — late config, theme, transform and
      visibility calls become inert after contact-ground resources are released;
      repeated disposal is safe.
- [x] **Make SectionGroups teardown terminal** — late group lookup becomes inert
      after recursive scene-resource disposal; carousel-first ordering and repeated
      teardown remain safe.
- [x] **Make CasePlane teardown terminal** — late reveal, pulse, motion, warp and
      frame calls become inert after per-card material release; shared geometry and
      texture ownership remain with their existing owners.
- [x] **Make Section teardown terminal** — late StateBus transitions become inert
      after owner channels/listeners are removed; repeated disposal detaches the
      section without reintroducing channels.
- [x] **Make WorksPortfolio teardown terminal** — late navigation calls become
      inert after callback/project release; repeated disposal cannot mutate the
      retired index or notify the carousel.
- [x] **Make Sizes teardown terminal** — late resize registration and viewport
      updates become inert after the window listener is released; repeated destroy
      remains safe.
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
- [x] **Finish the UIkit-first style ownership split** — keep component,
      layout and accessibility behavior single-owned by Vue/UIkit adapters.
  - [x] Builder card base radius/shadow and button radius now come only from
        UIkit hooks; project Less retains only builder-specific surface and variant
        rules, preserving separate `cardRadius`/`buttonRadius` tokens.
  - [x] Bootstrap UIkit refresh is scoped to `#spa-content`, preventing a
        document-wide traversal across the splash and persistent shell.
  - [x] Baseline/delta parity is verified: every compiler baseline component is
        imported by `_import.less`; only `list` and `divider` remain optional deltas.
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
