# justlovejazz

Studio-grade interactive 3D portfolio. Vite 8 (rolldown) + TypeScript (strict)

- three 0.184 + WebGPU/WebGL2 + UIkit 3 + bun.

**SPA** with SwipeNav + UIMenu navigation: 6 sections (intro→contact),
3D canvas + transparent DOM overlay. Home sections are prerendered into
`index.html` at build time for SEO.

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
| --- | --- |
| [AGENTS.md](AGENTS.md) | **Start here** — agent instructions, rules, stop conditions |
| [STATUS](docs/STATUS.md) ⭐ | Canonical state — if conflict, STATUS wins |
| [ARCHITECTURE](docs/ARCHITECTURE.md) | Modules, render path, layout, navigation |
| [HERMES_RULES](docs/HERMES_RULES.md) | Hard rules with bug provenance |
| [JUNNI_REFERENCE](docs/JUNNI_REFERENCE.md) | Junni patterns to port (and NOT to port) |
| [ENVIRONMENT](docs/ENVIRONMENT.md) | Chrome/Wayland WebGPU issue + workarounds |
| [AUDIT](docs/AUDIT.md) | Gap analysis vs junni (all resolved — historical) |
| [CHANGELOG](docs/CHANGELOG.md) | Recent merge log |

## Stack

- **Framework:** Vite 8 (rolldown) + TypeScript (`strict: true`)
- **3D:** three 0.184 (TSL NodeMaterial allowed; raw ShaderMaterial banned in scene)
- **Renderer:** `WebGPURenderer` (WebGPU/WebGL2 auto-fallback)
- **UI:** UIkit 3 + Less (master-quantum-flares theme)
- **Navigation:** SwipeNav (one-section swiper) + UIMenu (UIkit modal)
- **Lint:** ESLint 9 flat config + Prettier
- **Test:** Playwright
- **Package manager:** bun

## Renderer

Single `WebGPURenderer` — auto-selects backend (WebGPU if available, else WebGL2).

| Backend | Render | Post-processing |
| --- | --- | --- |
| WebGPU | `renderer.render()` direct | none (ACES via renderer.toneMapping) |
| WebGL2 | ShaderMaterial RT pipeline | bloom + grain + vignette (single ACES pass) |

All scene materials are TSL NodeMaterial or built-in. No raw ShaderMaterial
in scene objects — incompatible with WebGPURenderer.

## Navigation

- **SwipeNav** (bottom bar): drag 0→100% to move to NEXT/PREV section (one at a time). |progress|>50% commits, <50% snaps back.
- **UIMenu** (UIkit modal, top-right hamburger): jump to any section.
- Page scroll is disabled (`body { overflow: hidden }`). Sections are absolute-stacked.

## Sections

| Section | 3D content | Background |
| --- | --- | --- |
| intro | SplashCube (baku) + particles | White (light) |
| about | Particles + DrawTrail | Dark |
| flexible | Particles (EMPTY placeholder) | Dark purple |
| challenge (works) | BakuCarousel (baku cube morphs into carousel ring) | Dark |
| innovative | Particles | Dark |
| contact | Particles | Light cream |
