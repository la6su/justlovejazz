# UIKIT3 — Patterns, theme assembly, and hard-won lessons

> UIKit 3 theming layer only. Companion to `RULES.md` and `ARCHITECTURE.md`.

## 1. Theme assembly — `_import.less` is the single entry point

Import order (load-bearing — break it and theme overrides stop applying):

```
1. _import.less §1 → @jlz-* design tokens
2. _import.less §2 → :root { --jlz-* } CSS custom properties
3. uikit/variables.less → UIKit @* defaults
4. _import.less §3 → Theme overrides (map @jlz-* → UIKit @*)
5. _import.less §3.5 → UIKIT HOOK OVERRIDES (.hook-icon-button(), .hook-navbar-container(), etc.)
   ⚠️ Hooks MUST be defined BEFORE the component .less import in §4 — UIKit
   components call these mixins during compilation. See §7.23.
6. uikit/mixin.less → shared mixins
7. uikit/components/*.less → component rules (compiled with overridden vars + hooks)
8. master-quantum-flares/_import.less → QF visual personality (no UIKit globals)
```

**Rule:** UIKit variables set in `_import.less` §3. Hooks in §3.5. Never
redeclare either in `main.less`. master-qf MUST NOT duplicate UIKit globals.

**QF principle:** `@global-primary-background: @jlz-color-accent` (1 line). QF
manages ALL components through `@global-*` tokens. Do NOT override `@button-*`,
`@card-*`, `@navbar-*` — QF applies the accent to ~30 component variables
automatically.

## 2. `main.less` — app layer only

Only what UIKit/QF don't provide:
- Custom cursor (inner dot + canvas)
- Joystick + arrows + dotnav
- Splash overlay (`#jlz-app-loader`, SVG squares, CRT curtains, progress ring)
- Project overlay (`#project-overlay`, fullscreen dialog)
- Works page 3D tilt cards (`.jlz-work-card`, CSS perspective + rotateX/Y)
- `data-i18n`-driven text (no CSS — i18n is DOM attribute based)
- Mobile-first root font-size

Never duplicate UIKit/QF functionality. If UIKit has a class for it
(`uk-button`, `uk-card`, `uk-grid`), use it — don't write a custom equivalent.

## 3. Section template — unified sectionShell()

```ts
// ALL pages (home + content) use the same helper:
sectionShell(id, topHtml, bottomHtml, mode='content', isActive=false, extraAttrs='')
// mode: 'home' (data-section, 3D cube face) | 'content' (data-page-section)

contentTop(eyebrow, title, lead?, headingTier='medium', titleKey?, leadKey?)
// titleKey/leadKey → data-i18n attributes (i18n integration)

contentBottom(content)  // wraps cards/grid/list content
```

Both produce: TOP (eyebrow + title + lead) / 3D CENTER (transparent) / BOTTOM (content).
6 sections per page: 0=secret, 1=intro(start), 2-4=main, 5=secret.

**EXCEPTION:** Section 5 (Menu overlay) does NOT use `sectionShell()`. It has
its own `navOverlaySection()` in `src/sections/nav/template.ts` — a unique
3-column VOSK-style grid (stat | nav list | contacts + footer). See §7.22.

## 4. Theme toggle — 2-mode (auto/inverse)

| Mode | `uk-light` | Background | Text |
| --- | --- | --- | --- |
| auto (default) | on `body` | light | dark |
| inverse | off | dark | light |

Global flip (YooTheme Pro approach), NOT per-section. Toggle button (`#jlz-theme-toggle`)
lives in the menu overlay config toolbar (`src/sections/nav/template.ts`), NOT
in the header. UIKit3 has no sun/moon icons → inline SVG, swapped via `.is-inverse`
class. `localStorage('jlz:theme')`. EnvSphere syncs via
`jlz:theme-applied`.

ContentReveal applies `uk-light` per-section based on `sectionTheme` in WorldConfig:
- auto: sectionTheme='light' → uk-light, 'dark' → no uk-light
- inverse: FLIPPED

## 5. i18n integration with UIKit components

`data-i18n` attributes work on any element, including UIKit components:

```html
<!-- Button with translated label -->
<a href="/services" class="uk-button uk-button-default">
  <span data-i18n="common.explore">Explore</span>
</a>

<!-- Nav item with translated label -->
<a href="/" data-nav-item="home" data-i18n="nav.studio">Studio</a>

<!-- Input with translated placeholder -->
<input class="uk-input" data-i18n-placeholder="contact.form.placeholder"
       placeholder="What's the project?" />
```

