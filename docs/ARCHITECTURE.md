# ARCHITECTURE

Vite 8 · TypeScript strict · Three.js 0.184 + TSL · UIkit 3 + Less · bun.

## Entry

```
index.html → entry-shell.ts → entry-app.ts → main-app.ts → Experience.ts
Render: renderer.setAnimationLoop (pauses on hidden tab)
CSS: import('./assets/main.less?inline') — prevents @vite/client injection
```

`main-app.ts` inlines the former Bootstrapper (3 lines: new Experience + await init + onReady cb).

## Layout

```
canvas (z-index:1, fixed, pointer-events:none) — 3D scene
#spa-content (z-index:2) — DOM sections (absolute-stacked, 100dvh each)
  .section-active { opacity:1; pointer-events:auto } — only visible section
#circ-nav (z-index:9999, fixed bottom-right) — CircularNav vinyl circle
#jlz-menu-toggle (z-index:10002) — hamburger button
#jlz-menu-modal (z-index:10000) — UIkit modal
.jlz-hint (fixed bottom-center) — Subtitles section hint
#project-overlay (z-index:3500) — fullscreen project detail
.custom-cursor (z-index:100000) — above all overlays
```

## Visual tiers

The project has TWO visual paths, gated by `DeviceCapability.isRealWebGPU`:

| Tier | Path | Baku material | worldDNA TSL nodes | Background |
| --- | --- | --- | --- | --- |
| **Premium** | Real WebGPU (WebGPUBackend, non-fallback adapter) | `MeshPhysicalNodeMaterial` + `transmission=1` (real glass) | ✅ 4 nodes attached | EnvSphere (BackSide sphere + CanvasTexture) |
| **Parity** | WebGL2 / WebGLBackend fallback / SwiftShader | `MeshPhysicalMaterial` + opacity-glass | ❌ no-op | EnvSphere (BackSide sphere + CanvasTexture) |

`isRealWebGPU` is set in `Renderer.init()` after `wg.init()` + adapter inspection. Logged to console on startup.

## Navigation

**CircularNav** — vinyl circle, bottom-right. Center = corner (overflow:hidden clips 3/4).
- Drag DOWN → NEXT section. Drag UP → PREV.
- Progress 0→1 drives 3D scene transition + baku rotation.
- `|progress| > 0.35` on release commits; `< 0.35` snaps back. Flick velocity override.
- `goToDirection(±1)` — public, used by DevPanel + keyboard.
- `isActive()` — true during transition (feeds `_needsRender`).

**UIMenu** — UIkit modal (`uk-modal`). Hamburger `uk-toggle` opens. 6 section links.

**BakuCarousel** — works §4. Cube morphs into ring. Card click (raycast) → overlay.
- `isAnimating` getter — true when morphing/scrolling (feeds `_needsRender`).
- Scroll/drag blocked while CircularNav transition active.

**Subtitles** — `.jlz-hint` bottom-center. Created in `Experience.init()`. Listens to
`jlz:section-change` → shows section hint (e.g. "Scroll to explore", "Drag · Click to open"),
auto-fades after 4s. `dispose()` clears timer + removes listener.

## On-demand rendering + ambient breathing

`Experience._needsRender` flag gates `renderer.update()`. Set true when:
1. `CircularNav.isActive()` — transition in progress
2. `BakuCarousel.isAnimating` — morph/scroll/drag
3. Intro/splash animation running
4. Camera shake active
5. ParticleBurst active
6. **Ambient breathing** — when fully idle, schedules 1 render frame every ~2.5s
   (advances worldDNA `uTime` on premium, EnvSphere/particle drift on parity). Respects
   `prefers-reduced-motion`.

When idle (between breaths): `World.update(dt, false)` skips baku/particles/carousel. Zero draw calls.
Cursor (DOM) always updates — not gated by `_needsRender`.

## Background system — EnvSphere

| Property | Value |
| --- | --- |
| File | `src/Experience/World/EnvSphere.ts` |
| Geometry | `SphereGeometry(40, 32, 16)` |
| Material | `MeshBasicMaterial` (BackSide, `fog: false`, `depthTest: false`, `depthWrite: false`) |
| Texture | `CanvasTexture` 2048×1024, `SRGBColorSpace`, default UV mapping |
| `frustumCulled` | `false` |
| `renderOrder` | `-1000` (renders first) |
| `attachToScene()` | no-op (mesh is visible — `scene.background` NOT set) |

6 per-section patterns (mixed by animated `uSection` weights, lerped over ~0.3s):
- sec1 (intro) — HSV rainbow gradient (animated, low saturation, high value)
- sec2 (about) — grey gradient (`0x1a1a1a → 0x2e2e2e`)
- sec3 (flexible) — dark grey gradient (`0x141414 → 0x222222`)
- sec4 (works) — dark blue-grey gradient (`0x1a1a22 → 0x2a2a3a`)
- sec5 (innovative) — dark base + radial center glow (`0x2a3a4a`)
- sec6 (contact) — light off-white gradient (`0xe8e8e8 → 0xd8d8d8`)

`changeSection(idx)` → `_targetWeights[idx]=1, others=0` → lerped in `update()`.
Canvas redrawn when dirty, or every ~200ms for animated patterns (HSV, horizon).
`prefers-reduced-motion` → frozen.

> `ShaderBackground.ts` file still exists but is **dead code** (not imported anywhere).
> It was the prior @reuno-ui paper-shader port. EnvSphere is the sole background.

## Baku cube (SplashCube) — premium vs parity

