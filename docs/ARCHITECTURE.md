# ARCHITECTURE

Vite 8 · TypeScript strict · Three.js 0.184 + TSL · UIkit 3 + Less · bun.

> UIKit theming: see [`UIKIT3.md`](UIKIT3.md). Hard rules: see [`RULES.md`](RULES.md).

## Entry

```
index.html → entry-shell.ts → entry-app.ts → main-app.ts → Experience.ts
  ↑ seamless inline splash overlay (SVG squares + CRT curtains + progress)
  ↑ three.js loads LAZY (dynamic import) — does NOT block FCP
blog.html → standalone (prerendered semantic HTML, SEO)
```

No separate splash page. No landing page. One HTML entry (index.html) with
inline splash overlay that fades out when 3D scene is ready.

## Pages (6) — SPA routes

| Page | Route | Sections (joystick down/up) |
| --- | --- | --- |
| Studio | `/` | 01 Studio / 02 Services / 03 Works / 04 Manifesto |
| Services | `/services` | 01 Creative Direction / 02 Interactive Dev / 03 Motion & Realtime / 04 AI Systems |
| Works | `/works` | 01 Undercurrent / 02 Mono Sunday / 03 Till at Night / 04 Ebb Vibes |
| Manifesto | `/manifesto` | 01 Purpose / 02 Clarity / 03 Emotion / 04 Simplicity |
| Lab | `/lab` | 01 Shader Lab / 02 Audio Reactive / 03 Generative / 04 GPU Particles |
| Contact | `/contact` | 01 Email / 02 Social / 03 Location / 04 Form |

Blog (`/blog` + `/blog/[slug]`) — standalone HTML pages, not part of SPA.

## Navigation — JoystickNav

| Action | Behavior |
| --- | --- |
| Vertical (up/down) | Cycle 4 main sections of current page |
| Horizontal (left/right) | Toggle shared side sections: Lab ↔ center ↔ Contact |
| Dotnav | 4 dots below joystick — click to jump to section |
| Keyboard | Arrows, Home (→1), End (→4) |

## Layout — unified sectionShell()

ONE wrapper for ALL pages. Apple Watch layout:
TOP (eyebrow + title + lead) / 3D CENTER / BOTTOM (content).

```typescript
sectionShell(id, topHtml, bottomHtml, mode='content', isActive=false, extraAttrs='')
// mode: 'home' (data-section, 3D cube face) | 'content' (data-page-section)
```

UIKit3: uk-section-small + uk-section-large@m, uk-container-expand,
uk-flex uk-flex-between uk-height-1-1.

## Header — transparent navbar

```
[center-left nav]  [theme button]  [center-right nav]
  Studio / Services / Works    |    Manifesto / Lab / Contact
```

uk-navbar-transparent, uk-navbar-dropdown (under nav item),
uk-icon-button (theme toggle). QF line-mode + glitch hover.

## Splash — seamless inline overlay

```
#jlz-app-loader (z-index:9999, fixed)
  ├── SVG concentric squares (splash identity)
  ├── CRT curtains (split on ready)
  ├── Progress bar (real loading %)
  └── Config buttons (theme/sound — fade out with splash)
```

Flow: HTML parse → inline splash renders (FCP ~200ms) → dynamic import('three')
→ progress bar fills → jlz:webgl-ready → curtains split → 3D scene revealed.
No navigation, no flash. Config buttons inside loader (disappear on fade).

## Z-index layers

```
canvas (z-index:1, fixed, pointer-events:none) — 3D scene
#spa-content (z-index:2) — DOM sections
.tm-header (z-index:10001) — transparent navbar + dropdowns
#jlz-app-loader (z-index:9999) — splash overlay (removed after fade)
#joystick-nav (z-index:100, fixed) — joystick + dotnav
.custom-cursor-inner/canvas (z-index:100000) — cursor
```

## On-demand rendering

`_needsRender` flag gates `renderer.update()`. Set by: JoystickNav, BakuCarousel,
SplashCube opener, camera shake, ParticleBurst, mousemove (Works DrawTrail),
ambient breathing (1 frame/2.5s).

## Text animations

| Animation | Target | Trigger |
| --- | --- | --- |
| BlurFade | `.studio-title` (section titles) | IntersectionObserver + jlz:section-change |
| NoiseText | `[data-eyebrow]` (section numbers) | jlz:section-change (Experience.ts handler) |

NoiseText: console-style typewriter with trailing noise symbols (░▒▓█).
Stable source via `data-eyebrow-text` attribute.

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
| Router | Path-based `/`, `/services`, `/works`, `/manifesto`, `/lab`, `/contact` |
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
Splash config buttons write localStorage during loading; navbar toggle
takes over after splash fades.
