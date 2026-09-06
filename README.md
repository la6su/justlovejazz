# la6su

Interactive studio portfolio built as a Vite single-page application with
Vue 3, Vue Router and TresJS. The shipped runtime combines an inline,
FCP-friendly splash with one persistent TresJS scene, TSL NodeMaterials and a
single Three.js `WebGPURenderer`.

The renderer uses `WebGPUBackend` when hardware WebGPU is usable and the same
`WebGPURenderer` class with `WebGLBackend`/`forceWebGL` when it is not. Rendering
is demand-driven through one `RenderScheduler`; semantic Vue route content
remains above an `aria-hidden` canvas. The Vue/TresJS migration is complete;
the archived record is
[docs/archive/MIGRATION_VUE_TRES.md](docs/archive/MIGRATION_VUE_TRES.md), while active
architecture decisions live in [ADRs](docs/adr/README.md).

## Quick start

```bash
bun install
bun run dev
```

For the local end-to-end suite, install Playwright's managed Chromium once:

```bash
bunx playwright install chromium
bun run test
```

The full quality gate is documented in
[docs/DEVELOPMENT.md](docs/DEVELOPMENT.md).

## Routes

| Route                      | Page                              |
| -------------------------- | --------------------------------- |
| `/`                        | Studio home                       |
| `/services`                | Services                          |
| `/works`                   | Works                             |
| `/manifesto`               | Manifesto                         |
| `/lab`                     | Lab                               |
| `/contact`                 | Contact                           |
| `/blog` and `/blog/[slug]` | Standalone prerendered blog pages |

Each SPA route uses the same six-face navigation model: four visible main
sections plus secret Lab and Menu sections. The menu supports deep links such
as `/services#section-services-02`.

## Runtime at a glance

`index.html splash → entry shell → lazy Vue app → Vue Router → AppShell.vue → persistent SceneHost.vue → TresCanvas`

`SceneHost` owns the single canvas and renderer surface. `Experience` and its
scene owners provide the authored world; `RenderScheduler` owns the demand-
driven loop; typed route, locale, theme, motion and story ports keep semantic
Vue state separate from GPU resources. Navigation never remounts the scene
root, and every owner has an explicit teardown path.

## Documentation

Use [docs/README.md](docs/README.md) for the ownership map. The primary
technical reference is [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md), and local
verification lives in [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md). Open work is
tracked only in [NEXT.md](NEXT.md); migration history is preserved in the
[archive](docs/archive/MIGRATION_VUE_TRES.md).
