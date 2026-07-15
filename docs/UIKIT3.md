# UIkit and Less conventions

UIkit provides component behaviour and Quantum Flares provides the base visual
language. Project CSS should extend that system rather than recreate it.

## Theme assembly

`src/assets/_import.less` is the theme entry point. It defines project tokens,
configures Quantum Flares/UIKit import order and exposes runtime CSS custom
properties. Keep framework imports and token setup there.

`src/assets/main.less` is the application layer: layout, canvas overlays,
joystick, work cards, top bar and the menu section. Use it for behaviour that
UIKit does not provide.

Do not edit vendored Quantum Flares files. Do not add broad overrides for
UIKit's button, card or navbar variables merely to reproduce a project style
that the theme already supplies.

## Current component model

| Concern                             | Owner                      | Convention                                            |
| ----------------------------------- | -------------------------- | ----------------------------------------------------- |
| Dynamic component refresh           | `router.ts`                | Call `UIkit.update()` after route content is rendered |
| Menu expandable items               | `sections/nav/template.ts` | `uk-nav` / `uk-parent` state is authoritative         |
| Fullscreen project/showreel overlay | `FullscreenOverlay.ts`     | UIKit modal owns visibility and focus                 |
| Fixed configuration controls        | `UIMenu.ts`                | `.jlz-topbar` with language, theme and sound buttons  |
| Section navigation                  | `JoystickNav.ts`           | Custom DOM component; no equivalent UIKit component   |
| Works tilt cards                    | `WorkCards.ts`             | Custom interaction layered on semantic controls       |

The menu is a two-column navigation section, not a modal and not a three-column
header/dropbar. Its sub-links are SPA-aware; UIKit owns expansion while the
application owns route changes.

## State and accessibility

- Prefer UIKit's `uk-open`/`uk-active` classes to parallel custom flags.
- Let UIKit modal/nav components manage their own keyboard and ARIA state.
- When custom controls are necessary, expose an accessible name and preserve
  keyboard operation. The dotnav marks the active target with `aria-current`.
- Dynamic content must remain compatible with the per-section auto/inverse
  theme applied by `ContentReveal`.
- Respect reduced-motion policy rather than adding independent animation
  preference checks.

## Before adding a custom class or script

1. Check whether UIKit already supplies the component behaviour.
2. Use a project class only for a genuine visual or interaction gap.
3. Keep state in one owner; do not synchronize duplicate booleans.
4. Verify the result after dynamic route rendering and in both theme modes.

For runtime composition see [ARCHITECTURE.md](ARCHITECTURE.md); for the design
intent see [BRAND.md](BRAND.md).
