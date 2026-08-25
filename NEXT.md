# Next work

This is the evidence-driven execution queue. The accepted program is the full
Vue 3, Vue Router and TresJS migration described in
[docs/MIGRATION_VUE_TRES.md](docs/MIGRATION_VUE_TRES.md). Work top to bottom;
do not start a phase whose entry gate has not passed.

## 1 — Active migration queue

- [x] **Finish Phase 0: freeze the pre-migration baseline** — the architecture
      plan and ADR foundation now exist. Capture a clean production manifest,
      route screenshots after Enter, WebGPU and forced-WebGL diagnostics,
      accessibility contracts and the full current release gate. Record only
      evidence that can be repeated during later phases. Forced WebGL home
      parity passed once Enter was awaited in its `is-ready` state; the remaining
      owner-visible resource soak and explicit root teardown now pass on a
      physical Android high-DPR device. The two-canvas composition is recorded
      as an intentional legacy boundary to remove in Phase 2/6.

- [x] **Finish Phase 1: select and scaffold the compatible toolchain** — the
      exact Vue, Vue Router, TresJS and Three.js matrix is pinned; SFC, type,
      test and bundle gates run without changing the production entry graph.
      The hardware development probe establishes Tres manual mode as one loop
      candidate and records its built-in bootstrap `advance()` separately from
      project frame requests. Phase 2 must select manual advancement or a
      `setAnimationLoop` driver by hardware pacing/idle A/B. Async renderer
      initialization, backend inspection and application readiness remain
      distinct contracts.

- [ ] **Phase 2: pass the representative unified-renderer gate** — exercise
      `WebGPURenderer` with WebGPUBackend and forced WebGLBackend against fog,
      representative materials, the full TSL post graph, environment, Works,
      GLTF/DRACO, reduced motion, lazy teardown and software-adapter policy.
      Keep the classic fallback until parity, idle, performance and resource
      soak gates pass. The first factory slice now passes on the desktop RTX
      4060 Ti and forced WebGLBackend with one Tres canvas, one async init owner
      and no duplicate Three runtime. Adapter class remains explicitly unknown
      because Three r185 does not expose it. The bounded `setAnimationLoop`
      driver is selected for the future scheduler integration: three equal
      physical-Android windows per backend ran the representative TSL, fog,
      asset and post graph at 0 idle ticks and a worst p95 of 16.80 ms. The
      new dev-only representative
      probe renders fog plus `MeshBasicNodeMaterial` through `WebGLBackend`;
      its resource scope has idempotent teardown and refuses WebGPU-only post
      on the fallback backend. Physical Chrome now proves that the fog/material
      TSL-post path reaches `WebGPUBackend`. The existing environment owner now
      passes on both backends without duplicate Three runtimes. The existing
      time-driven instanced owner also passes. The Works texture plane passes
      through the shared cache, and the real `ContactCyprusStage` GLTF/DRACO
      owner now completes on both backends. Its scoped late-result branch
      disposes a detached stage rather than attaching it. Physical Android now
      proves the representative initial DPR cap and both backend paths. The
      mandatory SplashCube representative gate passed on 2026-08-21 over the
      secure HTTPS development proxy: `WebGPUBackend -> tsl-post` and forced
      `WebGLBackend -> direct-webgl-fallback` both completed with one
      renderer/canvas, no shader or material error, bounded settle and clean
      unmount/disposal, with reduced motion confirmed on both paths; dated
      qualitative screenshots confirmed the representative scene is visibly
      rendered on both backends (qualitative presence only, not pixel-level
      parity). Desktop pacing and hidden-tab resume for the bounded
      `setAnimationLoop` driver passed on 2026-08-21 on the remote desktop
      host (Chrome 151 on Linux, NVIDIA Lovelace, 60 Hz, DPR 1): three 90-
      invocation windows per backend with zero idle ticks and vsync-locked
      p95 16.80 ms, plus a real hidden-tab freeze/resume on both backend
      paths (0.10 ms over the frozen 16.7 ms target is a 60 Hz vsync
      quantization artifact, not pacing degradation). The Vue/Tres resource
      plateau and root-destroy-to-baseline gate passed on 2026-08-21 on the
      same host: five identical steady-state snapshots per backend after a
      declared warm-up (zero growth) and root teardown returning every
      root-owned counter to baseline with no surviving render demand. The
      initial route gzip was populated from the first clean production build
      (commit `6f02896`, 2026-08-21): 544.51 kB total (528.81 kB shared, 15.70
      kB route-owned Contact loader), with the shared Three.js headroom down
      to 0.71 kB. Pixel-level visual parity passed on 2026-08-21 on the same
      host: the `scripts/visual-parity.ts` tool captured both backend paths at
      an identical deterministic state (30 owner-update cycles, `?parity=1`
      direct-render mode) and the diff is 0.297% of pixels above the 0.1
      perceptual threshold (budget 0.5%), artifacts stored under
      `docs/evidence/visual-parity/`. The desktop dynamic resize/DPR event
      path was observed on 2026-08-21 on the same host (real OS window
      resizes via CDP: every CSS size change fired the size watcher and
      re-rendered once, resources flat, zero console errors; emulated-DPR
      without CSS change correctly fired no events). Dynamic resize/DPR
      events on real mobile hardware remain the only open Phase 2 gate,
      owner-deferred on 2026-08-21 pending the physical Android device. The
      lazy `ContactCyprusStage` now receives the same resize-owner propagation
      as the other route stages; this hardens the path but does not close the
      physical rotation/address-bar evidence gate.
      The lazy Lab experiment owner now invalidates pending async loads during
      root teardown and disposes late results instead of attaching them to a
      destroyed scene; this closes a concrete lifecycle race without changing
      the physical-device evidence requirement.
      The home `BakuCarousel` now rejects late texture-init results after
      disposal and releases their cache references; this prevents cards and
      global input listeners from being attached after root teardown.
      `SceneCoordinator` now receives a typed `PageId` getter instead of
      importing the DOM-backed route adapter; replacing that adapter at the
      Vue Router boundary remains a later route-state slice.
      `ExperienceUI` now consumes the same typed page port for route-owned
      lifecycle and interaction gates; the remaining DOM adapter is confined
      to Experience's application boundary and the remaining scene owners.
      `Experience` itself now consumes the page getter for all route-sensitive
      lifecycle, render-demand and visibility decisions; `entry-app.ts` is the
      sole current adapter boundary.
      The Contact route now uses Three's `DRACO_GLTF_CONFIG` decoder pair
      directly; the duplicate public `/assets/draco/` copies were removed,
      while the hashed loader assets remain route-owned and lazy. This reduces
      duplicate delivery but does not close the separate `vendor-three` budget
      overage.

