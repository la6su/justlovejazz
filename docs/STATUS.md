# STATUS — Single Source of Truth

> Updated: 2026-07-11. Branch: `main`. Build green.
>
> UIkit 3 theming patterns + lessons: see [`UIKIT3.md`](UIKIT3.md).

## Project

SPA studio portfolio — **8 sections**, 3D canvas + transparent DOM overlay. Single font: Inter.
Navigation: JoystickNav (pure DOM, 2D — bottom-center) + UIMenu (UIkit modal) + Subtitles (section hints).

## Current state

| Item | Status |
| --- | --- |
| 3D scene (WebGPU + WebGL2 fallback) | ✅ |
| JoystickNav — pure DOM joystick, trigger model (one section per drag) | ✅ |
| 2D navigation (vertical=main, horizontal=Lab/Process) | ✅ |
| UIMenu — UIkit modal jump navigation | ✅ |
| Subtitles — short UI hint per section, auto-fade 4s | ✅ |
| BakuCarousel — cube morphs into ring (Works §4) | ✅ |
| ProjectOverlay — card click (raycast) opens fullscreen | ✅ |
| On-demand rendering (`_needsRender` flag) | ✅ |
| Ambient breathing (1-frame refresh every 2.5s in idle) | ✅ |
| Event-driven animations (static when idle) | ✅ |
| NoiseText titles via `jlz:section-change` | ✅ |
| Splash curtain + SplashCube opener | ✅ |
| DevPanel (Tweakpane) | ✅ |
| Per-section lighting + fog (World.ts owns `scene.fog`) | ✅ |
| EnvSphere — procedural CanvasTexture on BackSide sphere, 8 patterns | ✅ |
| `makeParticles` (`THREE.Points`, shared by all 8 sections) | ✅ |
| SplashCube — single BoxGeometry + CubeCamera + rainbow vertex-color edges | ✅ |
| WebGPU/WebGL2 color parity (sRGB + ACES + grain + bloom) | ✅ |
| Cinematic typography + glassmorphism UI | ✅ |
| TypeScript strict + ESLint + Prettier | ✅ |
| Prerendered home sections (SEO) | ✅ |
| a11y (skip-link, focus-trap, noscript) | ✅ |
| 54 unit tests (CircularNav legacy, Easings, EventBus, Noise) | ✅ |

## Sections (8)

| Idx | Section | 3D content | BG pattern |
| --- | --- | --- | --- |
| 0 | Lab (secret left) | `makeParticles` (THREE.Points) | Light blue-grey HSV |
| 1 | Intro (start) | SplashCube (baku) + particles | HSV rainbow (light) |
| 2 | About | Particles + WireframeTypography | Grey gradient (dark) |
| 3 | Flexible | Particles | Dark purple gradient |
| 4 | Works | BakuCarousel + DrawTrail + particles | Blue-grey gradient (dark) |
| 5 | Innovative | Particles | Center glow (dark) |
| 6 | Contact | Particles | Off-white gradient (light) |
| 7 | Process (secret right) | `makeParticles` | Deep blue-black gradient |

Sections: `position:absolute; inset:0` (stacked). `.section-active` toggles visibility.
World initial state: **section 1 (Intro)**. EnvSphere starts on section 1.

## Visual tiers

Gated by `DeviceCapability.isRealWebGPU` (set in `Renderer.init()` after `wg.init()` + adapter inspection):

| Tier | Path | SplashCube | Background |
| --- | --- | --- | --- |
| **Premium** | Real WebGPU (WebGPUBackend, non-fallback adapter) | Same `MeshPhysicalMaterial` + CubeCamera envMap | EnvSphere (BackSide sphere + CanvasTexture) |
| **Parity** | WebGL2 / WebGLBackend fallback / SwiftShader | Same `MeshPhysicalMaterial` + CubeCamera envMap | EnvSphere (BackSide sphere + CanvasTexture) |

`isRealWebGPU` logged to console on startup:
```
[Renderer.init] Final path: WebGPU (WebGPUBackend) | isRealWebGPU=true
[Renderer.init] Premium WebGPU path active
```

> SplashCube is identical on both paths now (single BoxGeometry + MeshPhysicalMaterial + CubeCamera). The `worldDNA.ts` file + `attachWorldDNA()` exist but are NOT called by SplashCube (kept for future use). `isRealWebGPU` is still used by `RenderPipeline` for backend-specific post-processing path selection.

## On-demand rendering + ambient breathing

`renderer.update()` only called when `_needsRender=true`. Triggers:
1. JoystickNav section change (`isActive()` true for 400ms after trigger)
2. BakuCarousel morphing/scrolling (`isAnimating` getter)
3. Splash/intro animation
4. Camera shake
5. ParticleBurst active
6. **Ambient breathing** — 1 render frame every ~2.5s when fully idle
   (advances worldDNA `uTime` on premium path, EnvSphere/particle drift on parity).
   Respects `prefers-reduced-motion`.

When idle (between breaths): zero draw calls, GPU sleeps. Cursor (DOM) always updates.

## Background system — EnvSphere

