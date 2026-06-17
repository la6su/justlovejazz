# SPEC — Technical Specification

## Stack

| Layer | Tech |
|-------|------|
| Language | TypeScript (strict) |
| Build | Vite 8 (rolldown) |
| 3D | Three.js 18.4 + TSL |
| GPU | WebGPU primary, WebGL fallback |
| UI | UIkit 3 + Less |
| Scroll | Lenis (smooth) |

## Pages

| Page | File | data-page | Scenes | RouterPage |
|------|------|-----------|--------|------------|
| Home | index.html | home | drop, galaxy | Hero |
| Trinity | trinity.html | trinity | smoke, ball | Intro |
| Works | works.html | works | beams, neon | Portfolio |
| Contact | contact.html | contact | city, flow | Contact |

Page-specific behavior is allowed, but runtime state must stay deterministic across routes.

## Scenes (8 steps)

| Step | Name | Objects | Post Preset |
|------|------|---------|-------------|
| step01 | Smoke | 3 smoke planes + 200 stars | bloom:0.5, vignette:0.6 |
| step02 | Ball | metallic sphere + glass orbs | bloom:0.3, vignette:0.5 |
| step03 | Beams | 5 beam lines + particles | bloom:0.35, vignette:0.65 |
| step04 | City | core shapes + fields | bloom:0.15, vignette:0.4 |
| step05 | Neon | 4 neon columns + grid floor | bloom:0.4, vignette:0.55 |
| step06 | Flow | 20 flow field lines | bloom:0.2, vignette:0.5 |
| step07 | Droplets | 30 drop + reflections | bloom:0.15, vignette:0.35 |
| step08 | Galaxy | spiral dust + nebula planes | bloom:0.45, vignette:0.65 |

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

Required behavior:
- `webgpu`: primary path with full supported feature set for tier.
- `webgl`: supported fallback path with controlled feature downgrade.
- `unsupported`: explicit non-broken UX state (no silent blank canvas).

## Materials

| Material | Notes |
|----------|-------|
| **MeshStandardMaterial** | Must use `ensureUV()` on geometry with UVs |
| **MeshPhysicalMaterial** | Baku glass/wireframe mode |
| **ProjectMaterial** | Card hover/detail transitions (works only) |

## Performance Budget

| Metric | Target |
|--------|--------|
| Desktop FPS | 60 stable |
| Mobile FPS | ≥ 45 on mid-range |
| Critical startup bundle | keep below warning threshold or document justified threshold |
| Memory | No growth after repeated transitions |

## Motion Rules

- State-driven, delta-time aware
- No linear interpolation in visual layer
- Respects `prefers-reduced-motion`
- Mobile-reduced movement via quality tier
