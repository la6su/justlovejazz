# STATUS — Single Source of Truth

> Updated: 2026-06-26. Branch: `main`. Build green.

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
| Per-section post-processing presets (sec_intro..sec_contact) | ✅ fixed |
| NarrativePhase enum synced with PhaseConfig.id | ✅ fixed |
| Baku material swap — no per-frame GPU leak | ✅ fixed |
| dissolve transition uses StateBus (no rAF) | ✅ fixed |
| WorldAtmosphere — dead initBG/initFog removed | ✅ fixed |
| NoiseText — single canonical trigger path | ✅ fixed |
| BG — continuous cross-section color lerp (setProgress) | ✅ fixed |
| Input — framerate-independent scroll smoothing (half-life) | ✅ fixed |
| Camera — shake state reset on completion | ✅ fixed |
| SectionSceneFactory — distinctive geometry per section (junni patterns) | ✅ |
| Section.update — cached mesh list, no traverse per frame | ✅ |
| CursorLight — zero alloc per frame (subVectors/addScaledVector) | ✅ |
| Baku (hidden, user will refine) | ⏸️ |
| DrawTrail | ⏸️ disabled for perf |
| WebGLTextManager (Troika) | ⏸️ disabled (conflicts with NoiseText) |
| Bespoke 3D content per section | ⏳ needs human |
| Holographic UI Panels (T-050/051) | ⏳ not started |

## Renderer

Single WebGPURenderer (alpha:false). Auto-fallback to WebGL2.
- WebGPU: direct renderer.render() (no post-processing, perf)
- WebGL2: ShaderMaterial RT pipeline (bloom/grain/vignette/chromatic)
- Post-processing pipeline: RenderPipeline.ts (GLSL inline shaders)
- Per-section presets: PostProcessingManager.ts (keyed by PhaseConfig.id)

## Section layout

```
canvas.canvas (z-index:1, fixed) — 3D scene
#spa-content (z-index:2, transparent) — DOM sections
  section#section-intro      → 3D group 0  (PhaseConfig id: sec_intro)
  section#section-about      → 3D group 1  (PhaseConfig id: sec_about)
  section#section-flexible   → 3D group 2  (PhaseConfig id: sec_flexible)
  section#section-challenge  → 3D group 3  (PhaseConfig id: sec_challenge)
  section#section-innovative → 3D group 4  (PhaseConfig id: sec_innovative)
  section#section-contact    → 3D group 5  (PhaseConfig id: sec_contact)
```

## PhaseConfig ID ↔ NarrativePhase ↔ PostProcessingManager

These three must stay in sync at all times:

| WorldConfig id | NarrativePhase enum | PostProcessingManager key |
|----------------|---------------------|---------------------------|
| `sec_intro`    | `INTRO`             | `sec_intro`               |
| `sec_about`    | `ABOUT`             | `sec_about`               |
| `sec_flexible` | `FLEXIBLE`          | `sec_flexible`            |
| `sec_challenge`| `CHALLENGE`         | `sec_challenge`           |
| `sec_innovative`| `INNOVATIVE`       | `sec_innovative`          |
| `sec_contact`  | `CONTACT`           | `sec_contact`             |

## Fonts

**Single font: Inter** (Google Fonts, weights 300-900).
master-quantum-flares sets 'Source Sans 3' — overridden in main.less.

## NoiseText

Triggered ONLY by `jlz:section-change` event (from Experience.update when 3D
transitions to a new section) AND `jlz:webgl-ready` (after splash).
NOT IntersectionObserver, NOT setTimeout polls, NOT scroll listeners.
Duration: 1.2s. Intensity: 60% (visible glitch).

## Known env issues

Chrome WebGPU on Wayland+NVIDIA: slow (ANGLE-OpenGL fallback).
Workaround: access via LAN IP. See `docs/ENVIRONMENT.md`.
