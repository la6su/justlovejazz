# Changelog

This is a concise release-level record. Implementation decisions belong in
[`WORKLOG.md`](../WORKLOG.md); completed plans remain available through Git
history.

## 2026-07-24 — CSS minimization + /works texture fix (PR #173)

- Fixed invisible textures on /works: `prewarmShaders()` called
  `WebGPURenderer.compileAsync()` which crashed TSL node build and corrupted
  CasePlane material state. Made `prewarmShaders` a no-op — WebGPURenderer
  compiles shaders lazily during the first render.
- Deleted ~280 lines of dead CSS: `.jlz-joystick*` (16 rules + media queries
  + reduced-motion entries), `.jlz-scroll-hint*`, `#pageLoader`, `#jlj-enter`,
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
