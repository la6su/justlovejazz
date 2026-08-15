---
name: justlovejazz-ui
description: Apply JUSTLOVEJAZZ-specific UI composition, UIkit/Less ownership, Page Builder and Style Customizer contracts, theme, accessibility, responsive behavior, and visual verification. Use for changes to markup, styles, generated theme controls, overlays, navigation, route presentation, or other user-visible interface behavior.
---

# JUSTLOVEJAZZ UI

Start from the rendered interface and its current source owners. Use UIkit
components, utilities, variables and hooks as the baseline; add scoped
application CSS where the 3D shell or authored composition has no equivalent.

## Ownership

| Concern                        | Source                                        |
| ------------------------------ | --------------------------------------------- |
| Tokens and UIkit assembly      | `src/assets/_import.less`                     |
| Console theme decisions        | `src/assets/console-theme/_import.less`       |
| Style schema and showcase      | `src/builder/style*.ts`                       |
| Generated builder theme        | `src/assets/builder/*.generated.less`         |
| Development editor             | `admin/`                                      |
| 3D shell and route composition | `src/assets/main.less`                        |
| Standalone blog presentation   | `src/assets/blog.less`                        |
| Custom SVG icons               | `src/assets/console-icons.ts`                 |
| Route DOM and refresh          | `src/router.ts`, `src/sections/*/template.ts` |
| Story and sheet state          | `src/UI/CinematicNav.ts`                      |
| Fullscreen project interaction | `src/UI/FullscreenOverlay.ts`                 |

Keep one authority per behavior. UIkit manages component state, focus and ARIA;
the application manages routes, scene state and cinematic progress.
`CinematicNav` is the reveal authority for story frames. The router refreshes
dynamic UIkit markup after rendering.

Theme work covers both `auto` (dark console) and `inverse` polarities.
Interaction remains semantic in the DOM even when Three.js supplies the visible
media. Reduced motion reaches the same settled state without interpolation.

## Page Builder and Style Customizer

Keep `admin/` development-only. Put production-safe document contracts,
rendering and style definitions in `src/builder/`; never import the admin graph
from the SPA. Treat external builders as behavior references, not source code.

Add or change a Style control in this order:

1. define the whitelisted field, default and validation in
   `src/builder/style.ts`;
2. update the generated document version/default fixture when the persisted
   contract changes;
3. map the value to Less in `src/builder/compiler.ts` and to the live showcase;
4. keep `theme.generated.less` last in the UIkit assembly so lazy Less variable
   resolution makes generated component values authoritative;
5. cover validation and compilation, then exercise Save & Compile in `/admin/`.

Do not accept arbitrary Less through the typed Style controls. Keep direct
custom code, remote fonts, media and dynamic sources as separately authorised
capabilities with their own validation and ownership.

## Verification

Choose the smallest representative matrix for the change:

- desktop and narrow mobile viewport;
- auto and inverse polarity;
- pointer, keyboard and touch where the interaction supports them;
- reduced motion for authored transitions;
- WebGPU and `?renderer=webgl` when scene presentation changes;
- direct route/deep-link entry when route rendering changes.

For Style Customizer work, also verify:

- one selected component and the complete UIkit showcase;
- default and inverse preview using the authored palettes;
- save, Less compilation and reload persistence;
- the production output contains generated theme CSS but no `admin/` entry.

Before capturing a route screenshot, pass the ready splash through its Enter
control and wait for the route UI and scene to settle. Capture the splash only
when it is the subject of the check.

Inspect focus order, restored focus, readable contrast, console output and
layout edges. Run the focused automated checks, then use the release skill when
the change is being prepared for publication.
