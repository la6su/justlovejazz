# JUNNI_PORT_BLUEPRINT

Reference: `junni-inc/next.junni.co.jp` (public, Gulp + three 0.145, 2022). Port patterns, not assets.

## Junni → modern stack map

| junni | justlovejazz |
|-------|-------------|
| ORE.BaseLayer | Experience (single render loop) |
| ORE.PostProcessing | three/webgpu RenderPipeline + BloomNode |
| ore-three UniformsLib | TSL uniform() nodes |
| Section extends Object3D | src/core/Section.ts |
| CameraController | Camera.ts (per-section FOV + cursor spring) |
| Baku | Baku.ts (TSL iridescent material on WebGPU) |
| glsl-chunks/*.glsl | tsl-utils.ts (TSL functions) |
| Lethargy scroll | Lenis smooth scroll |
| GlobalManager singleton | Split singletons (AssetManager, GPUResourceManager, StateBus, DeviceCapability) |

## Track status (all done unless noted)

- ✅ Track 1: WebGPU TSL pipeline (BloomNode + chromatic + grain + vignette)
- ✅ Track 2: Section lifecycle
- ✅ Track 3: CameraController (per-section FOV/smoothing)
- ✅ Track 4: TSL shader library (easings, noise, blur, color, transform)
- ✅ Track 5: Design tokens
- ⏳ Track 6: Bespoke content (needs human — 3D assets, Baku model, copy)

## Non-negotiable gates

- `npm run type-check` + `npm run build` green after every commit
- No new `any` outside adapter boundaries (RenderPipeline NativeRenderPipelineCtor, tsl-utils TSLNode)
- No tsconfig relaxation
- TSL API unclear → STOP, document, leave stub with TODO
