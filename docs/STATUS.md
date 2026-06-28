# STATUS — Single Source of Truth

> Updated: 2026-06-28. Branch: `main`. Build green (type-check + lint + build).

## Project

SPA studio portfolio — single scroll page with 6 sections (junni pattern).
3D canvas (fixed, z-index:1) + transparent DOM overlay (z-index:2).
Single font: Inter (300-900 weights).

## Current state

| Item                                                      | Status |
| --------------------------------------------------------- | ------ |
| 3D scene renders (WebGPU + WebGL2 fallback)               | ✅     |
| 6 sections with scroll-snap navigation                    | ✅     |
| NoiseText title animation (glitch reveal)                 | ✅     |
| Works 3D slider on cube faces + overlay                   | ✅     |
| Splash screen (CSS curtain split + seam glow)             | ✅     |
| SplashCube (Apple Fifth Avenue cube = baku)               | ✅     |
| DrawTrail (about/flexible sections)                       | ✅     |
| Per-section lighting + fog (junni changeSection)          | ✅     |
| Camera shake on section transition (reduced-motion gated) | ✅     |
| Portrait FOV adaptation                                   | ✅     |
| Per-section cursor follow strength                        | ✅     |
| Single Inter font throughout                              | ✅     |
| TypeScript `strict: true`                                 | ✅     |
| ESLint + Prettier configured                              | ✅     |
| Prerendered home sections (SEO)                           | ✅     |
| a11y (skip-link, dialog focus-trap, noscript)             | ✅     |
| SEO (og/twitter/JSON-LD/sitemap)                          | ✅     |
| Flexible section wireframe object                         | ✅     |

## Renderer

Single `WebGPURenderer` (alpha:false, ACES tonemap, sRGB). Auto-fallback to WebGL2.

- WebGPU: direct `renderer.render()` (no post-processing — perf)
- WebGL2: ShaderMaterial RT pipeline (bloom/grain/vignette), single ACES pass

Render loop pauses on hidden tabs (`visibilitychange` → `setAnimationLoop(null)`).

## Section layout

```
canvas.canvas (z-index:1, fixed) — 3D scene
#spa-content (z-index:2, transparent) — DOM sections (100vh each, scroll-snap)
  section#section-intro     → 3D group 0 (white BG, particles)
  section#section-about     → 3D group 1 (dark BG, particles, DrawTrail)
  section#section-flexible  → 3D group 2 (light BG, wireframe icosahedron, DrawTrail)
  section#section-challenge → 3D group 3 (dark BG, Works slider on cube)
  section#section-innovative→ 3D group 4 (dark BG, particles)
  section#section-contact   → 3D group 5 (dark BG, particles)
```

## AUDIT status — ALL RESOLVED ✅

A-001 through A-015 all fixed (see `docs/AUDIT.md`). The TODO table at the
bottom of AUDIT.md is stale — all items are done.

## Fonts

**Single font: Inter** (Google Fonts, weights 300-900).
master-quantum-flares sets 'Source Sans 3' — overridden in main.less.

## NoiseText

Glitch reveal: characters appear with random Y-offset + rotate + blur,
staggered left-to-right, settling into final position. Duration 1.2s.
Triggered by `jlz:webgl-ready` (initial) and `jlz:section-change` (scroll).
`finalize()` strips span inline-styles in place (no textContent swap → no
layout pop from letter-spacing trailing).

## Splash

CSS curtain split — two panels (`#jlj-splash`) part vertically to reveal
the 3D SplashCube beneath. Seam glow line fades on open. `role=status`

- `aria-live=polite` for SR. `jlz:webgl-ready` fires at curtain mid-open
  (400ms) so the title animates in parallel with the cube reveal.

## Performance

- Lazy `KTX2Loader` (dynamic import — no .ktx2 textures, transcoder not loaded)
- Particle counts scaled by `DeviceCapability.tier` (low 0.4× / medium 0.7×)
- `prefers-reduced-motion` freezes decorative 3D anims (baku, cursor light, draw trail, particles, volumetric orbit)
- `disposeMaterialDeep()` — disposes all material textures on section/page switch
- Resize debounced 150ms (avoids RT recreation spikes)

## Known env issues

Chrome WebGPU on Wayland+NVIDIA: slow (ANGLE-OpenGL fallback).
Workaround: access via LAN IP. See `docs/ENVIRONMENT.md`.
