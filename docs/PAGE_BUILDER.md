# UIkit Page Builder

This document describes the current implementation and its planned Vue
ownership. The versioned schema, validation and compiler remain framework-free;
only the development editor and public rendering adapters migrate.

The Page Builder is a project-owned development tool inspired by the workflow
of visual theme builders. It does not embed or redistribute the supplied
YOOtheme runtime. UIkit semantics and the existing JUSTLOVEJAZZ Less theme
remain the rendering authority.

## Boundary

```text
admin/                         development application; never a build input
  index.html                   separate /admin/ document
  main.ts + admin.less         editor, preview and inspector
  vite-plugin.ts               fixed-path save and Less compilation API

src/builder/                   production-safe shared core
  schema.ts                    versioned document contract and validation
  style.ts                     typed Style groups, fields and defaults
  style-showcase.ts            trusted UIkit component preview catalogue
  catalog.ts                   supported elements, fields and CSS dependencies
  render.ts                    escaped semantic UIkit markup
  compiler.ts                  theme and component-manifest generators
  generated/page.json          saved source document

src/assets/builder/
  theme.generated.less         validated theme-token overrides
  components.generated.less    optional UIkit imports used by saved documents
```

The target boundary replaces `admin/main.ts` with a separate dev-only Vue
application entry and adds a Vue renderer for the same
`src/builder/schema.ts` document. It does not create a second schema, catalogue,
validator or compiler. Public routes and the editor preview must render through
the same typed element registry so a component is implemented once and tested
in both contexts.

`vite.config.ts` installs the save API with `apply: 'serve'`. The production
input list does not contain `admin/index.html`, so inspector code, editing
state and dev endpoints cannot enter `dist`. The two generated Less files are
imported by the normal theme assembly and therefore participate in the same
production compilation as hand-authored theme sources.

## Current document model

Version 2 supports twelve typed elements. Root nodes are sections; container
elements own ordered children. Copy is plain text, links accept internal paths,
anchors, mail links and HTTPS, and rendering escapes all authored values.
The `list` element can optionally resolve the bounded `projects` source from
the existing project manifest, with an allowlisted field (`title`,
`description`, `year` or `category`) and a 1–12 item limit. Resolution is
synchronous, local and deterministic; an absent source keeps authored lines.
Authored copy has one canonical English value plus an optional `*Ru` override
for headings, text, buttons, links, list items, image alt text and video
accessible labels. The render contract accepts `EN`/`RU`; RU falls back to the
English value when an override is absent. The admin preview follows the app's
typed locale port. Approved documents publish both `/p/<slug>` (EN) and
`/p/<slug>/ru` (RU) standalone routes; the Russian route uses localized
metadata when supplied and otherwise falls back to English.

The editor provides:

- element catalogue and hierarchical outline;
- preview selection and a schema-driven inspector;
- add, reorder, duplicate, delete, undo and redo;
- desktop, tablet and mobile preview widths;
- a separate Style workspace organized as `Global`, `Theme`, `Inverse` and
  component groups, following the useful information architecture of visual
  UIkit stylers without copying their runtime;
- a complete or focused UIkit component showcase with Default and Inverse
  preview tones;
- whitelisted global, typography, spacing, inverse, button, card, section,
  form and navbar decisions;
- atomic Save & Compile with strict validation and Less compilation before a
  successful response.
- an EN/RU preview toggle wired to the shared application locale port; the
  active locale is visible in the toolbar and updates the Vue preview without
  creating a second editor locale store.

## Save and compilation

`POST /__jlz-admin/save` accepts at most 256 KB and writes only three fixed
project paths. IDs, colors, radius values and document structure are validated
before generation. If Less compilation fails, the previous files are restored.

Style values are not free-form CSS or Less. Every editable decision is declared
in `style.ts`, validated by type and allowlist, compiled into known Less
variables, and rendered through a trusted showcase. The generated theme file is
loaded last in the Less variable graph so saved decisions override UIkit
component defaults while the project-owned hooks remain authoritative.

Production CSS selection is dependency-based. Core UIkit components needed by
the existing SPA stay in `_import.less`; optional components referenced by the
saved builder document are emitted into `components.generated.less`. The admin
application itself is excluded rather than tree-shaken after bundling.

## Next product boundary

The saved v2 document is a single source page and the Style workspace currently
covers the first high-value UIkit groups. Full UIkit component coverage,
publishing as a public route, managing multiple route documents, drag-and-drop
nesting and media selection are separate outcomes. The first dynamic source
slice is now in: only the trusted project manifest can feed a list, with no
network or user code. Public
route integration must use `renderBuilderDocument()` and the existing router
metadata/i18n contracts; it must not import `admin/`. This is the interim rule
before Phases 5 and 9. After the Vue route registry passes parity, public
rendering consumes that registry; the legacy HTML adapter remains only for
proven static output until its cleanup gate.

## Vue migration sequence

1. Freeze schema v2 fixtures and compiler output before changing the editor.
2. Extract framework-neutral commands for add, move, duplicate, delete,
   undo/redo and validation; keep the existing document contract unchanged.
3. Build the Vue admin shell as a separate dev-only entry and reuse those
   commands.
4. Add one typed Vue element registry used by editor preview and public route
   rendering. Keep HTML rendering only for static output until parity is
   proven.
5. Move multi-route publishing and SSG only after Vue Router owns the public
   route manifest.
6. Delete the old editor/render adapter when fixture, visual and production
   bundle gates pass.

The builder remains excluded from the initial public graph. Vue Devtools,
inspector state, drag-and-drop libraries and editor-only UIkit components must
not enter production chunks. A new dependency is accepted only when native
browser/Vue primitives cannot meet the requirement and its isolated bundle
cost is measured.

See [`archive/MIGRATION_VUE_TRES.md`](archive/MIGRATION_VUE_TRES.md) for
historical phase gates and
[`ARCHITECTURE.md`](ARCHITECTURE.md) for target dependency direction.
