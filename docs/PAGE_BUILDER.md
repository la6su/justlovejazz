# UIkit Page Builder

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

`vite.config.ts` installs the save API with `apply: 'serve'`. The production
input list does not contain `admin/index.html`, so inspector code, editing
state and dev endpoints cannot enter `dist`. The two generated Less files are
imported by the normal theme assembly and therefore participate in the same
production compilation as hand-authored theme sources.

## Current document model

Version 2 supports `section`, `grid`, `card`, `heading`, `text` and `button`.
Root nodes are sections; container elements own ordered children. Copy is plain
text, links accept internal paths, anchors, mail links and HTTPS, and rendering
escapes all authored values.

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
nesting, media selection and dynamic data sources are separate outcomes. Public
route integration must use `renderBuilderDocument()` and the existing router
metadata/i18n contracts; it must not import `admin/`.
