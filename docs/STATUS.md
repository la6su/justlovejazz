# STATUS — Single Source of Truth

> Updated: 2026-06-27. Branch: `main` (dev + test synced). Build green.

## Project

SPA studio portfolio — single scroll page with 6 sections (junni pattern).
3D canvas (fixed, z-index:1) + transparent DOM overlay (z-index:2).
Single font: Inter (300-900 weights).

## Current state

| Item | Status |
|------|--------|
| 3D scene renders (WebGPU + WebGL2) | ✅ |
| 6 sections with scroll navigation | ✅ |
| NoiseText title animation (junni typewriter reveal) | ✅ |
| Works 3D slider + overlay | ✅ |
| Splash screen (curtain split + grain + glow + vignette + scanlines) | ✅ |
| DrawTrail (about/flexible sections) | ✅ |
| DrawTrail per-section visibility gating | ✅ |
| Per-section lighting + fog (junni changeSection pattern) | ✅ |
| Camera shake on section transition | ✅ |
| Portrait FOV adaptation | ✅ |
| Per-section cursor follow strength | ✅ |
| Single Inter font throughout | ✅ |
| Baku (hidden, user will refine) | ⏸️ |
| WebGLTextManager (disabled — conflicts with NoiseText) | ⏸️ |
| Bespoke 3D content | ⏳ needs human |

## Renderer

Single WebGPURenderer (alpha:false). Auto-fallback to WebGL2.
- WebGPU: direct renderer.render() (no post-processing, perf)
- WebGL2: ShaderMaterial RT pipeline (bloom/grain/vignette)

## Section layout

```
canvas.canvas (z-index:1, fixed) — 3D scene
#spa-content (z-index:2, transparent) — DOM sections
  section#section-intro     → 3D group 0 (light BG, particles)
  section#section-about     → 3D group 1 (dark BG, particles, DrawTrail)
  section#section-flexible  → 3D group 2 (light BG, particles, DrawTrail)
  section#section-challenge → 3D group 3 (Works slider)
  section#section-innovative→ 3D group 4 (dark BG, particles)
  section#section-contact   → 3D group 5 (dark BG, particles)
```

## AUDIT status — ALL RESOLVED

| ID | Description | Status |
|----|-------------|--------|
| A-001 | World.resize() implementation | ✅ |
| A-002 | Portrait FOV adaptation | ✅ |
| A-003 | Section.switchState() bug fix | ✅ |
| A-004 | World.resize() wired to Experience | ✅ |
| A-005 | Baku role caching | ✅ |
| A-006 | Double traverse optimization | ✅ |
| A-007 | DrawTrail per-section re-enable | ✅ |
| A-008 | Section.setMeshOpacity cache | ✅ |
| A-009 | Baku worldState→material | ✅ |
| A-010 | Lenis defensive clamp | ✅ |
| A-011–A-014 | Resolved (HERMES_RULES constraints) | ✅ |
| A-015 | Per-section cursor follow | ✅ |

## Fonts

**Single font: Inter** (Google Fonts, weights 300-900).
master-quantum-flares sets 'Source Sans 3' — overridden in main.less.

## NoiseText

Junni typewriter reveal algorithm. Characters appear left-to-right,
noise tail (1-3 random chars) at reveal frontier. Duration 1.2s.
Triggered by jlz:section-change event (every section index change).

## Splash

Cinematic curtain split system:
- Gradient brand text (shimmer animation)
- Radial glow behind brand
- Film grain overlay (SVG noise, animated shift)
- Vignette (dark edges for depth)
- Scan lines (retro CRT, very subtle)
- Curtain split with overshoot (more dramatic)
- Progress bar + state label
- Enter button (neon glow)

## Known env issues

Chrome WebGPU on Wayland+NVIDIA: slow (ANGLE-OpenGL fallback).
Workaround: access via LAN IP. See `docs/ENVIRONMENT.md`.
