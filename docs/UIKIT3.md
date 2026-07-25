# UIkit 3 and Less conventions

UIkit 3 is the component, layout, and accessibility baseline. The project does
not maintain a parallel design system. Every new UI decision must reuse a
documented UIkit component, utility class, or Less variable before adding
custom CSS.

## Sources

- **Dependency:** `uikit` (npm) — see [package.json](../package.json)
- **Upstream:** [uikit/uikit](https://github.com/uikit/uikit)
- **Introduction:** <https://getuikit.com/docs/introduction>
- **Less theming:** <https://getuikit.com/docs/less>
- **Component reference:** <https://getuikit.com/docs/>

Read the relevant component page before creating any new markup or override.

## Asset structure

```
src/assets/
├── _import.less            # UIKit theme assembly + design tokens (entry point)
├── _theme.less             # Bridge: imports console-theme/_import.less
├── console-theme/
│   └── _import.less        # Console theme variables (single source of truth)
├── console-icons.ts        # Custom SVG icon registrations
├── main.less               # 3D shell, cinematic story/sheets, route-specific layout
├── blog.less               # Standalone blog pages (no 3D runtime)
└── fonts/                  # Self-hosted Onest Variable (Latin + Cyrillic subsets)
```

There is **no vendored theme layer**. The former Quantum Flares vendor snapshot
and its bridge files were removed; `console-theme/_import.less` is now the sole
owner of console theme variables.

### What lives where

| Layer                                                                           | Owner                        | Change it for                                             |
| ------------------------------------------------------------------------------- | ---------------------------- | --------------------------------------------------------- |
| Design tokens (`@jlz-*` Less vars, `--jlz-*` CSS custom properties)             | `_import.less` §1–§2         | A color, spacing, radius, z-index or motion token changes |
| UIKit variable overrides (`@global-*`, `@button-*`, etc.)                       | `_import.less` §3            | A UIKit component's default appearance changes            |
| UIKit component imports                                                         | `_import.less` §4            | Adding or removing a UIKit component from the build       |
| Console theme (font weights, status colors, shadows, heading sizes, color-mode) | `console-theme/_import.less` | A console-level visual decision                           |
| 3D shell, cinematic story/sheets, route-specific layout                         | `main.less`                  | No UIKit component covers the interaction or layout       |
| Standalone blog layout                                                          | `blog.less`                  | Semantic blog-only presentation                           |
| Custom SVG icons                                                                | `console-icons.ts`           | A new icon not in UIKit's default set                     |

## Less assembly order

Both Less entries compile in this order:

```less
@import './_import.less';
@import './_theme.less';
```

The load order inside `_import.less` is load-bearing — break it and theme
overrides stop applying:

1. `@jlz-*` token definitions (§1)
2. UIKit `variables.less` (defaults we override in §3)
3. Theme overrides — map `@jlz-*` → UIKit `@*` (§3)
4. UIKit `mixin.less` (shared by components)
5. UIKit component `*.less` (emit rules with overridden vars)

CSS custom properties (`:root { --jlz-* }`) are generated in §2 so they are
available at runtime for `var(--jlz-*)` references in `main.less`.

## Imported UIKit components

Active imports from `_import.less` §4 (commented-out lines are intentionally
excluded to reduce bundle size):

```
base, link, heading, icon, button, section, container, close, modal, tooltip,
grid, form, form-range, nav, navbar
```

The shared utility imports are limited to animation, width, height, text,
cover, utility, flex, margin, padding, position, transition, visibility and
inverse. Add a component or utility only after its markup/attribute has a
repository use and record the measured CSS impact in the relevant change.

If a task needs a commented-out component (e.g. `accordion`, `drop`,
`offcanvas`, `tab`), uncomment its import line and verify the bundle size
impact before merging.

## Solution priority

Before writing custom CSS or JavaScript, follow this order:

1. **Use documented UIKit markup** — utility classes (`uk-flex`, `uk-grid`,
   `uk-margin-*`, `uk-text-*`, `uk-width-*`) and component attributes
   (`uk-modal`, `uk-nav`, `uk-tooltip`, `uk-slider`).
2. **Change a UIKit Less variable or hook** — override `@global-*` or a
   component-specific variable in `_import.less` §3, or use a documented
   mixin hook (`.hook-button()`, `.hook-icon-button()`, etc.).
3. **Add a scoped `.jlz-*` rule** — only for a real application-specific gap
   that no UIKit component covers (3D shell hooks, cinematic story track,
   fullscreen overlay media stage).
4. **Never reproduce a UIKit component in custom CSS/JS** just to change its
   appearance. In particular, do not rebuild modal, off-canvas, navbar, nav,
   accordion, grid, button, icon-button, or form behaviour.

## Current component model

| Concern                             | Owner                                 | Convention                                                                             |
| ----------------------------------- | ------------------------------------- | -------------------------------------------------------------------------------------- |
| Dynamic component refresh           | `router.ts`                           | Call `UIkit.update()` after route content renders                                      |
| Menu expandable items               | `sections/nav/template.ts`            | `uk-nav` / `uk-parent` state is authoritative                                          |
| Fullscreen project/showreel overlay | `FullscreenOverlay.ts`                | UIKit `uk-modal` owns visibility + focus; explicit still/video media modes             |
| Fixed configuration controls        | `UIMenu.ts`                           | `.jlz-topbar` with UIKit `uk-icon-button` for language, theme, sound                   |
| Section navigation                  | `CinematicNav.ts`                     | Native scroll track + custom progress composition                                      |
| Works case planes                   | `WorkCards.ts` + `WorksPlaneStage.ts` | DOM controls/captions + real Three.js media planes                                     |
| Icons                               | `console-icons.ts`                    | Custom SVGs registered via `UIkit.icon.add`; UIKit `uk-icon="icon: name"` renders them |

The menu is a full-viewport two-column composition on desktop and a compact
top sheet on mobile, not a modal or a dropbar. Its sub-links are SPA-aware;
UIKit owns expansion while the application owns route and sheet changes.

## State and accessibility

- Prefer UIKit's `uk-open` / `uk-active` classes to parallel custom flags.
- Let UIKit modal/nav components manage their own keyboard and ARIA state.
- Custom controls need an accessible name (`aria-label`) and keyboard
  operation. The storyline marks the active target with `aria-current`;
  cinematic sheets make background frames `inert` and restore launcher focus
  when closed.
- `FullscreenOverlay` enforces a focus trap (Tab/Shift+Tab wraps within the
  dialog) and restores focus to the trigger on close.
- Keep custom rules compatible with the app's auto/inverse theme and its
  reduced-motion policy.

### CinematicNav state ownership

`CinematicNav` is the sole owner of story-section reveal state. Do not add
`uk-scrollspy` or `uk-animation-*` classes to section top/bottom panels: their
opacity and offset are already updated continuously from scroll progress.

## Typography

Onest Variable is the shared display and interface family. Its self-hosted
Latin and Cyrillic WOFF2 subsets (in `src/assets/fonts/`) cover the two
product languages with one set of metrics and a continuous `wght` axis from
100 to 900. The Unicode ranges in `public/fonts/onest.css` let the browser
request only the needed subset. Do not add static weight files or a remote
font request for UIKit components.

## Verification

After a visual change:

1. Verify dynamic route rendering (`UIkit.update()` fires on route change).
2. Test both theme polarities (auto = dark console, inverse = light).
3. Test keyboard navigation and reduced motion.
4. Run the project checks in [DEVELOPMENT.md](DEVELOPMENT.md).

For runtime composition see [ARCHITECTURE.md](ARCHITECTURE.md); for visual
intent see [BRAND.md](BRAND.md).
