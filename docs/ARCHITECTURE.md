# ARCHITECTURE

## Stack

Vite 8 (rolldown) · TypeScript (`strict: true`) · three 0.184 + TSL ·
`WebGPURenderer` (WebGPU/WebGL2 auto-fallback) · UIkit 3 + Less
(master-quantum-flares theme) · bun · ESLint + Prettier.
Single font: Inter.

> **Note:** Lenis was removed (SwipeNav drives navigation). The `lenis`
> package remains in package.json but is not imported anywhere.

## Layout

```
canvas.canvas (z-index:1, fixed, pointer-events:none) — 3D scene
#spa-content (z-index:2, transparent) — DOM sections (absolute-stacked, 100dvh)
  section#section-intro     → 3D group 0 (particles)
  section#section-about     → 3D group 1 (particles, DrawTrail)
  section#section-flexible  → 3D group 2 (particles — EMPTY placeholder)
  section#section-challenge → 3D group 3 (BakuCarousel)
  section#section-innovative→ 3D group 4 (particles)
  section#section-contact   → 3D group 5 (particles)
#swipe-nav (z-index:9999, fixed bottom) — SwipeNav scrubber
#jlz-menu-toggle (z-index:10001, fixed top-right) — UIMenu hamburger
#jlz-menu-modal (z-index:10000, UIkit modal) — UIMenu overlay
#project-overlay (z-index:3500, fixed) — ProjectOverlay fullscreen
.custom-cursor (z-index:100000, fixed) — custom cursor (above all overlays)
```

Sections are `position:absolute; inset:0` — stacked in one viewport cell.
`body { overflow: hidden }` — no page scroll. `.section-active` toggles
which section is visible (opacity:1, pointer-events:auto).

## Entry & Runtime

```
index.html (prerendered sections) → entry-shell.ts → entry-app.ts → main-app.ts → Bootstrapper → Experience.ts
Render loop: renderer.instance.setAnimationLoop(callback)
  (pauses on hidden tab via visibilitychange)
```

| Step | File | Role |
| --- | --- | --- |
| 1 | `index.html` | Static shell. `<body data-app-mode="full" data-page="home">`. `#jlj-splash` (curtain), `#main-nav`, `#app`. CSS locks `body { overflow: hidden }`. |
| 2 | `entry-shell.ts` | `requestIdleCallback` → dynamic `import('./entry-app')` → `startApp()`. Fallback reload overlay on failure. |
| 3 | `entry-app.ts` | Imports `main.less`, `UIkit.use(Icons)`, `initRouter()`, `boot()`. Listens for `jlz:webgl-ready` (NoiseText + scrollspy) and `jlz:section-change` (UIkit refresh). |
| 4 | `main-app.ts` | `bootstrap()`: ErrorTracker, splash show + progress, UIManager, Bootstrapper.init. Schedules curtain reveal + emits `jlz:webgl-ready` at curtain mid-open. |
| 5 | `Bootstrapper.ts` | `init(ui)`: dynamic-imports Experience, `new Experience(ui)`, `experience.init()`. |
| 6 | `Experience.ts` | Orchestrator. Owns Sizes/Time/Camera/Renderer/World/StateBus/Audio/Subtitles/SwipeNav/UIMenu/portfolio/overlay. `update(time)` is the per-frame driver. |

## Renderer

Single `WebGPURenderer` (alpha:false, ACES tonemap, sRGB).

- WebGPU: direct `renderer.render()` (no post-processing)
- WebGL2: ShaderMaterial RT pipeline — single ACES pass in composite shader
- All scene materials: built-in or TSL NodeMaterial (native WebGPU path)
- Raw ShaderMaterial banned in scene (WebGPURenderer incompatible); allowed in post-processing (WebGL2 only)
- Post-processing: refraction + color grade (composite shader, WebGL2 path)

## Navigation (current)

### SwipeNav (`src/UI/SwipeNav.ts`)

One-section-at-a-time swiper. Fixed bottom bar (`#swipe-nav`).

- Drag right 0→100% → transition to NEXT section. Drag left 0→-100% → PREV.
- `|progress| > 50%` on release commits transition (section advances, progress resets to 0).
- `|progress| < 50%` snaps back to current section.
- Boundary rubber-band: drag past first/last section is resisted ×0.3.
- `getOverallProgress()` = `(currentSection + progress) / (sectionCount − 1)` → fed to `world.advance()`.
- Keyboard: ArrowRight/Down = next, ArrowLeft/Up = prev, Home = first, End = last.
- Wheel/scroll does NOT navigate sections.
- Styling: `.jlz-swipenav*` in `main.less`.

### UIMenu (`src/UI/UIMenu.ts`)

UIkit modal for jump navigation. Hamburger button `#jlz-menu-toggle`
(top-right) with `uk-toggle="target: #jlz-menu-modal"`. Modal uses
`uk-modal` (UIkit handles overlay/esc/bg-close/focus-trap/scroll-lock).
6 section links → `SwipeNav.goToSection(idx)`.

### Section DOM (`main.less`)

