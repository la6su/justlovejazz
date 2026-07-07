# JUNNI_REFERENCE — Patterns to Port

> Source: https://github.com/junni-inc/next.junni.co.jp
> Reference implementation for justlovejazz. Port patterns, not assets.

## Layout (junni pattern → our adaptation)

Junni uses canvas inside section-wrap with absolute-positioned DOM overlays.

| Aspect | Junni | Ours |
| --- | --- | --- |
| Canvas | inside section-wrap, absolute | `canvas.canvas` (z:1, fixed, pointer-events:none) |
| DOM sections | absolute over canvas | `#spa-content` (z:2, transparent), 6 `<section>` absolute-stacked (100dvh each) |
| Page scroll | scroll-snap | **disabled** (`body { overflow: hidden }`) |
| Section visibility | scroll-driven | `.section-active` toggled on `jlz:section-change` |
| Navigation | scroll-snap | **CircularNav** (vinyl-record dial, bottom-right) + **UIMenu** (UIkit modal) |

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
Junni: gradient sphere with shader.
Ours: `BG.ts` — per-section Color as `scene.background`, lerped between section
colors. Works on WebGPU without shaders.

### Baku (character)
Junni: GLTF model with physics.
Ours: `SplashCube` — Apple Fifth Avenue glass cube (`MeshPhysicalNodeMaterial` +
worldDNA TSL nodes). ONE shared material for all 6 faces (WebGL binding-point
limit). On works §3 the cube morphs into BakuCarousel (faces unfold into a
ring of project cards).

### DrawTrail
Junni: GPU cursor trail ribbon.
Ours: `DrawTrail.ts` — 48-segment Line with vertex colors, additive blending.
Visible on about(1) + flexible(2) only.

### CursorLight
Junni: cursor-driven directional light.
Ours: `CursorLight.ts` — same pattern, DirectionalLight spring-following cursor.

### CameraController
Junni: per-section camera transforms with scroll-driven lerp.
Ours: `Section.cameraTransform` lerped in `World.updateTransform()`.

### Post-processing
Junni: custom RenderPipeline (GLSL ShaderMaterial).
Ours:
- WebGPU: `WebGPUPostPipeline` (TSL RenderPipeline + BloomNode + Fn nodes for vignette/grain/grade)
- WebGL2: `RenderPipeline` (ShaderMaterial RT pipeline — bloom/grain/vignette/chromatic/refraction/grade, single ACES pass)

### BakuCarousel (our addition — not in junni)
Baku cube morphs into a carousel ring of project cards. Card click via raycast
→ `ProjectOverlay` fullscreen. 4 unique textures shared across 6 faces.
Built-in `MeshBasicMaterial` for cards (not NodeMaterial — avoids uniform-group
bloat). See [ARCHITECTURE.md](ARCHITECTURE.md) for full mechanics.

## What NOT to port

| Pattern | Why not |
| --- | --- |
| **ore-three** | junni's custom utility library. We use vanilla three.js. |
| **cannon.js physics** | ~180KB + significant CPU. Baku uses simple drift. |
| **GLTF assets** | We don't have junni's models. Use primitives. |
| **ShaderMaterial in scene** | Incompatible with WebGPURenderer. Use built-in or TSL NodeMaterial. See [HERMES_RULES.md](HERMES_RULES.md) §1. |
| **scroll-snap navigation** | Replaced by CircularNav + UIMenu. Page scroll disabled. |
| **SmoothScroll/Lenis** | Removed. CircularNav drives navigation. See HERMES_RULES §21. |
| **SectionProgress timeline dots** | Replaced by CircularNav dial. See HERMES_RULES §22. |
| **6 NodeMaterials per multi-face object** | Exceeds WebGL binding-point limit. ONE shared material per object. See HERMES_RULES §3. |
| **Subtitles (DOM-based)** | Disabled. Will return as 3D environment element. See HERMES_RULES §31. |
| **Input scroll system** | Page doesn't scroll. Mouse only. See HERMES_RULES §32. |
| **setProjectTextures / clearProjectTextures** | Cube is always clean glass. BakuCarousel owns works visuals. See HERMES_RULES §33. |
| **AssetManager / GPUResourceManager** | No-op singletons. Deleted. |
| **CameraAnchors / BorderOverlay / FlexibleSlides** | Never instantiated. Deleted. |
| **import.meta.hot** | HMR disabled (proxy incompatibility). See HERMES_RULES §27. |
| **CSS imports without `?inline`** | Triggers `@vite/client` injection (breaks proxy). See HERMES_RULES §28. |

## Design language (junni aesthetic)

- **Dark backgrounds** with subtle gradient
- **Single accent color** per section (pink, blue, purple)
- **Minimal geometry** — a few key objects, not cluttered
- **Smooth transitions** — lerp everything, no hard cuts
- **Text as UI** — large typography integrated with 3D
- **Whitespace** — objects don't fill the screen, give breathing room

Our current factory follows this: 1-3 objects per section, accent colors,
transparent sections over 3D canvas.
