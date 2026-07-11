# ARCHITECTURE

Vite 8 · TypeScript strict · Three.js 0.184 + TSL · UIkit 3 + Less · bun.

> UIKit theming: see [`UIKIT3.md`](UIKIT3.md). Hard rules: see [`RULES.md`](RULES.md).

## Entry

```
index.html → entry-shell.ts → entry-app.ts → main-app.ts → Experience.ts
  ↑ seamless inline splash overlay (SVG squares + progress ring + CRT curtains)
  ↑ three.js loads LAZY (dynamic import) — does NOT block FCP
blog.html → standalone (prerendered semantic HTML, SEO)
```

No separate splash page. No landing page. One HTML entry (index.html) with
inline splash overlay that fades out when 3D scene is ready (Enter click).

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

UIKit3: uk-section-small + uk-section-large@m (responsive padding),
uk-container-expand, uk-flex uk-flex-between uk-height-1-1.

## Header — transparent navbar

```
[center-left nav]  [theme button]  [center-right nav]
  Studio / Services / Works    |    Manifesto / Lab / Contact
```

uk-navbar-transparent, uk-navbar-dropdown (under nav item),
uk-icon-button (theme toggle). QF line-mode + glitch hover.

## Splash — seamless inline overlay

```
#jlz-app-loader (z-index: 10010)
  ├── SVG concentric squares (z-index: 10014, staggered fade-in)
  ├── Progress ring (SVG stroke-dashoffset on sq-4 border)
  ├── CRT curtains (z-index: 10011, split on Enter, 0.8s)
  ├── Loader content (z-index: 10015, Enter button)
  └── Config buttons (z-index: 10016, sound + language)
```

Flow: HTML parse → inline splash renders (FCP) → dynamic import('three') →
progress ring fills → jlz:webgl-ready → Enter button appears →
user clicks Enter → jlz:splash-entered → curtains split + SVG scales out →
bakuCube opener at 400ms → 3D scene. Inline fallback at 5s.

## Z-index layers

```
10016: config buttons (sound/lang)
10015: loader content (Enter button)
10014: SVG splash squares
10012: seam glow
10011: CRT curtains
10010: #jlz-app-loader container
10001: .tm-header (navbar — below splash)
100:   joystick + dotnav
2:     #spa-content
1:     canvas (3D scene, fixed, pointer-events:none)
```

## On-demand rendering

`_needsRender` flag gates `renderer.update()`. Set by: JoystickNav, BakuCarousel,
SplashCube opener, camera shake, ParticleBurst, mousemove (Works DrawTrail),
ambient breathing (1 frame/2.5s). CubeCamera throttled to every 6 frames.

## Text animations

| Animation | Target | Trigger |
| --- | --- | --- |
| BlurFade | `.studio-title` | jlz:splash-entered (300ms delay) + section changes |
| NoiseText | `[data-eyebrow]` | jlz:section-change (Experience.ts handler) |

NoiseText: console-style typewriter with trailing noise symbols (░▒▓█).
Stable source via `data-eyebrow-text` attribute.

## Per-section theme (inverse)

ContentReveal applies uk-light per-section on section change:
- auto: sectionTheme='light' → uk-light, 'dark' → no uk-light
- inverse: FLIPPED — light → no uk-light, dark → uk-light

Each section in WorldConfig has sectionTheme: 'light' | 'dark'.
ContentReveal dispatches jlz:theme-applied → Experience syncs EnvSphere.

## 3D scene control (SceneControl)

Per-section config in WorldConfig:
```typescript
scene?: {
  objects?: { wireframeText?, shaderOrb?, timelineNodes?, bakuCarousel?, particles? }
  transition?: { duration, easing: 'linear'|'ease-out'|'ease-in-out'|'cubic-bezier' }
}
```

Easing applied to camera lerp + bg fade via `_applyEasing()`.

## Modules

| Module | Role |
| --- | --- |
| Experience | Render loop, section transitions, on-demand gating, destroy cleanup |
| World | Sections + baku + lights + EnvSphere + fog + DrawTrail(works) |
| SplashCube | Glass cube + CubeCamera (throttled) + opener |
| EnvSphere | Per-section theme-driven background |
| BakuCarousel | Cube↔ring morph (Works page). Card click → overlay |
| JoystickNav | Pure DOM 2D nav + dotnav timeline |
| UIMenu | Transparent navbar + dropdowns + theme toggle |
| ContentReveal | Section activation + per-section theme (uk-light) |
| ProjectOverlay | Fullscreen DOM dialog |
| Cursor | Codrops-style: inner dot + noisy circle (skip redraw when idle) |
| ThemeManager | 2-mode (auto/inverse), per-section via ContentReveal |
| Router | Path-based `/`, `/services`, `/works`, `/manifesto`, `/lab`, `/contact` |
| RenderPipeline | WebGL2 MSAA RT + post-processing parity (bloom skip when 0) |
| BlurFade | Cinematic blur+stagger reveal for titles |
| NoiseText | Console typewriter with noise tail for eyebrow numbers |
| i18n | EN/RU translation system (t(), data-i18n attributes, lang toggle) |

## Blog pages

Standalone HTML (blog.html + blog/*.html) — not part of SPA.
CSS: `blog.less` (QF theme + _theme-fixes, no app-specific styles).
Header: transparent sticky navbar (`.jlz-blog-header`).
Footer: minimal (`.jlz-blog-footer`).
SEO: BlogPosting JSON-LD + meta tags per post.

## i18n

`src/core/i18n.ts` — EN/RU translation system.
- `t(key)` — translate a key
- `data-i18n` attributes on elements — auto-translated on load + toggle
- `toggleLang()` — EN ↔ RU, persists to localStorage
- Wired to splash config lang button
- 40+ translation keys defined (nav, sections, actions, process)
- TODO: apply `data-i18n` attributes to templates

## Events

| Event | Emitted by | Consumed by |
| --- | --- | --- |
| `jlz:webgl-ready` | main-app | entry-app (show Enter button) |
| `jlz:splash-entered` | inline script (Enter click) | entry-app (animations + scrollspy) |
| `jlz:section-change` | Experience (home only) | entry-app (BlurFade), ContentReveal, Experience (NoiseText) |
| `jlz:page-section-change` | JoystickNav (content pages) | ContentReveal, entry-app (BlurFade) |
| `jlz:route-change` | router | UIMenu, ContentReveal (cache invalidation) |
| `jlz:theme-change` | ThemeManager | ContentReveal (re-apply theme) |
| `jlz:theme-applied` | ContentReveal | Experience (EnvSphere sync) |
