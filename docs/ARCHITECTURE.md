# ARCHITECTURE

## Stack

Vite 8 (rolldown) · TypeScript strict · three 0.184 + TSL · WebGPURenderer (WebGPU/WebGL2 auto-fallback) · UIkit 3 + Less · Lenis · troika-three-text (disabled) · Playwright · bun.

## Entry & Runtime

```
index.html → /src/entry-shell.ts → entry-app.ts (router init, splash, modal mount)
  → main-app.ts (bootstrap, dissolve transition)
  → core/Bootstrapper.ts → Experience.ts (render loop: setAnimationLoop)
  → src/styles/tokens.css (design tokens, consumed globally)
```

**Render loop:** `renderer.instance.setAnimationLoop(callback)` — required for WebGPU backend (rAF does not sync with WebGPU swap chain). On WebGL2 it falls back to rAF internally.

## Renderer (single WebGPURenderer)

```
WebGPURenderer (always)
  ├─ navigator.gpu present → WebGPU backend (WGSL)
  └─ else                  → WebGL2 backend (GLSL, transparent)
```

No manual WebGLRenderer. TSL compiles to both targets. `DeviceCapability.mode` is a capability hint (`webgpu` | `webgl2` | `unsupported`), not a renderer selector.

### Render path

| Backend | Method | Post |
|---------|--------|------|
| WebGPU | `renderer.render(scene, camera)` direct | none |
| WebGL2 | RenderPipeline ShaderMaterial RT pipeline | bloom + grain + vignette |

WebGPU has no post-processing because the TSL pipeline (pass→RT→QuadMesh) doubled GPU work on Chrome's ANGLE-OpenGL backend. Direct render is 60 FPS.

### Materials (built-in only)

**No ShaderMaterial in scene objects** — incompatible with WebGPURenderer's NodeBuilder. All scene materials are built-in:
- MeshStandardMaterial (Baku)
- MeshBasicMaterial + vertexColors (BG gradient)
- GridHelper / LineBasicMaterial (grid, road)
- PointsMaterial (particles)
- MeshBasicMaterial + AdditiveBlending (glow ring)

DissolveOverlay (ShaderMaterial) is skipped on WebGPU via `DeviceCapability.mode === 'webgpu'` check.

## Modules

| Module | Role |
|--------|------|
| Experience | Render loop (setAnimationLoop). Owns Sizes, Time, Camera, Renderer, World, StateBus, Portfolio, Overlay, ProjectDetail |
| Renderer | WebGPURenderer, DPR, alpha:false, ACES tonemap, sRGB. Pipeline creation in init() after backend ready |
| World | Section[] composition, Baku, Lights, Atmosphere, Ground. Scene groups with per-component animation |
| SectionSceneFactory | 6 scene compositions (built-in materials only, no ShaderMaterial) |
| WorksPortfolio | 3D card carousel. Raycast tap, swipe, arrow input. expandCard/collapseCard morph |
| RenderPipeline | WebGL2: ShaderMaterial RT pipeline (bloom/grain/vignette). WebGPU: direct render (no pipeline) |
| PostProcessingManager | Per-section presets, crossfade via lerp. WebGL2 only (WebGPU skips post) |
| CinematicLights | 5-light setup. setMood sets targets, update() lerps + volumetric orbits |

## Disabled modules (perf)

| Module | Why | Re-enable |
|--------|-----|-----------|
| DrawTrail | Per-frame 64-point geometry update | When perf budget allows |
| WebGLTextManager | Second WebGLRenderer (Troika) every frame | When perf budget allows; DOM text works |

## Routes (SPA hash)

| Route | data-page | Steps | Role |
|-------|-----------|-------|------|
| `#/` | home | step05, step06 | Studio positioning |
| `#/trinity` | trinity | step01, step02 | Process/method |
| `#/works` | works | step03, step04 | Interactive portfolio (pure slider) |

Works page hides Baku + ground + scene groups (pure slider).

## WorldConfig

6 scenes (step01–step06), each defines: camera, baku, post, fog, lights, camFovOffset/Duration/Smoothing, bloomRadius/Threshold.

## Works page flow

1. Swipe/arrows → change project in UI overlay
2. Tap (raycast) → navigate + expandCard morph
3. At peak → ProjectDetail modal
4. Esc/bg click → collapseCard

## Memory lifecycle

All window listeners have destroy()/dispose() with bound handler refs. `setAnimationLoop(null)` in Experience.destroy() stops the loop before dispose.

## A11y

prefers-reduced-motion, ARIA roles, focus management, skip-link, modal aria-modal.

## 3D↔UI sync

- `jlz:section-change` CustomEvent on section transition → ContentReveal highlights matching DOM element
- CinematicLights: setMood + update(dt) lerps per section
