# Changelog

This is a concise release-level record. Implementation decisions belong in
[`WORKLOG.md`](../WORKLOG.md); completed plans remain available through Git
history.

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
