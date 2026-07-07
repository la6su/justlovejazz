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
| [STATUS.md](docs/STATUS.md) ⭐ | Canonical state (visual tiers, background system, recent PRs) |
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | Modules, render path, visual tiers, background system |
| [HERMES_RULES.md](docs/HERMES_RULES.md) | 36 hard rules |
| [JUNNI_REFERENCE.md](docs/JUNNI_REFERENCE.md) | Patterns to port / NOT port |
| [CHANGELOG.md](docs/CHANGELOG.md) | Recent changes (visual overhaul 2026-07-09) |

## Stack

| Layer | Tech |
| --- | --- |
| Framework | Vite 8 (rolldown) + TypeScript strict |
| 3D | Three.js 0.184 + TSL NodeMaterial |
| Renderer | WebGPURenderer (WebGPU/WebGL2 auto-fallback with SwiftShader detection) |
| UI | UIkit 3 + Less (master-quantum-flares theme) |
| Navigation | CircularNav (vinyl circle) + UIMenu (UIkit modal) |
| Background | ShaderBackground (TSL port of @reuno-ui paper-shaders) |
| Lint | ESLint 9 + Prettier |
| Test | Vitest (54 tests) |
| PM | bun |

## Visual tiers

The project has TWO visual paths, gated by `DeviceCapability.isRealWebGPU`:

| Tier | Path | Baku cube | Background |
| --- | --- | --- | --- |
| **Premium** | Real WebGPU | `MeshPhysicalNodeMaterial` + `transmission=1` (real glass) + 4 TSL worldDNA nodes (fresnel iridescence, rim glow, vertex displacement, audio-reactive) | ShaderBackground (TSL, dark grey paper-shader) |
| **Parity** | WebGL2 / fallback | `MeshPhysicalMaterial` + opacity-glass (no TSL nodes) | ShaderBackground (TSL, dark grey paper-shader) |

`isRealWebGPU` is set in `Renderer.init()` after backend detection. Logged to console on startup:
```
[Renderer.init] Final path: WebGPU (WebGPUBackend) | isRealWebGPU=true
[Renderer.init] Premium WebGPU path active — TSL worldDNA nodes + real transmission enabled
```

## Renderer

| Backend | Render | Post |
| --- | --- | --- |
| WebGPU | TSL RenderPipeline | bloom + vignette + grain + ACES |
| WebGL2 | ShaderMaterial RT pipeline | bloom + grain + vignette |

On-demand rendering: `renderer.update()` only called when `_needsRender=true`. Zero draw calls when idle.
Ambient breathing: 1-frame refresh every ~2.5s in idle (advances worldDNA time, keeps scene alive).

## Navigation

- **CircularNav** (bottom-right vinyl circle): drag DOWN=next, UP=prev. Progress 0→1 drives 3D.
- **UIMenu** (UIkit modal): hamburger button, jump to any section.
- **BakuCarousel** (works §4): cube morphs into ring. Card click → fullscreen overlay.

## Sections

| Section | 3D content | BG |
| --- | --- | --- |
| intro | SplashCube (baku), particles | Dark grey (paper-shader) |
| about | Particles | Dark grey (paper-shader) |
| flexible | Particles (placeholder) | Dark grey (paper-shader) |
| challenge (works) | BakuCarousel + DrawTrail + particles | Dark grey (paper-shader) |
| innovative | Particles | Dark grey (paper-shader) |
| contact | Particles | Dark grey (paper-shader) |

## Background system

**ShaderBackground** — port of [@reuno-ui/background-paper-shaders](https://21st.dev/@reuno-ui/components/background-paper-shaders)
(21st.dev id: 5732, "Background Paper Shade with grey shaders") into TSL.

- `MeshBasicNodeMaterial` with `positionNode` (vertex displacement) + `colorNode` (noise + color mix)
- Dark grey palette: `0x1a1a1a` → `0x4a4a4a`
- 2-octave sine/cosine noise + subtle silver shimmer + paper undulation
- Opaque, fullscreen at `z=-30`, `renderOrder=-1000`
- `prefers-reduced-motion` aware

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
