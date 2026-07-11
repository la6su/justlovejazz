# STATUS — Single Source of Truth

> Updated: 2026-07-11. Branch: `main`. Build green. Tag: `backup-2026-07-11`.

## Project

SPA studio portfolio — **6 pages** (SPA routes), each with **4 main sections**.
Single HTML entry (index.html) with seamless inline splash overlay.
3D canvas + transparent DOM. Single font: Inter.
Navigation: JoystickNav (pure DOM + dotnav) + UIMenu (transparent navbar + dropdowns).
Theme: per-section inverse (auto = preset, inverse = flipped) via ContentReveal.
Mobile-first: `html { font-size: 0.85rem }` mobile → `1rem` ≥640px.

Multi-page: index (/) → blog (/blog + /blog/[slug] standalone for SEO).

## Pages (6) — SPA routes

| Page | Route | Sections (joystick down/up) |
| --- | --- | --- |
| Studio | `/` | 01 Studio / 02 Services / 03 Works / 04 Manifesto |
| Services | `/services` | 01 Creative Direction / 02 Interactive Dev / 03 Motion & Realtime / 04 AI Systems |
| Works | `/works` | 01 Undercurrent / 02 Mono Sunday / 03 Till at Night / 04 Ebb Vibes |
| Manifesto | `/manifesto` | 01 Purpose / 02 Clarity / 03 Emotion / 04 Simplicity |
| Lab | `/lab` | 01 Shader Lab / 02 Audio Reactive / 03 Generative / 04 GPU Particles |
| Contact | `/contact` | 01 Email / 02 Social / 03 Location / 04 Form |

## Current state

| Item | Status |
| --- | --- |
| 3D scene (WebGPU + WebGL2 fallback) | ✅ |
| 6 pages — SPA routes | ✅ |
| Unified sectionShell() — ONE wrapper for all pages | ✅ |
| Seamless inline splash (Enter button + SVG squares + progress ring) | ✅ |
| three.js lazy loading (dynamic import, non-blocking FCP) | ✅ |
| JoystickNav — pure DOM + dotnav timeline | ✅ |
| UIMenu — transparent navbar + dropdowns + theme toggle | ✅ |
| BakuCarousel — cube morphs into ring (Works page) | ✅ |
| SplashCube — RoundedBoxGeometry + CubeCamera + JLZ-branded textures | ✅ |
| CubeCamera throttled (every 6 frames, not every frame) | ✅ |
| Bloom skip when intensity=0 | ✅ |
| On-demand rendering + ambient breathing | ✅ |
| EnvSphere — per-section theme sync | ✅ |
| Per-section inverse theme (ContentReveal) | ✅ |
| Custom cursor — codrops-style (skip redraw when idle) | ✅ |
| BlurFade — cinematic blur+stagger for titles | ✅ |
| NoiseText — console typewriter for eyebrow numbers | ✅ |
| Footer removed — joystick sole bottom UI | ✅ |
| Landing page removed | ✅ |
| Blog standalone (SEO) | ✅ |
| JSON-LD structured data (WebSite + Organization) | ✅ |
| Mobile-first rem sizing | ✅ |
| TypeScript strict + ESLint + Prettier | ✅ |
| 19 unit tests | ✅ |
| Dead code audit — asMaterial + updateWorldDNA removed | ✅ |
| Memory leak fixes — all listeners tracked + cleaned | ✅ |

## Navigation — JoystickNav

| Action | Behavior |
| --- | --- |
| Vertical (up/down) | Cycle 4 main sections of current page |
| Horizontal (left/right) | Toggle shared side sections: Lab ↔ center ↔ Contact |
| Dotnav | 4 dots below joystick — click to jump |
| Keyboard | Arrows, Home (→1), End (→4) |

## Splash — seamless inline overlay

```
#jlz-app-loader (inside index.html)
  ├── SVG concentric squares (splash identity, staggered fade-in)
  ├── Progress ring (SVG stroke-dashoffset on sq-4 border)
  ├── CRT curtains (split apart on Enter, 0.8s)
  └── Config buttons (sound + language — fade out with splash)
```

Flow: HTML parse → inline splash renders (FCP) → dynamic import('three') →
progress ring fills → jlz:webgl-ready → Enter button appears →
user clicks Enter → scrollspy-pending removed + jlz:splash-entered dispatched →
curtains split + SVG scales out → bakuCube opener at 400ms → 3D scene.
Inline fallback: Enter button at 5s if entry-app.ts fails to load.

## Theme system — per-section inverse

| Property | Value |
| --- | --- |
| File | `src/core/ThemeManager.ts` |
| Modes | `auto` (preset), `inverse` (flipped) |
| Persistence | `localStorage('jlz:theme')` |
| Application | ContentReveal.ts — per-section uk-light toggle |
| 3D sync | jlz:theme-applied event → EnvSphere changeSection |
| Toggle (splash) | Config buttons inside #jlz-app-loader |
| Toggle (app) | uk-icon-button in navbar center |
| QF color-mode | `_theme-fixes.less` overrides (dark bg → light text) |

## Text animations

| Animation | Target | Trigger |
| --- | --- | --- |
| BlurFade | `.studio-title` | jlz:splash-entered (300ms delay) + jlz:section-change + jlz:page-section-change |
| NoiseText | `[data-eyebrow]` | jlz:section-change (Experience.ts handler) |

## Performance optimizations

| Fix | Effect |
| --- | --- |
| CubeCamera throttled (6 frames) | +30-50% FPS |
| getConfig() Map cache | O(1) lookup |
| Bloom skip when 0 | -5 draw calls |
| Cursor redraw skip when idle | -canvas ops |
| DrawTrail ring buffer skip | -48 Vector3.copy |
| All listeners tracked + cleaned | No HMR leaks |

## Proxy/dev config

| Setting | Value |
| --- | --- |
| `server.hmr` | `false` |
| `server.allowedHosts` | `['project.6la.ru']` |
| `block-vite-client` plugin | Strips @vite/client + stubs HTTP |
| CSS import | `?inline` |
