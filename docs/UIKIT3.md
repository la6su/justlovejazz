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

**Rule:** UIKit variables set in `_import.less` §3. Never redeclare in `main.less`. master-qf MUST NOT duplicate UIKit globals.

**QF principle:** `@global-primary-background: @jlz-color-accent` (1 line). QF manages ALL components through `@global-*` tokens. Do NOT override `@button-*`, `@card-*`, `@navbar-*`.

## 2. `main.less` — app layer only

Only what UIKit/QF don't provide:
- Custom cursor (inner dot + canvas)
- Joystick + arrows
- Dock (2-row bottom bar)
- Splash overlay
- Project overlay
- text-shadow for readability over 3D canvas
- Mobile-first root font-size

Never duplicate UIKit/QF functionality.

## 3. Section template — cube-map layout

```ts
// Home sections (sectionShell/sectionTop/sectionBottom)
sectionShell('about', 'about', topHtml, bottomHtml)

// Content page sections (contentSection/contentTop/contentBottom)
contentSection('services-intro', topHtml, bottomHtml, isActive=true)
```

Both produce: TOP (eyebrow + title + lead) / 3D CENTER (transparent) / BOTTOM (content).
6 sections per page: 0=secret, 1=intro(start), 2-4=main, 5=secret.

## 4. Theme toggle — 2-mode (auto/inverse)

| Mode | uk-light | Background | Text |
| --- | --- | --- | --- |
| auto (default) | on body | light | dark |
| inverse | off | dark | light |

Global flip (YooTheme Pro approach), NOT per-section. 1 toggle button in UIMenu. `localStorage('jlz:theme')`. EnvSphere syncs via `jlz:theme-applied`.

## 5. Hard-won lessons (do not repeat)

1. **`uk-blend-difference` can't cross stacking contexts** — modals with `backdrop-filter` create new contexts. Use `text-shadow` for readability instead.
2. **`uk-scrollspy` + splash timing** — gate scrollspy behind `.scrollspy-pending` body class until `jlz:webgl-ready` fires.
3. **Per-section theme overrides → global flip** — 50+ LOC of `body.light-theme .uk-*` deleted. Use UIKit native `uk-light`.
4. **LineSegments linewidth>1 unsupported** — WebGL/WebGPU ignore it. Use RoundedBoxGeometry or MeshLineGeometry.
5. **CubeCamera must hide cube mesh during render** — self-reflection bug.
6. **MSAA on RT** — `samples: 4` on WebGLRenderTarget. Renderer `antialias: true` doesn't work for RT rendering.
7. **`@global-primary-background` is the QF anchor** — 1 override, QF applies it to ~30 component variables.

## 6. When to add a custom class vs. use UIKit

| Need | Use |
| --- | --- |
| Button | `uk-button uk-button-primary` (QF glow) |
| Card | `uk-card uk-card-default uk-card-hover` (QF glassmorphism) |
| Grid | `uk-grid uk-child-width-1-2@s uk-child-width-1-4@m` |
| Icon | `uk-icon="icon: bolt; ratio: 1.5"` |
| Section padding | `uk-section uk-section-small uk-section-medium@s uk-section-large@m` |
| Eyebrow text | `.jlz-eyebrow` (custom — TUI terminal style) |
| Numeral | `.jlz-numeral` (custom — min-width + opacity) |
| Flex gap | `.jlz-flex-gap-small` (custom — UIKit has no gap) |
