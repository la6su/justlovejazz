# STATUS — Single Source of Truth

> Updated: 2026-06-18. Branch: `test`. Build green. Stack: Vite 8 + TS strict + three 0.184 + TSL + WebGPU + UIkit 3 + Lenis.

## Project

SPA studio portfolio (hash routing `#/`, `#/trinity`, `#/works`). 3 routes (Contact not implemented). Inspired by `junni-inc/next.junni.co.jp` (patterns only).

## Track status

| Track | Status |
|-------|--------|
| 1 — WebGPU TSL pipeline (BloomNode mip-chain + chromatic + grain + vignette) | ✅ |
| 2 — Section lifecycle (`src/core/Section.ts`) | ✅ |
| 3 — Camera (per-section FOV/smoothing, reduced-motion) | ✅ |
| 4 — TSL shader library + adapter hardening | ✅ |
| 5 — Design tokens (tokens.css + tokens.less) | ✅ |
| B — Per-section bloom radius/threshold | ✅ |
| Works card-morph transition (tap → expand → detail) | ✅ |
| Baku TSL iridescent material | ✅ |
| Memory lifecycle (all listeners clean up) | ✅ |
| A11y (ARIA, reduced-motion, focus) | ✅ |
| E2E tests (SPA hash routes) | ✅ |
| 6 — Bespoke 3D content | ⏳ needs human |

## Bundle (actual)

```
chunk-core  644KB gzip 184KB  (three + TSL + BloomNode)
chunk-assets 625KB gzip 167KB
chunk-experience 251KB gzip 85KB
chunk-text  122KB gzip 45KB
```
No oversized warning. Lazy imports in main-app.ts.

## Renderer

- **webgpu**: native RenderPipeline + PassNode + BloomNode + TSL nodes. ACES via renderer.toneMapping (not manual — double-tonemap was white-screen bug, fixed PR #16).
- **webgl**: custom ShaderMaterial pipeline (bright-extract → blur → composite). Parity with WebGPU.
- **unsupported**: explicit UX message.

## Recent PRs (session)

#1 render-pipeline integrity · #3 junni-parity foundation · #5 mip-chain bloom · #7 docs+leaks+a11y · #8 chromatic parity · #9 docs sync · #10 E2E+PerfMonitor · #11 Baku TSL · #13 white-bg fix · #14 Baku restore · #15 overlay guard · #16 double-tonemap · #17 per-section bloom · #18 Baku rework+dark bg · #19 slider race · #20 dissolve · #21 tap→detail · #22 sticky · #23 texture+aria · #24 card-morph · #26 expand guard · #27 tap-only+camera · #28 swipe+modal · #29 swipe+tap+fullscreen detail

## Next priorities

1. Track 6 bespoke content (3D assets, Baku model, copy) — needs human
2. Real-device Lighthouse (perf ≥ 85, a11y ≥ 90)
3. Playwright browser run (tests structurally correct, need browser install)
