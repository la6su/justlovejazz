# JUNNI_REFERENCE — Patterns to Port

> Source: https://github.com/junni-inc/next.junni.co.jp
> Reference implementation for justlovejazz. Port patterns, not assets.

## Layout (junni pattern)

```
.content-wrapper
  .content (flex column, z-index:1)
    .header (z-index:10)
    .section-wrap (flex:1, position:relative)
      canvas (position:absolute, z-index:0)  ← 3D scene
      .section (position:absolute, 100%, pointer-events:none)
        .section1, .section2, ... (DOM content overlays)
    .footer (z-index:10)
```

**Key:** Canvas is INSIDE section-wrap, behind sections. Sections are
absolute-positioned overlays with `pointer-events: none` (except active).

Our adaptation:
- `canvas.canvas` (z-index:1, fixed, pointer-events:none)
- `#spa-content` (z-index:2, transparent) with 6 `<section>` (100vh each)
- Scroll-based section switching (not absolute overlay)

## Section compositions (junni)

### Section1 — Intro
- **Wall**: physics-based collision wall (cannon.js)
- **Logo**: 3D logo parts that assemble
- **Crosses**: animated cross shapes
- **Gradation**: gradient background sphere
- **Lines**: geometric line field
- **Slashes**: diagonal slash patterns
- **Dots**: particle dots

**Our adaptation (createIntro):** Metal drop (Baku-like sphere) on white BG.
Keep simple — junni uses GLTF assets we don't have.

### Section2 — Flexible
- **Flexible**: flexible/elastic object
- **Section2Title**: animated title
- **Slides**: sliding panels
- **Transparents**: transparent layered objects

**Our adaptation (createAbout):** Blob + reflective floor + particles on dark BG.

### Section3 — Works (displays)
- **Wire**: wireframe structure
- **Displays**: product display cards (like our WorksPortfolio)
- **Lights**: section-specific lighting
- **BackText**: background text
- **CursorLight**: cursor-driven light
- **Sec3Particle**: section particles

**Our adaptation (createChallenge):** WorksPortfolio (3D card carousel) +
ProjectOverlay (DOM UI). Grid floor + geometric lines.

### Section4 — Peoples
- **Peoples**: character figures (GLTF)
- **TileText**: tiled text display

**Our adaptation (createInnovative):** Constellation network (points + lines)
+ blob. Represents "innovation/network" concept.

### Section5 — Outro
- **Grid**: animated grid (shader-based)
- **TextRing**: rotating ring of text
- **Outro**: closing text

**Our adaptation (createFlexible):** Metal drop + particles. (Could add
TextRing pattern — rotating text around Baku.)

### Section6 — Next
- **Comrades**: companion shapes
- **Next**: "next" call-to-action
- **Particle**: closing particles
- **Road**: perspective road
- **Wind**: wind effect

**Our adaptation (createContact):** Grid floor + particles. Simple closing.

## Key junni technical patterns

### BG (background)
Junni: `BG.ts` — gradient sphere with shader.
Ours: `BG.ts` — per-section Color, set as `scene.background`. Lerp between
section colors. Simpler, works on WebGPU without shaders.

### Ground
Junni: `Ground.ts` — shader-based grid floor.
Ours: `GridHelper` (built-in) or `MeshStandardMaterial` plane. No shader.

### Baku (character)
Junni: `Baku.ts` — GLTF model with physics + multiple materials.
Ours: `IcosahedronGeometry` + `MeshStandardMaterial`. Organic drift via
Noise. Role-based material switching (NORMAL/GLASS/WIRE).

### DrawTrail
Junni: `DrawTrail.ts` — cursor trail ribbon (GPU computation).
Ours: Disabled for perf. Would be LineBasicMaterial with ring buffer.

### CursorLight
Junni: `CursorLight.ts` — cursor-driven directional light.
Ours: `CursorLight.ts` — same pattern, PointLight following cursor.

### CameraController
Junni: Per-section camera transforms with scroll-driven lerp.
Ours: Same — `Section.cameraTransform` lerped in `updateTransform`.

### Post-processing
Junni: Custom RenderPipeline with bloom, vignette, chromatic aberration.
Ours: WebGPU = direct render (no post, perf). WebGL2 = ShaderMaterial RT
pipeline (bloom/grain/vignette).

## What NOT to port

- **ore-three**: junni's custom utility library. We use vanilla three.js.
- **cannon.js physics**: too heavy for our use case. Baku uses simple drift.
- **GLTF assets**: we don't have junni's models. Use primitives.
- **ShaderMaterial**: incompatible with WebGPURenderer. Use built-in materials.
- **TSL NodeMaterial for scene objects**: slow on WebGPU-over-ANGLE.

## Design language (junni aesthetic)

- **Dark backgrounds** with subtle gradient
- **Single accent color** per section (pink, blue, purple)
- **Minimal geometry** — a few key objects, not cluttered
- **Smooth transitions** — lerp everything, no hard cuts
- **Text as UI** — large typography integrated with 3D
- **Whitespace** — objects don't fill the screen, give breathing room

Our current factory follows this: 1-3 objects per section, accent colors,
transparent sections over 3D canvas.
