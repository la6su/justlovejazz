# STATUS — Single Source of Truth

> Updated: 2026-07-12. Branch: `main`. Build green.

## Project

SPA studio portfolio — **6 pages** (SPA routes), each with **4 main sections**.
Single HTML entry (index.html) with seamless inline splash overlay.
3D canvas + transparent DOM. Single font: Inter.
Navigation: JoystickNav (pure DOM + dotnav) + UIMenu (transparent navbar + dropdowns).
Theme: UIKit native `uk-light` via ThemeManager (2 modes: auto=light / inverse=dark).
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
| Seamless inline splash (no separate splash page) | ✅ |
| three.js lazy loading (dynamic import, non-blocking FCP) | ✅ |
| JoystickNav — pure DOM + dotnav timeline | ✅ |
| UIMenu — transparent navbar + dropdowns + theme toggle | ✅ |
| BakuCarousel — cube morphs into ring (Works page) | ✅ |
| SplashCube — RoundedBoxGeometry + CubeCamera + JLZ-branded textures | ✅ |
| On-demand rendering + ambient breathing | ✅ |
| EnvSphere — global theme sync | ✅ |
| ThemeManager — 2-mode (auto/inverse), global uk-light | ✅ |
| Custom cursor — codrops-style (inner dot + noisy circle) | ✅ |
| BlurFade — cinematic blur+stagger for titles | ✅ |
| NoiseText — console typewriter for eyebrow numbers | ✅ |
| Footer removed — joystick sole bottom UI | ✅ |
| Landing page removed | ✅ |
| Blog standalone (SEO) | ✅ |
| JSON-LD structured data (WebSite + Organization) | ✅ |
| Mobile-first rem sizing | ✅ |
| TypeScript strict + ESLint + Prettier | ✅ |
| 19 unit tests | ✅ |

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
  ├── SVG concentric squares (splash identity, animated scale-in)
  ├── CRT curtains (split apart on ready, 0.8s)
  ├── Progress bar (real loading %, 0→100)
  └── Config buttons (theme/sound — inside loader, fade out with splash)
```

Flow: HTML parse → inline splash renders (FCP) → dynamic import('three') →
progress fills → jlz:webgl-ready → curtains split → 3D scene revealed.
No navigation, no flash. Config buttons write localStorage during loading;
navbar theme toggle takes over after splash fades.

## Theme system

| Property | Value |
| --- | --- |
| File | `src/core/ThemeManager.ts` |
| Modes | `auto` (light), `inverse` (dark) — global |
| Persistence | `localStorage('jlz:theme')` |
| Body class | `uk-light` on `<body>` + `<html>` |
| 3D sync | `jlz:theme-applied` event → EnvSphere changeSection |
| Toggle (splash) | Config buttons inside #jlz-app-loader (during loading) |
| Toggle (app) | uk-icon-button in navbar center (after splash fades) |
| QF color-mode | `_theme-fixes.less` overrides (dark bg → light text) |

## Text animations

| Animation | Target | Effect |
| --- | --- | --- |
| BlurFade | `.studio-title` | Blur + stagger reveal (cinematic) |
| NoiseText | `[data-eyebrow]` | Console typewriter with noise tail (░▒▓█) |

Stable source: `data-eyebrow-text` attribute (never reads mutated textContent).

## Proxy/dev config

| Setting | Value |
| --- | --- |
| `server.hmr` | `false` |
| `server.allowedHosts` | `['project.6la.ru']` |
| `block-vite-client` plugin | Strips @vite/client + stubs HTTP |
| CSS import | `?inline` |
