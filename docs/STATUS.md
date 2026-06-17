# STATUS — Single Source of Truth

> Last updated: 2026-06-17 (after PR #8 merge)
> Branch: `test` (default work branch; `main` is 3 commits behind, do not use)
> Build: `npm run type-check` + `npm run build` green
> Stack: Vite 8 + TypeScript strict + three 0.184 + TSL + WebGPU + UIkit 3 + Lenis

This file is the canonical status. Other docs may lag — if they conflict
with STATUS.md, STATUS.md is correct. Update STATUS.md on every merge.

## What this project is

A **single-page application** (not MPA) — studio-grade interactive 3D
portfolio inspired by `junni-inc/next.junni.co.jp` (public reference
repo, ported patterns only, no asset/content copying). One `index.html`,
hash-based routing via `src/router.ts`, DOM injection into `#spa-content`.

## Routes (3, not 4)

| Route | data-page | Role |
|-------|-----------|------|
| `#/` | `home` | Studio positioning + capabilities |
| `#/trinity` | `trinity` | Process / method |
| `#/works` | `works` | Interactive portfolio (sticky + 3D + detail modal) |

**Contact** is referenced in historical planning docs but NOT implemented.
`PageKey = 'home' | 'trinity' | 'works'` in `src/router.ts`.

## Recent merges (this session)

| PR | Squash SHA | Topic |
|----|------------|-------|
| #1 | c5736b4 | render-pipeline integrity (resize, dt, overlay, magic numbers) |
| #3 | 6754da2 | junni-parity foundation (blueprint, TSL lib, WebGPU pipeline, per-section camera, tokens) |
| #5 | 39303d0 | batch 2 (mip-chain BloomNode, TSL hardening, init order, splash/enter tokens) |
| #7 | 2c016cc | batch 3 (docs drift, resize listener leaks, splash ARIA, Camera reduced-motion) |
| #8 | bef4a10 | batch 4 (WebGPU chromatic parity, Input.ts leak) |

## Track status (vs JUNNI_PORT_BLUEPRINT)

| Track | Status | Notes |
|-------|--------|-------|
| 1 — WebGPU TSL post-processing | ✅ done | `three/webgpu` RenderPipeline + PassNode + BloomNode (mip-chain) |
| 1.2 — Mip-chain bloom | ✅ done | `three/addons/tsl/display/BloomNode` (5-level) |
| 2 — Section lifecycle | ✅ done | `src/core/Section.ts` (pre-existing, verified) |
| 3 — CameraController | ✅ done | per-section FOV/smoothing in WorldConfig; cursor-delay spring; reduced-motion |
| 4 — TSL shader library | ✅ done | tsl-utils.ts: easings, noise, blur, color, transform, composite, tonemap |
| 4.1 — TSL adapter hardening | ✅ done | broken sampleMipBlend removed; version-assumptions header added |
| 5 — Visual token system | ✅ done | tokens.css + tokens.less; splash/enter/overlay/nav/modal migrated |
| 5 tail — remaining inline styles | ✅ done | router/modal/gallery migrated; Cursor/WebGLText left (legit dynamic) |
| 6 — Bespoke content | ⏳ needs human | 3D assets, Baku model, copy, device tuning — not code-generatable |
| B — Per-section bloom tuning | ⏳ design decision | radius/threshold per section — needs visual review |
| Docs-drift (Low-5) | ✅ done | SPEC/ARCHITECTURE/README fixed (SPA reality, entry files) |

## Bundle (actual, 2026-06-17)

```
chunk-core         644 KB  gzip 184 KB  (three + TSL + BloomNode)
chunk-assets       625 KB  gzip 167 KB  (AssetManager)
chunk-experience   251 KB  gzip  85 KB
chunk-text         122 KB  gzip  45 KB  (troika-three-text)
entry-app           13 KB  gzip   4 KB
chunk-camera         5 KB  gzip   2 KB
chunk-shaders        1 KB  gzip   1 KB
```

No oversized warning. `chunk-core` is the largest but within Vite's
default 1000KB `chunkSizeWarningLimit`. Lazy-loading is already used
in `src/main-app.ts` (ErrorTracker, UIManager, Bootstrapper, DissolveOverlay
are dynamic imports).

## Memory lifecycle (current state)

All window listeners now have explicit cleanup:

| Module | Listener | Cleanup |
|--------|----------|---------|
| Sizes | resize | `destroy()` → removeEventListener |
| Renderer | resize | `dispose()` → removeEventListener + pipeline dispose |
| Camera | resize | `destroy()` → removeEventListener |
| Input | mousemove + resize | `destroy()` → removeEventListener + singleton clear |
| Cursor | mouseover/mouseout | `destroy()` → element.remove() (listeners die with element) |

`Experience.destroy()` calls all of these. On Vite HMR, no listener leaks.

## A11y baseline (current state)

- `prefers-reduced-motion`: respected in Camera (shake/cursor/FOV breath),
  SmoothScroll, GalleryManager, World, tokens.css (transitions disabled)
- Splash: `role=status` + `aria-live=polite` + `role=progressbar` + `aria-valuenow` sync
- Nav: `role=navigation` + `aria-label`
- Skip-link present in index.html
- EnterButton: hover + focus-visible states
- ProjectOverlay: aria-labels on prev/next buttons

## Renderer contract

```ts
type RendererMode = 'webgpu' | 'webgl' | 'unsupported'
type QualityTier = 'high' | 'medium' | 'low'
```

- **webgpu**: primary. Native `three/webgpu` RenderPipeline + TSL graph
  (bloom → chromatic → grain → vignette → ACES tonemap → renderOutput).
- **webgl**: fallback. Custom ShaderMaterial pipeline (bright-extract →
  gaussian blur ping-pong → composite with chromatic + grain + vignette).
- **unsupported**: explicit UX message, no blank canvas.

Both paths have **parity** for: bloom, chromatic aberration, grain, vignette.
WebGPU uses BloomNode (5-level mip-chain); WebGL uses 4-pass ping-pong.

## Next productive work (priority order)

1. **Track 6 bespoke content** (needs human): 3D assets for 6 step scenes,
   Baku central object model + per-section material variants, per-page
   copy (Home/Trinity/Works), motion tuning on real desktop + mobile.
2. **Track B per-section bloom tuning** (needs design review): each
   `RawScene` in WorldConfig could define `bloomRadius` + `bloomThreshold`
   instead of the current global 0.6 / config.bloomThreshold.
3. **Playwright E2E expansion**: route-level smoke, works open/close,
   keyboard nav in works listbox. Config exists (`playwright.config.ts`),
   tests in `tests/`.
4. **Lighthouse on real hardware**: targets perf ≥ 85, a11y ≥ 90. Config
   exists (`lighthouserc.json`), needs run on real devices.
5. **Input.ts listener on `scroll`** (not added — Lenis drives scroll, so
   raw scroll listener may be redundant; audit if needed).

## What is NOT in scope (do not attempt in code)

- React, Next.js, or any framework migration (project is framework-free TS)
- GLSL string shaders in materials (TSL-only per AGENTS.md)
- New runtime dependencies without explicit human approval
- tsconfig.json strictness relaxation
