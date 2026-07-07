# ARCHITECTURE

Vite 8 · TypeScript strict · Three.js 0.184 + TSL · UIkit 3 + Less · bun.

## Entry

```
index.html → entry-shell.ts → entry-app.ts → main-app.ts → Bootstrapper → Experience.ts
Render: renderer.setAnimationLoop (pauses on hidden tab)
CSS: import('./assets/main.less?inline') — prevents @vite/client injection
```

## Layout

```
canvas (z-index:1, fixed, pointer-events:none) — 3D scene
#spa-content (z-index:2) — DOM sections (absolute-stacked, 100dvh each)
  .section-active { opacity:1; pointer-events:auto } — only visible section
#circ-nav (z-index:9999, fixed bottom-right) — CircularNav vinyl circle
#jlz-menu-toggle (z-index:10002) — hamburger button
#jlz-menu-modal (z-index:10000) — UIkit modal
#project-overlay (z-index:3500) — fullscreen project detail
.custom-cursor (z-index:100000) — above all overlays
```

## Navigation

**CircularNav** — vinyl circle, bottom-right. Center = corner (overflow:hidden clips 3/4).
- Drag DOWN → NEXT section. Drag UP → PREV.
- Progress 0→1 drives 3D scene transition + baku rotation.
- `|progress| > 0.5` on release commits; `< 0.5` snaps back.
- `goToDirection(±1)` — public, used by DevPanel + keyboard.
- `isActive()` — true during transition (feeds `_needsRender`).

**UIMenu** — UIkit modal (`uk-modal`). Hamburger `uk-toggle` opens. 6 section links.

**BakuCarousel** — works §4. Cube morphs into ring. Card click (raycast) → overlay.
- `isAnimating` getter — true when morphing/scrolling (feeds `_needsRender`).
- Scroll/drag blocked while CircularNav transition active.

## On-demand rendering

`Experience._needsRender` flag gates `renderer.update()`. Set true when:
1. `CircularNav.isActive()` — transition in progress
2. `BakuCarousel.isAnimating` — morph/scroll/drag
3. Intro/splash animation running
4. Camera shake active

When idle: `World.update(dt, false)` skips baku/particles/carousel. Zero draw calls.
Cursor (DOM) always updates — not gated by `_needsRender`.

## Renderer

| Backend | Render | Post |
| --- | --- | --- |
| WebGPU | TSL RenderPipeline (bloom+vignette+grain) | ACES toneMapping |
| WebGL2 | ShaderMaterial RT pipeline | bloom+grain+vignette, single ACES |

Shared MeshPhysicalNodeMaterial for all 6 cube faces (1 uniform group).
Built-in materials for particles/ground/cards/edges (reduce uniform groups).

## Modules

| Module | Role |
| --- | --- |
| Experience | Render loop, section transitions, on-demand gating |
| World | Sections + sceneGroups + baku + lights + BG + DrawTrail(works only) |
| SplashCube | Baku cube. Static when idle. Rotates ~30° on transition. Opener on splash. |
| BakuCarousel | Cube↔ring morph. Raycast card click. `isAnimating` getter. |
| CircularNav | Vinyl circle nav. `goToDirection`/`goToSection`/`isActive`. |
| UIMenu | UIkit modal. `onNavigate`/`setActive`. |
| ProjectOverlay | Fullscreen DOM dialog. Card click opens. |
| WorksPortfolio | Project metadata only (prev/next/goTo). No textures. |
| DevPanel | Tweakpane: Stats/Navigation/BakuCarousel/Render folders. |
| Section | No-op `update()`. State machine only. |
| Input | Mouse-only (scroll system removed). |
| NoiseText | Glitch reveal via `jlz:section-change`. `data-rot` for rotation. |

## Events

| Event | Emitted by | Consumed by |
| --- | --- | --- |
| `jlz:webgl-ready` | main-app (curtain mid-open) | entry-app (NoiseText + scrollspy) |
| `jlz:section-change` | Experience (section index change) | entry-app (NoiseText titles), ContentReveal |
