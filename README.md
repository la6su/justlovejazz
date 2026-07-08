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
| [AGENTS.md](AGENTS.md) | **Start here** — rules, navigation model, 21st.dev MCP usage |
| [STATUS.md](docs/STATUS.md) ⭐ | Canonical state (visual tiers, background system, removed modules) |
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | Modules, render path, visual tiers, background system, parity guarantees |
| [HERMES_RULES.md](docs/HERMES_RULES.md) | Hard rules (43) |
| [JUNNI_REFERENCE.md](docs/JUNNI_REFERENCE.md) | Patterns to port / NOT port |
| [CHANGELOG.md](docs/CHANGELOG.md) | Recent changes (EnvSphere + parity + YAGNI cleanup 2026-07-10) |

## Stack

| Layer | Tech |
| --- | --- |
| Framework | Vite 8 (rolldown) + TypeScript strict |
| 3D | Three.js 0.184 + TSL NodeMaterial |
| Renderer | WebGPURenderer (WebGPU/WebGL2 auto-fallback with SwiftShader detection) |
| UI | UIkit 3 + Less (master-quantum-flares theme) |
| Navigation | CircularNav (vinyl circle) + UIMenu (UIkit modal) + Subtitles (section hints) |
| Background | EnvSphere (BackSide sphere + procedural CanvasTexture) |
| Lint | ESLint 9 + Prettier |
| Test | Vitest (54 tests) |
| PM | bun |

## Visual tiers

The project has TWO visual paths, gated by `DeviceCapability.isRealWebGPU`:

| Tier | Path | Baku cube | Background |
| --- | --- | --- | --- |
| **Premium** | Real WebGPU | `MeshPhysicalNodeMaterial` + `transmission=1` (real glass) + 4 TSL worldDNA nodes (fresnel iridescence, rim glow, vertex displacement, audio-reactive) | EnvSphere (BackSide sphere + CanvasTexture) |
| **Parity** | WebGL2 / fallback | `MeshPhysicalMaterial` + opacity-glass (no TSL nodes) | EnvSphere (BackSide sphere + CanvasTexture) |

`isRealWebGPU` is set in `Renderer.init()` after backend detection. Logged to console on startup:
```
[Renderer.init] Final path: WebGPU (WebGPUBackend) | isRealWebGPU=true
[Renderer.init] Premium WebGPU path active — TSL worldDNA nodes + real transmission enabled
```

## Renderer

| Backend | Render | Post |
| --- | --- | --- |
| WebGPU | TSL `RenderPipeline` + `BloomNode` (via `WebGPUPostPipeline`) | bloom + vignette + grain + refraction + chromatic + grade + border + ACES + sRGB |
| WebGL2 | scene → RT(bright-extract) → gaussian blur(×2) → composite ShaderMaterial → screen | same chain, manual sRGB encode in GLSL |

**Parity guarantees** (bit-identical across backends):
- Bloom bright-extract: `smoothstep(threshold, threshold+0.1, luminance)` (matches `BloomNode`).
- ACES: `color*(6.2*color+0.03) / (color*(4.8*color+1.0) + 0.0001)` — epsilon prevents NaN on black pixels.
- Film grain: portable integer hash (NOT sin() — precision differs GLSL vs WGSL).
- sRGB encode: exact `sRGBTransferOETF` (manual in WebGL2 GLSL, `outputColorTransform=true` on WebGPU).

On-demand rendering: `renderer.update()` only called when `_needsRender=true`. Zero draw calls when idle.
Ambient breathing: 1-frame refresh every ~2.5s in idle (advances worldDNA time, keeps scene alive).

## Navigation

- **CircularNav** (bottom-right vinyl circle): drag DOWN=next, UP=prev. Progress 0→1 drives 3D.
- **UIMenu** (UIkit modal): hamburger button, jump to any section.
- **BakuCarousel** (works §4): cube morphs into ring. Card click → fullscreen overlay.
- **Subtitles** (bottom-center): section hints ("Scroll to explore", "Drag · Click to open"). Auto-fade 4s.

## Sections

| Idx | Section | 3D content | BG pattern |
| --- | --- | --- | --- |
| 0 | intro | SplashCube (baku), particles | HSV gradient (light) |
| 1 | about | Particles + WireframeTypography | Grey gradient (dark) |
| 2 | flexible | Particles (placeholder) | Grey gradient (dark) |
| 3 | challenge (works) | BakuCarousel + DrawTrail + particles | Blue-grey gradient (dark) |
| 4 | innovative | Particles | Center glow (dark) |
| 5 | contact | Particles | Off-white gradient (light) |

## Background system — EnvSphere

**EnvSphere** (`src/Experience/World/EnvSphere.ts`) — visible BackSide sphere mesh with a
procedural `CanvasTexture` (2048×1024, sRGB).

- `MeshBasicMaterial` (BackSide, `fog: false`, `depthTest: false`, `depthWrite: false`)
- `frustumCulled: false`, `renderOrder: -1000`
- 6 per-section patterns (HSV gradient, grey gradient, blue-grey gradient, radial glow,
  off-white gradient), mixed by animated `uSection` weights (~0.3s lerp on section change)
- Canvas redrawn when dirty, or every ~200ms for animated patterns (HSV, horizon)
- `prefers-reduced-motion` aware
- `scene.background` is NOT set — EnvSphere renders itself

## Particle system

`src/Sections/_shared/makeInstancedParticles.ts` — GPU-instanced particles with TSL shader.

- `InstancedMesh` (500–2000 instances, 1 draw call regardless of count)
- `MeshBasicNodeMaterial` with TSL `positionNode` (drift) + `colorNode` (twinkle) + `opacityNode` (soft circle)
- LOD: `count/2` on medium tier, `count/4` on low tier
- `frustumCulled: false`, `baseOpacity` cached in `userData`
- Frozen when idle (on-demand — drift only advances when rendering)

## Dev-server / proxy config

| Setting | Value |
| --- | --- |
| `server.hmr` | `false` (WebSocket unstable through proxy) |
| `server.allowedHosts` | `['project.6la.ru']` |
| `block-vite-client` plugin | Strips `@vite/client` + stubs HTTP |
| CSS import | `?inline` (prevents @vite/client in CSS) |

## 21st.dev integration

The project uses [@21st-dev/cli](https://21st.dev) MCP for component discovery:
- API key format: `21st_sk_...`
- Endpoint: `https://21st.dev/api/mcp`
- Used to fetch: Atlas Aurora (id: 16166), Background Paper Shaders (id: 5732)