- [ ] **Phase 3: extract framework-neutral contracts** — introduce the one
      route manifest, canonical world-slot tuple, bootstrap state machine,
      typed application/scene ports, render scheduler and resource scopes
      behind reversible legacy adapters. Remove duplicated facts as each new
      source gains tests and consumers. The route manifest contract landed on
      2026-08-21: `src/core/routeManifest.ts` is the single pure path →
      `PageId` source of truth (strict/lenient resolvers, 5 unit tests, 133/133
      suite, byte-identical production chunks) and the legacy `router.ts` now
      resolves through it instead of re-declaring the map. The world-slot
      tuple contract landed on 2026-08-21 the same way: `src/core/worldSlots.ts`
      is the pure six-slot source of truth (ids, roles, fifths story ranges,
      DOM anchors, SplashCube face rotations; 10 unit tests, 143/143 suite,
      runtime smoke on home + /works with zero console errors) and
      `WorldConfig.ts` / `SplashCube.ts` now consume it instead of
      re-declaring the literals. Direct DOM route reads from scene code are
      being removed through the typed route-page port
      (`src/core/routePage.ts`, legacy adapter; every scene consumer migrated on
      2026-08-21 — `World.ts`, `BakuCarousel.ts`, `CinematicNav.ts`,
      `ContentReveal.ts`, `Experience.ts` — 149/149 unit suite, runtime smoke
      on home + /works + /lab + /contact incl. SPA navigation with zero
      console errors; no scene-side `document.body.dataset.page` reads
      `CinematicNav` now consumes the same typed page getter from
      `ExperienceUI`; focused tests cover dataset disagreement and teardown.
      remain, the dataset write stays until Phase 5). The ContentReveal owner now receives the same page getter from Experience; its config cache invalidates on route change, and focused tests prove the getter remains authoritative over the legacy dataset. The bootstrap state
      machine is now consumed by the entry bootstrap (`src/core/bootstrapStates.ts`);
      its transition contract remains framework-neutral and covered by the unit suite. The
      render-demand decision is now a pure contract
      (`src/core/renderDemand.ts`, 175/175 unit suite; the 14-flag
      raise/settle set and the narrower 10-flag ambient-breath idle set are
      line-verified against the three live `Experience.update()` sites and
      unit-locked; **now consumed** by `Experience.update()` as a 1:1
      source-of-fact swap — the OR raise, the breath idle check + step and
      the settle AND-NOT read the contract at the same points with
      unchanged timing; the loop owner stays `Experience` until the Phase 7
      `RenderScheduler` takes over the loop itself). The brand/runtime token manifest is now a pure contract
      (`src/core/brandTokens.ts`; mirrors the 87
      `_import.less` §1 tokens key-for-key — the ADR 0007 Neon Stage identity
      with the three semantic status tokens, 9 documented aliases — unit-locked
      by a Less parity test; inert until the Phase 5 generated adapters
      consume it; the seven `type-step` tokens own the golden-ratio chain
      every rendered display clamp() snaps to). The
      typed motion-preference port is now formalized
      (`src/core/motionPolicy.ts`, 178/178 unit suite; 11 consumers read
      through it, the dead `syncReducedMotionDataset` writer removed, the
      `entry-shell.ts` E2E/CSS dataset hook stays until Phase 5). The
      the former route resource scopes contract was retired on 2026-08-24
      after a zero-runtime-import proof; live ownership remains in
      Experience/SceneCoordinator. The story progress→section mapping is now a pure contract
      (src/core/storyProgress.ts, 200/200 unit suite; the midpoint
      arrival rule — direction-independent, exact .5 boundary unit-
      locked — is already consumed by World.updateTransform as a 1:1 source-of-fact swap with unchanged timing). The story slot index is
      now single-sourced: `worldSlots.ts` gained a strict
      `worldSlotIndex`/`isWorldSlotId` lookup (203/203 unit suite) and
      `CinematicNav` derives its `0/1/4/5` slot-index constants from the
      tuple instead of re-declaring them (a 1:1 source-of-fact swap, the
      `goToSectionByHash` logic untouched). The typed scene input ports for
      effective theme and locale are now in place (208/208 unit suite):
      `src/core/sectionTheme.ts` owns the pure auto/inverse decision + the
      typed `ThemeAppliedPort` shape (consumed 1:1 by `ContentReveal`
      emitter and `Experience` handler, timing unchanged) and `i18n.ts` is
      formalized as the typed locale port (pull reads, single writer,
      push event, EN/RU parity-locked). The story-state mapping is now a pure
      contract (`src/core/storyState.ts`, 220/220 unit suite; the main→slot
      progress rescale, the main-section rounding rule and the footer/menu
      side edges are consumed 1:1 by `CinematicNav` with unchanged
      event/frame timing, and the route/story/scene desync invariant — DOM
      main index == scene slot index at every stop point — is unit-locked;
      a framework-neutral `StoryPublisher` compatibility bridge now publishes
      deduplicated snapshots from `ExperienceUI`/`CinematicNav` without changing
      the native scroll source, pull path or scene timing; the full runtime
      StoryController publisher still lands with the Phase 5/7 scene-host
      rewiring on top of this contract). The Contact greeting is now a lazy
      Experience-owned `ContactTypographyStage`; the static contact section no
      longer imports `FontLoader`/`TextGeometry`, with explicit disposal and a
      focused lifecycle test. The render-demand decision is
      now consumed by the loop (the Phase 7 RenderScheduler consumer
      migration, 220/220 unit suite): `Experience.update()` reads the
      14-flag OR raise, the breath idle check + step and the 14-flag settle
      from `renderDemand.ts` at the same points with unchanged timing, and
      the loop owner stays `Experience` until the Phase 7 `RenderScheduler`
      takes over the loop itself. The Phase 3 contract set is complete —
      remaining work (the full runtime StoryController publisher, the
      `RenderScheduler` loop owner) lands in Phases 5/7. A 2026-08-21
      conformance sweep removed the last duplicated six-slot facts from the
      scene code (`Experience` `CinematicNav(6)` / `idx === 3` / `+ 1, 5`
      literals and `CinematicNav` `Math.max(6, …)` now read the `worldSlots`
      contract) and pinned the local e2e gate serially via `bun run
 test:serial`. Segment gate
      (2026-08-21, re-verified per slice through this one): whole-project
      prettier, vue-tsc, 220/220 unit suite, build and `git diff --check`
      all green,
      and the Playwright e2e suite passes **serially** (18/18,
      `bun run test:serial`). Under the configured default (`fullyParallel: true`)
      two timing-sensitive tests (section-anchor attach after in-app route
      change; `data-state="idle"` after history `goBack`) flake on this
      machine's CPU load — they pass in isolation and in the serial run, and
      no migration slice touched the router/lab DOM or transition timing,
      so the flake is environmental, not behavioral. The local serial
      invocation is now pinned in `package.json` (`test:serial`) and
      documented in `docs/DEVELOPMENT.md`.

