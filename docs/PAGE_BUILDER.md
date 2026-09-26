# Page builder

`/admin/` is a dev-only Vue editor inspired by YOOtheme's catalogue, outline,
preview, inspector and separate Style workspace. It does not ship YOOtheme
runtime code. Public builds exclude the admin entry and save endpoints.

## Sources

| Concern                                | Owner                                                            |
| -------------------------------------- | ---------------------------------------------------------------- |
| Dev shell and save API                 | `admin/main.ts`, `admin/vite-plugin.ts`                          |
| Document validation                    | `src/builder/schema.ts`                                          |
| Collection and publish selection       | `src/builder/documents.ts`                                       |
| Catalogue, grouped fields and defaults | `src/builder/catalog.ts`                                         |
| Commands and undo/redo                 | `src/builder/commands.ts`, `store.ts`                            |
| Shared Vue element registry            | `src/builder/vue/`                                               |
| Style controls and preview             | `src/builder/style.ts`, `style-showcase.ts`, `themeVariables.ts` |
| Less generation                        | `src/builder/compiler.ts`                                        |
| Authored collection                    | `src/builder/generated/documents.json`                           |
| Static publishing                      | `src/builder/publish.ts`, `scripts/publish-builder-pages.mjs`    |

Schema/validation/commands/compiler are framework-neutral. Editor preview and
static publishing share the Vue element registry. `render.ts` is only a
framework-neutral reference/test renderer, not the public renderer.

## Authoring and publishing

Schema v2 defines typed elements and allowlisted props. Root nodes are sections;
containers own ordered children. Text is escaped; URLs and media follow schema
validation. EN is canonical; optional `*Ru` fields fall back to EN. Preview
locale uses the shared app locale port, not another editor store.

The bounded `projects` list source reads local project data synchronously;
there is no arbitrary remote source or executable authored code. The desktop
editor offers desktop/tablet/mobile preview widths and selection/history tools.

`published: true` documents generate `/p/<slug>` and `/p/<slug>/ru` HTML with
self-canonical URLs and shared EN/RU/x-default alternates. Static pages load
neither the editor nor the 3D application. Per-page styles are generated during publishing.

## Save and style contract

`POST /__jlz-admin/save` uses `{ slug, document }`, validates at most 256 KiB,
upserts the collection and writes generated theme/component Less to fixed paths.
It compiles main Less before success and restores snapshots on failure.
The save body is strictly `{ slug, document }`; legacy `page.json`/bare-body
compatibility was removed (the handler rejects anything else with a 400).
The collection is multi-document, while the shared SPA theme outputs use the
saved document's style. Do not describe this as per-document runtime theming.

Style fields are typed allowlists, not arbitrary CSS/Less. Add controls through
`style.ts`, compiler mappings and preview variables/showcase together. The app's
base UIkit imports remain in `_import.less`; generated imports add optional
components. Generated theme variables load last. Cover schema/compiler parity,
preview locales/widths, undo, Save & Compile and reload persistence when editing.
