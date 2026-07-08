# justlovejazz

Studio-grade interactive 3D portfolio. Vite 8 (rolldown) + TypeScript (strict).
Three.js 0.184 + WebGPU/WebGL2 + TSL NodeMaterial + UIkit 3 + Less + bun.

## Run

```bash
bun install          # deps
bun run dev          # dev server (localhost:5173)
bun run type-check   # tsc --noEmit (strict)
bun run lint         # ESLint
bun run build        # production build
bun run test:unit    # 54 unit tests
bun run format       # Prettier
```

## Docs

| File | Content |
| --- | --- |
| [AGENTS.md](AGENTS.md) | **Start here** — rules, navigation model, 21st.dev MCP |
| [STATUS.md](docs/STATUS.md) ⭐ | Canonical state (visual tiers, background, removed modules) |
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | Modules, render path, parity guarantees |
| [RULES.md](docs/RULES.md) | Hard rules |
| [JUNNI_REFERENCE.md](docs/JUNNI_REFERENCE.md) | Patterns to port / NOT port |
| [CHANGELOG.md](docs/CHANGELOG.md) | Recent changes |

## Stack

| Layer | Tech |
| --- | --- |
| Framework | Vite 8 (rolldown) + TypeScript strict |
| 3D | Three.js 0.184 + TSL NodeMaterial |
| Renderer | WebGPURenderer (WebGPU/WebGL2 auto-fallback with SwiftShader detection) |
| UI | UIkit 3 + Less (master-quantum-flares theme) |
| Navigation | JoystickNav (pure DOM, 2D) + UIMenu (UIkit modal) + Subtitles (section hints) |
| Background | EnvSphere (BackSide sphere + procedural CanvasTexture, 8 patterns) |
| Lint | ESLint 9 + Prettier |
| Test | Vitest (54 tests) |
| PM | bun |

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

World starts on **section 1 (Intro)** — Lab (idx 0) and Process (idx 7) are secret side sections reachable only via horizontal joystick drag.

## Navigation

- **JoystickNav** (bottom-center, pure DOM, NOT three-joystick): one section per drag (trigger model).
  - Vertical drag = cycle 6 MAIN sections (Intro→About→…→Contact)
  - Horizontal drag = toggle to SECRET side sections (Lab ← center → Process)
  - Keyboard: ArrowUp/Down/Left/Right, Home, End
- **UIMenu** (UIkit modal): hamburger button, jump to any of 8 sections.
- **BakuCarousel** (Works §4): cube morphs into ring. Card click → fullscreen overlay.
- **Subtitles** (`.jlz-hint` bottom-center): short UI hint per section, auto-fades 4s.

## Visual tiers

Gated by `DeviceCapability.isRealWebGPU` (set in `Renderer.init()` after backend detection):

| Tier | Path | SplashCube | Background |
| --- | --- | --- | --- |
| **Premium** | Real WebGPU | `MeshPhysicalMaterial` (iridescence=1) + `CubeCamera` envMap | EnvSphere (CanvasTexture) |
| **Parity** | WebGL2 / fallback | Same `MeshPhysicalMaterial` + `CubeCamera` envMap | EnvSphere (CanvasTexture) |

SplashCube is identical on both paths: single `BoxGeometry` + `MeshPhysicalMaterial` (transmission=0, iridescence=1, clearcoat=1) + `CubeCamera` reflections + `EdgesGeometry` with animated rainbow HSL vertex colors.

## Renderer

| Backend | Render | Post |
| --- | --- | --- |
| WebGPU | TSL `RenderPipeline` + `BloomNode` (via `WebGPUPostPipeline`) | bloom + vignette + grain + refraction + chromatic + grade + border + ACES + sRGB |
| WebGL2 | scene → RT(bright-extract) → gaussian blur(×2) → composite ShaderMaterial → screen | same chain, manual sRGB encode in GLSL |

**Parity guarantees** (bit-identical across backends):
- Bloom bright-extract: `smoothstep(threshold, threshold+0.1, luminance)` (matches `BloomNode`).
- ACES: `color*(6.2*color+0.03) / (color*(4.8*color+1.0) + 0.0001)` — epsilon prevents NaN on black pixels.
- Film grain: portable integer hash (NOT `sin()` — precision differs GLSL vs WGSL).
- sRGB encode: exact `sRGBTransferOETF` (manual in WebGL2 GLSL, `outputColorTransform=true` on WebGPU).

On-demand rendering: `renderer.update()` only called when `_needsRender=true`. Zero draw calls when idle.
Ambient breathing: 1-frame refresh every ~2.5s in idle (advances worldDNA time, keeps scene alive).

## Background system — EnvSphere

**EnvSphere** (`src/Experience/World/EnvSphere.ts`) — visible BackSide sphere mesh with procedural `CanvasTexture` (2048×1024, sRGB).

- `MeshBasicMaterial` (BackSide, `fog: false`, `depthTest: false`, `depthWrite: false`)
- `frustumCulled: false`, `renderOrder: -1000`
- 8 per-section patterns, mixed by animated `uSection` weights (~0.3s lerp on section change)
- Canvas redrawn when dirty, or every ~200ms for animated patterns (HSV)
- `prefers-reduced-motion` aware
- Starts on section 1 (Intro) — default weights `[0,1,0,0,0,0,0,0]`
- `scene.background` is NOT set — EnvSphere renders itself

## Particle system

`src/Sections/_shared/makeParticles.ts` — shared `THREE.Points` factory used by all 8 section creators.

- `THREE.Points` + built-in `PointsMaterial` (NOT NodeMaterial — reduces uniform groups on WebGL2)
- `baseOpacity` cached in `material.userData` for non-destructive fade
- `frustumCulled = false`
- Static when idle (event-driven — no drift, respects on-demand rendering)

## Dev-server / proxy config

| Setting | Value |
| --- | --- |
| `server.hmr` | `false` (WebSocket unstable through proxy) |
| `server.allowedHosts` | `['project.6la.ru']` |
| `block-vite-client` plugin | Strips `@vite/client` + stubs HTTP |
| CSS import | `?inline` (prevents @vite/client in CSS) |

## 21st.dev integration

[@21st-dev/cli](https://21st.dev) MCP for component discovery:
- API key format: `21st_sk_...`
- Endpoint: `https://21st.dev/api/mcp`
- Used to fetch: Atlas Aurora (id: 16166), Background Paper Shaders (id: 5732)
