# JUNNI_REFERENCE — Patterns to Port

> Source: https://github.com/junni-inc/next.junni.co.jp
> Reference implementation for justlovejazz. Port patterns, not assets.

## Layout (junni pattern → our adaptation)

Junni uses canvas inside section-wrap with absolute-positioned DOM overlays.
Our adaptation:
- `canvas.canvas` (z-index:1, fixed, pointer-events:none) — 3D scene
- `#spa-content` (z-index:2, transparent) — 6 `<section>` absolute-stacked (100dvh each)
- `body { overflow: hidden }` — no page scroll
- `.section-active` toggles which section is visible (ContentReveal on `jlz:section-change`)
- SwipeNav (bottom bar) + UIMenu (UIkit modal) drive navigation — NOT scroll

## Section compositions (current state)

| Idx | Section | 3D content | BG |
| --- | --- | --- | --- |
| 0 | intro | particles (25 grey) | white (light) |
| 1 | about | particles (50 pink), DrawTrail | dark |
| 2 | flexible | particles (20 grey) — **EMPTY placeholder** | dark purple |
| 3 | challenge (works) | **BakuCarousel** (baku cube morphs into ring) + particles (20 blue) | dark |
| 4 | innovative | particles (45 blue-grey) | dark |
| 5 | contact | particles (30 light-blue) | light cream |

All factories in `src/Sections/Section*/index.ts` use the shared
`makeParticles` helper from `src/Sections/_shared/makeParticles.ts`.

## Key junni technical patterns (ported)

### BG (background)
Junni: gradient sphere with shader. Ours: `BG.ts` — per-section Color as
`scene.background`, lerped between section colors. Works on WebGPU without shaders.

### Baku (character)
Junni: GLTF model with physics. Ours: `SplashCube` — Apple Fifth Avenue glass
cube (`MeshPhysicalNodeMaterial` + worldDNA TSL nodes). 6 faces. On works §4
the cube morphs into BakuCarousel (faces unfold into a ring of project cards).

### DrawTrail
Junni: GPU cursor trail ribbon. Ours: `DrawTrail.ts` — 48-segment Line with
vertex colors, additive blending. Visible on about(1) only.

### CursorLight
Junni: cursor-driven directional light. Ours: `CursorLight.ts` — same pattern,
DirectionalLight spring-following cursor.

### CameraController
Junni: per-section camera transforms with scroll-driven lerp.
Ours: `Section.cameraTransform` lerped in `World.updateTransform()`.

### Post-processing
Junni: custom RenderPipeline. Ours: WebGPU = direct render (no post, perf);
WebGL2 = ShaderMaterial RT pipeline (bloom/grain/vignette).

## What NOT to port

- **ore-three**: junni's custom utility library. We use vanilla three.js.
- **cannon.js physics**: too heavy. Baku uses simple drift.
- **GLTF assets**: we don't have junni's models. Use primitives.
- **ShaderMaterial in scene**: incompatible with WebGPURenderer. Use built-in or TSL.
- **scroll-snap navigation**: replaced by SwipeNav + UIMenu. Don't re-add.
- **SmoothScroll/Lenis**: removed — SwipeNav drives navigation. Don't re-add.
- **SectionProgress timeline dots**: replaced by SwipeNav. Don't re-add.

## Design language (junni aesthetic)

- **Dark backgrounds** with subtle gradient
- **Single accent color** per section (pink, blue, purple)
- **Minimal geometry** — a few key objects, not cluttered
- **Smooth transitions** — lerp everything, no hard cuts
- **Text as UI** — large typography integrated with 3D
- **Whitespace** — objects don't fill the screen, give breathing room

Our current factory follows this: 1-3 objects per section, accent colors,
transparent sections over 3D canvas.

