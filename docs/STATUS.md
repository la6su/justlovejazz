# STATUS — Single Source of Truth

> Updated: 2026-06-22. Branch: `main` (test synced). Build green. Stack: Vite 8 + TS strict + three 0.184 + TSL + WebGPU/WebGL2 + UIkit 3 + Lenis + bun.

## Project

SPA studio portfolio (hash routing `#/`, `#/trinity`, `#/works`). 3 routes. Inspired by `junni-inc/next.junni.co.jp` (patterns only).

## Current state (2026-06-22 session)

3D rendering restored and performance-fixed. Works on both WebGPU and WebGL2 backends. See "Renderer architecture" below for the current single-path design.

| Item | Status |
|------|--------|
| 3D scene renders (WebGPU + WebGL2) | ✅ |
| Baku sphere (MeshStandardMaterial, was TSL) | ✅ |
| 6 junni-inspired scenes (built-in materials only) | ✅ |
| Works 3D slider (raycast, swipe, card-morph) | ✅ |
| SPA hash routing (3 routes) | ✅ |
| Per-section camera/post/light transitions | ✅ |
| Memory lifecycle (listeners cleaned up) | ✅ |
| Bun migration | ✅ |
| DrawTrail | ⏸️ disabled for perf (re-enable when budget allows) |
| WebGLTextManager (Troika overlay) | ⏸️ disabled for perf (DOM text instead) |
| Track 6 bespoke 3D content | ⏳ needs human |
| Real-device Lighthouse | ⏳ pending |

## Renderer architecture (current)

**Single WebGPURenderer** from `three/webgpu`. It auto-selects backend:
- `navigator.gpu` present → WebGPU (WGSL)
- else → WebGL2 (GLSL, transparent fallback)

No manual WebGLRenderer branch. TSL compiles to both targets.

### Render path per backend

| Backend | Render method | Post-processing |
|---------|---------------|-----------------|
| WebGPU | `renderer.render(scene, camera)` direct | none (ACES + sRGB via renderer) |
| WebGL2 | RenderPipeline ShaderMaterial RT pipeline | bloom + grain + vignette |

**Why WebGPU has no post-processing:** Chrome's WebGPU-over-ANGLE-OpenGL backend (NVIDIA/Wayland) is slow. TSL pipeline (pass→RT→screen) doubled GPU work. Direct render is 60 FPS; TSL pipeline was 5 FPS. Bloom/grain/vignette are WebGL2-only until Chrome ships native Vulkan WebGPU.

### Materials in scene (all built-in, no ShaderMaterial)

| Object | Material |
|--------|----------|
| Baku sphere | MeshStandardMaterial (color + emissive) |
| BG gradient | MeshBasicMaterial + vertexColors |
| Grid floor | GridHelper (LineBasicMaterial) |
| Particles | PointsMaterial |
| Glow ring | MeshBasicMaterial + AdditiveBlending |
| Cards | MeshBasicMaterial (texture) |

**No ShaderMaterial in scene objects** — it's incompatible with WebGPURenderer's NodeBuilder. DissolveOverlay (ShaderMaterial) is skipped on WebGPU via `DeviceCapability.mode` check.

## Bundle (actual, 2026-06-22)

```
chunk-core       644KB gzip 182KB  (three + TSL + RenderPipeline)
chunk-assets     626KB gzip 167KB
chunk-experience 251KB gzip 85KB
chunk-text       122KB gzip 45KB  (Troika, kept for re-enable)
```

## Works page flow

1. Swipe (velocity > 0.12) or arrows ←/→ → change project in UI overlay
2. Tap (raycast on card mesh) → navigate to clicked card → expandCard morph
3. At peak → ProjectDetail fullscreen modal
4. Esc / bg click / close → collapseCard back to carousel

## Scenes (junni-inspired)

| Step | Composition | Page |
|------|-------------|------|
| step01 | Gradient BG + grid floor | trinity |
| step02 | Gradient BG + glow particles | trinity |
| step03 | Gradient BG + glow ring | works |
| step04 | Gradient BG + slashes plane | works |
| step05 | Gradient BG + road grid | home |
| step06 | Gradient BG + glow particles | home |

## Known environment issues

### Chrome WebGPU on Wayland+NVIDIA

Chrome on Ubuntu/Sway/Wayland with NVIDIA often falls back to ANGLE-OpenGL
WebGPU (not native Vulkan). This is **slow** (3-5 FPS on RTX 4060 Ti).

**Workaround:** access via LAN IP (`http://192.168.x.x:5173/`) instead of
`localhost` — Chrome selects a different/faster adapter on remote origins.
Firefox WebGPU works at full speed on localhost.

Not a project bug — environment limitation. See `docs/ENVIRONMENT.md`.

## Recent commits (2026-06-22 session)

```
65e014f perf: disable DrawTrail + WebGLTextManager
b68eb92 perf: remove per-frame ShaderMaterial traverse
2bffc17 perf: WebGPU direct render — bypass TSL pipeline
3a8487a fix: dissolveOverlay GLSL dot() args
86fb90b perf: BakuTSLMaterial → MeshStandardMaterial
7a6c15d fix: restore 3D — built-in materials, getTextureNode, dissolve guard
```

## Next priorities

1. Track 6 bespoke content (3D assets, copy) — needs human
2. Real-device Lighthouse (perf ≥ 85, a11y ≥ 90)
3. Re-enable DrawTrail + WebGLTextManager when perf budget allows
4. More junni patterns (CursorLight, NoiseText)