- [x] **Phase 4: migrate the development Page Builder to Vue** — use the
      isolated admin application as the first state-heavy Vue surface while
      keeping schema, validation, escaping and Less compilation pure. Preserve
      atomic save and keep the admin graph out of production. The typed
      framework-neutral `builder/store.ts` (document, selection, undo/redo
      history and the saved baseline, with the atomic validation-gated
      `commit`/`recordSnapshot`/`restore` paths) landed 2026-08-21 and
      `admin/main.ts` now only renders and dispatches it (1:1 swap, 14 new
      unit tests); a dev-only editor style polish (accent Save + disabled
      states, status state dot, outline indent guides + single-line names,
      hover/focus affordances, thin scrollbars) landed the same day; and an
      editor usability slice followed 2026-08-21 — `Ctrl+S`/`Ctrl+Z`/
      `Ctrl+Shift+Z`/`Ctrl+Y`/Delete shortcuts, a locked “Saving…” state,
      outline glyphs + tooltips with the selected row kept in view,
      scroll-into-view for the selected preview node, an undo-able theme
      Reset in the Style workspace, and the `builder/themeVariables.ts`
      contract replacing the duplicated preview variable literals (6 new
      unit tests). A console-minimal unified style system slice landed
      2026-08-21: one flat square system (radius tokens → 0, no card
      shadow, no glow) shared by product and preview through the same
      token pipeline, the admin shell now loads the product's Commissioner
      display font (the preview previously fell back to system fonts), the
      preview grid lays out by container queries mirroring the compiled
      `@m` pivot, the `S 01` counter/divider hack is removed, the heading
      catalogue owns the `2xlarge` tier and the stored hero sits at the
      step-5 display ceiling. A builder-catalogue and Figma-style-inspector
      slice landed the same day: the catalogue now covers every component
      the product composes (added `link`, `icon`, `list`, `divider`) and is
      grouped Layout / Typography / Elements; the inspector is a grouped
      property panel (Content / Typography / Layout / Style) with the
      selected node's id badge, and the preview registers the console icon
      set so `uk-icon` is WYSIWYG of the product. A secondary-accent token
      and Style-workspace rework slice landed the same day: the brand now
      carries `accent-secondary` (the cool mineral counterweight, authored
      independently by the builder and aliased to `signal-cool` in the
      canonical token set), and the Style workspace uses the same grouped
      panel language on both rails — the left rail shows a UIkit glyph and
      the field count per group, and the right panel splits the selected
      group's properties into Colors / Values sections with the group's
      id badge, with decorative chrome borders removed in favor of the
      console-minimal language. The Style workspace now covers every
      element family the catalogue composes — Heading, Text, Grid, Link,
      Icon, List and Divider groups joined the theme (47 preview
      variables) — and its preview always renders the complete component
      set: the "Preview all UI components" toggle is gone, and selecting
      a group marks its sample active and scrolls it into view. A follow-up
      polish pass showed the full six-level heading scale in the Heading
      sample (the Base sample keeps body copy only) and reworked the
      builder sidebar: the catalog is one quiet column of glyph rows and
      the outline drops the duplicated mono type badge. The secondary
      variants (card, section, button) now carry the secondary accent's
      1px line — outlined card, hairline section, ghost button that fills
      on hover — in both the preview and the shipped `_builder-page.less`
      layer. The structural editor commands (add / move / duplicate / remove
      / theme reset + `makeId`) moved out of `admin/main.ts` into the pure
      framework-neutral `builder/commands.ts` (13 unit tests) so the SFC
      panels can dispatch them without a DOM.
      The SFC migration is complete: `src/admin/AdminApp.vue` renders the
      catalogue, outline, both inspectors and the preview (v-html of the
      pure renderers) over the `useAdminEditor` composable, which owns the
      single `BuilderStore` and the lifecycle-safe preview effects (theme
      variables + selection class re-applied per action, document-level
      listeners bound to the component lifecycle). `admin/main.ts` is the
      Vue mount point; 9 unit tests cover the composable and an SFC jsdom
      mount.

- [x] **Phase 5: migrate the public DOM shell and routing** — adopt AppShell,
      Vue Router, semantic route SFCs, UIkit lifecycle adapters, i18n/meta and
      prerendering one vertical slice at a time while the current Three runtime
      remains persistent behind a typed port. First slice landed: `src/app/`
      now mounts `AppShell` on `#app` after the inline splash and lets Vue
      Router own navigation behind the `VITE_JLZ_VUE_ROUTER=1` candidate
      flag — `routes.ts` derives records from the Phase 3 route manifest
      (strict in-app, lenient direct entry), `PageView.vue` is the documented
      temporary primitive adapter hosting the string-template pages and
      porting the legacy `renderView` side effects, and `index.ts` owns the
      nav surface (popstate via `createWebHistory`, the `#section-` hash
      dispatch, `jlz:lang-change` re-apply). The entry branch inlines the
      flag and pulls the candidate only through a dynamic import, so the
      default production build carries no Vue Router code (verified: default
      build has the candidate + admin graphs both absent from `dist`; a
      flag-on build carries the candidate). 5 unit tests lock the
      manifest→record bijection and an `AppShell`+`PageView` memory-history
      mount (271/271). Live candidate smoke (direct entry, in-app, hash,
      popstate, EN/RU, strict unknown no-op, stable scene canvas, zero
      console errors) passes. Open: the per-route semantic SFC migration,
      the UIkit lifecycle adapters, flipping the candidate to the production
      default through the full candidate gate, and the cleanup commit that
      removes the legacy `src/router.ts` path. Second slice landed: the six
      route records now point at semantic route SFCs (`src/app/views/*` — 1:1
      ports of the string templates, locked by a parsed-`<section>` parity
      suite), `useJlzPage.ts` is the per-page lifecycle composable (ported
      `renderView` side effects + scoped UIkit adapter replacing the
      document-wide update; i18n/meta run as the route provider), the mount
      resolves the initial navigation and renders a fresh client app (the
      prerendered `#app` shell is replaced, not hydrated — it stays
      available pre-JS), and `entry-app.ts` gains the `?no-scene=1` DOM-only
      bootstrap (the no-scene evidence path for the candidate gate). The
      candidate gate passed and Vue Router is now the production default:
      `src/entry-app.ts` mounts the Vue app via a dynamic `import('./app')`
      (the only edge into the Vue graph). The Phase 5 cleanup landed: the
      legacy `src/router.ts`, the string page/section templates
      (`src/pages/*`), `PageView.vue`, the `VITE_JLZ_LEGACY_ROUTER` rollback
      flag and `RouteTransition.run()` are removed; the build-time home
      prerender now SSRs the home SFC (`scripts/prerender-home.mjs` prebuild →
      `prerender/home.html` → `prerender-index` plugin) so the SFC is the
      single source of truth; the SFC↔template parity + template unit suites
      are removed. 268/268 unit suite, serial e2e 20/20 on the default (Vue)
      build, inverted dist grep (`jlz-admin` absent, `pathMatch` present),
      live default-path smoke through Caddy. Phase 5 is complete.

