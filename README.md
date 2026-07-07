# justlovejazz

Studio-grade interactive 3D portfolio. Vite 8 (rolldown) + TypeScript (strict).

Three.js 0.184 + WebGPU/WebGL2 + UIkit 3 + Less + bun.

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
| [AGENTS.md](AGENTS.md) | **Start here** — rules, navigation model |
| [STATUS.md](docs/STATUS.md) ⭐ | Canonical state |
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | Modules, render path, on-demand rendering |
| [HERMES_RULES.md](docs/HERMES_RULES.md) | 36 hard rules |
| [JUNNI_REFERENCE.md](docs/JUNNI_REFERENCE.md) | Patterns to port / NOT port |
| [CHANGELOG.md](docs/CHANGELOG.md) | Recent changes |

## Stack

| Layer | Tech |
| --- | --- |
| Framework | Vite 8 (rolldown) + TypeScript strict |
| 3D | Three.js 0.184 + TSL NodeMaterial |
| Renderer | WebGPURenderer (WebGPU/WebGL2 auto-fallback) |
| UI | UIkit 3 + Less (master-quantum-flares theme) |
| Navigation | CircularNav (vinyl circle) + UIMenu (UIkit modal) |
| Lint | ESLint 9 + Prettier |
| Test | Vitest (54 tests) |
| PM | bun |

## Renderer

| Backend | Render | Post |
| --- | --- | --- |
| WebGPU | TSL RenderPipeline | bloom + vignette + grain + ACES |
| WebGL2 | ShaderMaterial RT pipeline | bloom + grain + vignette |

On-demand rendering: `renderer.update()` only called when `_needsRender=true`. Zero draw calls when idle.

## Navigation

- **CircularNav** (bottom-right vinyl circle): drag DOWN=next, UP=prev. Progress 0→1 drives 3D.
- **UIMenu** (UIkit modal): hamburger button, jump to any section.
- **BakuCarousel** (works §4): cube morphs into ring. Card click → fullscreen overlay.

## Sections

| Section | 3D content | BG |
| --- | --- | --- |
| intro | SplashCube (baku), particles | White (light) |
| about | Particles | Dark |
| flexible | Particles (placeholder) | Dark purple |
| challenge (works) | BakuCarousel + DrawTrail + particles | Dark |
| innovative | Particles | Dark |
| contact | Particles | Dark |

## Dev-server / proxy config

| Setting | Value |
| --- | --- |
| `server.hmr` | `false` (WebSocket unstable through proxy) |
| `server.allowedHosts` | `['project.6la.ru']` |
| `block-vite-client` plugin | Strips `@vite/client` + stubs HTTP |
| CSS import | `?inline` (prevents @vite/client in CSS) |
