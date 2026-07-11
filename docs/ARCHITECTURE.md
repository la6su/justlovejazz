# ARCHITECTURE

Vite 8 · TypeScript strict · Three.js 0.184 + TSL · UIkit 3 + Less · bun.

> UIKit theming: see [`UIKIT3.md`](UIKIT3.md). Hard rules: see [`RULES.md`](RULES.md).

## Entry

```
index.html → entry-shell.ts → entry-app.ts → main-app.ts → Experience.ts
  ↑ seamless inline splash overlay (SVG squares + progress ring + CRT curtains)
  ↑ three.js loads LAZY (dynamic import) — does NOT block FCP
  ↑ Enter button DISABLED until 3D fully ready (jlz:webgl-ready)
blog.html + blog/*.html → standalone (prerendered semantic HTML, SEO)
```

No separate splash page. No landing page. One HTML entry (`index.html`) with
inline splash overlay that fades out when the 3D scene is ready (Enter click).

## Pages (6 SPA routes)

| Page | Route | Sections (joystick down/up) |
| --- | --- | --- |
| home | `/` | 01 Studio / 02 Services / 03 Works / 04 Manifesto |
| services | `/services` | 01 Creative Direction / 02 Interactive Dev / 03 Motion & Realtime / 04 AI Systems |
| works | `/works` | 4 sections × 2 large 3D tilt cards = 8 case studies |
| manifesto | `/manifesto` | 01 Purpose / 02 Clarity / 03 Emotion / 04 Simplicity |
| lab | `/lab` | 01 Shader Lab / 02 Audio Reactive / 03 Generative / 04 GPU Particles |
| contact | `/contact` | 01 Email / 02 Social / 03 Location / 04 Form |

Blog (`/blog` + `/blog/[slug]`) — standalone HTML pages, not part of SPA.

## Navigation — JoystickNav

| Action | Behavior |
| --- | --- |
| Vertical (up/down) | Cycle 4 main sections of current page |
| Horizontal (left/right) | Toggle shared side sections: Lab(0) ↔ center(1-4) ↔ Process(5) |
| Dotnav | 4 dots below joystick — click to jump to section |
| Keyboard | Arrows, Home (→1), End (→4) |

## Layout — unified sectionShell()

ONE wrapper for ALL pages. Apple Watch layout:
TOP (eyebrow + title + lead) / 3D CENTER / BOTTOM (content).

```typescript
sectionShell(id, topHtml, bottomHtml, mode='content', isActive=false, extraAttrs='')
// mode: 'home' (data-section, 3D cube face) | 'content' (data-page-section)

contentTop(eyebrow, title, lead?, headingTier='medium', titleKey?, leadKey?)
// titleKey/leadKey → data-i18n attributes on <h2> and <p> (i18n integration)

contentBottom(content)  // wraps cards/grid/list content
```

UIKit3: `uk-section-small uk-section-large@m` (responsive padding),
`uk-container-expand`, `uk-flex uk-flex-between uk-height-1-1`.

## Header — transparent navbar

```
[center-left nav]  [theme button]  [center-right nav]
  Studio / Services / Works    |    Manifesto / Lab / Contact
```

`uk-navbar-transparent`, `uk-navbar-dropdown` (under nav item),
`uk-icon-button` (theme toggle). QF line-mode + glitch hover.
Nav labels have `data-i18n` attributes (`nav.studio`, `nav.services`, etc.).

## Splash — seamless inline overlay

```
#jlz-app-loader (z-index: 10010)
  ├── SVG concentric squares (z-index: 10014, staggered fade-in)
  ├── Progress ring (SVG stroke-dashoffset on sq-4 border, perimeter=1064)
  ├── CRT curtains (z-index: 10011, split on Enter, 0.8s)
  ├── Loader content (z-index: 10015, Enter button — DISABLED until ready)
  └── Config buttons (z-index: 10016, sound + language)
```

### Flow (CRITICAL — see RULES §15-17)

```
HTML parse → inline splash renders (FCP)
  → dynamic import('three') → progress ring fills (15→40→55→85→95→100%)
  → jlz:webgl-ready fires (Experience.init() COMPLETE)
  → Enter button ACTIVATES (.is-ready: pointer-events:auto, opacity:1)
  → user clicks Enter → jlz:splash-entered → curtains split + SVG scales out
  → bakuCube opener at 400ms → 3D scene
```

Enter button is ALWAYS visible but DISABLED (`pointer-events:none`, `opacity:0.5`)
until `jlz:webgl-ready`. Under throttling, init takes 10-20s — that's expected.
60s hard fallback → load error (NOT Enter). If init crashes → `jlz:webgl-failed`
→ load error.