**Always keep English as default content** (no-JS fallback). `applyTranslations()`
overwrites `textContent` / `placeholder` only when a translation exists.

## 6. Works page 3D tilt cards — custom (UIKit has no equivalent)

`.jlz-work-card` is a `<button>` with CSS 3D perspective. UIKit doesn't provide
this — fully custom in `main.less`:

- `perspective: 1200px` on the button
- `transform: rotateX(var(--rx)) rotateY(var(--ry))` on `.jlz-work-card__inner`
- `transform-style: preserve-3d` — child layers use `translateZ` for parallax
- `--rx` / `--ry` custom props set by `WorkCards.ts` on pointermove (batched rAF)
- `prefers-reduced-motion` → tilt disabled (transform: none)

Do NOT replace with UIKit cards — the 3D tilt + parallax sheen is the visual
signature of the works page.

## 7. Hard-won lessons (do not repeat)

1. **`uk-blend-difference` can't cross stacking contexts** — modals with
   `backdrop-filter` create new contexts. Use `text-shadow` for readability instead.
2. **`uk-scrollspy` + splash timing** — gate scrollspy behind `.scrollspy-pending`
   body class until `jlz:webgl-ready` fires (prevents fade-in behind loader).
3. **Per-section theme overrides → global flip** — 50+ LOC of
   `body.light-theme .uk-*` deleted. Use UIKit native `uk-light`.
4. **LineSegments linewidth>1 unsupported** — WebGL/WebGPU ignore it. Use
   RoundedBoxGeometry or MeshLineGeometry.
5. **CubeCamera must hide cube mesh during render** — self-reflection bug.
6. **MSAA on RT** — `samples: 4` on WebGLRenderTarget. Renderer `antialias: true`
   doesn't work for RT rendering.
7. **`@global-primary-background` is the QF anchor** — 1 override, QF applies it
   to ~30 component variables.
8. **`uk-section-medium` does NOT exist in UIKit3** — only xsmall/small/large/xlarge
   + bare `uk-section` (medium is the default). Use `uk-section-small uk-section-large@m`.
9. **`uk-drop` with `stretch:x` creates full-width dropbar** — but section ancestor
   with CSS transform breaks `position:fixed`. ProjectOverlay attaches to `document.body`,
   not to a section.
10. **`uk-grid` has no gap** — use `.jlz-flex-gap-small` / `.jlz-flex-gap-large`
    custom utilities (UIKit uk-flex has no gap control).
