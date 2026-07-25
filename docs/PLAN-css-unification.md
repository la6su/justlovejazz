# CSS Unification Plan — UIKit 3 native-first

This plan defines the staged refactoring of all Less files in `src/assets/`
to minimize the CSS bundle by replacing custom `.jlz-*` rules with native
UIKit 3 utilities, components, and Less variable overrides.

**Principle:** UIKit 3 provides components, utility classes, and a Less
variable/hook system. The project must use these "out of the box" instead of
re-implementing them in `.jlz-*` CSS. Only genuinely bespoke CSS (3D shell,
cinematic sheets, fullscreen overlay, work-card 3D planes) stays as custom.

See [docs/UIKIT3.md](UIKIT3.md) for the solution priority order.

## Current state

| File                         | Lines    | Role                                                                       |
| ---------------------------- | -------- | -------------------------------------------------------------------------- |
| `_import.less`               | 511      | Design tokens + UIKit variable overrides + hooks + component imports       |
| `_theme.less`                | 6        | Bridge to `console-theme/_import.less`                                     |
| `console-theme/_import.less` | 77       | Console theme variables (font weights, status colors, shadows, color-mode) |
| `main.less`                  | 2048     | App layer CSS (3D shell, cinematic, overlay, work-card controls, sections) |
| `blog.less`                  | 352      | Standalone blog pages (no 3D runtime)                                      |
| **Total**                    | **3432** |                                                                            |

## Target

Minimize `main.less` and `blog.less` by deleting rules that duplicate UIKit
utilities or that can be expressed as UIKit variable overrides. Keep all
genuinely bespoke CSS intact.

## Stages

### Stage 1 — Dead CSS + base resets + heading variable migration

**Goal:** Delete rules with zero markup matches or that UIKit base already
provides. Migrate global heading typography into UIKit variable overrides.

**Files:** `main.less`, `console-theme/_import.less`, `blog.less`

**Deletions in `main.less`:**

- `* { box-sizing: border-box }` — UIKit base.less provides this
- `body { margin: 0; background; color }` — UIKit base + `@global-*` provide these
- `html, body { font-family: ... !important }` — `@global-font-family` provides it
- `h1..h6, .uk-h*, .uk-heading-*` selector (22 LOC) — migrate to `@base-heading-*`
- `.jlz-visually-hidden` (11 LOC) — dead, zero markup refs
- `.jlz-fs-overlay .jlz-fs-* { color }` (8 LOC) — children inherit from parent
- `.jlz-fs-close { color }` — `@close-color` already set
- `.jlz-sheet-close { color: inherit }` — UIKit `.uk-close` already sets color

**Additions in `console-theme/_import.less`:**

```less
@base-heading-text-transform: uppercase;
@base-heading-letter-spacing: -0.03em;
```

**Deletions in `blog.less`:**

- `.uk-card-title` from shared selectors (dead — zero `.uk-card` markup in blog)

**LOC reduction:** ~50–65. **Risk:** zero.

### Stage 2 — Topbar / launcher / console-bar UIKit utility consolidation

**Goal:** Delete CSS properties that duplicate UIKit utility classes already
present in markup.

**Files:** `main.less`, `CinematicNav.ts`

**Deletions in `main.less`:**

- `.jlz-topbar` — delete `display/align-items/justify-content` (markup has `uk-flex uk-flex-middle uk-flex-between`)
- `.jlz-topbar-controls` — delete `display/align-items` (markup has `uk-flex uk-flex-middle`)
- `.jlz-works-index` — delete `display/align-items/justify-content/text-transform` (markup has utilities)
- `.jlz-menu-nav` — delete entire rule (UIKit `.uk-nav` provides list-reset)
- `.jlz-menu-nav__subs` — delete `list-style/margin/padding/flex-direction` (UIKit `.uk-nav-sub` provides)
- `.jlz-storyline__items` — delete `display/align-items` (after markup change)

**Markup change in `CinematicNav.ts`:**

- `.jlz-storyline__items` div: add `uk-flex uk-flex-middle`

**LOC reduction:** ~15–20. **Risk:** low.

### Stage 3 — Works cards + 3D plane handoff pruning — complete

**Goal:** Prune duplicate flex declarations on works-composition children
without breaking the 3D plane-origin handoff.

**Files:** `main.less`, `works.ts`

**Completed changes:**

- Removed the hidden `<img>`, cover, chromatic, pseudo-element, CSS-wobble and
  `body[data-page='works']` override family. The 3D stage is the only visual
  media owner, so those declarations had no visible job.
- Retained only a native button, caption, focus ring and UIKit grid utilities.
- Replaced the one layout modifier class with `data-works-layout="equal"`;
  layout data now describes the page state rather than creating a one-off CSS
  class family.

**Result:** 306 deleted / 139 added lines across the implementation slice;
`main.less` fell 2205 → 2025 lines before the later frustum-synchronised
caption layer and UIKit utility pass. It is currently 2048 lines. Desktop and
390×844 visual checks confirm
that DOM captions match the 3D plane bounds. **Risk:** low–moderate; retain
screenshot checks for later visual work.

### Stage 4 — Menu sheet + contact footer cleanup

**Goal:** Consolidate menu/nav/contact-footer rules; verify UIKit `uk-nav`
coverage; audit `.jlz-telegram-cta` family.

**Files:** `main.less`, `nav/template.ts`, `lab-overlay/template.ts`

**Changes:**

- `.jlz-contact-footer__actions` — optionally add `uk-flex uk-flex-middle` to markup; delete `display/align-items` from CSS
- `.jlz-menu-stat` — optionally add `uk-flex uk-flex-column` to markup; delete `display/flex-direction` from CSS
- `.jlz-menu-nav__toggle` — keep bespoke (UIKit `.uk-nav > li > a` doesn't provide baseline-aligned flex)
- `.jlz-telegram-cta` — verify if styles are intentionally absent or missing

**LOC reduction:** ~10–15. **Risk:** low.

### Stage 5 — blog.less polish + navbar variable migration

**Goal:** Remove dead blog CSS + migrate blog navbar typography to UIKit
variable overrides.

**Files:** `blog.less`, `_import.less`

**Deletions in `blog.less`:**

- `body { background; color }` — UIKit base provides
- `.jlz-blog-header .uk-navbar-container { background: transparent !important }` — `@navbar-background` provides
- `.jlz-blog-header .uk-navbar-nav > li > a { font-size; font-weight; letter-spacing; text-transform }` — migrate to vars

**Additions in `_import.less`:**

```less
@navbar-nav-item-font-size: 0.72rem;
@navbar-nav-item-font-weight: 500;
@navbar-nav-item-text-transform: uppercase;
@navbar-nav-item-letter-spacing: 0.1em;
```

**LOC reduction:** ~10–15. **Risk:** zero–low (only one `.uk-navbar` in the project).

## Execution order

1 → 2 → 5 → 3 → 4 (zero-risk first, moderate-risk last)

## Per-stage verification gate

```bash
bun run type-check && bun run lint && bun run test:unit && bun run build
```

Followed by visual screenshot diff on: home, /works, /services, /manifesto,
/lab, /contact, /blog, fullscreen overlay, menu sheet, contact footer.

## Deferred

- `.hook-button-default()` / `.hook-button-primary()` consolidation with
  `display: inline-flex; align-items: center; gap` — affects ALL buttons
  app-wide. Defer until Stages 1–5 are merged and the remaining button-rule
  count justifies the global hook change.
