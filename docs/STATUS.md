# STATUS — Single Source of Truth

> Updated: 2026-07-12. Branch: `main`. Build green.

## Project

SPA studio portfolio — **6 pages** (one per cube face), each with **4 main sections**.
3D canvas + transparent DOM overlay. Single font: Inter.
Navigation: JoystickNav (pure DOM + dotnav) + UIMenu (transparent navbar + dropdowns).
Theme: UIKit native `uk-light` via ThemeManager (2 modes: auto=light / inverse=dark).
Mobile-first: `html { font-size: 0.85rem }` mobile → `1rem` ≥640px.

Multi-page: splash (/) → app (/app) → blog (/blog) → landing (/landing).

## Pages (6) — one per cube face

| Page | URL | Sections (joystick down/up) |
| --- | --- | --- |
| Studio | `/app` | 01 Studio / 02 Services / 03 Works / 04 Manifesto |
| Services | `/app/services` | 01 Creative Direction / 02 Interactive Dev / 03 Motion & Realtime / 04 AI Systems |
| Works | `/app/works` | 01 Undercurrent / 02 Mono Sunday / 03 Till at Night / 04 Ebb Vibes |
| Manifesto | `/app/manifesto` | 01 Purpose / 02 Clarity / 03 Emotion / 04 Simplicity |
| Lab | `/app/lab` | 01 Shader Lab / 02 Audio Reactive / 03 Generative / 04 GPU Particles |
| Contact | `/app/contact` | 01 Email / 02 Social / 03 Location / 04 Form |

## Current state

| Item | Status |
| --- | --- |
| 3D scene (WebGPU + WebGL2 fallback) | ✅ |
| 6 pages — one per cube face | ✅ |
| Unified sectionShell() — ONE wrapper for all pages | ✅ |
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
| Mobile-first rem sizing | ✅ |
| Responsive sections | ✅ |
| TypeScript strict + ESLint + Prettier | ✅ |
| 19 unit tests | ✅ |

## Navigation — JoystickNav

| Action | Behavior |
| --- | --- |
| Vertical (up/down) | Cycle 4 main sections of current page |
| Horizontal (left/right) | Toggle shared side sections: Lab ↔ center ↔ Contact |
| Dotnav | 4 dots below joystick — click to jump |
| Keyboard | Arrows, Home (→1), End (→4) |

## Visual tiers

| Tier | Path | SplashCube | Background |
| --- | --- | --- | --- |
| Premium | Real WebGPU | MeshPhysicalMaterial + CubeCamera | EnvSphere |
| Parity | WebGL2 fallback | Same | EnvSphere |

MSAA 4× on scene WebGLRenderTarget. RoundedBoxGeometry (bevel 0.04) for smooth edges.

## Theme system

| Property | Value |
| --- | --- |
| File | `src/core/ThemeManager.ts` |
| Modes | `auto` (light), `inverse` (dark) — global |
| Persistence | `localStorage('jlz:theme')` |
| Body class | `uk-light` on `<body>` + `<html>` |
| 3D sync | `jlz:theme-applied` event → EnvSphere changeSection |
| Toggle | uk-icon-button in navbar center (calls `themeManager.toggle()`) |
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
