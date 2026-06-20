# JUNNI_PORT_BLUEPRINT

Reference: `junni-inc/next.junni.co.jp` (public, Gulp + three 0.145, 2022). Port patterns, not assets.

## Junni → modern stack map

| junni | justlovejazz |
|-------|-------------|
| ORE.BaseLayer | Experience (single render loop) |
| ORE.PostProcessing | three/webgpu RenderPipeline + BloomNode |
| ore-three UniformsLib | TSL uniform() nodes |
| Section extends Object3D | src/core/Section.ts |
| CameraController | Camera.ts (per-section FOV + cursor spring + parallax) |
| Baku | Baku.ts (TSL iridescent material, hidden on works) |
| glsl-chunks/*.glsl | tsl-utils.ts (TSL functions) |
| Lethargy scroll | Lenis smooth scroll |
| GlobalManager singleton | Split singletons (AssetManager, GPUResourceManager, StateBus, DeviceCapability) |
| BG (inverted sphere shader) | ShaderMaterial BackSide gradient sphere |
| Ground (grid + noise) | GridHelper with transparent opacity |
| Section1 Crosses | Graphic plane-pair crosses with opacity flicker |
| Section5 TextRing | 24-dot rotating ring ellipse |
| CursorLight | ⏳ todo |
| DrawTrail | ⏳ todo |
| NoiseText | ⏳ todo |

## Track status

- ✅ Track 1-5 + B: WebGPU pipeline, Section, Camera, TSL lib, tokens, bloom
- ✅ Works 3D slider (raycast, card-morph, fullscreen detail)
- ✅ Junni-inspired scenes (BG sphere, grid, crosses, text ring)
- ⏳ Track 6: Bespoke content (needs human)

## Non-negotiable gates

- `bun run type-check` + `bun run build` green after every commit
- No new `any` outside adapter boundaries
- No tsconfig relaxation
- TSL API unclear → STOP, document, leave stub with TODO
