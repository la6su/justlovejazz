# ARCHITECTURE

## Stack

Vite 8 (rolldown) · TypeScript · three 0.184 + TSL · WebGPURenderer
(WebGPU/WebGL2 auto-fallback) · UIkit 3 + Less (master-quantum-flares theme)
· Lenis · bun. Single font: Inter.

## Layout

```
canvas.canvas (z-index:1, fixed, pointer-events:none) — 3D scene
#spa-content (z-index:2, transparent) — DOM sections (100vh each)
  section#section-intro → 3D group 0
  section#section-about → 3D group 1
  section#section-flexible → 3D group 2
  section#section-challenge → 3D group 3 (Works slider)
  section#section-innovative → 3D group 4
  section#section-contact → 3D group 5
.jlz-section-progress (footer, z-index:100) — timeline dots
```

## Entry & Runtime

```
index.html → entry-shell.ts → entry-app.ts → main-app.ts → Bootstrapper → Experience.ts
Render loop: renderer.instance.setAnimationLoop(callback)
```

## Renderer

Single WebGPURenderer (alpha:false, ACES tonemap, sRGB).
- WebGPU: direct renderer.render() (no post-processing)
- WebGL2: ShaderMaterial RT pipeline (bloom/grain/vignette)
- All scene materials: built-in (no ShaderMaterial, no TSL NodeMaterial)

## Fonts

Single font: Inter (300-900). master-quantum-flares sets 'Source Sans 3' —
overridden in main.less AFTER the theme import:
```less
@global-font-family: 'Inter', sans-serif;
@global-primary-font-family: 'Inter', sans-serif;
body { font-family: 'Inter', sans-serif !important; }
```

## NoiseText

Triggered by `jlz:section-change` event (NOT IntersectionObserver).
Experience.update() dispatches this when 3D scene transitions to a new section.
Each .studio-title animates with character-level glitch (60% intensity, 1.5s).

## Modules

| Module | Role |
|--------|------|
| Experience | Render loop (setAnimationLoop). Owns World, Renderer, Portfolio, Overlay |
| Renderer | WebGPURenderer, alpha:false, direct render on WebGPU |
| World | Section[] + sceneGroups[], Baku, Lights, BG, Ground |
| SectionSceneFactory | 6 scenes (particles only, minimal) |
| BG | Per-section background color (lerp transitions) |
| WorksPortfolio | 3D card carousel (pointer guard: check group.visible) |
| ProjectOverlay | DOM overlay (reuses #project-overlay from templates) |
| NoiseText | Character glitch animation (jlz:section-change trigger) |

## Disabled (perf)

| Module | Why |
|--------|-----|
| DrawTrail | Per-frame geometry update |
| WebGLTextManager | Second WebGLRenderer (Troika) |
| Baku | Hidden — user will refine visual |

## Scroll → 3D sync

1. Lenis scroll → input.setScroll()
2. input.getSmoothedScrollProgress() → 0..1
3. world.advance(progress) → updateTransform(progress)
4. sceneGroups visibility: from/to groups visible, fade multiplicatively
5. BG.color lerps to section color
6. jlz:section-change dispatched on section transition → NoiseText fires
