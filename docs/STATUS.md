# STATUS — Single Source of Truth

> Updated: 2026-06-24. Branch: `main` (test synced). Build green.

## Project

SPA studio portfolio — single scroll page with 6 sections (junni pattern).
3D canvas (fixed, z-index:1) + transparent DOM overlay (z-index:2).
Single font: Inter (300-900 weights).

## Current state

| Item | Status |
|------|--------|
| 3D scene renders (WebGPU + WebGL2) | ✅ |
| 6 sections with scroll navigation | ✅ |
| NoiseText title animation (jlz:section-change) | ✅ |
| Works 3D slider + overlay | ✅ |
| Splash screen (curtain split + grain + glow) | ✅ |
| Single Inter font throughout | ✅ |
| Baku (hidden, user will refine) | ⏸️ |
| DrawTrail | ⏸️ disabled for perf |
| WebGLTextManager (Troika) | ⏸️ disabled for perf |
| Bespoke 3D content | ⏳ needs human |

## Renderer

Single WebGPURenderer (alpha:false). Auto-fallback to WebGL2.
- WebGPU: direct renderer.render() (no post-processing, perf)
- WebGL2: ShaderMaterial RT pipeline (bloom/grain/vignette)

## Section layout

```
canvas.canvas (z-index:1, fixed) — 3D scene
#spa-content (z-index:2, transparent) — DOM sections
  section#section-intro     → 3D group 0
  section#section-about     → 3D group 1
  section#section-flexible  → 3D group 2
  section#section-challenge → 3D group 3 (Works slider)
  section#section-innovative→ 3D group 4
  section#section-contact   → 3D group 5
```

## Fonts

**Single font: Inter** (Google Fonts, weights 300-900).
master-quantum-flares sets 'Source Sans 3' — overridden in main.less.

## NoiseText

Triggered by `jlz:section-change` event (from Experience.update when 3D
transitions to a new section). NOT IntersectionObserver (fires too early).
Duration: 1.5s. Intensity: 60% (visible glitch).

## Known env issues

Chrome WebGPU on Wayland+NVIDIA: slow (ANGLE-OpenGL fallback).
Workaround: access via LAN IP. See `docs/ENVIRONMENT.md`.
