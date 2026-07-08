# STATUS — Single Source of Truth

> Updated: 2026-07-10. Branch: `main`. Build green.

## Project

SPA studio portfolio — 6 sections, 3D canvas + transparent DOM overlay. Single font: Inter.
Navigation: CircularNav (vinyl circle, bottom-right) + UIMenu (UIkit modal) + Subtitles (bottom-center hints).

## Current state

| Item | Status |
| --- | --- |
| 3D scene (WebGPU + WebGL2 fallback) | ✅ |
| CircularNav — drag DOWN=next, UP=prev | ✅ |
| UIMenu — UIkit modal jump navigation | ✅ |
| Subtitles — section hints, auto-fade after 4s | ✅ |
| BakuCarousel — cube morphs into ring (works §4) | ✅ |
| ProjectOverlay — card click (raycast) opens fullscreen | ✅ |
| On-demand rendering (`_needsRender` flag) | ✅ |
| Ambient breathing (1-frame refresh every 2.5s in idle) | ✅ |
| Event-driven animations (static when idle) | ✅ |
| NoiseText titles via `jlz:section-change` | ✅ |
| Splash curtain + SplashCube opener | ✅ |
| DevPanel (Tweakpane, merged DebugStats) | ✅ |
| Per-section lighting + fog (World.ts owns `scene.fog`) | ✅ |
| EnvSphere — procedural CanvasTexture on BackSide sphere | ✅ |
| GPU-instanced particles (`makeInstancedParticles`, TSL) | ✅ |
| WebGPU/WebGL2 color parity (sRGB + ACES + grain + bloom) | ✅ |
| Cinematic typography + glassmorphism UI (templates.ts + main.less §15) | ✅ |
| TypeScript strict + ESLint + Prettier | ✅ |
| Prerendered home sections (SEO) | ✅ |
| a11y (skip-link, focus-trap, noscript) | ✅ |
| 54 unit tests (CircularNav, Easings, EventBus, Noise) | ✅ |
| **Premium WebGPU path** (worldDNA TSL nodes + real transmission) | ✅ |
| **Baku fresnel iridescence + rim glow** (21st-style glass) | ✅ |

## Visual tiers

The project has TWO visual paths, gated by `DeviceCapability.isRealWebGPU`:

| Tier | Path | Baku material | Background | worldDNA TSL nodes |
| --- | --- | --- | --- | --- |
| **Premium** | Real WebGPU (WebGPUBackend, non-fallback adapter) | `MeshPhysicalNodeMaterial` + `transmission=1` (real glass) | EnvSphere (BackSide sphere + CanvasTexture) | ✅ positionNode + colorNode + emissiveNode + roughnessNode |
| **Parity** | WebGL2 / WebGLBackend fallback / SwiftShader | `MeshPhysicalMaterial` + opacity-glass | EnvSphere (BackSide sphere + CanvasTexture) | ❌ no-op (JS-driven material props) |

`isRealWebGPU` is set in `Renderer.init()` after `wg.init()` + adapter inspection. Logged to console:
```
[Renderer.init] Final path: WebGPU (WebGPUBackend) | isRealWebGPU=true
[Renderer.init] Premium WebGPU path active — TSL worldDNA nodes + real transmission enabled
```

## On-demand rendering + ambient breathing

`renderer.update()` only called when `_needsRender=true`. Triggers:
1. CircularNav transition (`isActive()`)
2. BakuCarousel morphing/scrolling (`isAnimating` getter)
3. Splash/intro animation
4. Camera shake
5. ParticleBurst active
6. **Ambient breathing** — when fully idle, schedules 1 render frame every ~2.5s
   so the scene doesn't look frozen (advances worldDNA `uTime` on premium path,
   EnvSphere/particle drift on parity path). Respects `prefers-reduced-motion`.

When idle (between breaths): zero draw calls, GPU sleeps. Cursor (DOM) always updates.

## Background system

The background is **EnvSphere** — a visible BackSide sphere mesh with a procedural CanvasTexture.

| Property | Value |
| --- | --- |
| File | `src/Experience/World/EnvSphere.ts` |
| Geometry | `SphereGeometry(40, 32, 16)` |
| Material | `MeshBasicMaterial` (BackSide, `fog: false`, `depthTest: false`, `depthWrite: false`) |
| Texture | `CanvasTexture` 2048×1024 (sRGB colorSpace, default UV mapping) |
| `frustumCulled` | `false` |
| `renderOrder` | `-1000` (renders first) |
| `attachToScene()` | no-op (mesh is visible — `scene.background` is NOT set) |

6 per-section patterns (mixed by animated `uSection` weights, lerped over ~0.3s):

| Idx | Section | Pattern |
| --- | --- | --- |
| 0 | intro | HSV gradient (low sat, animated hue shift) |
| 1 | about | Dark grey vertical gradient (`0x1a1a1a → 0x2e2e2e`) |
| 2 | flexible | Dark grey vertical gradient (`0x141414 → 0x222222`) |
| 3 | challenge | Dark blue-grey gradient (`0x1a1a22 → 0x2a2a3a`) |
| 4 | innovative | Dark base + radial center glow (`0x2a3a4a`) |
| 5 | contact | Light off-white gradient (`0xe8e8e8 → 0xd8d8d8`) for dark text |

