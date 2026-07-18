# la6su

Interactive studio portfolio built as a Vite single-page application. The
experience combines an inline, FCP-friendly splash with a Three.js scene that
uses TSL NodeMaterials and selects WebGPU or WebGL2 at runtime.

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

`index.html → entry-shell.ts → entry-app.ts → main-app.ts → Experience.ts`

The inline splash is visible before the Three.js import. The Enter control only
activates after `jlz:webgl-ready`; failure shows an error state rather than an
uninitialised scene. A fixed top bar provides language, theme and sound
controls; trackpad, mouse wheel, touch and keyboard arrows drive the vertical
story track.

## Documentation

Use [docs/README.md](docs/README.md) for the ownership map. The primary
technical reference is [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md); hard
engineering constraints live in [docs/RULES.md](docs/RULES.md).
