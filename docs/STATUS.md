# STATUS — Single Source of Truth

> Updated: 2026-07-09. Branch: `main`. Build green.

## Project

SPA studio portfolio — 6 sections, 3D canvas + transparent DOM overlay. Single font: Inter.
Navigation: CircularNav (vinyl circle, bottom-right) + UIMenu (UIkit modal).

## Current state

| Item | Status |
| --- | --- |
| 3D scene (WebGPU + WebGL2 fallback) | ✅ |
| CircularNav — drag DOWN=next, UP=prev | ✅ |
| UIMenu — UIkit modal jump navigation | ✅ |
| BakuCarousel — cube morphs into ring (works §4) | ✅ |
| ProjectOverlay — card click (raycast) opens fullscreen | ✅ |
| On-demand rendering (`_needsRender` flag) | ✅ |
| Ambient breathing (A4 — 1-frame refresh every 2.5s in idle) | ✅ |
| Event-driven animations (static when idle) | ✅ |
| NoiseText titles via `jlz:section-change` | ✅ |
| Splash curtain + SplashCube opener | ✅ |
| DevPanel (Tweakpane, merged DebugStats) | ✅ |
| Per-section lighting + fog | ✅ |
| TypeScript strict + ESLint + Prettier | ✅ |
| Prerendered home sections (SEO) | ✅ |
| a11y (skip-link, focus-trap, noscript) | ✅ |
| 54 unit tests (CircularNav, Easings, EventBus, Noise) | ✅ |
| **Premium WebGPU path** (A1 — worldDNA TSL nodes + real transmission) | ✅ |
| **Baku fresnel iridescence + rim glow** (21st-style glass) | ✅ |
| **Paper-shader background** (@reuno-ui port, dark grey) | ✅ |

## Visual tiers (IMPROVEMENT_PLAN doctrine)

The project now has TWO visual paths, gated by `DeviceCapability.isRealWebGPU`:

| Tier | Path | Baku material | Background | worldDNA TSL nodes |
| --- | --- | --- | --- | --- |
| **Premium** | Real WebGPU (WebGPUBackend, non-fallback adapter) | `MeshPhysicalNodeMaterial` + `transmission=1` (real glass) | ShaderBackground (TSL, paper-shader) | ✅ positionNode + colorNode + emissiveNode + roughnessNode |
| **Parity** | WebGL2 / WebGLBackend fallback / SwiftShader | `MeshPhysicalMaterial` + opacity-glass | ShaderBackground (TSL, paper-shader) | ❌ no-op (JS-driven material props) |

`isRealWebGPU` is set in `Renderer.init()` after `wg.init()` + adapter inspection. Logged to console:
```
[Renderer.init] Final path: WebGPU (WebGPUBackend) | isRealWebGPU=true | EnvSphere=TSL shader (premium)
[Renderer.init] Premium WebGPU path active — TSL worldDNA nodes + real transmission enabled
```

## On-demand rendering + ambient breathing

`renderer.update()` only called when `_needsRender=true`. Triggers:
1. CircularNav transition (`isActive()`)
2. BakuCarousel morphing/scrolling (`isAnimating` getter)
3. Splash/intro animation
4. Camera shake
5. **Ambient breathing** — when fully idle, schedules 1 render frame every ~2.5s
   so the scene doesn't look frozen (advances worldDNA `uTime` on premium path,
   EnvSphere/shader animations on parity path). Respects `prefers-reduced-motion`.

When idle (between breaths): zero draw calls, GPU sleeps. Cursor (DOM) always updates.

## Background system