## Z-index layers

```
10016: config buttons (sound/lang)
10015: loader content (Enter button)
10014: SVG splash squares
10012: seam glow
10011: CRT curtains
10010: #jlz-app-loader container
3500:  #project-overlay (fullscreen works dialog)
1001:  .tm-header (navbar — below splash, above content)
100:   joystick + dotnav
2:     #spa-content
1:     canvas (3D scene, fixed, pointer-events:none)
```

## On-demand rendering

`_needsRender` flag gates `renderer.update()`. Set by:
- JoystickNav (navigation active)
- BakuCarousel (morphing/scrolling/dragging)
- SplashCube opener (`openerPhase !== 'done' && !== 'idle'`)
- camera shake
- ParticleBurst (active)
- mousemove on Works section (DrawTrail, rAF-throttled)
- cube face rotation (`_faceLerp < 1`)
- ambient breathing (1 frame/2.5s — the ONLY idle exception)

CubeCamera throttled to every 6 frames. Bloom node skipped when intensity=0.

## Ground plane — section 4 ONLY

`Experience.ts`: `this.world.groundPlane.visible = this.world.currentSectionIndex === 4`.
Section 4 = bottom cube face (-Y) on all pages. The floor appears ONLY there
(grounded feel). All other sections float in void. `groundOpacity` for section 4
is 0.25. See RULES §20.

## Text animations

| Animation | Target | Trigger |
| --- | --- | --- |
| BlurFade | `.studio-title` | jlz:splash-entered (300ms delay) + section changes |
| NoiseText | `[data-eyebrow]` | jlz:section-change (home) / jlz:page-section-change (content) |

NoiseText: console-style typewriter with trailing noise symbols (░▒▓█).
Stable source via `data-eyebrow-text` attribute.

## Per-section theme (inverse)

ContentReveal applies `uk-light` per-section on section change:
- auto mode: sectionTheme='light' → `uk-light`, 'dark' → no `uk-light`
- inverse mode: FLIPPED — light → no `uk-light`, dark → `uk-light`

Each section in WorldConfig has `sectionTheme: 'light' | 'dark'`.
ContentReveal dispatches `jlz:theme-applied` → Experience syncs EnvSphere.

## i18n — EN/RU

`src/core/i18n.ts` — full EN/RU dictionary (130+ keys, flat dot notation).
- `t(key)` — translate a key (returns key if not found)
- `data-i18n` attributes — auto-translated by `applyTranslations()` (textContent)
- `data-i18n-placeholder` — for input placeholder attributes
- `toggleLang()` — EN ↔ RU, persists to `localStorage('jlz:lang')`, dispatches `jlz:lang-change`
- `applyTranslations()` runs in `router.ts` on every `renderView()` + on `jlz:lang-change`
- English text is always the default element content (no-JS fallback)
- Project names (Undercurrent, Mono Sunday, etc.) stay English — proper nouns

### Key naming convention

```
splash.*        — splash overlay
nav.*           — header nav labels
common.*        — shared CTAs (explore, readMore, send, email, telegram, github)
home.*          — home page cube-face sections (studio, about, works, manifesto, contact, lab)
services.*      — services content page
works.*         — works content page section headers
manifesto.*     — manifesto content page
lab.*           — lab content page
contact.*       — contact content page
hint.*          — secret-section return hints
meta.*          — per-page <title> + <meta description> (route-based SEO)
```

## Meta tags — route-based SEO

`src/core/pageMeta.ts` — `applyMetaTags(page)` called in `router.ts` on every
route change + on `jlz:lang-change`:
- `<title>` — from `meta.<page>.title`
- `<meta name="description">` — from `meta.<page>.description`
- `<html lang>` — `'ru'` or `'en'` based on `getLang()`
- Open Graph: `og:title`, `og:description`, `og:url`, `og:site_name`, `og:type`
- Twitter Card: `twitter:card`, `twitter:title`, `twitter:description`
- `<link rel="canonical">` — `origin + page.path`

All meta values come from the i18n dictionary → switch language → meta switches.

## Works page — 3D tilt cards

4 sections × 2 large CSS-3D tilt cards = 8 case studies (`src/pages/content/works.ts`).
Each `.jlz-work-card` has:
- `data-project-idx` — positional index into `PROJECTS` array
- CSS 3D: `perspective` on button, `rotateX/Y` on `__inner` via `--rx`/`--ry` custom props
- `transform-style: preserve-3d` on inner — child layers (`__image`, `__sheen`, `__overlay`) use `translateZ` for parallax depth
- Click → `jlz:open-project { idx }` → Experience opens ProjectOverlay (same overlay as home BakuCarousel)