- [x] **Phase 6: unified production renderer** — move production to one
      `WebGPURenderer` + one TSL post graph on `WebGPUBackend`, calculate
      capabilities after init, add bounded device-loss recovery, and delete the
      classic `WebGLRenderer` path in a phase-exit cleanup commit. Slice 1
      landed: the fixed decision is recorded (the bounded GLSL fallback is the
      explicit forced-WebGLBackend post owner — TSL `RenderPipeline` is
      WebGPU-only on Three r185 and the `WebGLBackend` `NodeBuilder` cannot
      compile raw `ShaderMaterial` passes), and PMREM now uses the
      renderer-native TSL generator on `WebGPURenderer` with the secondary
      offscreen WebGL context removed (classic generator only on the dev-forced
      `?renderer=webgl` path). Slice 2 landed: the unified renderer candidate —
      `Renderer.init()` constructs `WebGPURenderer` only, inspects the actual
      backend after async init, re-creates with `forceWebGL: true` on a
      software (SwiftShader) adapter (same class, never a classic renderer),
      calculates `DeviceCapability` mode from the actual backend, and adds
      bounded device-loss recovery (budget 1: dispose pipeline + renderer,
      re-create on the same canvas, rebuild the pipeline, re-attach the
      animation loop via the `Renderer.setAnimationLoop` owner boundary, and
      re-run `setupEnvironment()` through the `jlz:renderer-recovered` event
      because the PMREM texture dies with the lost device). `src/core/rendererBackend.ts`
      holds the pure policy (`planUnifiedBackend` + bounded `deviceLostAction`).
      Candidate gate passed (all six public routes on the flag-ON build, both
      representative backends, 0 errors), the flag was flipped to the
      production default, and the phase-exit cleanup deleted the flag + the
      classic production auto-switch path — the classic `WebGLRenderer` + GLSL
      `ShaderMaterial` chain is retained solely as the labelled dev-forced
      `?renderer=webgl` post owner (deletion tracked to a future Three release
      that admits TSL post on `WebGLBackend`, Phase 10). Rollback is a revert
      of the Phase 6 commits. Phase 6 is complete.

- [x] **Phase 7: persistent TresCanvas and legacy world adapter** — make
      `SceneHost` a persistent Tres root, give the custom renderer factory,
      camera and scene exactly one owner, cut the Experience loop over to the
      single driver selected in Phase 2 (the bounded `setAnimationLoop` port,
      ADR 0004), attach the existing World through an explicit primitive
      adapter, publish readiness only after renderer initialization +
      actual-backend inspection + Tres context mount + the initial World's
      first successful render, and split `Experience` into bootstrap, scene
      coordination and former UI features. Slice 1 landed: the
      `RenderScheduler` single loop-driver core
      (`src/core/RenderScheduler.ts`) — the single caller of
      `renderer.setAnimationLoop`, start on typed invalidation / resume, stop
      after the settled frame, hidden-tab pause with exactly one resume
      invalidation, synchronous settle for reduced motion; 13 unit tests.
      Slice 2 landed: the Experience loop is now driven by the scheduler as
      the single `setAnimationLoop` caller — the direct `setAnimationLoop`
      call and the ad-hoc `_onVisibilityChange` re-attach are deleted, wake
      sources are typed invalidations (`first-frame`/`nav`/`cursor`/`resize`/
      `recovery`/`breath`), the loop stops after the settled frame (settle =
      `!needsRender && demandSettles(last activity) && cursor.isSettled`,
      `Cursor` now exposes the spring-convergence predicate), the per-frame
      `dt` breath accumulator is replaced by a wall-clock timer firing the
      typed `breath` invalidation, and hidden-tab pause / exactly-one resume
      are owned by the scheduler's `autoVisibility`. Slice 3 landed:
      `src/app/SceneHost.vue` is the persistent Tres root (mounted once by
      `AppShell`, sibling of `RouterView` — navigation never remounts the
      scene root) owning the one canvas, the one `PerspectiveCamera` and the
      custom renderer factory (unified `WebGPURenderer` via
      `src/core/unifiedRenderer.ts`, software-adapter `forceWebGL`
      re-creation through `planUnifiedBackend`, `render-mode="manual"` so the
      `RenderScheduler` stays the single loop driver); the module-scoped
      one-shot bridge (`src/app/sceneHost.ts`, unit-locked) resolves only
      after renderer init + actual-backend inspection + the Tres context
      mount, `entry-app.ts` awaits it before constructing `Experience`, and
      the World enters Tres through the explicit
      `<primitive :object :dispose="null">` adapter. `Renderer.init(adopted)`
      / `Camera(sizes, instance)` adopt the host instances (hostless
      construction keeps self-hosting — no scene owner deleted; `?no-scene`
      stays the DOM-only rollback). Slice 4 landed: the former UI features
      (CinematicNav, UIMenu, FullscreenOverlay, Works portfolio, UI-facing
      window handlers) moved to `src/Experience/ExperienceUI.ts` behind the
      narrow `ExperienceUIHost` port, `Experience` adopts the Tres scene
      instead of creating its own, and readiness is gated on the initial
      World's first successful render (`jlz:webgl-ready` only after
      `Experience.init` → `firstRender`; a throwing frame never resolves it).
      Device-loss recovery syncs the persistent Tres context through
      `sceneHost.replaceRenderer`. Static gates: `type-check`,
      `type-check:vue`, the unit suite and the production build all pass.
      Acceptance closed (2026-08-22): the serial e2e suite (21/21) adds the
      persistent-scene-host contract — exactly one `canvas.canvas` with
      `aria-hidden`, splash→Enter through the readiness handshake, and route
      navigation that never remounts the scene root (the same canvas element
      survives `/` → `/works` → `/`). The live gate
      (`bun scripts/phase7-live-gate.ts` against the dev server; evidence in
      `docs/evidence/phase7-live-gate/`) passes on both backends: the
      production unified `WebGPURenderer` settles to a stopped loop
      (`loopActive:false`, zero settled draws — the 2.5 s ambient breath
      re-wakes and re-settles it) and the reduced-motion path settles
      synchronously; disposal is clean and the Vue-owned canvas survives
      `Experience.destroy()`. Rollback stays alive: `?no-scene` (DOM-only)
      and hostless self-host in `Renderer`/`Camera` are both e2e-covered and
      no scene owner was deleted. Caveat recorded for Phase 10: on a GPU-less
      software host the dev-forced classic `?renderer=webgl` QA owner (removed
      in Phase 10) keeps its bounded loop armed because software-rAF
      throttling degenerates the glass-cube jelly spring's `dt`; it is a
      dev-only path, not a Phase 7 gate input. The separately reviewed
      [ADR 0008](docs/adr/0008-three-delivery-budget.md) keeps the
      Three-delivery budget evidence-gated: the measured 381 kB gzip variance
      remains a failing optimization gate and the 350 kB cap is not raised
      silently.

