# Changelog

## Unreleased

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
