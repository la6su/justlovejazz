# STATUS — Single Source of Truth

> Updated: 2026-07-12. Branch: `main`. Build green.

## Project

SPA studio portfolio — **6 sections** (1:1 with cube faces), 3D canvas + transparent DOM overlay. Single font: Inter.
Navigation: JoystickNav (pure DOM) + UIMenu (UIkit modal) + Subtitles (NoiseText on [data-eyebrow]).
Theme: UIKit native `uk-light` via ThemeManager (2 modes: auto=light / inverse=dark) — global flip, not per-section.
Mobile-first: `html { font-size: 0.85rem }` mobile → `1rem` ≥640px.

Multi-page: splash (/) → app (/app) → blog (/blog) → landing (/landing).

## Current state

| Item | Status |
| --- | --- |
| 3D scene (WebGPU + WebGL2 fallback) | ✅ |
| 6 sections — 1:1 cube faces | ✅ |
| JoystickNav — pure DOM, trigger model | ✅ |
| 2D nav (vertical=main 1-4, horizontal=secret 0/5) | ✅ |
| UIMenu — modal + page links + theme toggle + slider labels per page | ✅ |
| Subtitles — NoiseText scramble on [data-eyebrow] | ✅ |
| BakuCarousel — cube morphs into ring (Works §3) | ✅ |
| SplashCube — RoundedBoxGeometry + CubeCamera + iridescence + opener | ✅ |
| On-demand rendering + ambient breathing | ✅ |
| EnvSphere — global theme sync (auto=light, inverse=dark) | ✅ |
| ThemeManager — 2-mode (auto/inverse), 1 toggle button | ✅ |
| Custom cursor — codrops-style (inner dot + noisy circle, red on hover) | ✅ |
| Dock — 2-row bottom bar (tools + footer) on ALL pages | ✅ |
| Mobile-first rem sizing | ✅ |
| Responsive sections | ✅ |
| 3 content pages (home/services/manifesto) + blog + landing | ✅ |
| TypeScript strict + ESLint + Prettier | ✅ |
| 19 unit tests | ✅ |

## Sections (6) — cube-map layout (ALL pages)

| Idx | Home | Services | Manifesto | Theme |
| --- | --- | --- | --- | --- |
| 0 | Lab (secret) | Secret | Secret | light |
| 1 | Intro (start) | Intro | Intro | light |
| 2 | About | Capabilities | Principles | dark |
| 3 | Works | Stack | Craft | dark |
| 4 | Contact | Process | Process | light |
| 5 | Process (secret) | Secret | Secret | dark |

## Visual tiers

| Tier | Path | SplashCube | Background |
| --- | --- | --- | --- |
| Premium | Real WebGPU | MeshPhysicalMaterial + CubeCamera | EnvSphere |
| Parity | WebGL2 fallback | Same | EnvSphere |

MSAA 4× on scene WebGLRenderTarget (`samples: 4`). RoundedBoxGeometry (bevel 0.04) for smooth edges.

## On-demand rendering

`renderer.update()` only when `_needsRender=true`. Triggers: JoystickNav, BakuCarousel, SplashCube opener, camera shake, ParticleBurst, mousemove (Works section DrawTrail), ambient breathing (1 frame / 2.5s idle).

## Theme system

| Property | Value |
| --- | --- |
| File | `src/core/ThemeManager.ts` |
| Modes | `auto` (light), `inverse` (dark) — global, not per-section |
| Persistence | `localStorage('jlz:theme')` |
| Body class | `uk-light` on `<body>` + `<html>` |
| 3D sync | `jlz:theme-applied` event → EnvSphere changeSection |
| Toggle | 1 button in UIMenu (calls `themeManager.toggle()`) |

## SplashCube (baku)

| Property | Value |
| --- | --- |
| Geometry | RoundedBoxGeometry(1.6, 6 segments, 0.04 bevel) |
| Material | MeshPhysicalMaterial (iridescence=1, clearcoat=1, roughness=0, opacity=0.35) |
| Reflections | CubeCamera 512×512, content scene (gradient planes + logo/text) |
| Opener | Scale pulse 1.0→1.3→1.0 on `triggerOpener()` (600ms after webgl-ready) |

## Dock — 2-row bottom bar

```
┌──────────────────────────────────────────┐
│  TOOLS ROW (70px) — joystick sits here   │
├──────────────────────────────────────────┤
│  FOOTER ROW — brand + © + social         │
└──────────────────────────────────────────┘
```

Visible on ALL pages. `padding-bottom: calc(130px + env(safe-area-inset-bottom))` on sections.

## Proxy/dev config

| Setting | Value |
| --- | --- |
| `server.hmr` | `false` |
| `server.allowedHosts` | `['project.6la.ru']` |
| `block-vite-client` plugin | Strips @vite/client + stubs HTTP |
| CSS import | `?inline` |
