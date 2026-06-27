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

Single font: Inter (300-900). Override master-quantum-flares in main.less:
```less
@global-font-family: 'Inter', sans-serif;
body { font-family: 'Inter', sans-serif !important; }
```

## NoiseText

Junni typewriter reveal algorithm. Characters appear left-to-right,
noise tail at frontier. Triggered by jlz:section-change event.

## Splash

Cinematic curtain split: gradient brand + shimmer + radial glow + film grain
+ vignette + scanlines + dramatic curtain split with overshoot.

## Scroll transitions

Per-section (from WorldConfig):
- Camera position/FOV (lerp via Camera.updateSmooth)
- BG color (continuous lerp via BG.setProgress)
- Fog color + density (set on section change)
- Lighting: key/fill/rim/volumetric/hemi (lerp via Lights.changeSection)
- Post-processing presets (bloom/vignette/grain per section)
- Camera shake on section transition (0.04 power, 0.4s)
- Portrait FOV boost (up to +20° on narrow portrait)
- Per-section cursor follow (works=0.22, others=0.15)
- DrawTrail visible on about(1) + flexible(2) only

## Modules

| Module | Role |
|--------|------|
| Experience | Render loop, section transitions, portfolio |
| Renderer | WebGPURenderer, direct render on WebGPU |
| World | Section[] + sceneGroups[], Baku, Lights, BG, Ground, DrawTrail |
| SectionSceneFactory | 6 scenes (particles only, minimal) |
| BG | Per-section background color (continuous lerp) |
| WorksPortfolio | 3D card carousel (pointer guard: check group.visible) |
| ProjectOverlay | DOM overlay (reuses #project-overlay) |
| NoiseText | Junni typewriter reveal (jlz:section-change trigger) |
| DrawTrail | Cursor trail (about/flexible only) |
| CinematicLights | 5-light setup, changeSection + lerp |

## Disabled (perf/compat)

| Module | Why |
|--------|-----|
| WebGLTextManager | Makes .studio-title transparent → breaks NoiseText |
| Baku | Hidden — user will refine visual |

## AUDIT — ALL RESOLVED ✅

A-001 through A-015 — all fixed. See docs/AUDIT.md for details.
