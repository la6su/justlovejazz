# STATUS — Single Source of Truth

> Updated: 2026-06-24. Branch: `main` (test synced). Build green. Stack: Vite 8 + TS strict + three 0.184 + TSL + WebGPU/WebGL2 + UIkit 3 + Lenis + bun.

## Project

SPA studio portfolio — single scroll page with 6 sections (junni pattern).
3D canvas (fixed, z-index:1) + transparent DOM overlay (z-index:2).
No hash routing — pure anchor scroll navigation.

Inspired by `junni-inc/next.junni.co.jp` (patterns only, no assets/content).

## Current state (2026-06-24)

| Item | Status |
|------|--------|
| 3D scene renders (WebGPU + WebGL2) | ✅ |
| Baku sphere (central character, MeshStandardMaterial) | ✅ |
| 6 junni-inspired scenes (built-in materials) | ✅ |
| Works 3D slider + overlay (title/nav/description) | ✅ |
| SPA scroll navigation (6 sections, anchor links) | ✅ |
| Section↔3D sync (scroll → scene group visibility) | ✅ |
| Footer timeline dots (clickable nav) | ✅ |
| Memory lifecycle (listeners cleaned up) | ✅ |
| Bun migration | ✅ |
| tsl-utils.ts (restored for future TSL work) | ✅ |
| DrawTrail | ⏸️ disabled for perf |
| WebGLTextManager (Troika) | ⏸️ disabled for perf |
| Track 6 bespoke 3D content | ⏳ needs human |
| Real-device Lighthouse | ⏳ pending |

## Section layout (junni pattern)

```
┌─ canvas.canvas (z-index:1, fixed, pointer-events:none) ─ 3D scene
├─ #spa-content (z-index:2, relative, transparent) ─────── DOM overlay
│  ├─ section#section-intro    (data-section="intro")     ← 3D group 0
│  ├─ section#section-about    (data-section="about")     ← 3D group 1
│  ├─ section#section-flexible (data-section="flexible")  ← 3D group 2
│  ├─ section#section-challenge(data-section="challenge") ← 3D group 3 (Works slider)
│  ├─ section#section-innovative(data-section="innovative")← 3D group 4
│  └─ section#section-contact  (data-section="contact")   ← 3D group 5
└─ .jlz-section-progress (footer timeline dots)
```

Each section is 100vh, transparent background. 3D canvas provides the
background via `World.bg.color` (per-section color from BG.ts).

## Renderer architecture

**Single WebGPURenderer** from `three/webgpu`. Auto-selects backend:
- `navigator.gpu` present → WebGPU (WGSL)
- else → WebGL2 (GLSL, transparent fallback)

| Backend | Render | Post-processing |
|---------|--------|-----------------|
| WebGPU | `renderer.render()` direct | none (ACES via renderer.toneMapping) |
| WebGL2 | ShaderMaterial RT pipeline | bloom + grain + vignette |

**Why WebGPU has no post-processing:** Chrome's WebGPU-over-ANGLE-OpenGL
backend is slow. TSL pipeline (pass→RT→screen) doubled GPU work. Direct
render is 60 FPS; TSL pipeline was 5 FPS.

### Materials (all built-in, no ShaderMaterial in scene)

| Object | Material |
|--------|----------|
| Baku sphere | MeshStandardMaterial (color + emissive) |
| Metal drop | MeshStandardMaterial (metalness:1, roughness:0.08) |
| Blob | MeshStandardMaterial |
| BG gradient | scene.background = BG.color (per-section Color) |
| Grid floor | GridHelper (LineBasicMaterial) |
| Particles | PointsMaterial |
| Constellation | PointsMaterial + LineBasicMaterial |
| Glow ring | MeshBasicMaterial + AdditiveBlending |

**No ShaderMaterial in scene objects** — incompatible with WebGPURenderer's
NodeBuilder. DissolveOverlay (ShaderMaterial) is skipped on WebGPU.

## Works slider flow

1. Scroll to #section-challenge → `showGallery=true` from WorldConfig
2. Portfolio.group.visible = true (3D cards appear)
3. ProjectOverlay.showContainer() (DOM overlay fades in)
4. Swipe/arrows → change project (overlay + 3D cards sync)
5. Tap card → expandCard morph → ProjectDetail modal
6. Esc/bg click → collapseCard back to carousel

**Section ID:** `section-challenge` (not "section-works" — historical naming).
ProjectOverlay mounts into `#project-overlay` div (from templates.ts).

## Bundle (actual)

```
chunk-core       625KB gzip 178KB  (three + RenderPipeline)
chunk-assets     626KB gzip 167KB
chunk-experience 286KB gzip 96KB
```

## Known environment issues

### Chrome WebGPU on Wayland+NVIDIA

Chrome on Ubuntu/Sway/Wayland with NVIDIA often falls back to ANGLE-OpenGL
WebGPU (not native Vulkan). Slow (3-5 FPS on RTX 4060 Ti at localhost).

**Workaround:** access via LAN IP (`http://192.168.x.x:5173/`) — Chrome
selects a faster adapter on remote origins. Firefox WebGPU works at full
speed on localhost. See `docs/ENVIRONMENT.md`.

## Recent commits (2026-06-24 session)

```
8d887a1 fix: restore 3D layer — Baku, transparent sections, non-destructive fade
5eee827 fix: restore junni-pattern 1:1 sections — remove lessons, fix nav, fix CSS
2bffc17 perf: WebGPU direct render — bypass TSL pipeline
65e014f perf: disable DrawTrail + WebGLTextManager
```

## Next priorities

1. Track 6 bespoke content (3D assets, copy) — needs human
2. Polish 3D visuals (junni-inspired: Grid, TextRing, Wire patterns)
3. Real-device Lighthouse (perf ≥ 85, a11y ≥ 90)
4. Re-enable DrawTrail + WebGLTextManager when perf budget allows
