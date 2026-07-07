# ARCHITECTURE

Vite 8 · TypeScript strict · Three.js 0.184 + TSL · UIkit 3 + Less · bun.

## Entry

```
index.html → entry-shell.ts → entry-app.ts → main-app.ts → Bootstrapper → Experience.ts
Render: renderer.setAnimationLoop (pauses on hidden tab)
CSS: import('./assets/main.less?inline') — prevents @vite/client injection
```

## Layout

```
canvas (z-index:1, fixed, pointer-events:none) — 3D scene
#spa-content (z-index:2) — DOM sections (absolute-stacked, 100dvh each)
  .section-active { opacity:1; pointer-events:auto } — only visible section
#circ-nav (z-index:9999, fixed bottom-right) — CircularNav vinyl circle
#jlz-menu-toggle (z-index:10002) — hamburger button
#jlz-menu-modal (z-index:10000) — UIkit modal
#project-overlay (z-index:3500) — fullscreen project detail
.custom-cursor (z-index:100000) — above all overlays
```

## Visual tiers (IMPROVEMENT_PLAN doctrine)

The project has TWO visual paths, gated by `DeviceCapability.isRealWebGPU`:

| Tier | Path | Baku material | worldDNA TSL nodes | Background |
| --- | --- | --- | --- | --- |
| **Premium** | Real WebGPU (WebGPUBackend, non-fallback adapter) | `MeshPhysicalNodeMaterial` + `transmission=1` (real glass) | ✅ 4 nodes attached | ShaderBackground (TSL) |
| **Parity** | WebGL2 / WebGLBackend fallback / SwiftShader | `MeshPhysicalMaterial` + opacity-glass | ❌ no-op | ShaderBackground (TSL) |

`isRealWebGPU` is set in `Renderer.init()` after `wg.init()` + adapter inspection. Logged to console on startup.

## Navigation

**CircularNav** — vinyl circle, bottom-right. Center = corner (overflow:hidden clips 3/4).
- Drag DOWN → NEXT section. Drag UP → PREV.
- Progress 0→1 drives 3D scene transition + baku rotation.
- `|progress| > 0.5` on release commits; `< 0.5` snaps back.
- `goToDirection(±1)` — public, used by DevPanel + keyboard.
- `isActive()` — true during transition (feeds `_needsRender`).

**UIMenu** — UIkit modal (`uk-modal`). Hamburger `uk-toggle` opens. 6 section links.

**BakuCarousel** — works §4. Cube morphs into ring. Card click (raycast) → overlay.
- `isAnimating` getter — true when morphing/scrolling (feeds `_needsRender`).
- Scroll/drag blocked while CircularNav transition active.

## On-demand rendering + ambient breathing

`Experience._needsRender` flag gates `renderer.update()`. Set true when:
1. `CircularNav.isActive()` — transition in progress
2. `BakuCarousel.isAnimating` — morph/scroll/drag
3. Intro/splash animation running
4. Camera shake active
5. **Ambient breathing** — when fully idle, schedules 1 render frame every ~2.5s
   (advances worldDNA `uTime` on premium, shader time on parity). Respects
   `prefers-reduced-motion`.

When idle (between breaths): `World.update(dt, false)` skips baku/particles/carousel. Zero draw calls.
Cursor (DOM) always updates — not gated by `_needsRender`.

## Background system