### Premium path (real WebGPU)
- `MeshPhysicalNodeMaterial` with `transmission=1.0` — real glass refraction
- `attachWorldDNA()` connects 4 TSL nodes: `positionNode` (displacement),
  `colorNode` (fresnel iridescence + shimmer), `emissiveNode` (rim glow),
  `roughnessNode` (noise-modulated)
- Audio-reactive: `uAudioBass` kicks displacement, `uAudioTreble` boosts shimmer

### Parity path (WebGL2 / fallback)
- Plain `MeshPhysicalMaterial` with `transmission=0` (opacity-based glass)
- `attachWorldDNA()` is a no-op — material props driven from JS
- No fresnel/iridescence/rim glow (normalLocal is constant per flat face → invisible)

### Why fresnel (not normalLocal)
Cube faces are flat → `normalLocal` is **constant per face** → any shader based on it is uniform → invisible.
Fresnel uses `cameraPosition - positionWorld` which **varies from face center to edge** → visible rainbow edges.

## Render pipeline (WebGPU/WebGL2 parity)

| Backend | Render | Post |
| --- | --- | --- |
| WebGPU | `TSLRenderPipeline` + `PassNode` + `BloomNode` (via `WebGPUPostPipeline`) | ACES + vignette + grain + refraction + chromatic + grade + border + sRGB encode |
| WebGL2 | scene → RT(bright-extract) → gaussian blur(×2 ping-pong) → composite ShaderMaterial → screen | same chain, manual sRGB encode in GLSL |

**Parity guarantees** (bit-identical output across backends):

| Effect | Implementation | Why |
| --- | --- | --- |
| Bloom bright-extract | `smoothstep(threshold, threshold+0.1, luminance)` matches `BloomNode` exactly | Old `c*(c-threshold)` quadratic diverged from BloomNode |
| ACES tone map | `color*(6.2*color+0.03) / (color*(4.8*color+1.0) + 0.0001)` | Epsilon (0.0001) prevents NaN on black pixels; both paths lift shadows identically |
| Film grain | Portable integer hash: `p3 = fract(vec3(p.xyx)*0.1031); p3 += dot(p3, p3.yzx+33.33); fract((p3.x+p3.y)*p3.z)` | `sin()` precision differs GLSL vs WGSL — integer hash is bit-identical |
| sRGB encode | Exact `sRGBTransferOETF`: `mix(pow(c, 0.41666)*1.055 - 0.055, c*12.92, step(c, 0.0031308))` | Manual in WebGL2 GLSL; `TSLRenderPipeline` applies via `outputColorTransform=true` (default) on WebGPU |

Color grading: `mix(color*uGradeShadows, color+(uGradeHighlights-1)*max(color-0.5,0), smoothstep(0,1,lum))` at 40% mix.

## Fog ownership

`World.ts` owns `scene.fog` (per-section `FogExp2`):
- `World.init()` creates `scene.fog = new FogExp2(cfg.fog.color, cfg.fog.density)` from section 0
- `World.updateTransform()` updates `fog.color` + `fog.density` on section index change (reuses instance)
- `World.dispose()` sets `scene.fog = null`
- `Renderer.ts` does NOT touch `scene.fog` (was overriding with stale envColor before)

## Modules

| Module | Role |
| --- | --- |
| Experience | Render loop, section transitions, on-demand gating, ambient breathing |
| World | Sections + sceneGroups + baku + lights + BG + EnvSphere + DrawTrail(works only) + fog |
| SplashCube | Baku cube. Premium: MeshPhysicalNodeMaterial + TSL worldDNA + transmission. Parity: MeshPhysicalMaterial + opacity-glass. |
| EnvSphere | BackSide sphere + CanvasTexture. 6 per-section patterns mixed by animated weights. Sole background. |
| BakuCarousel | Cube↔ring morph. Raycast card click. `isAnimating` getter. |
| CircularNav | Vinyl circle nav. `goToDirection`/`goToSection`/`isActive`. |
| UIMenu | UIkit modal. `onNavigate`/`setActive`. |
| Subtitles | Bottom-center section hints. Listens to `jlz:section-change`. Auto-fade 4s. |
| ProjectOverlay | Fullscreen DOM dialog. Card click opens. |
| WorksPortfolio | Project metadata only (prev/next/goTo). No textures. |
| DevPanel | Tweakpane: Stats/Navigation/BakuCarousel/Render folders. |
| Section | No-op `update()`. State machine only (`switchState`). |
| SectionSceneFactory | `SECTION_CREATORS[6]` array + `hideGeometry()` (keeps Points + InstancedMesh visible). |
| makeInstancedParticles | GPU-instanced particles (TSL MeshBasicNodeMaterial). 500-2000 instances, 1 draw call. |
| Input | Mouse-only (scroll system removed). |
| NoiseText | Glitch reveal via `jlz:section-change`. `data-rot` for rotation. |
| WireframeTypography | Section2 About decorative typography. |

## Events

| Event | Emitted by | Consumed by |
| --- | --- | --- |
| `jlz:webgl-ready` | main-app (curtain mid-open) | entry-app (NoiseText + scrollspy) |
| `jlz:section-change` | Experience (section index change) | entry-app (NoiseText titles), ContentReveal, Subtitles |

## 21st.dev integration

The project uses [@21st.dev/cli](https://21st.dev) MCP for component discovery:
- MCP endpoint: `https://21st.dev/api/mcp` (POST, `x-api-key` header)
- API key format: `21st_sk_...` (NOT `an_sk_...` — rejected by server)
- Free tier: 2 component-code retrievals/day
- Used to fetch:
  - Atlas Aurora (id: 16166) — `get_component({ id: 16166 })`
  - Background Paper Shaders (id: 5732) — `get_component({ id: 5732 })`
