# ARCHITECTURE

> Modules, render path, navigation, section layout. See [STATUS.md](STATUS.md) for current state.

## Stack

Vite 8 (rolldown) · TypeScript (`strict: true`) · three 0.184 + TSL ·
`WebGPURenderer` (WebGPU/WebGL2 auto-fallback) · UIkit 3 + Less
(master-quantum-flares theme) · bun · ESLint + Prettier.
Single font: Inter.

## Layout

```
canvas.canvas          (z:1, fixed, pointer-events:none)  3D scene
#spa-content           (z:2, transparent)                 DOM sections (absolute-stacked, 100dvh)
#circ-nav              (z:9999, fixed bottom-right)       CircularNav dial (vinyl-record style)
#jlz-menu-toggle       (z:10001)                          UIMenu hamburger (center of dial)
#jlz-menu-modal        (z:10000, UIkit modal)             UIMenu overlay
#project-overlay       (z:3500, fixed)                    ProjectOverlay fullscreen
.custom-cursor         (z:100000, fixed)                  above all overlays
```

Sections `position:absolute; inset:0` — stacked in one viewport cell.
`body { overflow: hidden }` — no page scroll. `.section-active` toggles visibility.

## Entry & Runtime

| Step | File | Role |
| --- | --- | --- |
| 1 | `index.html` | Static shell. `<body data-app-mode="full" data-page="home">`. `#jlj-splash` (curtain), `#app`. CSS locks `body { overflow: hidden }`. |
| 2 | `entry-shell.ts` | `requestIdleCallback` → dynamic `import('./entry-app')` → `startApp()`. |
| 3 | `entry-app.ts` | Imports `main.less?inline` (prevents `@vite/client` injection). `UIkit.use(Icons)`, `initRouter()`, `boot()`. Listens for `jlz:webgl-ready` (NoiseText + scrollspy). |
| 4 | `main-app.ts` | `bootstrap()`: ErrorTracker, splash show + progress, UIManager, Bootstrapper.init. Emits `jlz:webgl-ready` at curtain mid-open. |
| 5 | `Bootstrapper.ts` | `init(ui)`: dynamic-imports Experience, `new Experience(ui)`, `experience.init()`. |
| 6 | `Experience.ts` | Orchestrator. Owns Sizes/Time/Camera/Renderer/World/StateBus/Audio/CircularNav/UIMenu/portfolio/overlay. `update(time)` is the per-frame driver (wrapped in try/catch). |

Render loop: `renderer.instance.setAnimationLoop(callback)` — pauses on hidden tab.

## Renderer

Single `WebGPURenderer` (alpha:false, ACES tonemap, sRGB).

| Path | Pipeline |
| --- | --- |
| WebGPU | `WebGPUPostPipeline` (TSL RenderPipeline + BloomNode + Fn nodes for vignette/grain/grade) |
| WebGL2 | `RenderPipeline` (ShaderMaterial RT pipeline — bright-extract → ping-pong blur → composite with bloom/grain/vignette/chromatic/refraction/grade) |

- WebGL2 fallback uses `WebGLNodesHandler` (addon) to compile TSL NodeMaterials
- Real WebGPU only (SwiftShader fallback → switch to WebGL2 hardware renderer)
- `setTransmissionEnabled(true)` only on real WebGPU (transmission crashes WebGLBackend)
- All scene materials: built-in OR TSL NodeMaterial. Raw ShaderMaterial banned in scene.
- NodeMaterial cache rebuilt only on invalidation (avoid per-frame traverse)

## Navigation

### CircularNav (`src/UI/CircularNav.ts`)

Vinyl-record dial fixed to bottom-right corner. Circle center = corner; only
top-left quadrant visible (`overflow:hidden`). 6 section dots on a 90° arc.

- Drag counter-clockwise (up) → NEXT section. Drag clockwise (down) → PREV.
- `|progress| > 0.5` on release commits transition; `< 0.5` snaps back.
- Tap a dot → jump to that section (`handleTap` finds closest dot ≤40px).
- Boundary rubber-band: drag past first/last resisted ×0.3.
- `getOverallProgress()` = `(currentSection + progress) / (sectionCount − 1)` → fed to `world.advance()`.
- Keyboard: ArrowRight/Up = next, ArrowLeft/Down = prev, Home = first, End = last.
- Wheel/scroll does NOT navigate sections.
- Styling: `.jlz-circnav*` in `main.less`.

### UIMenu (`src/UI/UIMenu.ts`)

UIkit modal for jump navigation. Hamburger button `#jlz-menu-toggle`
(positioned at dial center) with `uk-toggle="target: #jlz-menu-modal"`.
Modal uses `uk-modal` (UIkit handles overlay/esc/bg-close/focus-trap/scroll-lock).
6 section links → `CircularNav.goToSection(idx)`.

### Section DOM (`main.less`)

| Selector | Style |
| --- | --- |
| `html, body` | `overflow: hidden` (page scroll locked) |
| `.section-studio` | `height: 100dvh; overflow: hidden` |
| `.section-studio section[data-section]` | `position: absolute; inset: 0` |
| `[data-section]` | `opacity: 0; pointer-events: none` |
| `.section-active` | `opacity: 1; pointer-events: auto` |

ContentReveal toggles `.section-active` on `jlz:section-change`.

## BakuCarousel (`src/Experience/World/BakuCarousel.ts`)

