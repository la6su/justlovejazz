# ARCHITECTURE

Vite 8 · TypeScript strict · Three.js 0.184 + TSL · UIkit 3 + Less · bun.

> UIKit theming: see [`UIKIT3.md`](UIKIT3.md). Hard rules: see [`RULES.md`](RULES.md).

## Entry

```
index.html → splash-entry.ts (splash page, ~15KB inline)
app.html → entry-shell.ts → entry-app.ts → main-app.ts → Experience.ts
blog.html → standalone (prerendered semantic HTML)
landing.html → standalone (no-JS fallback)
```

## Layout

```
canvas (z-index:1, fixed, pointer-events:none) — 3D scene
#spa-content (z-index:2) — DOM sections (absolute-stacked, 100dvh)
  [data-eyebrow] — NoiseText hint target (Subtitles)
.tm-header (z-index:1000) — top nav (uk-navbar + uk-slider)
#joystick-nav (z-index:100, fixed) — JoystickNav (inside dock visually)
#jlz-menu-modal (z-index:10000) — UIkit modal
#project-overlay (z-index:3500) — fullscreen project detail
.jlz-dock (z-index:50, fixed bottom) — 2-row: tools + footer
.custom-cursor-inner/canvas (z-index:100000) — cursor
```

## Sections (6) — cube-map layout (ALL pages)

| Idx | Home | Services | Manifesto | Cube face |
| --- | --- | --- | --- | --- |
| 0 | Lab (secret) | Secret | Secret | Top (+Y) |
| 1 | Intro (start) | Intro | Intro | Front (+Z) |
| 2 | About | Capabilities | Principles | Right (+X) |
| 3 | Works | Stack | Craft | Back (-Z) |
| 4 | Contact | Process | Process | Bottom (-Y) |
| 5 | Process (secret) | Secret | Secret | Left (-X) |

## Navigation — JoystickNav

| Action | Behavior |
| --- | --- |
| Vertical (up/down) | Cycle main sections 1→2→3→4 |
| Horizontal (left/right) | Toggle secret sides: 0↔center↔5 |
| From secret + opposite | Return to middle |
| Keyboard | Arrows, Home (→1), End (→4) |

Slider nav: 4 items (idx 1-4), labels per-page (PAGE_SLIDER_LABELS).

## On-demand rendering

`_needsRender` flag gates `renderer.update()`. Set by: JoystickNav, BakuCarousel, SplashCube opener, camera shake, ParticleBurst, mousemove (Works DrawTrail), ambient breathing (1 frame/2.5s).

## Background — EnvSphere

Global theme-driven. `jlz:theme-applied` event → `changeSection(isLight ? 1 : 2)`. auto=Intro pattern (light), inverse=About pattern (dark). BackSide sphere, CanvasTexture 1024×512.

## SplashCube (baku)

| Property | Value |
| --- | --- |
| Geometry | RoundedBoxGeometry(1.6, 6, 0.04) — beveled edges, no aliasing |
| Material | MeshPhysicalMaterial (iridescence=1, clearcoat=1, roughness=0, opacity=0.35) |
| Reflections | CubeCamera 512×512, content scene (gradient planes + logo/text) |
| Opener | Scale pulse 1.0→1.3→1.0 via `triggerOpener()` |
| MSAA | `samples: 4` on scene WebGLRenderTarget |

## Render pipeline

| Backend | Render | Post |
| --- | --- | --- |
| WebGPU | TSL RenderPipeline + BloomNode | ACES + vignette + grain + chromatic + grade + sRGB |
| WebGL2 | scene → RT(MSAA 4×) → bright-extract → blur(×2) → composite → screen | same chain, manual sRGB |

Parity: portable integer hash, ACES epsilon, exact sRGBTransferOETF, BloomNode smoothstep.

## Modules

| Module | Role |
| --- | --- |
| Experience | Render loop, section transitions, on-demand gating, destroy cleanup |
| World | Sections + baku + lights + EnvSphere + fog + DrawTrail(works) |
| SplashCube | Glass cube + CubeCamera + opener |
| EnvSphere | Global theme-driven background |
| BakuCarousel | Cube↔ring morph (Works §3). Card click → overlay |
| JoystickNav | Pure DOM 2D nav. Cube-map on ALL pages |
| UIMenu | UIkit modal + slider (per-page labels) + theme toggle |
| Subtitles | NoiseText scramble on [data-eyebrow] |
| ProjectOverlay | Fullscreen DOM dialog |
| Cursor | Codrops-style: inner dot (red on hover) + noisy circle canvas |
| ThemeManager | 2-mode (auto/inverse), global, uk-light |
| Router | Path-based `/app`, `/app/services`, `/app/manifesto` |
| RenderPipeline | WebGL2 MSAA RT + post-processing parity |

## Events

| Event | Emitted by | Consumed by |
| --- | --- | --- |
| `jlz:webgl-ready` | main-app | entry-app (loader fade, opener, NoiseText) |
| `jlz:section-change` | Experience | entry-app (NoiseText), Subtitles |
| `jlz:route-change` | router | UIMenu (page active, slider labels), JoystickNav |
| `jlz:theme-change` | ThemeManager | UIMenu (toggle label) |
| `jlz:theme-applied` | ThemeManager | Experience (EnvSphere sync) |
| `jlz:page-section-change` | JoystickNav | (content page section navigation) |

## Dock — 2-row bottom bar

```
TOOLS ROW (70px) — joystick visually sits here (position:fixed, centered)
FOOTER ROW (~48px) — brand + © + social icons
```

`padding-bottom: calc(130px + env(safe-area-inset-bottom))` on all sections.
