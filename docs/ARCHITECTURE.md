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

## Pages (6) — one per cube face

| Page | URL | Sections (joystick down/up) |
| --- | --- | --- |
| Studio | `/app` | 01 Studio / 02 Services / 03 Works / 04 Manifesto |
| Services | `/app/services` | 01 Creative Direction / 02 Interactive Dev / 03 Motion & Realtime / 04 AI Systems |
| Works | `/app/works` | 01 Undercurrent / 02 Mono Sunday / 03 Till at Night / 04 Ebb Vibes |
| Manifesto | `/app/manifesto` | 01 Purpose / 02 Clarity / 03 Emotion / 04 Simplicity |
| Lab | `/app/lab` | 01 Shader Lab / 02 Audio Reactive / 03 Generative / 04 GPU Particles |
| Contact | `/app/contact` | 01 Email / 02 Social / 03 Location / 04 Form |

## Navigation — JoystickNav

| Action | Behavior |
| --- | --- |
| Vertical (up/down) | Cycle 4 main sections of current page |
| Horizontal (left/right) | Toggle shared side sections: Lab ↔ center ↔ Contact |
| Dotnav | 4 dots below joystick — click to jump to section |
| Keyboard | Arrows, Home (→1), End (→4) |

## Layout — unified sectionShell()

ONE wrapper for ALL pages (home + content). Apple Watch layout:
TOP (eyebrow + title + lead) / 3D CENTER / BOTTOM (content).

```typescript
sectionShell(id, topHtml, bottomHtml, mode='content', isActive=false, extraAttrs='')
// mode: 'home' (data-section, 3D cube face) | 'content' (data-page-section)
```

```html
<section data-section|data-page-section class="uk-section uk-section-small uk-section-large@m">
  <div class="uk-container uk-container-expand uk-padding uk-flex uk-flex-column uk-flex-between uk-text-center uk-height-1-1">
    topHtml   ← .jlz-section-top (eyebrow + title + lead)
    bottomHtml ← .jlz-section-bottom (content + EXPLORE button)
  </div>
</section>
```

UIKit3 utilities: uk-section-small + uk-section-large@m (responsive padding),
uk-container-expand, uk-flex uk-flex-between uk-height-1-1 (Apple Watch layout).

## Header — transparent navbar (Balou-inspired)

```
[center-left nav]  [theme button]  [center-right nav]
  Studio / Services / Works    |    Manifesto / Lab / Contact
```

- `uk-navbar-transparent` — no background bar
- `uk-navbar-center` + `uk-navbar-center-left/right` — centered split layout
- `uk-navbar-dropdown` — under nav item (not full-width stretch)
- Theme toggle: `uk-icon-button` in center (replaces logo)
- QF `@navbar-nav-item-line-mode: true` (underline animation) + glitch hover

## Footer — removed (minimalism)

Joystick is the sole bottom UI element. `position: fixed`, floats at bottom
center with safe-area inset. Dotnav timeline below joystick base.

## Z-index layers

```
canvas (z-index:1, fixed, pointer-events:none) — 3D scene
#spa-content (z-index:2) — DOM sections
.tm-header (z-index:10001) — transparent navbar + dropdowns
#joystick-nav (z-index:100, fixed) — joystick + dotnav
.custom-cursor-inner/canvas (z-index:100000) — cursor
```

## On-demand rendering

`_needsRender` flag gates `renderer.update()`. Set by: JoystickNav, BakuCarousel,
SplashCube opener, camera shake, ParticleBurst, mousemove (Works DrawTrail),
ambient breathing (1 frame/2.5s).

## Background — EnvSphere

Global theme-driven. `jlz:theme-applied` event → `changeSection(isLight ? 1 : 2)`.
auto=Intro pattern (light), inverse=About pattern (dark).
BackSide sphere, CanvasTexture 1024×512.

## SplashCube (baku)

| Property | Value |
| --- | --- |
| Geometry | RoundedBoxGeometry(1.6, 6, 0.04) — beveled edges |
| Material | MeshPhysicalMaterial (iridescence=1, clearcoat=1, opacity=0.35) |
| Reflections | CubeCamera 512×512, JLZ-branded content scene |
| Opener | Scale pulse 1.0→1.3→1.0 |
| MSAA | `samples: 4` on scene WebGLRenderTarget |

## Render pipeline

| Backend | Render | Post |
| --- | --- | --- |
| WebGPU | TSL RenderPipeline + BloomNode | ACES + vignette + grain + chromatic + grade + sRGB |
| WebGL2 | scene → RT(MSAA 4×) → bright-extract → blur(×2) → composite → screen | same chain, manual sRGB |

Parity: portable integer hash, ACES epsilon, exact sRGBTransferOETF, BloomNode smoothstep.

## Text animations

| Animation | Target | Trigger |
| --- | --- | --- |
| BlurFade | `.studio-title` (section titles) | IntersectionObserver + jlz:section-change |
| NoiseText | `[data-eyebrow]` (section numbers) | jlz:section-change (Experience.ts handler) |

NoiseText: console-style typewriter with trailing noise symbols (░▒▓█).
Stable source via `data-eyebrow-text` attribute (never reads mutated textContent).

## Modules

| Module | Role |
| --- | --- |
| Experience | Render loop, section transitions, on-demand gating, destroy cleanup |
| World | Sections + baku + lights + EnvSphere + fog + DrawTrail(works) |
| SplashCube | Glass cube + CubeCamera + opener |
| EnvSphere | Global theme-driven background |
| BakuCarousel | Cube↔ring morph (Works page). Card click → overlay |
| JoystickNav | Pure DOM 2D nav + dotnav timeline |
| UIMenu | Transparent navbar + dropdowns + theme toggle |
| ProjectOverlay | Fullscreen DOM dialog |
| Cursor | Codrops-style: inner dot (red on hover) + noisy circle canvas |
| ThemeManager | 2-mode (auto/inverse), global, uk-light |
| Router | Path-based `/app`, `/app/services`, `/app/works`, `/app/manifesto`, `/app/lab`, `/app/contact` |
| RenderPipeline | WebGL2 MSAA RT + post-processing parity |
| BlurFade | Cinematic blur+stagger reveal for titles |
| NoiseText | Console typewriter with noise tail for eyebrow numbers |

## Events

| Event | Emitted by | Consumed by |
| --- | --- | --- |
| `jlz:webgl-ready` | main-app | entry-app (loader fade, opener, BlurFade) |
| `jlz:section-change` | Experience | entry-app (BlurFade), Experience (NoiseText eyebrow) |
| `jlz:route-change` | router | UIMenu (page active) |
| `jlz:theme-change` | ThemeManager | UIMenu (toggle label) |
| `jlz:theme-applied` | ThemeManager | Experience (EnvSphere sync) |
| `jlz:page-section-change` | JoystickNav | (content page section navigation) |

## Theme

2 modes: `auto` (light) / `inverse` (dark). Global `uk-light` on `<html>`.
QF color-mode overrides in `_theme-fixes.less` (dark bg → light text).
CSS vars (`--jlz-color-*`) flip via `html.uk-light` overrides.
