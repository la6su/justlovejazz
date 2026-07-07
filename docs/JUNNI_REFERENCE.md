# JUNNI_REFERENCE — Patterns to Port

> Source: junni-inc/next.junni.co.jp. Port patterns, not assets.

## Layout

Canvas fixed behind DOM. Our adaptation:
- `canvas` (z-index:1, fixed, pointer-events:none)
- `#spa-content` (z-index:2) — 6 `<section>` absolute-stacked (100dvh)
- `body { overflow: hidden }` — no page scroll
- `.section-active` toggles visibility (ContentReveal on `jlz:section-change`)
- CircularNav (vinyl circle) + UIMenu (UIkit modal) drive navigation

## Sections (current)

| Idx | Section | 3D content | BG |
| --- | --- | --- | --- |
| 0 | intro | SplashCube (baku), particles (static) | White (light) |
| 1 | about | Particles (static) | Dark |
| 2 | flexible | Particles (static) — EMPTY placeholder | Dark purple |
| 3 | challenge (works) | BakuCarousel + DrawTrail + particles | Dark |
| 4 | innovative | Particles (static) | Dark |
| 5 | contact | Particles (static) | Dark |

All factories use shared `makeParticles` from `src/Sections/_shared/`.
Particles are STATIC — no drift (event-driven animation model).

## Key patterns (ported)

| Pattern | Junni | Ours |
| --- | --- | --- |
| BG | Gradient sphere + shader | `BG.ts` — per-section Color, lerped |
| Baku | GLTF model + physics | SplashCube — glass cube, static when idle, ~30° rotation on transition |
| DrawTrail | GPU cursor trail ribbon | `DrawTrail.ts` — Line + vertex colors. Works section ONLY. |
| CameraController | Per-section transforms | `Section.cameraTransform` lerped in `updateTransform` |
| Post-processing | Custom RenderPipeline | WebGPU: TSL RenderPipeline. WebGL2: ShaderMaterial RT |

## What NOT to port

- `ore-three` custom utility library
- `cannon.js` physics
- GLTF assets (use primitives)
- ShaderMaterial in scene (incompatible with WebGPURenderer)
- scroll-snap navigation (replaced by CircularNav)
- SmoothScroll/Lenis (removed)
- SectionProgress timeline dots (replaced by CircularNav)
- CursorLight (deleted — continuous animation conflicts with on-demand rendering)
- Particle drift (particles are static — event-driven model)
- `import.meta.hot` (breaks module loading through proxy)
