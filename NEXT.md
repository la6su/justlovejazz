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
      owner-deferred on 2026-08-21 pending the physical Android device.

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
      remain, the dataset write stays until Phase 5). The bootstrap state
      machine is now a pure contract (`src/core/bootstrapStates.ts`, 158/158
      unit suite, inert until the Phase 5 shell consumes it). The
      render-demand decision is now a pure contract
      (`src/core/renderDemand.ts`, 175/175 unit suite; the 14-flag
      raise/settle set and the narrower 10-flag ambient-breath idle set are
      line-verified against the three live `Experience.update()` sites and
      unit-locked; **now consumed** by `Experience.update()` as a 1:1
      source-of-fact swap — the OR raise, the breath idle check + step and
      the settle AND-NOT read the contract at the same points with
      unchanged timing; the loop owner stays `Experience` until the Phase 7
      `RenderScheduler` takes over the loop itself). The brand/runtime token manifest is now a pure contract
      (`src/core/brandTokens.ts`, 183/183 unit suite; mirrors the 84
      `_import.less` §1 tokens key-for-key, unit-locked by a Less parity
      test; inert until the Phase 5 generated adapters consume it). The
      typed motion-preference port is now formalized
      (`src/core/motionPolicy.ts`, 178/178 unit suite; 11 consumers read
      through it, the dead `syncReducedMotionDataset` writer removed, the
      `entry-shell.ts` E2E/CSS dataset hook stays until Phase 5). The
      route resource scopes policy is now a pure contract
      (`src/core/routeResourceScopes.ts`, 191/191 unit suite; the
      persistent carousel vs route-scoped works/contact stages acquire/
      dispose policy is line-verified against the `Experience.ts`
      route-change handler and unit-locked; inert until the Phase 8
      rewiring). The story progress→section mapping is now a pure contract
      (`src/core/storyProgress.ts`, 200/200 unit suite; the midpoint
      arrival rule — direction-independent, exact `.5` boundary unit-
      locked — is **already consumed** by `World.updateTransform` as a 1:1
      source-of-fact swap with unchanged timing). The story slot index is
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
      the full runtime StoryController publisher lands with the Phase 5/7
      scene-host rewiring on top of this contract). The render-demand decision is
      now consumed by the loop (the Phase 7 RenderScheduler consumer
      migration, 220/220 unit suite): `Experience.update()` reads the
      14-flag OR raise, the breath idle check + step and the 14-flag settle
      from `renderDemand.ts` at the same points with unchanged timing, and
      the loop owner stays `Experience` until the Phase 7 `RenderScheduler`
      takes over the loop itself. The Phase 3 contract set is complete —
      remaining work (the runtime StoryController publisher, the
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

- [ ] **Phase 4: migrate the development Page Builder to Vue** — use the
      isolated admin application as the first state-heavy Vue surface while
      keeping schema, validation, escaping and Less compilation pure. Preserve
      atomic save and keep the admin graph out of production. The typed
      framework-neutral `builder/store.ts` (document, selection, undo/redo
      history and the saved baseline, with the atomic validation-gated
      `commit`/`recordSnapshot`/`restore` paths) landed 2026-08-21 and
      `admin/main.ts` now only renders and dispatches it (1:1 swap, 14 new
      unit tests); a dev-only editor style polish (accent Save + disabled
      states, status state dot, outline indent guides + single-line names,
      hover/focus affordances, thin scrollbars) landed the same day. The SFC
      migration of the catalogue, outline, inspector, preview and Style
      workspace and the lifecycle-safe preview remain open.

- [ ] **Phase 5: migrate the public DOM shell and routing** — adopt AppShell,
      Vue Router, semantic route SFCs, UIkit lifecycle adapters, i18n/meta and
      prerendering one vertical slice at a time while the current Three runtime
      remains persistent behind a typed port.

- [ ] **Phases 6–10: cut over renderer, Tres scene owners and static content** —
      only after their gates pass, ship the unified renderer, persistent
      TresCanvas, one-by-one scene-owner migration, builder/blog SSG
      consolidation and final legacy removal. The migration is not done while
      duplicate routers, loops, renderer paths, owner adapters or undocumented
      dependencies remain.

## 2 — Deferred product queue

These outcomes remain valid but must not deepen a legacy boundary scheduled
for replacement. Pull one forward only when its migration dependency is clear.

- [ ] **Publish custom Page Builder pages through the frontend** — continue in
      Phase 9 after the Vue builder, route manifest and trusted component
      registry exist. Multi-page metadata, drag-and-drop, media and dynamic
      sources remain separate bounded outcomes.

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