- `html, body { overflow: hidden }` — page scroll locked.
- `.section-studio { height: 100dvh; overflow: hidden; }`
- `.section-studio section[data-section] { position: absolute; inset: 0; }` — stacked.
- `[data-section] { opacity: 0; pointer-events: none; }` — inactive hidden.
- `.section-active { opacity: 1; pointer-events: auto; }` — active visible.
- ContentReveal toggles `.section-active` on `jlz:section-change`.

## BakuCarousel (`src/Experience/World/BakuCarousel.ts`)

Baku cube morphs into a carousel ring on the works section (§4).

- 6 plane meshes start as cube faces (folded), unfold into horizontal ring.
- `morphT`: 0 = cube, 1 = carousel. Eased with smoothstep.
- ARC trajectory: cards travel along an arc (y-bump peaks at mid-morph).
- Card opacity: invisible while cube (morphT<0.25), fades in 0.25→0.7.
- Ring rotates by `scroll.current` (wheel/drag) when `morphT > 0.5`.
- Snap-to-card after 180ms idle.
- **Morph trigger:** `World.updateTransform()` calls `carousel.setActive(fade > 0.5)` when works section fade crosses 0.5.
- **Card click:** `onCardClick(idx)` → `onProjectSelect(idx)` + `overlay.showContainer()`. SOLE entry point for fullscreen.
- 4 unique project textures loaded once, shared across 6 faces.
- Guards: `isMenuOpen()` + `isUiChromeEvent(e)` from `src/UI/uiChrome.ts`.

## ProjectOverlay (`src/UI/ProjectOverlay.ts`)

Custom DOM fullscreen overlay (`#project-overlay`, z-index 3500). Opens on
BakuCarousel card click. Prev/next arrows drive BakuCarousel. Esc closes.
Focus trap. Body overflow locked while open. Custom cursor (z-index 100000)
stays visible on top.

## Modules

| Module | Role |
| --- | --- |
| Experience | Render loop, section transitions, portfolio, visibilitychange |
| Renderer | WebGPURenderer, direct render on WebGPU |
| World | Section[] + sceneGroups[], SplashCube (baku), Lights, BG, Ground, DrawTrail |
| SectionSceneFactory | 6 scenes (particles + BakuCarousel on §4) |
| BG | Per-section background color (reads from WorldConfig — single source) |
| WorksPortfolio | Project metadata + texture container (slider logic removed — BakuCarousel owns works UI) |
| BakuCarousel | Cube↔carousel morph + card click → overlay |
| ProjectOverlay | DOM dialog (role=dialog, focus-trap, ESC close) |
| NoiseText | Glitch reveal (jlz:webgl-ready + jlz:section-change) |
| DrawTrail | Cursor trail (about section only) |
| CinematicLights | 5-light setup, changeSection + lerp |
| disposeMaterialDeep | Disposes all material textures (prevents VRAM leak) |
| worldDNA | TSL persistent shader: vertex displacement, color blend, iridescent shimmer |
| AudioSystem | Web Audio API FFT analyser → worldDNA uniforms (bass/mid/treble) |
| WebGPUPostPipeline | TSL post-processing (bloom + vignette + grain + color grade) for WebGPU |
| SwipeNav | One-section-at-a-time swiper (bottom bar) |
| UIMenu | UIkit modal section menu (hamburger → jump nav) |
| uiChrome | Centralized UI-chrome event guard (`isUiChromeEvent`, `isMenuOpen`) |
| makeParticles | Shared particle factory (`src/Sections/_shared/`) |

## Chunking (Vite 8 / rolldown `codeSplitting`)

```
vendor-three  (preloaded — three.js needed at boot)
vendor-ui     (uikit)
KTX2Loader    (lazy — dynamic import, not preloaded)
chunk-*       (app code, split by src path)
```

## Event bus events

| Event | Emitted by | Consumed by |
| --- | --- | --- |
| `jlz:webgl-ready` | main-app.ts (curtain mid-open) | entry-app.ts (NoiseText + scrollspy) |
| `jlz:section-change` | Experience.update (on section index change) | Subtitles, ContentReveal, entry-app.ts (UIkit refresh) |

StateBus channels: `intro:opacity`, `intro:stage`, `intro:done`,
`section:<id>:state`, `section:<id>:opacity`.

## Fonts

Single font: Inter (300-900). Override master-quantum-flares in main.less.

## Scroll transitions

Per-section (from `WorldConfig`, ranges `[i/5, (i+1)/5]`):

- Camera position/FOV (lerp via `Camera.updateSmooth`)
- BG color (double-smoothstep `bgT` — holds color until mid-transition)
- Fog color + density (set on section change)
- Lighting: key/fill/rim/volumetric/hemi (lerp via `Lights.changeSection`)
- Post-processing presets (bloom/vignette/grain per section)
- Camera shake on section transition (reduced-motion gated)
- Portrait FOV boost (up to +20° on narrow portrait)
- Per-section cursor follow (works=0.22, others=0.15)
- DrawTrail visible on about(1) only

## AUDIT — ALL RESOLVED ✅

A-001 through A-015 — all fixed. See `docs/AUDIT.md` (historical reference).
