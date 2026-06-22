# justlovejazz

Studio-grade interactive 3D portfolio. Vite 8 + TypeScript strict + three 0.184 + TSL + WebGPU/WebGL2 + UIkit 3 + Lenis + bun.

**SPA** with hash routing: `#/` (Home), `#/trinity` (Process), `#/works` (Portfolio).

Inspired by `junni-inc/next.junni.co.jp` (patterns only, no assets/content).

## Run

```bash
bun install          # install deps
bun run dev          # dev server (localhost:5173)
bun run type-check   # tsc --noEmit
bun run build        # production build
bun test             # playwright e2e
```

For LAN access (faster WebGPU on Chrome/Wayland — see ENVIRONMENT.md):
```bash
bun run dev -- --host 0.0.0.0
# open http://<your-lan-ip>:5173/
```

## Docs

| File | Content |
|------|---------|
| [STATUS](docs/STATUS.md) ⭐ | Canonical state — if conflict, STATUS wins |
| [HERMES_RULES](docs/HERMES_RULES.md) | 10 hard rules with bug provenance (READ FIRST) |
| [ARCHITECTURE](docs/ARCHITECTURE.md) | Modules, render path, routes |
| [ENVIRONMENT](docs/ENVIRONMENT.md) | Chrome/Wayland WebGPU issue + workarounds |
| [JUNNI_PORT_BLUEPRINT](docs/JUNNI_PORT_BLUEPRINT.md) | Junni → modern stack port map |
| [AUTONOMY](docs/AUTONOMY.md) | LLM agent protocol |
| [CHANGELOG](docs/CHANGELOG.md) | Recent merge log |
| [AGENTS.md](AGENTS.md) | Agent instructions (rules, stop conditions) |

## Stack

- **Framework:** Vite 8 (rolldown) + TypeScript strict
- **3D:** three 0.184 + TSL, WebGPURenderer (WebGPU/WebGL2 auto-fallback)
- **UI:** UIkit 3 + Less, Lenis smooth scroll
- **Text:** troika-three-text (disabled for perf, DOM text instead)
- **Test:** Playwright
- **Package manager:** bun

## Renderer

Single `WebGPURenderer` — auto-selects backend (WebGPU if available, else WebGL2).
TSL compiles to both WGSL and GLSL. No manual renderer switching.

| Backend | Render | Post-processing |
|---------|--------|-----------------|
| WebGPU | `renderer.render()` direct | none (ACES via renderer.toneMapping) |
| WebGL2 | ShaderMaterial RT pipeline | bloom + grain + vignette |

All scene materials are built-in (MeshStandard, MeshBasic, Points, LineBasic).
No ShaderMaterial in scene objects — incompatible with WebGPURenderer.