Light sections (0, 5) drive the `light-theme` body class → dark text/nav.

## Particle system

`src/Sections/_shared/makeInstancedParticles.ts` — GPU-instanced particles with TSL shader.

- `InstancedMesh` (500–2000 instances, 1 draw call regardless of count)
- `MeshBasicNodeMaterial` with TSL `positionNode` (drift) + `colorNode` (twinkle) + `opacityNode` (soft circle)
- Shared `uTime` uniform advanced by `updateInstancedParticles(dt)` in `World.update()`
- LOD: `count/2` on medium tier, `count/4` on low tier
- `frustumCulled = false`, `baseOpacity` cached in `userData` for non-destructive fade
- Frozen when idle (on-demand — drift only advances when rendering)

`SectionSceneFactory.hideGeometry()` keeps both `THREE.Points` AND `THREE.InstancedMesh` visible
(particles stay for atmospheric depth even when other geometry is hidden).

## Section layout

| Idx | Section | 3D content | BG pattern |
| --- | --- | --- | --- |
| 0 | intro | SplashCube (baku), particles | HSV gradient (light) |
| 1 | about | Particles + WireframeTypography | Grey gradient (dark) |
| 2 | flexible | Particles (placeholder) | Grey gradient (dark) |
| 3 | challenge (works) | BakuCarousel + DrawTrail + particles | Blue-grey gradient (dark) |
| 4 | innovative | Particles | Center glow (dark) |
| 5 | contact | Particles | Off-white gradient (light) |

Sections: `position:absolute; inset:0` (stacked). `.section-active` toggles visibility.

## Baku cube (SplashCube) — premium vs parity

### Premium path (real WebGPU)
- `MeshPhysicalNodeMaterial` with `transmission=1.0` — **real glass refraction**
- `attachWorldDNA()` connects 4 TSL nodes: `positionNode` (displacement), `colorNode`
  (fresnel iridescence + shimmer), `emissiveNode` (rim glow), `roughnessNode` (noise-modulated)
- Audio-reactive: `uAudioBass` kicks displacement, `uAudioTreble` boosts shimmer

### Parity path (WebGL2 / fallback)
- Plain `MeshPhysicalMaterial` with `transmission=0` (opacity-based glass)
- `attachWorldDNA()` is a no-op — material props driven from JS
- No fresnel/iridescence/rim glow (normalLocal is constant per flat face → invisible)

### Why fresnel (not normalLocal)
Cube faces are flat → `normalLocal` is **constant per face** → any shader based on it is uniform → invisible.
Fresnel uses `cameraPosition - positionWorld` which **varies from face center to edge** → visible rainbow edges.

## Removed (don't re-add)

| Module | Why |
| --- | --- |
| SmoothScroll/Lenis | CircularNav drives navigation (no page scroll) |
| CursorLight | Continuous animation, removed for on-demand |
| DebugStats | Merged into DevPanel (Tweakpane) |
| SectionProgress | Replaced by CircularNav |
| PerfMonitor | YAGNI — on-demand rendering made it redundant |
| Bootstrapper | Inlined into `main-app.ts` (3 lines) |
| WorldAtmosphere | Inlined into `World.ts` (fog logic at 2 call sites) |
| World.advance alias | `Experience.ts` calls `world.updateTransform()` directly |
| Section.switchViewingState | Callers use `switchState()` directly |
| SectionSceneFactory named wrappers | Replaced by `SECTION_CREATORS` array |
| ShaderBackground (as active bg) | Replaced by EnvSphere (file kept but unused) |
| Atlas Aurora CanvasTexture | Replaced by EnvSphere procedural CanvasTexture |
| Particle drift | Particles are static (event-driven) |
| import.meta.hot | Breaks module loading through proxy |
| Input.ts scroll system | Mouse-only now |

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
- GPU-instanced particles: 1 draw call for 500–2000 instances (TSL drift on GPU)
- `try/catch` in `update()` — logs error, skips frame, doesn't stop loop
- `prefers-reduced-motion` freezes decorative anims (including ambient breathing)
- Post-processing parity: bloom/vignette/grain/refraction/chromatic-aberration/color-grade
  on BOTH WebGPU (TSL graph) and WebGL2 (ShaderMaterial composite). Mouse wheel
  does NOT navigate — only drag/dots/keyboard (see HERMES_RULES §21).

## 21st.dev integration

The project uses [@21st-dev/cli](https://21st.dev) MCP for component discovery:
- API key format: `21st_sk_...` (NOT `an_sk_...` — that format is rejected)
- MCP endpoint: `https://21st.dev/api/mcp` (POST, `x-api-key` header)
- Free tier: 2 component-code retrievals/day
- Used to fetch: Atlas Aurora (id: 16166), Background Paper Shaders (id: 5732)