The background is now a **ShaderBackground** plane — a port of
[@reuno-ui/background-paper-shaders](https://21st.dev/@reuno-ui/components/background-paper-shaders)
(21st.dev component id: 5732, "Background Paper Shade with grey shaders") into TSL.

| Layer | What | File | renderOrder |
| --- | --- | --- | --- |
| 1 | **ShaderBackground** (paper-shader plane, dark grey) | `src/Experience/World/ShaderBackground.ts` | -1000 |

- `MeshBasicNodeMaterial` with `positionNode` (vertex displacement) + `colorNode` (noise + color mix)
- Dark grey palette: `0x1a1a1a` → `0x4a4a4a` (matches @reuno-ui demo)
- 2-octave sine/cosine noise pattern + subtle silver shimmer on high noise
- Paper undulation (vertex X/Y displacement via sin/cos)
- Pulsing intensity: `1.0 + sin(t*2) * 0.3`
- Opaque, fullscreen plane at `z=-30`, `depthTest=false`, `toneMapped=false`
- `prefers-reduced-motion` → frozen (static snapshot)

> `EnvSphere` (Atlas Aurora CanvasTexture from PR #125/#128) is **disabled** —
> kept for lifecycle compat but `attachToScene()` is NOT called. `scene.background`
> is NOT set. ShaderBackground is the sole background.

## Section layout

| Idx | Section | 3D content | BG |
| --- | --- | --- | --- |
| 0 | intro | SplashCube (baku), particles | Dark grey (paper-shader) |
| 1 | about | Particles | Dark grey (paper-shader) |
| 2 | flexible | Particles (EMPTY placeholder) | Dark grey (paper-shader) |
| 3 | challenge (works) | BakuCarousel + DrawTrail + particles | Dark grey (paper-shader) |
| 4 | innovative | Particles | Dark grey (paper-shader) |
| 5 | contact | Particles | Dark grey (paper-shader) |

Sections: `position:absolute; inset:0` (stacked). `.section-active` toggles visibility.

## Baku cube (SplashCube) — premium vs parity

### Premium path (real WebGPU)
- `MeshPhysicalNodeMaterial` with `transmission=1.0` — **real glass refraction**
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
Fresnel uses `cameraPosition - positionWorld` which **varies from face center to edge** → visible rainbow edges + rim glow. This is the standard 21st.dev glass approach.

## Removed (don't re-add)

| Module | Why |
| --- | --- |
| SmoothScroll/Lenis | CircularNav drives navigation (no page scroll) |
| CursorLight | Continuous animation, removed for on-demand |
| DebugStats | Merged into DevPanel (Tweakpane) |
| SectionProgress | Replaced by CircularNav |
| Particle drift | Particles are static (event-driven) |
| Section.update() emissive pulse | Was continuous, now no-op |
| import.meta.hot | Breaks module loading through proxy |
| Input.ts scroll system | Mouse-only now |
| EnvSphere (as visible mesh) | Replaced by ShaderBackground (PR #129/#130) |
| Atlas Aurora CanvasTexture | Disabled — ShaderBackground is sole bg (PR #130) |
| Animated mx_noise_float on bg | User feedback: "swims" visibly. Removed. |

## Proxy/dev config

| Setting | Value | Why |
| --- | --- | --- |
| `server.hmr` | `false` | WebSocket unstable through proxy |
| `server.allowedHosts` | `['project.6la.ru']` | Caddy/haproxy reverse proxy |
| `block-vite-client` plugin | Strips `@vite/client` from HTML + stubs HTTP | Prevents reload loop |
| `main.less` import | `?inline` | Prevents `@vite/client` injection in CSS |

## Performance

- Shared material for all 6 cube faces (1 uniform group on parity, 1 NodeMaterial on premium)
- Built-in materials for particles, ground, cards, edges
- `try/catch` in `update()` — logs error, skips frame, doesn't stop loop
- `prefers-reduced-motion` freezes decorative anims (including ambient breathing)
- Post-processing parity: bloom/vignette/grain/refraction/chromatic-aberration
  on BOTH WebGPU (TSL graph) and WebGL2 (ShaderMaterial composite). Mouse wheel
  does NOT navigate — only drag/dots/keyboard (see HERMES_RULES §21).
- Grain amplitude halved (PR #119) — was "too obvious", now subtle dither

## 21st.dev integration

The project uses [@21st-dev/cli](https://21st.dev) MCP for component discovery:
- API key format: `21st_sk_...` (NOT `an_sk_...` — that format is rejected)
- MCP endpoint: `https://21st.dev/api/mcp` (POST, `x-api-key` header)
- Free tier: 2 component-code retrievals/day
- Used to fetch: Atlas Aurora (id: 16166), Background Paper Shaders (id: 5732)

## Recent PRs (visual overhaul)

| PR | Title | Impact |
| --- | --- | --- |
| #118 | worldDNA TSL nodes + real WebGPU transmission + ambient breathing | Premium path foundation |
| #119 | Aurora mesh-gradient background + reduce grain | First bg attempt (replaced later) |
| #120 | Static EnvSphere + mix() orbs | Fix bg visibility |
| #121 | Baku fresnel iridescence + rim glow | 21st-style glass on cube |
| #123 | Bold cinematic mesh-gradient (4 orbs) | Bolder bg (replaced later) |
| #124 | Skybox render pattern + MAX bold orbs | Render-order fix |
| #125 | Atlas Aurora cinematic background (21st port) | TSL bg (replaced later) |
| #126 | CanvasTexture fallback for WebGL2 | Parity-path bg |
| #127 | Orbs on -Z hemisphere | Fix black bg bug |
| #128 | scene.background = equirectangular CanvasTexture | Native bg (replaced later) |
| #129 | Paper-shader background plane (@reuno-ui port) | New shader bg |
| #130 | Paper-shaders dark grey palette | Final @reuno-ui match |