Baku cube morphs into a carousel ring on the works section (§3).

- 6 plane meshes start as cube faces, unfold into horizontal ring (radius 3.2).
- `morphT`: 0 = cube, 1 = carousel. Eased with smoothstep.
- Arc trajectory: cards travel along an arc (y-bump peaks at mid-morph).
- Card opacity: invisible while cube (`morphT<0.25`), fades in 0.25→0.7.
- Ring rotates by `scroll.current` (wheel/drag) when `morphT > 0.5`.
- Snap-to-card after 180ms idle.
- **Morph trigger:** `World.updateTransform()` calls `carousel.setActive(fade > 0.5)`.
- **Card click:** raycast against visible cards (opacity > 0.1) → `onCardClick(idx)` → `overlay.showContainer()`. SOLE entry point for fullscreen.
- 4 unique project textures loaded once, shared across 6 faces.
- Built-in `MeshBasicMaterial` for cards (not NodeMaterial — avoids uniform-group bloat).
- Guards: `isMenuOpen()` + `isUiChromeEvent(e)` from `src/UI/uiChrome.ts`.

## ProjectOverlay (`src/UI/ProjectOverlay.ts`)

Custom DOM fullscreen overlay (`#project-overlay`, z-index 3500). Opens on
BakuCarousel card click. Prev/next arrows drive BakuCarousel + update overlay
HTML. Esc closes. Focus trap. Body overflow locked while open. Custom cursor
(z-index 100000) stays visible on top.

## WorksPortfolio (`src/Experience/WorksPortfolio.ts`)

Project metadata container only. `group.visible = false` (never rendered —
BakuCarousel owns works UI). Provides:
- `projects: Project[]` — used by `onProjectSelect` to populate overlay
- `currentIdx`, `prev()` / `next()` / `goTo(idx)` — drive BakuCarousel via `onCardClick` callback
- `dispose()` — clears group

NO texture loading, NO spring physics, NO input handlers (all removed).

## Modules

| Module | Role |
| --- | --- |
| Experience | Render loop (try/catch), section transitions, portfolio, visibilitychange |
| Renderer | WebGPURenderer, TSL/ShaderMaterial pipelines, NodeMaterial cache |
| World | Section[] + sceneGroups[], SplashCube (baku), Lights, BG, Ground, DrawTrail |
| SectionSceneFactory | 6 scenes (particles + BakuCarousel on §3) |
| BG | Per-section background color (single source: WorldConfig) |
| SplashCube | Apple Fifth Avenue glass cube = baku. ONE shared MeshPhysicalNodeMaterial. |
| WorksPortfolio | Project metadata (no textures, no slider) |
| BakuCarousel | Cube↔carousel morph + card click → overlay |
| ProjectOverlay | DOM dialog (role=dialog, focus-trap, ESC close) |
| NoiseText | Glitch reveal (jlz:webgl-ready + jlz:section-change) |
| DrawTrail | Cursor trail (about + flexible sections) |
| CinematicLights | 5-light setup, changeSection + lerp |
| disposeMaterialDeep | Disposes all material textures (prevents VRAM leak) |
| worldDNA | TSL persistent shader: vertex displacement, color blend, iridescent shimmer |
| AudioSystem | Web Audio API FFT analyser → worldDNA uniforms |
| WebGPUPostPipeline | TSL post-processing (bloom + vignette + grain + grade) for WebGPU |
| CircularNav | Vinyl-record dial (bottom-right corner) |
| UIMenu | UIkit modal section menu (hamburger → jump nav) |
| uiChrome | Centralized UI-chrome event guard (`isUiChromeEvent`, `isMenuOpen`) |
| makeParticles | Shared particle factory (`src/Sections/_shared/`) |
| DebugStats | FPS + frame time + backend + memory + drawCalls (per-frame) + geometries/textures |

## Chunking (Vite 8 / rolldown `codeSplitting`)

```
vendor-three  (preloaded)
vendor-ui     (uikit)
KTX2Loader    (lazy — dynamic import, not preloaded)
chunk-*       (app code, split by src path)
```

## Event bus events

| Event | Emitted by | Consumed by |
| --- | --- | --- |
| `jlz:webgl-ready` | main-app.ts (curtain mid-open) | entry-app.ts (NoiseText + scrollspy) |
| `jlz:section-change` | Experience.update (on section index change) | ContentReveal, entry-app.ts (UIkit refresh) |

StateBus channels: `intro:opacity`, `intro:stage`, `intro:done`,
`section:<id>:state`, `section:<id>:opacity`.

## Scroll transitions

Per-section (from `WorldConfig`, ranges `[i/5, (i+1)/5]`):

| Aspect | Mechanism |
| --- | --- |
| Camera position/FOV | lerp via `Camera.updateSmooth` |
| BG color | double-smoothstep `bgT` (holds color until mid-transition) |
| Fog color + density | set on section change |
| Lighting | key/fill/rim/volumetric/hemi lerp via `Lights.changeSection` |
| Post-processing presets | bloom/vignette/grain per section |
| Camera shake | on section transition (reduced-motion gated) |
| Portrait FOV boost | up to +20° on narrow portrait |
| Cursor follow | works=0.22, others=0.15 |
| DrawTrail visible | about(1) + flexible(2) only |

## AUDIT — ALL RESOLVED ✅

A-001 through A-015 — all fixed. See [docs/AUDIT.md](AUDIT.md) (historical reference).
