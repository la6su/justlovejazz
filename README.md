# justlovejazz

Studio-grade interactive 3D portfolio. Vite 8 (rolldown) + TypeScript (strict)
+ three 0.184 + WebGPU/WebGL2 + UIkit 3 + bun.

**SPA** with CircularNav + UIMenu navigation: 6 sections (intro→contact),
3D canvas + transparent DOM overlay. Home sections prerendered into
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

For LAN access (faster WebGPU on Chrome/Wayland — see [docs/ENVIRONMENT.md](docs/ENVIRONMENT.md)):

```bash
bun run dev -- --host 0.0.0.0
```

## Docs (priority order)

| File | Content |
| --- | --- |
| [AGENTS.md](AGENTS.md) | **Start here** — agent instructions, rules, stop conditions |
| [docs/STATUS](docs/STATUS.md) ⭐ | Canonical state — if conflict, STATUS wins |
| [docs/ARCHITECTURE](docs/ARCHITECTURE.md) | Modules, render path, layout, navigation |
| [docs/HERMES_RULES](docs/HERMES_RULES.md) | Hard rules with bug provenance |
| [docs/JUNNI_REFERENCE](docs/JUNNI_REFERENCE.md) | Junni patterns to port (and NOT to port) |
| [docs/ENVIRONMENT](docs/ENVIRONMENT.md) | Chrome/Wayland WebGPU issue + workarounds |
| [docs/AUDIT](docs/AUDIT.md) | Gap analysis vs junni (all resolved — historical) |
| [docs/CHANGELOG](docs/CHANGELOG.md) | Recent merge log |

## Stack

| Layer | Tech |
| --- | --- |
| Framework | Vite 8 (rolldown) + TypeScript (`strict: true`) |
| 3D | three 0.184 (TSL NodeMaterial allowed; raw ShaderMaterial banned in scene) |
| Renderer | `WebGPURenderer` (WebGPU/WebGL2 auto-fallback) |
| UI | UIkit 3 + Less (master-quantum-flares theme) |
| Navigation | CircularNav (vinyl-record dial) + UIMenu (UIkit modal) |
| Lint | ESLint 9 flat config + Prettier |
| Test | Playwright |
| Package manager | bun |

## Renderer

Single `WebGPURenderer` — auto-selects backend (WebGPU if available + not
SwiftShader fallback, else hardware WebGL2).

| Backend | Render | Post-processing |
| --- | --- | --- |
| WebGPU | TSL RenderPipeline (`WebGPUPostPipeline`) | bloom + vignette + grain + color grade (TSL Fn nodes) |
| WebGL2 | ShaderMaterial RT pipeline | bloom + grain + vignette + chromatic + refraction + grade (single ACES pass) |

All scene materials: built-in or TSL NodeMaterial. No raw ShaderMaterial in
scene objects — incompatible with WebGPURenderer. ONE shared NodeMaterial per
multi-face object (WebGL binding-point limit).

## Navigation

| Surface | Role |
| --- | --- |
| **CircularNav** | Bottom-right vinyl-record dial. Drag along arc → NEXT/PREV (one section). Tap dot → jump. Keyboard arrows + Home/End. |
| **UIMenu** | UIkit modal (`uk-modal`). Hamburger button (center of dial) opens jump-nav overlay. |
| **BakuCarousel card click** | Raycast hit on works-section card → ProjectOverlay fullscreen. |

Page scroll is disabled (`body { overflow: hidden }`). Sections are
absolute-stacked. `.section-active` toggles visibility on `jlz:section-change`.

## Sections

| Section | 3D content | Background |
| --- | --- | --- |
| intro | SplashCube (baku) + particles | White (light) |
| about | Particles + DrawTrail | Dark |
| flexible | Particles (EMPTY placeholder) | Dark purple |
| challenge (works) | BakuCarousel (baku cube morphs into carousel ring) | Dark |
| innovative | Particles | Dark |
| contact | Particles | Light cream |

## Dev-server / proxy config

| Setting | Value | Why |
| --- | --- | --- |
| `server.hmr` | `false` | WebSocket unstable through Caddy reverse proxy → reload loop |
| `server.allowedHosts` | `['project.6la.ru']` | Proxy host forwarding to localhost:5173 |
| `block-vite-client` plugin | strips `@vite/client` script tag + stubs HTTP request | `@vite/client` resolves to Next.js app through proxy (returns HTML, breaks modules) |
| `main.less` import | `?inline` suffix | Prevents `@vite/client` `updateStyle`/`removeStyle` injection in CSS |
| `import.meta.hot` | removed from all source | HMR triggers `@vite/client` injection (see above) |

See [docs/STATUS.md](docs/STATUS.md) → "Proxy/dev-server config".