| Property | Value |
| --- | --- |
| File | `src/Experience/World/EnvSphere.ts` |
| Geometry | `SphereGeometry(40, 32, 16)` |
| Material | `MeshBasicMaterial` (BackSide, `fog: false`, `depthTest: false`, `depthWrite: false`) |
| Texture | `CanvasTexture` 2048×1024 (sRGB colorSpace, default UV mapping) |
| `frustumCulled` | `false` |
| `renderOrder` | `-1000` (renders first) |
| `attachToScene()` | no-op (mesh is visible — `scene.background` is NOT set) |
| Initial weights | `[0, 1, 0, 0, 0, 0, 0, 0]` — starts on section 1 (Intro) |

8 per-section patterns (mixed by animated `uSection` weights, lerped over ~0.3s):

| Idx | Section | Pattern |
| --- | --- | --- |
| 0 | Lab | Light blue-grey HSV (`hue: 0.6, sat: 0.06, val: 0.88`) |
| 1 | Intro | HSV rainbow gradient (low sat, animated hue shift) |
| 2 | About | Grey vertical gradient (`0x1a1a1a → 0x2e2e2e`) |
| 3 | Flexible | Dark purple gradient (`0x141414 → 0x222232`) |
| 4 | Works | Dark blue-grey gradient (`0x1a1a22 → 0x2a2a3a`) |
| 5 | Innovative | Dark base + radial center glow (`0x2a3a4a`) |
| 6 | Contact | Light off-white gradient (`0xe8e8e8 → 0xd8d8d8`) for dark text |
| 7 | Process | Deep blue-black gradient (`0x080810 → 0x12121e`) |

Light sections (1=Intro, 6=Contact) drive the `light-theme` body class → dark text/nav.

## Particle system

`src/Sections/_shared/makeParticles.ts` — shared `THREE.Points` factory used by all 8 section creators.

- `THREE.Points` + built-in `PointsMaterial` (NOT NodeMaterial — reduces WebGL2 uniform groups)
- `baseOpacity` cached in `material.userData` for non-destructive fade
- `frustumCulled = false`
- Static when idle (event-driven — no drift)

`SectionSceneFactory.hideGeometry()` keeps both `THREE.Points` AND `THREE.InstancedMesh` visible
(particles stay for atmospheric depth even when other geometry is hidden).

## SplashCube (baku) — current implementation

| Property | Value |
| --- | --- |
| Geometry | Single `BoxGeometry(1.6, 1.6, 1.6)` |
| Material | `MeshPhysicalMaterial` — `transmission: 0`, `iridescence: 1.0`, `clearcoat: 1.0`, `roughness: 0.05`, `metalness: 0.0`, `envMapIntensity: 2.0` |
| Reflections | `CubeCamera` renders a content scene (6 gradient planes + Apple logo/text textures) into a `WebGLCubeRenderTarget(256)`, used as `material.envMap` |
| Edges | `EdgesGeometry` from BoxGeometry with animated rainbow HSL vertex colors (12 edges, not 6×4=24 from separate planes) |
| Opener | Scale pulse (single mesh, NOT face separation) |
| Update | `cubeCamera.update(renderer, contentScene)` each frame, cube hidden during CubeCamera render to avoid self-reflection |

No premium/parity split — same `MeshPhysicalMaterial` on both paths. `worldDNA.ts` + `attachWorldDNA()` exist but are not called by SplashCube.

## Removed (don't re-add)

| Module | Why |
| --- | --- |
| SmoothScroll/Lenis | JoystickNav drives navigation (no page scroll) |
| CursorLight | Continuous animation, removed for on-demand |
| DebugStats | Merged into DevPanel (Tweakpane) |
| SectionProgress | Replaced by JoystickNav |
| PerfMonitor | YAGNI — on-demand rendering made it redundant |
| Bootstrapper | Inlined into `main-app.ts` (3 lines) |
| WorldAtmosphere | Inlined into `World.ts` (fog logic at 2 call sites) |
| World.advance alias | `Experience.ts` calls `world.updateTransform()` directly |
| Section.switchViewingState | Callers use `switchState()` directly |
| SectionSceneFactory named wrappers | Replaced by `SECTION_CREATORS[8]` array |
| CircularNav | Replaced by JoystickNav (pure DOM, 2D, trigger model) |
| three-joystick (library import) | JoystickNav is pure DOM — no external joystick lib |
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

- Shared material for cube (single BoxGeometry, 1 draw call)
- Built-in materials for particles, ground, cards, edges
- `makeParticles` (THREE.Points): 1 draw call per section's particle cloud
- `try/catch` in `update()` — logs error, skips frame, doesn't stop loop
- `prefers-reduced-motion` freezes decorative anims (including ambient breathing)
- Post-processing parity: bloom/vignette/grain/refraction/chromatic-aberration/color-grade
  on BOTH WebGPU (TSL graph) and WebGL2 (ShaderMaterial composite).

## 21st.dev integration

[@21st-dev/cli](https://21st.dev) MCP for component discovery:
- API key format: `21st_sk_...` (NOT `an_sk_...`)
- MCP endpoint: `https://21st.dev/api/mcp` (POST, `x-api-key` header)
- Free tier: 2 component-code retrievals/day
- Used to fetch: Atlas Aurora (id: 16166), Background Paper Shaders (id: 5732)
