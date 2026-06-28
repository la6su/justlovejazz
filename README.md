# justlovejazz

Studio-grade interactive 3D portfolio. Vite 8 (rolldown) + TypeScript (strict)
+ three 0.184 + WebGPU/WebGL2 + UIkit 3 + Lenis + bun.

**SPA** with scroll-snap navigation: 6 sections (intro→contact), 3D canvas +
transparent DOM overlay. Home sections are prerendered into `index.html` at
build time for SEO.

## Run

```bash
bun install          # install deps
bun run dev          # dev server (localhost:5173)
bun run type-check   # tsc --noEmit (strict mode)
bun run lint         # ESLint
bun run build        # production build
bun run test         # playwright e2e
bun run format       # Prettier write
```

For LAN access (faster WebGPU on Chrome/Wayland — see ENVIRONMENT.md):
```bash
bun run dev -- --host 0.0.0.0
```

## Docs

| File | Content |
|------|---------|
| [STATUS](docs/STATUS.md) ⭐ | Canonical state — if conflict, STATUS wins |
| [ARCHITECTURE](docs/ARCHITECTURE.md) | Modules, render path, layout, chunking |
| [HERMES_RULES](docs/HERMES_RULES.md) | Hard rules with bug provenance (READ FIRST) |
| [JUNNI_REFERENCE](docs/JUNNI_REFERENCE.md) | Junni patterns to port (and NOT to port) |
| [ENVIRONMENT](docs/ENVIRONMENT.md) | Chrome/Wayland WebGPU issue + workarounds |
| [AUDIT](docs/AUDIT.md) | Gap analysis vs junni (all resolved) |
| [CHANGELOG](docs/CHANGELOG.md) | Recent merge log |
| [AGENTS.md](AGENTS.md) | Agent instructions (rules, stop conditions) |

## Stack

- **Framework:** Vite 8 (rolldown) + TypeScript (`strict: true`)
- **3D:** three 0.184 (built-in materials only; TSL NodeMaterial forbidden in scene)
- **Renderer:** `WebGPURenderer` (WebGPU/WebGL2 auto-fallback)
- **UI:** UIkit 3 + Less, Lenis smooth scroll
- **Lint:** ESLint 9 flat config + Prettier
- **Test:** Playwright
- **Package manager:** bun

## Renderer

Single `WebGPURenderer` — auto-selects backend (WebGPU if available, else WebGL2).

| Backend | Render | Post-processing |
|---------|--------|-----------------|
| WebGPU | `renderer.render()` direct | none (ACES via renderer.toneMapping) |
| WebGL2 | ShaderMaterial RT pipeline | bloom + grain + vignette (single ACES pass) |

All scene materials are built-in (MeshStandard, MeshBasic, Points, LineBasic).
No ShaderMaterial in scene objects — incompatible with WebGPURenderer.

## Sections

| Section | 3D content | Background |
|---------|-----------|------------|
| intro | SplashCube (baku) | White |
| about | Particles + DrawTrail | Dark |
| flexible | Wireframe icosahedron + DrawTrail | Light |
| challenge | Works slider (project textures on cube faces) | Dark |
| innovative | Particles | Dark |
| contact | Particles | Dark |
