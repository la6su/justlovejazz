---
name: justlovejazz-ui
description: Apply JUSTLOVEJAZZ-specific UI composition, UIkit/Less ownership, theme, accessibility, responsive behavior, and visual verification. Use for changes to markup, styles, overlays, navigation, route presentation, or other user-visible interface behavior.
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

## Verification

Choose the smallest representative matrix for the change:

- desktop and narrow mobile viewport;
- auto and inverse polarity;
- pointer, keyboard and touch where the interaction supports them;
- reduced motion for authored transitions;
- WebGPU and `?renderer=webgl` when scene presentation changes;
- direct route/deep-link entry when route rendering changes.

Before capturing a route screenshot, pass the ready splash through its Enter
control and wait for the route UI and scene to settle. Capture the splash only
when it is the subject of the check.

Inspect focus order, restored focus, readable contrast, console output and
layout edges. Run the focused automated checks, then use the release skill when
the change is being prepared for publication.
