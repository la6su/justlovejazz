# SPEC — Technical Specification

## Stack

| Layer | Stack |
|-------|-------|
| Language | TypeScript (strict) |
| Build | Vite 8 (rolldown backend) |
| 3D | Three.js 18.4 + TSL (Node Materials) |
| GPU | WebGPU primary, WebGL/unsupported fallback |
| UI | UIkit 3 + Less |
| Scroll | Lenis (smooth) |

## Route Contract (MPA)

Pages:

- `index.html` (`data-page="home"`)
- `trinity.html` (`data-page="trinity"`)
- `works.html` (`data-page="works"`)

Rules:

- All pages use the same structural template (loader/nav/sections/modal scaffold).
- Page content is route-specific and non-duplicative in intent.
- Interactive works UI (`ProjectGallery`) must initialize only on `data-page="works"`.
- 3D runtime (`data-app-mode="full"`) remains enabled on all studio routes.

## Renderer Contract

```ts
type RendererMode = 'webgpu' | 'webgl' | 'unsupported'
type QualityTier = 'high' | 'medium' | 'low'

interface RendererCapabilities {
  mode: RendererMode
  tier: QualityTier
  maxDpr: number
  postProcessing: boolean
  floatRenderTargets: boolean
}
```

Rules: single canvas, controlled DPR, explicit async init, post-processing by capability, resize without leak.

## TSL Rules

- Method chaining only: `.add()`, `.mul()`, `.sub()`
- Utils in `src/shaders/tsl-utils.ts`
- No GLSL strings mixed with TSL in same material
- Every expensive node has a quality tier switch
- `time`, `uv`, `uniform` via helpers when reused

## Shader Modules

```
src/shaders/
├── background.tsl.ts
├── env-effects.tsl.ts
├── noise.tsl.ts
├── postprocessing.tsl.ts
├── project-dive.tsl.ts
├── ProjectMaterial.ts
└── tsl-utils.ts
```

## Materials

| Material | States |
|----------|--------|
| **ProjectMaterial** | base texture, detail texture, transition progress, hover/active, fullscreen sampling, reduced quality |
| **BakuMaterial** | `normal`, `glass`, `wireframe`, `dark`, `project_focus` |

Material states come from `WorldConfig`, not random mesh logic.

## Noise

- Low-frequency noise for organic motion
- High-frequency grain only in final composite
- 4D noise for looping/time-based motion when needed
- Never use noise as a composition substitute

## Asset Manifest

```ts
interface AssetManifestItem {
  id: string
  url: string
  type: 'texture' | 'ktx2' | 'gltf' | 'env' | 'image'
  priority: 'pre' | 'must' | 'sub'
  context: string
  fallback?: string
}
```

Rules:
- UI/images: AVIF/WebP
- GPU textures: KTX2/Basis (Bicubic where supported)
- HDR/env: lazy where possible
- Disposal only by inactive context

## Performance Budget

| Metric | Target |
|--------|--------|
| Desktop FPS | 60 stable |
| Mobile FPS | ≥ 45 on mid-range |
| Critical textures | ≤ 2 MB optimized |
| Long tasks | None > 100 ms steady-state |
| Memory | No growth after repeated transitions |

## Quality Tiers

| Tier | Bloom | DPR | Post-processing |
|------|-------|-----|-----------------|
| **high** | mip pyramid | uncapped | full (AA, chromatic, grain, vignette) |
| **medium** | reduced samples | capped | simplified chromatic |
| **low** | disabled | capped | none |

## Motion Rules

- State-driven, delta-time aware
- No linear interpolation in visual layer
- Respects `prefers-reduced-motion`
- Mobile-reduced movement enabled by quality tier

## Definition of Done

- `npm run build` passes
- `--noUnusedLocals` not disabled to hide errors
- Renderer mode + quality tier logged on init
- All sections reachable (scroll/touch/keyboard) on each route
- Gallery → detail → back: no visual jumps
- Works interactions isolated to `/works.html` (no cross-route UI leakage)
- WebGPU path stable
- Fallback behavior defined and tested
- No TODO masking production blockers
