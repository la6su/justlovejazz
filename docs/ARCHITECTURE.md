# ARCHITECTURE

## Stack

Vite 8 (rolldown) · TypeScript strict · three 0.184 + TSL · WebGPURenderer
(WebGPU/WebGL2 auto-fallback) · UIkit 3 + Less · Lenis · bun.

## Layout pattern (junni-inspired)

```
index.html
  ├─ #main-nav (sticky, z-index:10)
  ├─ #spa-content (z-index:2, transparent) — DOM sections
  │   └─ .section-studio
  │       ├─ section#section-intro     (100vh, transparent bg)
  │       ├─ section#section-about     (100vh, transparent bg)
  │       ├─ section#section-flexible  (100vh, transparent bg)
  │       ├─ section#section-challenge (100vh, transparent bg, Works slider)
  │       ├─ section#section-innovative(100vh, transparent bg)
  │       └─ section#section-contact   (100vh, transparent bg)
  ├─ canvas.canvas (z-index:1, fixed, pointer-events:none) — 3D scene
  └─ .jlz-section-progress (footer, z-index:100) — timeline dots
```

DOM sections are transparent overlays. 3D canvas (behind) provides the
background via `World.bg.color`. Text floats over the live 3D scene.

## Entry & Runtime

```
index.html → /src/entry-shell.ts → entry-app.ts (router init, splash)
  → main-app.ts (bootstrap, dissolve transition)
  → core/Bootstrapper.ts → Experience.ts (render loop: setAnimationLoop)
  → src/styles/tokens.css (design tokens)
```

**Render loop:** `renderer.instance.setAnimationLoop(callback)` — required
for WebGPU backend (rAF does not sync with WebGPU swap chain).

## Renderer (single WebGPURenderer)

```
WebGPURenderer (always, alpha:false)
  ├─ navigator.gpu present → WebGPU backend (WGSL)
  └─ else                  → WebGL2 backend (GLSL, transparent)
```

No manual WebGLRenderer. TSL compiles to both targets. `DeviceCapability.mode`
is a capability hint (`webgpu` | `webgl2` | `unsupported`), not a selector.

### Render path

| Backend | Method | Post |
|---------|--------|------|
| WebGPU | `renderer.render(scene, camera)` direct | none |
| WebGL2 | RenderPipeline ShaderMaterial RT pipeline | bloom + grain + vignette |

WebGPU direct render because TSL pipeline (pass→RT→QuadMesh) doubled GPU
work on Chrome's ANGLE-OpenGL backend.

### Materials (built-in only)

**No ShaderMaterial in scene objects** — incompatible with WebGPURenderer's
NodeBuilder. All scene materials are built-in (MeshStandard, MeshBasic,
Points, LineBasic, GridHelper).

DissolveOverlay (ShaderMaterial) is skipped on WebGPU via mode check.

## Modules

| Module | Role |
|--------|------|
| Experience | Render loop (setAnimationLoop). Owns Sizes, Time, Camera, Renderer, World, Portfolio, Overlay |
| Renderer | WebGPURenderer, alpha:false, ACES tonemap, sRGB. Direct render on WebGPU |
| World | Section[] + sceneGroups[] composition, Baku, Lights, BG, Ground |
| SectionSceneFactory | 6 scene compositions (built-in materials) |
| BG | Per-section background color (lerp transitions) |
| WorksPortfolio | 3D card carousel. Raycast tap, swipe, arrows |
| ProjectOverlay | DOM overlay for works slider (title/nav/description) |
| RenderPipeline | WebGL2: ShaderMaterial RT pipeline. WebGPU: direct render |
| PostProcessingManager | Per-section presets, WebGL2 only |
| CinematicLights | 5-light setup, setMood + lerp |
| SectionProgress | Footer timeline dots (clickable nav) |

## Disabled modules (perf)

| Module | Why | Re-enable |
|--------|-----|-----------|
| DrawTrail | Per-frame 64-point geometry update | When perf budget allows |
| WebGLTextManager | Second WebGLRenderer (Troika) | DOM text works instead |

## Routes (SPA scroll)

No hash routing. Pure anchor scroll:

| Anchor | Section | 3D group | Role |
|--------|---------|----------|------|
| `#section-intro` | intro | 0 | Hero — Baku on white |
| `#section-about` | about | 1 | About — blob on dark |
| `#section-flexible` | flexible | 2 | Flexible — metal drop |
| `#section-challenge` | challenge | 3 | Works — 3D slider |
| `#section-innovative` | innovative | 4 | Innovative — constellation |
| `#section-contact` | contact | 5 | Contact — Baku on dark |

## WorldConfig

6 scenes, each defines: camera, baku, post, fog, lights, camFovOffset,
bloomRadius/Threshold, `ui.showGallery` (true only for challenge/works).

## Scroll → 3D sync

1. Lenis scroll → `input.setScroll(scroll, limit)`
2. `input.getSmoothedScrollProgress()` → 0..1
3. `world.advance(progress)` → `updateTransform(progress)`
4. updateTransform: range-based fromIndex/toIndex + smoothstep t
5. sceneGroups visibility: from/to groups visible, fade multiplicatively
6. BG.color lerps to section color
7. Camera lerps between section transforms

## Memory lifecycle

- `setAnimationLoop(null)` in Experience.destroy() FIRST
- All window listeners have destroy()/dispose() with bound refs
- No HMR leaks

## A11y

prefers-reduced-motion, ARIA roles, focus management, skip-link, modal.

## 3D↔UI sync

- `jlz:section-change` CustomEvent → ContentReveal highlights DOM section
- `worldState.currentPhase` → Experience → ProjectOverlay visibility
- `showGallery` config → Portfolio.group.visible + Overlay.showContainer
