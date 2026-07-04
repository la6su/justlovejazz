# ARCHITECTURE

## Stack

Vite 8 (rolldown) · TypeScript (`strict: true`) · three 0.184 + TSL ·
`WebGPURenderer` (WebGPU/WebGL2 auto-fallback) · UIkit 3 + Less
(master-quantum-flares theme) · Lenis · bun · ESLint + Prettier.
Single font: Inter.

## Layout

```
canvas.canvas (z-index:1, fixed, pointer-events:none) — 3D scene
#spa-content (z-index:2, transparent) — DOM sections (100vh, scroll-snap)
  section#section-intro → 3D group 0
  section#section-about → 3D group 1
  section#section-flexible → 3D group 2 (wireframe icosahedron)
  section#section-challenge → 3D group 3 (Works slider on cube)
  section#section-innovative → 3D group 4
  section#section-contact → 3D group 5
.jlz-section-progress (footer, z-index:100) — timeline dots
```

## Entry & Runtime

```
index.html (prerendered sections) → entry-shell.ts → entry-app.ts → main-app.ts → Bootstrapper → Experience.ts
Render loop: renderer.instance.setAnimationLoop(callback)
  (pauses on hidden tab via visibilitychange)
```

## Renderer

Single `WebGPURenderer` (alpha:false, ACES tonemap, sRGB).

- WebGPU: direct `renderer.render()` (no post-processing)
- WebGL2: ShaderMaterial RT pipeline — single ACES pass in composite shader,
  rtScene is linear (no double tone-map / sRGB encode)
- All scene materials: built-in or TSL NodeMaterial (native WebGPU path)
- Raw ShaderMaterial banned in scene (WebGPURenderer incompatible); allowed in post-processing (WebGL2 only)
- Post-processing: refraction + color grade (composite shader, WebGL2 path)

## Chunking (Vite 8 / rolldown `codeSplitting`)

```
vendor-three  (preloaded — three.js needed at boot)
vendor-ui     (uikit + lenis)
KTX2Loader    (lazy — dynamic import, not preloaded)
chunk-*       (app code, split by src path)
```

## Fonts

Single font: Inter (300-900). Override master-quantum-flares in main.less.

## NoiseText

Glitch reveal (staggered chars, blur+rotate → settle). Triggered by
`jlz:webgl-ready` + `jlz:section-change`. `finalize()` strips span styles
in place (no layout pop).

## Splash

CSS curtain split (two panels part vertically) + seam glow line.
`role=status` + `aria-live=polite`. `jlz:webgl-ready` fires at curtain
mid-open (400ms).

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
- DrawTrail visible on about(1) + flexible(2) only

CSS `scroll-snap-type: y mandatory` + `scroll-snap-align: start` for
junni-style full-screen section locking.

## Modules

| Module              | Role                                                                        |
| ------------------- | --------------------------------------------------------------------------- |
| Experience          | Render loop, section transitions, portfolio, visibilitychange               |
| Renderer            | WebGPURenderer, direct render on WebGPU                                     |
| World               | Section[] + sceneGroups[], SplashCube (baku), Lights, BG, Ground, DrawTrail |
| SectionSceneFactory | 6 scenes (particles, flexible wireframe)                                    |
| BG                  | Per-section background color (reads from WorldConfig — single source)       |
| WorksPortfolio      | Cube-face slider (spring physics, pointer guard)                            |
| ProjectOverlay      | DOM dialog (role=dialog, focus-trap, ESC close)                             |
| NoiseText           | Glitch reveal (jlz:webgl-ready + jlz:section-change)                        |
| DrawTrail           | Cursor trail (about/flexible only)                                          |
| CinematicLights     | 5-light setup, changeSection + lerp                                         |
| disposeMaterialDeep | Disposes all material textures (prevents VRAM leak)                         |
| AssetManager        | Lazy KTX2Loader (dynamic import)                                            |

## Removed (cleanup)

| Module           | Why                                                                                             |
| ---------------- | ----------------------------------------------------------------------------------------------- |
| WebGLTextManager | Troika conflicted with NoiseText (made titles transparent). Deleted with troika-three-text dep. |
| Baku.ts          | Replaced by SplashCube (cube IS the baku).                                                      |

## AUDIT — ALL RESOLVED ✅

A-001 through A-015 — all fixed. See `docs/AUDIT.md`.