11. **`uk-navbar` attribute goes on the INNER `<div>`, NOT on `<nav class="uk-navbar-container">`** —
    the navbar component applies `display:flex` + the left/center/right margin-auto
    layout to the element with the `uk-navbar` attribute. If you put it on `<nav>`,
    the inner `uk-container` (`display: flow-root`) breaks the flex chain and all
    three zones collapse to the center. Correct structure (verbatim from
    https://getuikit.com/docs/navbar):
    ```html
    <nav class="uk-navbar-container uk-navbar-transparent">
      <div class="uk-container uk-container-expand">
        <div uk-navbar>
          <div class="uk-navbar-left">…</div>
          <div class="uk-navbar-center">…</div>
          <div class="uk-navbar-right">…</div>
        </div>
      </div>
    </nav>
    ```
    Verified geometry (1280px viewport): `lang.left=40`, `logo.centerX=640=nav.centerX`,
    `hamburger.right=1240`. Logo is pixel-exact centered; side items pinned to
    container padding edges.
12. **3-zone vs centered-logo split-menu** — UIkit3 ships TWO navbar layouts:
    - **3-zone** (`uk-navbar-left` + `uk-navbar-center` + `uk-navbar-right`): each
      zone is a flex child; `uk-navbar-right { margin-left: auto }` pins right to
      the edge; center sits between. Use when you have ONE item per side and want
      them at the container edges. THIS IS WHAT WE USE.
    - **Centered-logo** (`uk-navbar-center > [uk-navbar-center-left, uk-logo, uk-navbar-center-right]`):
      all three live INSIDE `uk-navbar-center`; logo is pixel-centered but side
      items cluster around it, not at container edges. Use for split menus with
      many items per side.
    Pick ONE; do not mix. Mixing produces a centered cluster with side items
    floating in the middle of the bar.
13. **UIKit3 does NOT ship `sun` / `moon` icons** — the icon library
    (162 icons in `uikit/dist/js/uikit-icons.js`) has `paint-bucket`, `bolt`,
    `eye`, `eye-slash`, `star`, but no celestial icons. For theme toggles use
    inline SVG (we use Material Design Icons, Apache 2.0) and toggle visibility
    via a state class (`.is-inverse` on the button). Do NOT use `uk-icon="icon: sun"`
    — it silently renders nothing.
14. **`UIkit.icon(el, opts)` creates a component but does NOT retro-render SVG
    in hidden sections** — UIKit3's icon component defers SVG injection until
    the element is visible. If you dynamically insert `uk-icon` markup into a
    `display:none` section (our secret side overlays), the SVG never appears
    even after the section becomes visible. Workaround: inline SVG in the
    template string (see §13) so no JS rendering is needed.
15. **`UIkit.update(el)` does NOT re-scan for new `uk-*` attributes** — it only
    refreshes already-initialized components. If you add a `uk-icon` attribute
    to an existing element via `setAttribute`, you must call `UIkit.icon(el).$setOption('icon', name)`
    or replace the element. Inline SVG (§13) avoids this entirely.
16. **`.jlz-glass-btn` was a duplicate of `uk-button` / `uk-icon-button`** —
    the old custom class redefined background, border, backdrop-filter, hover
    state, bypassing the QF `@global-primary-background` cascade. REMOVED in
    the navbar-conformance refactor. Use `uk-button uk-button-default` (text
    buttons) or `uk-icon-button` (icon buttons) and customize via
    `.hook-button-default()` / `.hook-icon-button()` in `_import.less` if needed.
17. **`#jlz-menu-modal` is dead** — the old UIKit modal navbar dropdown was
    replaced by a section-5 nav overlay (joystick right / hamburger click).
    Any guard checking `#jlz-menu-modal.uk-open` is a no-op; replace with
    `[data-section="menu"].section-active, [data-page-section="page-menu"].section-active`
    if you need to detect the open state.
18. **`@navbar-color-mode: dark` (in `_theme-fixes.less`) is the canonical way
    to make navbar text flip in inverse mode** — do NOT write
    `body.uk-light .uk-navbar-nav > li > a { color: … }` overrides. The color-mode
    variable + `uk-light` class on `<body>` handle it automatically via UIKit's
    Inverse component.
19. **`.hook-navbar-container()` is the right place for glassmorphism** —
    `backdrop-filter`, semi-transparent background, and border belong in the
    `.hook-navbar-container()` mixin in `_import.less §3` (or scoped to
    `.jlz-header .uk-navbar-container` in `main.less` if you want it ONLY on
    our header). Do NOT override `@navbar-background` with a complex rgba+blur
    expression — keep `@navbar-background: transparent` and add visual styling
    in the hook / app-layer CSS.
20. **Accordion: use `.hook-accordion-default-title()` for hover colors** —
    the `.jlz-nav-accordion` block in `main.less` has a legit custom grid layout
    for `num/label/desc` (UIKit has no equivalent) but its hover-color and
    chevron rules should ideally go through `.hook-accordion-default-title-hover()`
    and `.hook-accordion-default-icon()`. We keep them as scoped CSS
    (`.jlz-nav-accordion__header:hover`) for now because the grid layout
    requires custom selectors anyway — but do not add MORE color overrides
    there; extend the hooks instead.
    **UPDATE:** `.jlz-nav-accordion` was REMOVED in the menu-template refactor.
    The menu overlay now uses a unique 3-column VOSK-style template (flat nav
    list, no accordion). Lesson 20 is retained for historical context — if you
    ever reintroduce an accordion, follow the hook pattern above.
21. **Hamburger ↔ Close toggle: inline SVG, CSS-driven swap** — the
    `#jlz-hamburger` button is a toggle (menu closed → hamburger; menu open →
    X). Do NOT use `uk-navbar-toggle-icon` + JS to swap the attribute — UIKit3's
    icon component does not re-render reliably on attribute change (§7.15).
    Instead, put BOTH SVGs in the button and toggle visibility via a state class
    on the `<header>` (`jlz-header--menu-open`). CSS:
    ```less
    .jlz-toggle-icon { display: none; }
    .jlz-header:not(.jlz-header--menu-open) .jlz-toggle-icon--open { display: inline-flex; }
    .jlz-header.jlz-header--menu-open .jlz-toggle-icon--close { display: inline-flex; }
    ```
    JS (`UIMenu._syncToggleState`) toggles the class on every `jlz:section-change`
    + `jlz:page-section-change` event. The click handler checks `_isMenuOpen()`
    and dispatches `jlz:goto-nav` (open) or `jlz:close-nav` (close).
22. **Menu overlay = unique template, NOT `sectionShell()`** — the menu
    overlay (section 5) is the ONE section that does not use `sectionShell()`.
    It has its own `navOverlaySection()` in `src/sections/nav/template.ts` that
    emits a 3-column grid (stat | nav | contacts + footer). Reason: VOSK-style
    layout with a giant stat number, flat nav list (no accordion), and contacts
    column — none of which fit the `sectionShell(top/center/bottom)` Apple-Watch
    layout. All other sections (0-4) still use `sectionShell()`.
23. **Glassmorphism on uk-icon-button via `.hook-icon-button()`** — UIKit3
    hooks are Less mixins that components call during compilation. They MUST be
    defined in `_import.less` BEFORE the component `.less` import (§4). We have
    a dedicated §3.5 section for hooks:
    ```less
    .hook-icon-button() {
      background: @jlz-color-surface;
      backdrop-filter: blur(8px);
      border: 1px solid @jlz-color-border;
      border-radius: 8px;
    }
    .hook-icon-button-hover() {
      border-color: fade(@global-primary-background, 40%);
      background: fade(@global-primary-background, 10%);
      color: @global-primary-background;
    }
    ```
    This applies to ALL `uk-icon-button` instances (lang, theme, sound). Do NOT
    add per-instance glassmorphism overrides in `main.less` — extend the hooks.
24. **`touch-action: none` is NOT inherited** — it must be on the drag target
    itself, not just the parent. The joystick base (`.jlz-joystick__base`) is
    the pointer-down target, but `touch-action: none` was only on the parent
    `.jlz-joystick`. On touch devices, the browser intercepted the drag as a
    scroll gesture and `pointermove` never fired beyond the dead zone. Fix:
    add `touch-action: none` directly on `.jlz-joystick__base`.

## 8. When to add a custom class vs. use UIKit

| Need | Use |
| --- | --- |
| Button | `uk-button uk-button-default` / `uk-button-primary` (QF glow) |
| Icon button (square) | `uk-icon-button` (QF styled, 36px, circle) |
| Card | `uk-card uk-card-default uk-card-hover` (QF glassmorphism) |
| Grid | `uk-grid uk-child-width-1-2@s uk-child-width-1-4@m` |
| Icon | `uk-icon="icon: bolt; ratio: 1.5"` (built-in 162 icons; NO sun/moon — use inline SVG) |
| Section padding | `uk-section uk-section-small uk-section-large@m` |
| Navbar (3-zone) | `<nav uk-navbar-container><div uk-container><div uk-navbar>[left/center/right]</div></div></nav>` |
| Navbar (centered split-menu) | `uk-navbar-center > [uk-navbar-center-left, uk-logo, uk-navbar-center-right]` |
| Hamburger/close toggle | `uk-navbar-toggle` + inline SVG (hamburger + X), CSS-driven swap via `.jlz-header--menu-open` (see §7.21) |
| Modal/dialog | `uk-modal` (or custom `#project-overlay` for fullscreen) |
| Accordion | `uk-accordion` + `uk-accordion-title` + `uk-accordion-content` (NOT used in menu — menu is flat nav list now) |
| Tooltip | `uk-tooltip="pos: bottom; delay: 200; title: ..."` |
| Eyebrow text | `.jlz-eyebrow` (custom — TUI terminal style, monospace) |
| Numeral | `.jlz-numeral` (custom — min-width + opacity) |
| Flex gap | `.jlz-flex-gap-small` / `.jlz-flex-gap-large` (custom — UIKit has no gap) |
| Works 3D card | `.jlz-work-card` (custom — CSS 3D perspective tilt, no UIKit equivalent) |
| Joystick | `.jlz-joystick` (custom — 2D nav, no UIKit equivalent; `touch-action: none` on `.jlz-joystick__base` is REQUIRED) |
| CTA pill | `.jlz-service-explore` (custom — pill button + accent dot) |
| Theme toggle (sun/moon) | `uk-icon-button` (glassmorphism via `.hook-icon-button()`) + inline SVG (UIKit has no sun/moon icons) |
| Sound toggle (EQ-bars) | `uk-icon-button` (glassmorphism via `.hook-icon-button()`) + `.jlz-sound-bars` custom spans |
| Config toolbar | `.jlz-menu-toolbar` (custom container; children are `uk-icon-button`) |
| Menu overlay (section 5) | `.jlz-menu-overlay` (UNIQUE template — 3-col grid, NOT `sectionShell()`; see §7.22) |
| Glassmorphism on icon buttons | `.hook-icon-button()` in `_import.less §3.5` (applies to ALL `uk-icon-button`; see §7.23) |
