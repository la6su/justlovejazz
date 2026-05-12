# justlovejazz

Cinematic interactive studio portfolio built with [Three.js](https://threejs.org/) (TSL), [WebGPU](https://gpuweb.github.io/gpu-web/), and Vite.

> Inspired by the production quality of [junni-inc/next.junni.co.jp](https://github.com/junni-inc/next.junni.co.jp).

## Status

| Area | Status |
|------|--------|
| Core infra (types, config, WebGPU renderer) | ✅ |
| Cinematic camera (FOV, shake, Baku follow) | ✅ |
| Post-processing chain (bloom, grain, vignette) | ✅ |
| 3D gallery (expand/contract transitions) | ✅ |
| Project detail modal pipeline | ✅ |
| DPR cap + Bicubic filtering | ✅ |
| Lazy loading (chunk split, deferred assets) | 🔄 |
| WebGL fallback | ❌ |
| a11y audit | ❌ |
| E2E tests | ❌ |

## Stack

| Layer | Tech |
|-------|------|
| Language | TypeScript (strict) |
| Build | Vite 8 (rolldown) |
| 3D | Three.js 18.4 — TSL / Nodes |
| GPU | WebGPU primary |
| Scroll | Lenis |
| UI | UIkit 3 + Less |

## Run

```bash
npm run dev
npm run build
```

## Architecture

```
src/
├── core/                  # Bootstrapper, CameraStateManager, GalleryManager, WorldConfig
├── Experience/            # Renderer, Camera, Input, SmoothScroll
├── Experience/World/      # Baku, Environment, GalleryScene
├── shaders/               # ProjectMaterial, postprocessing.tsl, tsl-utils, noise
└── UI/                    # ProjectDetail, GalleryUI
```

Single render loop: `Experience.update()` drives everything (camera, scene, post, UI state).

## Docs

| File | Content |
|------|---------|
| [CONCEPT](docs/CONCEPT.md) | Design principles, patterns, anti-patterns |
| [SPEC](docs/SPEC.md) | Technical spec, renderer contract, materials |
| [ARCHITECTURE](docs/ARCHITECTURE.md) | Module responsibilities, pipeline, types |
| [ROADMAP](docs/ROADMAP.md) | Phased plan & completion status |
| [LAZY_LOADING](docs/LAZY_LOADING.md) | Progressive loading plan |
| [AUTONOMY](docs/AUTONOMY.md) | LLM agent work protocol |
| [CHANGELOG](docs/CHANGELOG.md) | Activity log |

## Production Gate

- `npm run build` passes
- Desktop: stable 60 FPS; Mobile: ≥ 45 FPS
- WebGPU primary; Android fallback defined
- Lighthouse: Performance ≥ 85 / Accessibility ≥ 90
- No memory growth after transitions
