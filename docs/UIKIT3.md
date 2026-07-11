# UIKIT3 — Patterns, theme assembly, and hard-won lessons

> UIKit 3 theming layer only. Companion to `RULES.md` and `ARCHITECTURE.md`.

## 1. Theme assembly — `_import.less` is the single entry point

Import order (load-bearing — break it and theme overrides stop applying):

```
1. _import.less §1 → @jlz-* design tokens
2. _import.less §2 → :root { --jlz-* } CSS custom properties
3. uikit/variables.less → UIKit @* defaults
4. _import.less §3 → Theme overrides (map @jlz-* → UIKit @*)
5. uikit/mixin.less → shared mixins
6. uikit/components/*.less → component rules (compiled with overridden vars)
7. master-quantum-flares/_import.less → QF visual personality (no UIKit globals)
```

**Rule:** UIKit variables set in `_import.less` §3. Never redeclare in `main.less`.
master-qf MUST NOT duplicate UIKit globals.

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

## 4. Theme toggle — 2-mode (auto/inverse)

| Mode | `uk-light` | Background | Text |
| --- | --- | --- | --- |
| auto (default) | on `body` | light | dark |
| inverse | off | dark | light |

Global flip (YooTheme Pro approach), NOT per-section. 1 toggle button in UIMenu
(paint-bucket icon). `localStorage('jlz:theme')`. EnvSphere syncs via
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

## 8. When to add a custom class vs. use UIKit

| Need | Use |
| --- | --- |
| Button | `uk-button uk-button-default` / `uk-button-primary` (QF glow) |
| Card | `uk-card uk-card-default uk-card-hover` (QF glassmorphism) |
| Grid | `uk-grid uk-child-width-1-2@s uk-child-width-1-4@m` |
| Icon | `uk-icon="icon: bolt; ratio: 1.5"` |
| Section padding | `uk-section uk-section-small uk-section-large@m` |
| Navbar | `uk-navbar-container uk-navbar-transparent` + `uk-navbar-dropdown` |
| Modal/dialog | `uk-modal` (or custom `#project-overlay` for fullscreen) |
| Eyebrow text | `.jlz-eyebrow` (custom — TUI terminal style, monospace) |
| Numeral | `.jlz-numeral` (custom — min-width + opacity) |
| Flex gap | `.jlz-flex-gap-small` / `.jlz-flex-gap-large` (custom — UIKit has no gap) |
| Works 3D card | `.jlz-work-card` (custom — CSS 3D perspective tilt, no UIKit equivalent) |
| Joystick | `.jlz-joystick` (custom — 3D nav, no UIKit equivalent) |
| CTA pill | `.jlz-service-explore` (custom — pill button + accent dot) |
