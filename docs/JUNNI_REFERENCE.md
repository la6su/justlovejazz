# JUNNI_REFERENCE — Patterns to Port

> Source: junni-inc/next.junni.co.jp. Port patterns, not assets.

## Layout

Canvas fixed behind DOM. Our adaptation:
- `canvas` (z-index:1, fixed, pointer-events:none)
- `#spa-content` (z-index:2) — 8 `<section>` absolute-stacked (100dvh)
- `body { overflow: hidden }` — no page scroll
- `.section-active` toggles visibility (ContentReveal on `jlz:section-change`)
- JoystickNav (pure DOM, 2D) + UIMenu (UIkit modal) drive navigation

## Sections (current — 8)

| Idx | Section | 3D content | BG |
| --- | --- | --- | --- |
| 0 | Lab (secret left) | `makeParticles` (THREE.Points) | Light HSV |
| 1 | Intro (start) | SplashCube (baku) + particles | HSV rainbow (light) |
| 2 | About | Particles + WireframeTypography | Grey gradient (dark) |
| 3 | Flexible | Particles | Dark purple gradient |
| 4 | Works | BakuCarousel + DrawTrail + particles | Blue-grey gradient (dark) |
| 5 | Innovative | Particles | Center glow (dark) |
| 6 | Contact | Particles | Off-white gradient (light) |
| 7 | Process (secret right) | `makeParticles` | Deep blue-black gradient |

All factories use shared `makeParticles` from `src/Sections/_shared/`.
Particles are STATIC — no drift (event-driven animation model).
World starts on section 1 (Intro), NOT section 0.

## Key patterns (ported)

| Pattern | Junni | Ours |
| --- | --- | --- |
| BG | Gradient sphere + shader | `EnvSphere.ts` — BackSide sphere + CanvasTexture, 8 per-section patterns |
| Baku | GLTF model + physics | SplashCube — single BoxGeometry + MeshPhysicalMaterial + CubeCamera reflections + rainbow edges. Static when idle, ~30° rotation on transition. |
| DrawTrail | GPU cursor trail ribbon | `DrawTrail.ts` — Line + vertex colors. Works section ONLY. |
| CameraController | Per-section transforms | `Section.cameraTransform` lerped in `updateTransform` |
| Post-processing | Custom RenderPipeline | WebGPU: TSL RenderPipeline. WebGL2: ShaderMaterial RT |
| Navigation | Scroll-snap + UIkit modal | JoystickNav (pure DOM, 2D, trigger model) + UIMenu (UIkit modal) |
| Subtitles | Bottom subtitle bar | `Subtitles.ts` — short UI hint per section, auto-fade 4s |

## What NOT to port

- `ore-three` custom utility library
- `cannon.js` physics
- GLTF assets (use primitives)
- ShaderMaterial in scene (incompatible with WebGPURenderer)
- scroll-snap navigation (replaced by JoystickNav)
- SmoothScroll/Lenis (removed)
- SectionProgress timeline dots (replaced by JoystickNav)
- CircularNav vinyl circle (replaced by JoystickNav — pure DOM, 2D)
- `three-joystick` library (JoystickNav is pure DOM — no external lib)
- CursorLight (deleted — continuous animation conflicts with on-demand rendering)
- Particle drift (particles are static — event-driven model)
- `makeInstancedParticles` (legacy, unused — `makeParticles` is canonical)
- `attachWorldDNA` on SplashCube (worldDNA.ts kept but unused — cube is single MeshPhysicalMaterial)
- `import.meta.hot` (breaks module loading through proxy)
