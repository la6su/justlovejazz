# STATUS — Single Source of Truth

> Updated: 2026-06-20. Branch: `test` (main synced through PR #34). Build green. Stack: Vite 8 + TS strict + three 0.184 + TSL + WebGPU + UIkit 3 + Lenis + bun.

## Project

SPA studio portfolio (hash routing `#/`, `#/trinity`, `#/works`). 3 routes (Contact not implemented). Inspired by `junni-inc/next.junni.co.jp` (patterns only).

## Track status

| Track | Status |
|-------|--------|
| 1 — WebGPU TSL pipeline (BloomNode mip-chain + chromatic + grain + vignette) | ✅ |
| 2 — Section lifecycle (`src/core/Section.ts`) | ✅ |
| 3 — Camera (per-section FOV/smoothing, reduced-motion, scroll parallax) | ✅ |
| 4 — TSL shader library + adapter hardening | ✅ |
| 5 — Design tokens (tokens.css + tokens.less) | ✅ |
| B — Per-section bloom radius/threshold | ✅ |
| Baku TSL iridescent material | ✅ |
| Works 3D slider (raycast tap, swipe, arrows, card-morph transition) | ✅ |
| Works page = pure slider (Baku/ground/scenes hidden) | ✅ |
| Junni-inspired scenes (BG sphere, grid, crosses, text ring) | ✅ |
| Smooth light transitions (lerp, volumetric orbit) | ✅ |
| 3D→DOM section sync (jlz:section-change event) | ✅ |
| Memory lifecycle (all listeners clean up) | ✅ |
| A11y (ARIA, reduced-motion, focus, modal) | ✅ |
| E2E tests (SPA hash routes) | ✅ |
| Bun migration (bun.lock, bunx) | ✅ |
| 6 — Bespoke 3D content | ⏳ needs human |

## Bundle (actual)

```
chunk-core  644KB gzip 184KB  (three + TSL + BloomNode)
chunk-assets 625KB gzip 167KB
chunk-experience 251KB gzip 85KB
chunk-text  122KB gzip 45KB
```
No oversized warning. Card textures lazy-load (on demand + neighbors).

## Renderer

- **webgpu**: native RenderPipeline + PassNode + BloomNode + TSL nodes. ACES via renderer.toneMapping.
- **webgl**: custom ShaderMaterial pipeline. Parity with WebGPU.
- **unsupported**: explicit UX message.

## Works page flow

1. Swipe (velocity > 0.12) or arrows ←/→ → change project in UI overlay
2. Tap (raycast on card mesh) → navigate to clicked card → expandCard morph to fullscreen
3. At peak → ProjectDetail fullscreen modal (texture background + blur scrim)
4. Esc / bg click / close button → collapseCard back to carousel

## Scenes (junni-inspired)

| Step | Composition | Page |
|------|-------------|------|
| step01 | Inverted gradient BG sphere + grid floor + 4 graphic crosses | trinity |
| step02 | 24-dot rotating text ring + grid + center glow | trinity |
| step03 | Empty (cards = scene) | works |
| step04 | Empty (cards = scene) | works |
| step05 | BG sphere + 7 light strips + grid floor | home |
| step06 | BG sphere + chrome sphere + grid floor | home |

## Recent PRs (session)

#1-#10 foundation · #11-#18 Baku + bloom · #19-#29 works transitions · #30 runtime fixes · #31 cleanup · #32 UI/3D sync · #33 bun · #34 test→main · #35 lazy-load/parallax · #36 production slider UI · #37 art-directed scenes · #38 raycast + hide Baku · #39 clean works + scenes · #40 junni-inspired compositions

## Next priorities

1. Track 6 bespoke content (3D assets, copy) — needs human
2. Real-device Lighthouse (perf ≥ 85, a11y ≥ 90)
3. Playwright browser run
4. More junni patterns (CursorLight, DrawTrail, NoiseText)
