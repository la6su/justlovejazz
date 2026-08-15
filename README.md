# la6su

Interactive studio portfolio built as a Vite single-page application. The
current experience combines an inline, FCP-friendly splash with a Three.js
scene that uses TSL NodeMaterials and selects WebGPU or a classic WebGL2 path
at runtime.

The project is now migrating to Vue 3, Vue Router and TresJS. The target uses
one Three.js `WebGPURenderer` with WebGPU and WebGL2 backends, one TSL post
graph and one demand-driven scheduler. This is a staged target, not the current
production runtime; follow the
[migration plan](docs/MIGRATION_VUE_TRES.md) and [ADRs](docs/adr/README.md).

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

## Current runtime at a glance

`index.html → entry-shell.ts → entry-app.ts → Experience.ts`

The inline splash is visible before the Three.js import. The Enter control only
activates after `jlz:webgl-ready`; failure shows an error state rather than an
uninitialised scene. A fixed top bar provides language, theme and sound
controls; trackpad, mouse wheel, touch and keyboard arrows drive the vertical
story track.

## Target runtime at a glance

`index.html splash → lazy Vue app → Vue Router → persistent TresCanvas → custom WebGPURenderer → WorldRoot`

The splash remains outside Vue. Semantic route components remain above an
`aria-hidden` scene. A typed route manifest and state ports replace duplicated
route/DOM checks, while route resource scopes preserve cancellation and GPU
disposal. The classic WebGL renderer is removed only after the representative
WebGLBackend/TSL gate passes.

## Documentation

Use [docs/README.md](docs/README.md) for the ownership map. The primary
technical reference is [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md), and local
verification lives in [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md). Migration
execution lives only in [docs/MIGRATION_VUE_TRES.md](docs/MIGRATION_VUE_TRES.md).