`src/UI/WorkCards.ts` — `initWorkCards()` binds tilt + click. Idempotent (skips
already-bound via `data-jlz-bound`). Called on every `jlz:route-change` +
once on app start. Single batched rAF for all card tilt updates.

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

| Module | File | Role |
| --- | --- | --- |
| Experience | `src/Experience/Experience.ts` | Render loop, section transitions, on-demand gating, destroy cleanup, `jlz:open-project` handler |
| World | `src/core/World.ts` | Sections + baku + lights + EnvSphere + fog + groundPlane + DrawTrail(works) |
| SplashCube | `src/Experience/World/SplashCube.ts` | Glass cube + CubeCamera (throttled 6 frames) + opener |
| EnvSphere | `src/Experience/World/EnvSphere.ts` | Per-section theme-driven background (sole background) |
| BakuCarousel | `src/Experience/World/BakuCarousel.ts` | Cube↔ring morph (home Works section). Card click → overlay |
| WorksPortfolio | `src/Experience/WorksPortfolio.ts` | Project metadata container (drives overlay prev/next) |
| WorkCards | `src/UI/WorkCards.ts` | Works page 3D tilt cards + click → `jlz:open-project` |
| JoystickNav | `src/UI/JoystickNav.ts` | Pure DOM 2D nav + dotnav timeline |
| UIMenu | `src/UI/UIMenu.ts` | Transparent navbar + dropdowns + theme toggle |
| ProjectOverlay | `src/UI/ProjectOverlay.ts` | Fullscreen DOM dialog (reused by home + works) |
| ContentReveal | `src/Experience/ContentReveal.ts` | Section activation + per-section theme (uk-light) |
| Cursor | `src/Experience/Cursor.ts` | Codrops-style: inner dot + noisy circle (skip redraw when idle) |
| ThemeManager | `src/core/ThemeManager.ts` | 2-mode (auto/inverse), global flip |
| Router | `src/router.ts` | Path-based routes + `applyTranslations()` + `applyMetaTags()` on every render |
| i18n | `src/core/i18n.ts` | EN/RU dictionary + `t()` + `applyTranslations()` + `toggleLang()` |
| pageMeta | `src/core/pageMeta.ts` | `applyMetaTags(page)` — route-based title/description/OG/canonical |
| RenderPipeline | `src/core/RenderPipeline.ts` | WebGL2 MSAA RT + post-processing parity (bloom skip when 0) |
| BlurFade | `src/Experience/BlurFade.ts` | Cinematic blur+stagger reveal for titles |
| NoiseText | `src/Experience/NoiseText.ts` | Console typewriter with noise tail for eyebrow numbers |
| WorldConfig | `src/core/WorldConfig.ts` | 6 section configs (camera, baku, post, ground, scene objects) |

## Blog pages

Standalone HTML (`blog.html` + `blog/*.html`) — not part of SPA.
CSS: `blog.less` (QF theme + _theme-fixes, no app-specific styles).
Header: transparent sticky navbar (`.jlz-blog-header`).
Footer: minimal (`.jlz-blog-footer`).
SEO: BlogPosting JSON-LD + meta tags per post.

## Events

| Event | Emitted by | Consumed by |
| --- | --- | --- |
| `jlz:webgl-ready` | main-app (after Experience.init) | entry-app (activate Enter button) |
| `jlz:webgl-failed` | main-app (init crashed) | entry-app (show load error) |
| `jlz:splash-entered` | inline script (Enter click) | entry-app (animations + scrollspy), Experience (opener delay) |
| `jlz:section-change` | Experience (home, section idx change) | entry-app (BlurFade), ContentReveal, Experience (NoiseText) |
| `jlz:page-section-change` | JoystickNav (content pages) | ContentReveal, entry-app (BlurFade + NoiseText) |
| `jlz:route-change` | router (page navigation) | UIMenu, ContentReveal, entry-app (initWorkCards) |
| `jlz:lang-change` | i18n (toggleLang) | router (re-apply translations + meta tags) |
| `jlz:theme-change` | ThemeManager | ContentReveal (re-apply theme) |
| `jlz:theme-applied` | ContentReveal | Experience (EnvSphere sync) |
| `jlz:open-project` | WorkCards (works page card click) | Experience (open ProjectOverlay) |
| `jlz:sound-toggle` | entry-app (config button) | Experience (audio mute) |
