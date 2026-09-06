---
name: uikit3
description: UIKit 3 framework contracts and the JUSTLOVEJAZZ page-builder reference. Load for UIkit component/Less/theme work, builder changes (catalogue, inspector, preview, generated theme), or when aligning the editor with the yotheme.pro (YOOtheme Pro) page-builder pattern.
---

# UIKit 3 framework + page-builder reference

## UIKit 3 contracts

- Pinned UIkit 3.25.x; source of truth is
  `node_modules/uikit/src/less/components/*.less` (Less) and
  `node_modules/uikit/dist/js/uikit.js` (full UMD build). Import the default
  export: `import UIkit from 'uikit'`.
- Component markup = `uk-*` presentation classes + `uk-<component>` data
  attributes for the JS layer (grid, icon, navbar, tooltip…). The JS layer
  owns state, focus and ARIA; the application owns routes and scene state.
  Never restyle JS-owned states with app CSS — override the Less variable.
- Theming happens in exactly one place: `src/assets/_import.less`
  (tokens → UIkit Less variables), assembled before the component imports.
  The typed mirror `src/core/brandTokens.ts` stays key-for-key in sync,
  locked by the brand token parity test.
- The application baseline imports a fixed component set
  (`src/assets/_import.less`). Anything extra a saved builder document
  needs is emitted into `src/assets/builder/components.generated.less` by
  the compiler — never hand-edit generated files.
- Console icon set: `src/assets/console-icons.ts` registers 15 original
  SVGs through `UIkit icon.add`. The `uikit` default export bundles only the
  internal glyphs (spinner, totop, marker) — the official set ships as the
  separate UMD plugin `uikit/dist/js/uikit-icons.js`, which `admin/style-icons.ts`
  applies for the Style rail. Both the product entry and the admin preview
  call `registerConsoleIcons()`; without it `uk-icon` renders
  nothing (the Icon component throws "Icon not found." and the promise
  swallows it — a silent blank span).
- Display type: Commissioner variable font, UPPERCASE, weight 800
  (`--jlz-vf-weight` axes in the product). The φ scale owns heading sizes
  (ADR 0007); UIkit heading tiers map to φ steps in the console theme.
- Console-minimal language (owner ruling): square corners (radius 0), flat
  surfaces, no glow, 1px hairlines, mono tracked uppercase meta, accent as
  color. 3D scene glow is scene, not UI — leave it.

## Page-builder reference (yotheme.pro pattern)

The builder is the YOOtheme Pro pattern (yotheme.pro, active license) in
miniature: a grouped element catalogue on the left, a document outline, a
WYSIWYG preview, a grouped property inspector on the right and a separate
Style workspace. YOOtheme Pro is the UX reference: element groups in the
left rail, properties grouped by concern (Content / Typography / Layout /
Style) with the selected element identified by its stable name, and theme
tokens edited outside the element flow.

| Concern                    | Owner                                               |
| -------------------------- | --------------------------------------------------- |
| Document schema/version    | `src/builder/schema.ts`                             |
| Element catalogue + groups | `src/builder/catalog.ts` (`BUILDER_CATALOG_GROUPS`) |
| Markup renderer            | `src/builder/render.ts`                             |
| Theme + Style workspace    | `src/builder/style.ts`, `style-showcase.ts`         |
| Preview variables          | `src/builder/themeVariables.ts`                     |
| Less compiler              | `src/builder/compiler.ts`                           |
| Document store/history     | `src/builder/store.ts` (`BuilderStore`)             |
| Development editor         | `admin/` (desktop-only shell)                       |
| Stored document            | `src/builder/generated/page.json`                   |

Rules of the pattern:

- The catalogue is the single source of element truth: types, grouped
  fields (`fieldGroups`), create defaults and the UIkit components each
  type pulls. The inspector renders the same `fieldGroups` — never
  duplicate field lists in the editor.
- The catalogue exposes only what the product can render. Element types
  and their safe values live in the renderer's whitelists; untrusted
  document props fall back, they never execute.
- WYSIWYG law: the preview renders with the same font, icon set, tokens
  and breakpoint behavior as the compiled page (container queries mirror
  the compiled `@m` pivot; Commissioner and console icons are loaded in
  `admin/index.html` / `admin/main.ts`).
- Theme changes flow `page.json` → `validateBuilderDocument` →
  `generateBuilderThemeLess` / `generateBuilderComponentLess`; the
  defaults in `style.ts` and the stored document must agree. `themeToCssVars`
  is the single preview-variable map (47 entries, including
  `--builder-accent-secondary`); the brand carries a secondary accent
  (`jlz-color-accent-secondary`, aliased to the cool signal) so actions
  and emphasis have a cool mineral counterweight to the primary accent.
  The Style workspace edits these tokens: the left rail lists every group
  with a UIkit glyph and its field count (16 groups — one per element
  family the catalogue composes), and the right panel splits the
  selected group's properties into Colors / Values sections with the
  group's id badge — the same grouped panel language as the element
  inspector. The style preview always shows the complete component set;
  selecting a group marks its sample active (1px accent outline) and
  scrolls it into view instead of hiding the rest. The Heading sample
  renders the full six-level scale (2xlarge through level six); the
  Base sample is body copy only.
- The admin shell is desktop-only (owner ruling); only the preview's
  viewport modes (desktop / tablet / mobile) may simulate narrow layouts.
- SFC migration target: the Vue admin preserves `BuilderStore` semantics
  (shortcuts, history, saved baseline) 1:1 when the panels move to SFCs.

## Verification

- `bun x vue-tsc --noEmit -p tsconfig.json`, the brand token parity test,
  the builder unit tests, and the production build with the admin graph
  absent from `dist`.
- Builder work: add every changed element through the UI, check all three
  preview viewport modes, confirm zero console errors, and restore the
  document with real `Ctrl+Z` keypresses (never click Save during smoke).
- Icon work: confirm the SVG actually renders in the preview (the Icon
  component inserts it asynchronously; wait a frame).