The background is a **ShaderBackground** plane — port of
[@reuno-ui/background-paper-shaders](https://21st.dev/@reuno-ui/components/background-paper-shaders)
(21st.dev id: 5732) into TSL.

| Property | Value |
| --- | --- |
| File | `src/Experience/World/ShaderBackground.ts` |
| Material | `MeshBasicNodeMaterial` (TSL — HERMES §1 compliant) |
| Geometry | `PlaneGeometry(120, 80, 32, 32)` |
| Position | `z=-30` (behind baku cube at z=0) |
| `renderOrder` | `-1000` (renders first) |
| `depthTest` | `false` (skybox pattern — never occluded) |
| `depthWrite` | `false` |
| `toneMapped` | `false` (keep colors vivid) |
| Colors | `0x1a1a1a` → `0x4a4a4a` (dark grey, matches @reuno-ui demo) |

**TSL nodes:**
- `positionNode` — vertex displacement (paper undulation: `sin(pos.x*10+t)*0.1`, `cos(pos.y*8+t*1.5)*0.05`)
- `colorNode` — 2-octave sine/cosine noise + color mix + subtle silver shimmer, returns `vec4(color, 1.0)` (opaque)

**Animation:**
- Time advances when rendering (respects on-demand model + ambient breathing)
- `prefers-reduced-motion` → frozen (static snapshot)
- Pulsing intensity: `1.0 + sin(t*2) * 0.3`

> `EnvSphere` (Atlas Aurora CanvasTexture) is **disabled** — kept for lifecycle
> compat but `attachToScene()` is NOT called. `scene.background` is NOT set.

## Baku cube (SplashCube) — premium vs parity

### Premium path (real WebGPU)
- `MeshPhysicalNodeMaterial` with `transmission=1.0` — real glass refraction
- `attachWorldDNA()` connects 4 TSL nodes:
  - `positionNode` — organic vertex displacement (multi-octave noise + audio-bass kick)
  - `colorNode` — **fresnel iridescence** (rainbow at edges via `1 - dot(normalWorld, viewDir)`) + position shimmer + audio-treble
  - `emissiveNode` — **fresnel rim glow** (iridescent halo on all edges, amplitude 0.5)
  - `roughnessNode` — noise-modulated (razor-sharp glass + micro-imperfections)
- Audio-reactive: `uAudioBass` kicks displacement, `uAudioTreble` boosts shimmer

### Parity path (WebGL2 / fallback)
- Plain `MeshPhysicalMaterial` with `transmission=0` (opacity-based glass)
- `attachWorldDNA()` is a no-op — material props driven from JS
- No fresnel/iridescence/rim glow (normalLocal is constant per flat face → invisible)

### Why fresnel (not normalLocal)
Cube faces are flat → `normalLocal` is **constant per face** → any shader based on it is uniform → invisible.
Fresnel uses `cameraPosition - positionWorld` which **varies from face center to edge** → visible rainbow edges + rim glow.

## Renderer

| Backend | Render | Post |
| --- | --- | --- |
| WebGPU | TSL RenderPipeline (bloom+vignette+grain) | ACES toneMapping |
| WebGL2 | ShaderMaterial RT pipeline | bloom+grain+vignette, single ACES |

Shared material for all 6 cube faces (1 uniform group on parity, 1 NodeMaterial on premium).
Built-in materials for particles/ground/cards/edges (reduce uniform groups).

## Modules

| Module | Role |
| --- | --- |
| Experience | Render loop, section transitions, on-demand gating, ambient breathing |
| World | Sections + sceneGroups + baku + lights + BG + DrawTrail(works only) + ShaderBackground |
| SplashCube | Baku cube. Premium: MeshPhysicalNodeMaterial + TSL worldDNA + transmission. Parity: MeshPhysicalMaterial + opacity-glass. |
| ShaderBackground | Paper-shader plane (@reuno-ui port). Dark grey, opaque, sole background. |
| EnvSphere | DISABLED (kept for lifecycle). Was Atlas Aurora CanvasTexture. |
| BakuCarousel | Cube↔ring morph. Raycast card click. `isAnimating` getter. |
| CircularNav | Vinyl circle nav. `goToDirection`/`goToSection`/`isActive`. |
| UIMenu | UIkit modal. `onNavigate`/`setActive`. |
| ProjectOverlay | Fullscreen DOM dialog. Card click opens. |
| WorksPortfolio | Project metadata only (prev/next/goTo). No textures. |
| DevPanel | Tweakpane: Stats/Navigation/BakuCarousel/Render folders. |
| Section | No-op `update()`. State machine only. |
| Input | Mouse-only (scroll system removed). |
| NoiseText | Glitch reveal via `jlz:section-change`. `data-rot` for rotation. |

## Events

| Event | Emitted by | Consumed by |
| --- | --- | --- |
| `jlz:webgl-ready` | main-app (curtain mid-open) | entry-app (NoiseText + scrollspy) |
| `jlz:section-change` | Experience (section index change) | entry-app (NoiseText titles), ContentReveal |

## 21st.dev integration

The project uses [@21st-dev/cli](https://21st.dev) MCP for component discovery:
- MCP endpoint: `https://21st.dev/api/mcp` (POST, `x-api-key` header)
- API key format: `21st_sk_...` (NOT `an_sk_...` — rejected by server)
- Free tier: 2 component-code retrievals/day
- Used to fetch:
  - Atlas Aurora (id: 16166) — `get_component({ id: 16166 })`
  - Background Paper Shaders (id: 5732) — `get_component({ id: 5732 })`