- [ ] **Phases 9–10: cut over static content and remove the last legacy** —
      only after their gates pass, ship the builder/blog SSG consolidation
      and final legacy removal. Phase 8 (the one-by-one scene-owner
      migration, slices 1–10) completed 2026-08-22: the legacy `World` +
      `SectionSceneFactory` are deleted, the coordination engine runs in
      `SceneCoordinator` (owned by Experience), and no production callers of
      the scene-coordination part of `Experience` remain. The migration is
      not done while duplicate routers, loops, renderer paths, owner
      adapters or undocumented dependencies remain. Phase 8 slice 1 landed
      (2026-08-22): lights + ground left `World` — Experience creates the
      `CinematicLights` + the new `GroundPlane` scene owners
      (`src/Experience/Scene/GroundPlane.ts`, 1:1 geometry/material/theme/
      lerp state), owns their disposal, and drives the per-frame ground gate
      (section 4 only) and the section-arrival light targets; the legacy
      `World.lightsGroup`/`groundPlane` members, `syncGroundTheme` and the
      ground state fields are deleted. One documented temporary adapter
      remains: `World.attachGround` forwards the ground lerp from
      `updateTransform` (it needs World's eased `t`) until the World
      scene-coordination part leaves production (Phase 8 completion).
      Phase 8 slice 3 landed (2026-08-22): the EnvSphere ambient pavilion
      left `World` — Experience creates the `EnvSphere` owner directly in the
      Tres-owned scene and injects it via `World.attachEnvSphere` (temporary
      adapter: the World frame path forwards the per-frame colour-lerp
      `update`); the intro config step (section 1, dark), the per-frame update
      forwarding and disposal now run through the Experience owner, and the
      `World.envSphere` member, constructor creation and `dispose()` step are
      deleted.
      Phase 8 slice 4 landed (2026-08-22): the SplashCube glass cube left
      `World` — Experience creates the `SplashCube` owner directly in the
      Tres-owned scene and injects it via `World.attachBaku` (temporary
      adapter: the World frame path gates its visibility, forwards the
      per-frame `update` and reads the ambient-motion signal); `World.baku` is
      now a documented temporary getter (legacy read surface for World
      internals + ExperienceUI), the constructor creation and `dispose()` step
      are deleted, and the `World.routeVisuals` test injects the cube owner
      before driving the gating.
      Phase 8 slice 5 landed (2026-08-22): the ParticleBurst intro light
      frames + DrawTrail cursor signal left `World` — Experience creates both
      owners directly in the Tres-owned scene and injects them via
      `World.attachParticleBurst` / `World.attachDrawTrail` (temporary
      adapters: the World frame path forwards the per-frame `update`, gates
      the prewarm/route visibility and disposes them); `World.particleBurst` + `World.drawTrail` are now documented temporary getters (legacy read
      surface for World internals + ExperienceUI), the constructor creation
      and `dispose()` steps are deleted, and disposal (incl. removing the
      trail object from the scene) runs in `Experience.destroy()`.
      Phase 8 slice 6 landed (2026-08-22): the BakuCarousel reference + init
      left `World` — the carousel stays a child of the Works group (created by
      the works section factory; its BakuCarousel-first disposal ordering stays
      in the `SectionGroups` owner), but Experience now holds the reference
      (`buildWorld` reads it from the Works group's `userData`, injects it via
      `World.attachBakuCarousel`, and awaits the home-carousel texture decode at
      the same boundary `World.init()` used to) and owns the idempotent
      `ensureCarouselInitialized` (moved verbatim; the UI reaches it through a
      new `ExperienceUIHost` port). `World.carousel` is a documented temporary
      getter (World frame path: the per-frame `update` forward + baku
      visibility interplay in `update`, the fade visibility gate + the trail
      visibility gate in `updateTransform`; ExperienceUI reads via it); the
      World `_carouselInitPromise` + `ensureCarouselInitialized` are deleted.
      Phase 8 slice 7 landed (2026-08-22): the /works case-plane stage
      (WorksPlaneStage) left `World` — Experience now owns the lazy stage
      (created on the first /works visit, disposed when leaving, so the ~8
      decoded 1440×810 textures never look like a navigation leak): it creates
      the stage as a direct child of the Tres-owned scene, injects it through
      `World.attachWorksPlaneStage`, and runs the init boundary that
      `World.init()` used to (the route can dispose the stage while its texture
      decode is still pending — the double-dispose race is covered by the
      migrated `Experience.worksStage` test). The moved lifecycle methods
      (`ensureWorksPlaneStageInitialized` / `disposeWorksPlaneStage`) are reached
      by the UI through two new `ExperienceUIHost` ports; the resize + camera
      forwards moved out of `World.resize` / `World.setCamera` into Experience
      directly. `World.worksPlaneStage` is a documented temporary getter (World
      frame path: `setActive` — with World's cached `worksPlaneStageSection`
      index — + the per-frame `update`; Experience's `isAnimating` render-demand
      read now uses its own field; ExperienceUI's `hitTest` reads via it).
      World's lazy-stage fields (`_worksPlaneStagePromise` /
      `_worksPlaneStageRequest`) + lifecycle methods + disposal are deleted.
      Phase 8 slice 8 landed (2026-08-22): the Contact pixel-title layer
      (ContactTextStage) + the lazy 3D Agros backdrop (ContactCyprusStage)
      left `World` — Experience now owns both lazy stages (created on the
      first /contact visit, disposed when leaving, so the decoded pixel
      texture + Draco model never look like a navigation leak): they enter the
      Tres-owned scene directly, are injected through
      `World.attachContactTextStage` / `World.attachContactCyprusStage`, and
      the init boundaries `World.init()` used to run at (text stage + Draco
      decode + transparent material warm-up) run in `buildWorld` at the same
      point. The moved lifecycle (`ensureContactTextStageInitialized` /
      `disposeContactTextStage` / `setContactTextStageSection` /
      `syncContactTextTheme` / `ensureContactCyprusStageInitialized` /
      `disposeContactCyprusStage` / `setContactCyprusStageSection`) is reached
      by the UI through six new `ExperienceUIHost` ports; the
      `_contactTextIsLight` polarity cache + `_contactCyprusActive` flag moved
      to Experience (the World cube-visibility gate now reads
      `contactCyprusStage.isActive` off the attached stage — a new getter on
      the class). `World.contactTextStage` / `World.contactCyprusStage` are
      documented temporary getters (World frame path: the per-frame `update`
      forwards in both branches; ExperienceUI's `refreshLanguage` reads via
      them); World's lazy-stage fields + lifecycle methods + disposal are
      deleted (`setContactSceneSection` stays — it only touches the scene
      groups). The text-stage double-dispose race test lives in the new
      `src/__tests__/Experience.contactStages.test.ts`.
      Phase 8 slice 9 landed (2026-08-22): the Lab experiment object
      (LabGamepad) left `World` — Experience now owns the lazy object (created
      once on the first /lab visit, then only toggled visible — never disposed
      per route leave; disposed only on final destroy): it enters the
      Tres-owned scene directly, is injected through
      `World.attachLabGamepad`, and the lazy-creation trigger `World.
syncRouteVisuals()` used to run (on route entry + section change) now
      runs in `buildWorld` (entry route) + the UI route-change handler
      (navigation). `World.labGamepad` is a documented temporary getter — the
      only remaining World touch is the visibility gate in
      `syncRouteVisuals` (read off the getter, frame-path); World's lazy
      object field + `_labGamepadPromise` + `ensureLabGamepad` + disposal are
      deleted. The lazy-load test moved to the new
      `src/__tests__/Experience.labStage.test.ts` (the manifest + cube-gating
      tests stay in `World.routeVisuals.test.ts`).
      Phase 8 slice 10 landed (2026-08-22): the legacy `World`
      scene-coordination engine leaves production — the six-section state
      machine, the scroll transform (`updateTransform`), the per-frame
      coordination body (`update`), `init`/`resize`/`dispose` and the
      route-visual gating move 1:1 into the new `SceneCoordinator` owner
      (`src/Experience/SceneCoordinator.ts`), created by Experience in
      `buildWorld`. The coordinator is a plain class (not a `THREE.Group`):
      the sections enter the Tres scene directly in `init()`, and the scene
      owners are injected as getters over Experience's own fields (the lazy
      route owners change identity per route). Every `attach*` temporary
      adapter from slices 1–9 is deleted with the owner; the
      overlay/scene-interaction wiring (tap hitTest readiness, route-change + section-change handlers, splash opener) now reaches the scene
      through the coordinator getter on the `ExperienceUI` port
      (`coordinator()` instead of `world()`). The `worldObject` primitive
      slot (`<primitive :object :dispose="null">`) is removed from
      `SceneHost.vue` + `sceneHost.ts` + the `ExperienceHost` interface.
      `SectionSceneFactory` is inlined into the `SectionGroups` owner (its
      only production consumer). Both legacy files — `src/core/World.ts`
      and `src/core/SectionSceneFactory.ts` — are deleted; the Phase 8
      acceptance check (no production callers of `World`,
      `SectionSceneFactory` or the scene-coordination part of `Experience`)
      passes. The last legacy post binding is resolved as absent in the
      World direction: the post chain
      (`postManager.applyPreset` + `pipeline.setSectionGrade`) is driven
      exclusively by the Experience frame path on context change. Phase 8
      is complete (all 10 slices). The migrated tests:
      `SceneCoordinator.routeVisuals.test.ts` (cube gating + Lab
      manifest), the works/contact/lab lifecycle tests (coordinator owner
      getters), and the `attachWorld` bridge test deleted with the slot.
      Phase 9 slice 1 landed (2026-08-22): route metadata and the sitemap
      consume the manifest — `routeManifest.ts` gains `pathForPage(page)`
      (the manifest's closed-set inverse of `resolveRoute`), the new pure
      table `src/core/pageMetaData.ts` (i18n copy keys + sitemap
      changefreq/priority per page) replaces the hand-maintained path table
      in `pageMeta.ts` (the runtime now builds canonical/og:url from
      `pathForPage`), and the new canonical blog index
      `src/core/blogPages.ts` (slugs + lastmod + priority, newest first)
      feeds both the pure sitemap builder (`src/core/sitemap.ts` +
      `src/core/sitemapEntries.ts`) and the Vite build input map
      (`vite.config.ts` — blog article entries are now derived, not
      hand-listed). `public/sitemap.xml` is now a generated artifact:
      `bun scripts/generate-sitemap.ts` runs as a prebuild step (wired into
      the `build` script) and writes the file from the manifest-driven
      sources only — the first generation was byte-identical to the
      hand-maintained file (zero drift). A closed-set invariant (every
      page-metadata entry must resolve to a manifest-owned path) fails the
      build instead of emitting a broken sitemap. Gates: `type-check`,
      `type-check:vue`, `test:unit` (311 — +15 new sitemap/manifest-drift
      tests), `build`; the generated sitemap + all five blog pages + the
      absence of admin strings in `dist` are verified on the built output.
      Phase 9 slice 2 landed (2026-08-22): the trusted Vue element registry
      landed — `src/builder/vue/elements.ts` is one typed component per
      builder element type (ten: section/grid/heading/text/button/card/
      divider/list/link/icon), rendering the exact same markup the
      framework-neutral string renderer emits (shared `safeChoice` + the new
      `sanitizeHref` href policy; Vue's interpolation/attribute escaping
      replaces the hand-rolled `escapeHtml`). `BuilderPage`
      (`src/builder/vue/BuilderPage.ts`) renders a full document through it
      and is the public surface for builder documents. The admin editor
      preview now renders the builder document through the registry (real
      DOM nodes with the `data-builder-id`/`data-builder-type`/`tabindex`
      delegation attributes in editable mode) instead of a `v-html` string —
      the style showcase stays a pure-HTML string; the delegation, selection
      and theme effects on `#builder-preview` are unchanged. The parity test
      (`src/__tests__/builderVueRegistry.test.ts`) locks the contract: SSR
      output of `BuilderPage` and `renderBuilderDocument` parse to identical
      trees for a document covering all ten types, the allowlist clamps,
      unsafe-href rejection and copy escaping, in both modes. The string
      renderer stays (static/SSG output + the interim rule); the registry is
      what public routes render (slice 5). Gates: `type-check`,
      `type-check:vue`, `test:unit` (317 — +6 parity tests + the SFC
      registry-render assertion in `adminEditor.test.ts`), `build` (admin
      strings + registry still absent from `dist`), serial e2e (21/21).
      Phase 9 slice 3 landed (2026-08-22): the one-page builder publishing
      restriction is out. Storage moved from one fixed `page.json` to a
      document collection: `src/builder/documents.ts` is the new pure model
      (v1 `BuilderDocuments`, `validateBuilderDocuments` — per-document v2
      validation + unique safe slugs, `upsertBuilderDocument`,
      `removeBuilderDocument`, `findBuilderDocument`,
      `migrateLegacyPageDocument`, `nextAvailableBuilderSlug`,
      `createBuilderDocument`), the slug policy is exported from the schema
      (`SAFE_BUILDER_SLUG` / `isSafeBuilderSlug`). The dev plugin
      (`admin/vite-plugin.ts`) now serves `GET /__jlz-admin/documents`,
      `GET /__jlz-admin/document?slug=` (no slug → first), `POST
/__jlz-admin/save` (the `{ slug, document }` envelope upserts by slug;
      a bare document body still works) and `POST /__jlz-admin/delete`
      (keeps >= 1 document); the legacy `page.json` is transparently wrapped
      into a collection on first read and retired on the next save — the
      committed artifact is now `src/builder/generated/documents.json`
      (migrated from `page.json` in this change). The admin toolbar gained
      the slug input, the document select and the New / Delete actions
      (switching or creating while dirty is blocked with a status note; the
      compiled theme artifacts still follow the document just saved). The
      public side is untouched: nothing in the public graph reads the
      collection yet (slice 5 publishes from it). Gates: `type-check`,
      `type-check:vue`, `test:unit` (336 — +19 collection-model tests + 4
      composable/SFC collection tests), `build`, serial e2e (21/21).
      Phase 9 slice 4 landed (2026-08-22): the blog moved onto the shared
      SSG content pipeline. The five hand-maintained standalone documents
      (`blog.html` + `blog/*.html`) are now generated output: the new
      prebuild step `scripts/prerender-blog.mjs` renders `BlogPage.vue`
      (SFC shell `src/app/views/blog/` + the `content/blog/*.html`
      editorial sources via the `?raw` registry in
      `src/core/blogContent.ts`) through a throwaway Vite middleware
      server (Vue SFC compiler only — no Tres/Three in the graph), and
      `renderBlogDocument` (`src/core/blogMeta.ts`) wraps the body into
      the standalone document — the closed-set head metadata table
      `BLOG_PAGE_META` (title/description/robots/OG/Twitter/JSON-LD for
      the index + every published article, the same slugs the sitemap
      consumes; `assertBlogMetaClosedSet` fails the build on drift) plus
      the per-variant script tags (Prism + the year script for articles,
      only `/js/blog.js` for the index). The generated files overwrite
      the Vite build inputs at the root (deterministic: fixed meta
      table, fixed content sources, prettier-normalized in the pipeline),
      so Vite only rewrites the stylesheet URL — the documents ship as
      static HTML with no application bundle. `stripSsrComments` removes
      Vue SSR fragment/v-if markers, so the emitted markup is clean
      static HTML. Body parity: all five bodies are DOM-identical to the
      hand-maintained originals; the head is now generated (only
      semantic delta: `&` → `&amp;` in the `<title>`/OG/Twitter titles).
      Gates: `type-check`, `type-check:vue`, `test:unit` (358 — +20
      meta/content/SSG-pipeline tests incl. the no-3D SFC import-graph
      assertions), `build` (dist layout `blog.html` + `blog/<slug>.html`,
      vendor-only scripts), serial e2e (21/21).
      Phase 9 slice 5 landed (2026-08-22): approved builder documents are
      published. The schema gains the publish-gate fields (`published` —
      the "approved" marker, `description` — 1–300 SEO characters, both
      optional so pre-slice-5 documents stay valid), and `publishedPages`
      (`src/builder/documents.ts`) selects the `published: true` subset in
      stable slug order — one closed set the pipeline renders and the
      sitemap consumes. The new pure core `src/builder/publish.ts` assembles
      each published document: `renderBuilderPageDocument` (standalone HTML
      — canonical head: title/description/canonical/OG/Twitter, escaped
      metadata, the per-page Less link, zero application scripts; SSR
      fragment/v-if markers stripped via `stripSsrComments`) and
      `renderBuilderPageLess` (per-page chain: the `_import.less` app base
      first, the document's own theme last — Less last-definition-wins —
      then the document's own UIkit component set). The new prebuild step
      `scripts/publish-builder-pages.mjs` SSR-renders every approved
      document through the trusted Vue registry (`BuilderPage` — the same
      registry the admin preview uses; `renderBuilderDocument` is NOT used,
      it stays only for proven static output), writes the Vite build inputs
      (`p/<slug>.html` at the root) + `src/assets/builder/<slug>.less`, and
      removes stale artifacts of unpublished/removed documents.
      `vite.config.ts` derives the `p/<slug>` build inputs from
      `documents.json`; the sitemap generator joins the builder section
      (`buildBuilderSitemapSections`, `/p/<slug>` @ weekly/0.5) from the
      same collection — `public/sitemap.xml` is now 12 urls. The admin
      toolbar gained the Publish checkbox + SEO description input (saved
      with the document through the existing envelope). First approval
      committed: `studio-page` → `/p/studio-page` (registry-rendered body,
      per-page Less rewritten by Vite, no app bundle, no editor delegation
      attributes). Gates: `type-check`, `type-check:vue`, `test:unit` (381 —
      +23 publish-core tests incl. body parity against the registry and the
      string renderer), `build` (dist layout `p/<slug>.html`, hashed
      per-page CSS, no `vendor-three`/app-bundle refs), serial e2e (22/22).
      Phase 10 slice 1 landed (2026-08-22): the completed spike
      instrumentation is out. `src/spikes/` (the Phase 2/7 verification
      probes — unified/representative/loop/resource/manual entries,
      `rendererReadiness` / `unifiedRendererFactory` /
      `representativeScene`), the four probe-only test files
      (`PhaseOneProbe`, `RepresentativeScene`, `UnifiedRendererFactory`,
      `TresRendererReadiness`), the `dev:tres-spike` script and the Vite
      `tres-spike-pages` plugin + `optimizeDeps` block are deleted — a
      consumer search proved zero production consumers (only the tests and
      the dev routes referenced them; `SplashCube` / readiness coverage
      survives in `worldSlots` + `SceneCoordinator.routeVisuals` and the
      production contracts). The `DEVELOPMENT.md` renderer gate now names
      the Phase 7 live gate as the current tool, and the `visual-parity`
      usage example no longer points at the removed probe route. Deletion
      ledger +1 done row (tres spike instrumentation). Gates:
      `type-check`, `type-check:vue`, `test:unit` (371 — 10 probe tests
      removed with their probes), `build`, serial e2e (22/22).
      Phase 10 slice 2 landed (2026-08-22): the dev-forced classic
      `?renderer=webgl` QA owner is out — the `WebGPURenderer` is now the
      only renderer class the app constructs. Removed: the
      `createClassicWebGLRenderer` factory from `core/unifiedRenderer.ts`
      (the `WebGLNodesHandler` import with it), the `?renderer=webgl`
      branch in `SceneHost.vue`'s renderer factory and in
      `Renderer.init()`, the GLSL `ShaderMaterial` post chain
      (bright-extract/Gaussian/composite shaders, quad geometry) and the
      `_setupWebGL`/`_renderWebGL`/`_setupRTSize`/`_renderQuad`
      `RenderPipeline` path (the rewrite keeps the `WebGPUPostPipeline` TSL
      branch on `WebGPUBackend` and a direct render on `WebGLBackend`),
      the classic `THREE.PMREMGenerator` branch in `Experience` (the
      renderer-native TSL generator is the single PMREM owner), and the
      forced-classic run of `scripts/phase7-live-gate.ts`. Retained: the
      automatic software-adapter policy (SwiftShader WebGPU adapter →
      `forceWebGL: true` on the same `WebGPURenderer` → `WebGLBackend`) —
      the classic WebGL fallback per AGENTS.md. No unified-backend-parity
      claim is made. Ledger rows updated (classic fallback + GLSL chain
      annotate the Phase 10 deletion; migration flags note the flag
      removal, the raw-bridge shim stays pending). Gates: `type-check`,
      `type-check:vue`, `test:unit` (371), `build`, serial e2e (22/22).
      Phase 10 slice 3 landed (2026-08-22): the raw `jlz:*` window bridge is
      out — every `jlz:*` port flows through the typed `eventBus`. Removed:
      the `window.dispatchEvent` bridge inside `EventBus.emit()` (the bus is
      now the single port surface). All 17 ports are typed in `AppEvents`
      (exact payload shapes; `void` ports take no payload via a variadic
      `emit` signature). Migrated to `eventBus.on/emit` (unsub-closure
      fields; teardown calls them): `entry-app.ts` (route-change,
      splash-entered, page-section-change), `app/index.ts` (webgl-ready,
      navigate, lang-change), `nav/template.ts` (close-nav, navigate),
      `ThemeManager` (theme-change), `i18n` (lang-change), `UIMenu`
      (sound-toggle, lang-change, theme-change), `FullscreenOverlay`
      (project-navigate), `WorkCards` (section-change, open-project),
      `CinematicNav` (route-change, lang-change, close-nav,
      page-section-change), `ContentReveal` (section-change,
      page-section-change, route-change, theme-change; emits theme-applied),
      `ExperienceUI` (sound-toggle, lang-change, open-project,
      project-navigate, route-change, wobble-pulse, page-section-change,
      goto-section-by-hash), `Experience` (splash-entered, theme-applied),
      `BakuCarousel` (emits wobble-pulse). Non-module producers reach the
      bus through the new `window.__jlzEmit` facade (installed at
      `entry-app.ts` module scope — before the router mounts and before the
      splash Enter is ever enabled, so it is always present): the `index.html`
      splash Enter script (kept a classic non-module script so it stays
      outside the initial 3D dependency graph — a module import there would
      re-introduce the 3D chunk preloads) emits `jlz:splash-entered`; the
      e2e suite drives `jlz:navigate` through a `navigateInApp` helper.
      Tests: `EventBus` gains a no-bridge assertion (`emit` never reaches
      `window.dispatchEvent`); `i18n` + `ThemeManager` assert on
      `eventBus.emit` instead of a `dispatchEvent` stub; `CinematicNav`
      emits `jlz:close-nav` on the bus. Ledger rows flipped to done (raw
      `jlz:*` window bridge + migration flags and shims — no migration
      adapter, feature flag or shim remains). Gates: `type-check`,
      `type-check:vue`, `test:unit` (372 — +1 no-bridge test), `build`
      (splash HTML preloads only `chunk-runtime`), serial e2e (22/22).
      Slice 4 (hardening, separate commit) landed (2026-08-22): the
      Phase 10 route-cycle soak evidence + release-gate hardening.
      `scripts/phase10-route-cycle-soak.ts` (the Phase 10 acceptance tool,
      driven through the `window.__jlzEmit` seam) ran five warm-up +
      twenty steady-state cycles over the six SPA routes against the dev
      server: canvas held at exactly 1 (`canvas.canvas`) every cycle and
      after root destroy, scene/renderer counters flat across the steady
      block (first-pass caps, no monotonic trend), the settle gate is the
      app's own settle contract — settle-able routes end the settle window
      with `loopActive === false` and zero active demand flags, the
      by-design continuous `/works` route (`worksScroll`) holds a stable
      per-visit frame rate (per-visit delta trend gate), and root destroy
      adds no canvases / no fatal errors / heap at or below the steady
      peak. The stale invalid pre-run report was deleted; the machine
      report is committed under
      `docs/evidence/phase10-route-cycle-soak/`. The soak surfaced one real
      defect, fixed in the same slice:
      `ContactCyprusStage.update()` left its one-frame prewarm flag
      (`_prewarmFramePending`) permanently set when the lazy stage
      initialized on a non-Agros section (the prewarm frame is skipped
      while the stage is hidden and the skip path never cleared the flag),
      holding a persistent `contactCyprus` render reason that kept the
      loop alive on `/contact` forever; the skip path now clears the
      flag. `DEVELOPMENT.md` resource gate now names the soak tool +
      the route-aware settle contract + the noisy-metric policy; the
      documentation audit (root + `docs/`: ARCHITECTURE, AGENTS,
      DEVELOPMENT, MIGRATION) carries no current-runtime claims about
      removed implementations. Gates: `type-check`, `type-check:vue`,
      `test:unit`, `build`, serial e2e, the 25-cycle soak (PASS). Phase 10
      is complete — the removal ledger is fully done and no migration
      adapter, feature flag or shim remains.
      Phase 8 slice 2 landed (2026-08-22): the six stable section groups
      left `World` — Experience creates the new `SectionGroups` owner
      (`src/Experience/Scene/SectionGroups.ts`: factory creation,
      geometry-hiding, the BakuCarousel-first disposal ordering and the
      Works particle texture) attached to the World before `init()`;
      `World.sceneGroups` is now a documented temporary getter (legacy read
      surface for the World frame path, Experience and ExperienceUI) and the
      `World` group-creation/disposal code plus the now-unused
      `SectionSceneFactory`/`disposeMaterialDeep` imports are deleted.

## 2 — Deferred product queue

These outcomes remain valid but must not deepen a legacy boundary scheduled
for replacement. Pull one forward only when its migration dependency is clear.

- [ ] **Extend published builder pages with richer content** — the publish
      path itself is in (Phase 9 slice 5: approved documents → static
      `/p/<slug>` routes, sitemap, per-page theme). Remaining builder
      content capabilities as separate bounded outcomes: media elements,
      dynamic sources and drag-and-drop reordering.

- [ ] **Extend the cinematic brand language across every route** — tune motion
      and TSL response through the new component/scene owners, preserving both
      effective theme polarities and reduced-motion parity.

- [ ] **Complete the cross-backend runtime baseline** — finish real-mobile DPR
      evidence and preserve the current desktop reference as the pre-migration
      comparison rather than tuning two architectures simultaneously.

- [ ] **Validate the shared transition language** — complete direct entry,
      navigation, popstate, backend, theme, narrow-layout and reduced-motion QA
      as each Vue route slice replaces its legacy owner.

- [ ] **Finish the UIkit-first style ownership split** — carry the component
      boundaries into SFC and adapter ownership without duplicating layout or
      accessibility behavior.

- [ ] **Decide the fate of the vendored `references/` tree** — choose an
      external archive or separately approved history rewrite after licensing
      review.

- [ ] **Decide the final UIkit JS footprint** — measure retained Vue adapters
      against the current 75.8 KB gzip vendor chunk; replace behavior only with
      an equivalent accessible owner.

- [ ] **Configure production SPA/SSG hosting** — decide the hosting target and
      verify every route, blog document, asset and canonical URL against it.

- [ ] **Turn Works into evidence** — align approved facts and media around the
      same problem, response, role and proof after the Works scene owner moves.

- [ ] **Replace placeholder media and contact delivery** — ship measured media
      and a real contact endpoint after the target route/resource boundaries
      exist.

## 3 — Engineering policy

- Do not duplicate route, slot, metadata, preference or render-reason facts.
- Do not add a dependency without an owner, measured value, bundle impact and
  removal/replacement analysis.
- Prefer current stable library releases only after checking official release
  notes and the tested compatibility matrix; pin the accepted result.
- Preserve the working production path until its replacement passes, then
  remove the legacy path promptly rather than maintaining two architectures.
- A renderer or route phase cannot pass with memory/resource growth, duplicate
  animation loops, continuous idle draws or weakened startup/performance
  budgets.

## Plan maintenance

After completing an item, update this file in the same change: remove the
completed outcome, update the migration traceability/removal ledgers, capture
discovered work and reorder the remainder when evidence changes priority.
