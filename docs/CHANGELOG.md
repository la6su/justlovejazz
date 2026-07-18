# Changelog

This is a concise release-level record. Implementation decisions belong in
[`WORKLOG.md`](../WORKLOG.md); completed plans remain available through Git
history.

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
