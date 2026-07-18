# UIkit, Quantum Flares and Less conventions

Use `$uikit-yootheme-theme` whenever a task changes a UIkit component, Less theme assembly, Quantum Flares variation, or a visual pattern that may already exist in UIkit/YOOtheme Pro. It makes the official component documentation and this project's ownership boundaries part of the work.

## Sources and ownership

UIkit is the component framework: consult its [Introduction](https://getuikit.com/docs/introduction), the relevant component page, and the [Less theming guide](https://getuikit.com/docs/less) before creating a component or a broad override. The local dependency is `uikit`; its upstream source is [uikit/uikit](https://github.com/uikit/uikit).

`src/assets/master-quantum-flares/` is a vendored snapshot of the licensed YOOtheme Pro **Quantum Flares** UIkit theme. It supplies the visual composition, component variables, effects and assets; it is not a collection of snippets to copy into application CSS. The active starting variation is `master-quantum-flares/styles/black-blue.less`.

Do not edit files under `master-quantum-flares`. Project-owned adaptations live next to them in `src/assets`; this is the Vite equivalent of YOOtheme Pro's child-theme approach, so an upstream theme refresh remains reviewable.

| Layer                                                          | Owner                                            | Change it for                                                               |
| -------------------------------------------------------------- | ------------------------------------------------ | --------------------------------------------------------------------------- |
| Semantics, keyboard behaviour, ARIA and component state        | UIkit                                            | A documented UIkit component/attribute solves the problem                   |
| Visual language, effects, variation variables and theme assets | Quantum Flares                                   | The selected baseline provides the intended feature                         |
| Brand tokens and QF-variation palette bridge                   | `_import.less`, `_quantum-flares-overrides.less` | A project-wide semantic color, font, spacing or QF effect needs adaptation  |
| Dark-surface color-mode bridge                                 | `_theme-fixes.less`                              | A QF component needs the correct inverse text mode on project dark surfaces |
| 3D shell, cinematic story/sheets and route-specific layout     | `main.less`                                      | No UIkit component covers the interaction or layout                         |
| Standalone blog layout                                         | `blog.less`                                      | Semantic blog-only presentation                                             |

## Less assembly

Both Less entries compile in the same order:

```less
@import './_import.less';
@import './master-quantum-flares/_import.less';
@import './master-quantum-flares/styles/black-blue.less';
@import './_quantum-flares-overrides.less';
@import './_theme-fixes.less';
```

This order is intentional. The selected QF variation is allowed to define its own values; the project bridge then reapplies semantic JLZ tokens so UIkit and QF controls share the same accent. Do not move imports, edit the vendored files, or add a second token system in `main.less`.

Prefer this order of solutions:

1. Use documented UIkit markup, utility classes and JavaScript attributes.
2. Change a UIkit global/component Less variable or a documented hook.
3. Use an existing QF variable/effect in `_quantum-flares-overrides.less` when it is the smallest way to retint or adapt that QF treatment.
4. Add a scoped `.jlz-*` rule only for a real application-specific gap.

Never reproduce a UIkit component in custom CSS/JavaScript just to change its appearance. In particular, do not rebuild modal, off-canvas, navbar, nav, accordion, grid, button, icon button or form behaviour. Keep one state owner: UIkit owns its `uk-open`/`uk-active` and accessibility state; application code owns route, story/sheet and 3D state.

## Using YOOtheme Pro themes as a design library

Quantum Flares is the chosen baseline, not an immutable identity. Other themes available through the YOOtheme Pro subscription may be inspected for useful composition, hooks, variables, textures and interaction styling. Treat every adoption as a deliberate, project-owned adaptation:

1. Record the source theme, variation, asset and reason in the change.
2. Inspect its `_import.less` and variation first; prefer variables/hooks over compiled CSS or copied selectors.
3. Import/copy only the licensed source or asset needed into a clearly named, versioned vendor snapshot; preserve attribution and license terms.
4. Translate the chosen treatment into project tokens or the QF bridge. Avoid forks and do not mix whole style packages opportunistically.
5. Test the affected UI in auto and inverse modes, with keyboard navigation and reduced motion.

YOOtheme Pro's style customizer itself is organised around global variables, theme variables, inverse colors and UIkit component variables. Its child-theme guidance similarly extends a selected style/variation rather than patching the parent. Those are the design principles replicated here, even though this site uses Vite instead of WordPress. See [YOOtheme Pro child themes](https://yootheme.com/docs/wordpress/developers-child-themes) and the [Style Customizer](https://yootheme.com/docs/wordpress/style-customizer).

## Current component model

| Concern                             | Owner                      | Convention                                           |
| ----------------------------------- | -------------------------- | ---------------------------------------------------- |
| Dynamic component refresh           | `router.ts`                | Call `UIkit.update()` after route content renders    |
| Menu expandable items               | `sections/nav/template.ts` | `uk-nav` / `uk-parent` state is authoritative        |
| Fullscreen project/showreel overlay | `FullscreenOverlay.ts`     | UIkit modal owns visibility and focus                |
| Fixed configuration controls        | `UIMenu.ts`                | `.jlz-topbar` with language, theme and sound buttons |
| Section navigation                  | `CinematicNav.ts`          | Native scroll track plus custom progress composition |
| Works tilt cards                    | `WorkCards.ts`             | Custom interaction layered on semantic controls      |

The menu is a full-viewport two-column composition on desktop and a compact
top sheet on mobile, not a modal or a dropbar. Its sub-links are SPA-aware;
UIkit owns expansion while the application owns route and sheet changes.

## State, accessibility and verification

- Prefer UIkit's `uk-open`/`uk-active` classes to parallel custom flags.
- Let UIkit modal/nav components manage their own keyboard and ARIA state.
- Custom controls need an accessible name and keyboard operation. The
  storyline marks the active target with `aria-current`; cinematic sheets make
  background frames inert and restore launcher focus when closed.
- Keep custom rules compatible with the app's auto/inverse theme and its reduced-motion policy.
- After a visual change, verify dynamic route rendering and both theme modes; run the project checks in `docs/DEVELOPMENT.md`.

For runtime composition see [ARCHITECTURE.md](ARCHITECTURE.md); for visual intent see [BRAND.md](BRAND.md).
