# Architecture

## System boundary

The product is one Vite SPA entry (`index.html`) plus standalone blog pages.
The SPA owns the 3D scene and a transparent DOM layer; blog pages do not boot
the scene.

```text
index.html
  → entry-shell.ts
  → entry-app.ts
  → router.ts + main-app.ts
  → Experience.ts
     → Renderer / World / UI / input / lifecycle

blog.html + blog/*.html → standalone semantic pages
```

The inline splash is part of `index.html`, so it can paint before the lazy
Three.js import. It emits/receives the bootstrap events; the user can enter
only after `jlz:webgl-ready`.

## Routing and section model

`router.ts` owns the SPA routes, DOM rendering, translations and page metadata.

| Route        | Page key    | Main sections                                                              |
| ------------ | ----------- | -------------------------------------------------------------------------- |
| `/`          | `home`      | Studio, Services, Works, Manifesto                                         |
| `/services`  | `services`  | Creative Direction, Interactive Development, Motion & Realtime, AI Systems |
| `/works`     | `works`     | Four case-study groups                                                     |
| `/manifesto` | `manifesto` | Purpose, Clarity, Emotion, Simplicity                                      |
| `/lab`       | `lab`       | Shader Lab, Audio Reactive, Generative, GPU Particles                      |
| `/contact`   | `contact`   | Email, Social, Location, Form                                              |

The world is always six sections, in this fixed order. `WorldConfig.ts` is the
source for their IDs and section data; `SplashCube.FACE_ROTATIONS` is the
source for the cube's displayed orientation.

| Index | Canonical ID              | Role                 | Cube face     | Primary source module                                |
| ----- | ------------------------- | -------------------- | ------------- | ---------------------------------------------------- |
| 0     | `lab` / `sec_lab`         | Secret left section  | Front (+Z)    | `sections/lab/scene.ts`                              |
| 1     | `intro` / `sec_intro`     | Start section        | Right (+X)    | `sections/intro/scene.ts`                            |
| 2     | `about` / `sec_about`     | Main section         | Back (-Z)     | `sections/about/scene.ts`                            |
| 3     | `works` / `sec_works`     | Main section         | Left (-X)     | `sections/works/scene.ts`                            |
| 4     | `contact` / `sec_contact` | Main section         | Y tilt `−π/4` | `sections/contact/scene.ts`                          |
| 5     | `menu` / `sec_menu`       | Secret right section | Y tilt `+π/4` | `sections/menu/scene.ts`; `sections/nav/template.ts` |

Home sections use `data-section`; content-page sections use
`data-page-section`. The menu template is the one intentional exception to
the shared content section shell. Contact and Menu deliberately use tilted
side-face views rather than literal top/bottom cube rotations; changing that
visual model requires updating `SplashCube.FACE_ROTATIONS` and this table.

## Navigation and UI composition

`JoystickNav` is a DOM control, not a Three.js joystick.

- Up/down move through the current page's main sections (1–4).
- Left opens Lab (0); right opens Menu (5); leaving a side restores the prior
  main section.
- Dotnav jumps among main sections. Keyboard supports arrows, Home and End.
- The Menu is a navigation-only, two-column section. UIkit `uk-nav` owns its
  expandable parents; sub-links carry `data-nav-href` for SPA navigation.
- `UIMenu.ts` creates the fixed `.jlz-topbar` with language, theme and sound
  controls. There is no hamburger-driven navbar or menu toolbar.

`navigateToPage()` preserves same-origin hashes. Bare `href="#"` links are
local controls, never routes. A link such as `/works#section-works-02` renders
the route first and then asks `JoystickNav` to activate the target section.

## Rendering path

`Renderer` owns the canvas, renderer instance and `RenderPipeline`.

1. `DeviceCapability` performs an initial feature/tier assessment.
2. `WebGPURenderer` is attempted when available.
3. If its backend resolves to a fallback, or WebGPU is unavailable, a
   `WebGLRenderer` is created.
4. `setFinalRendererMode()` recalculates renderer mode, DPR cap, quality tier
   and post-processing from the backend actually selected.
5. `PostProcessingManager` and the pipeline configuration refresh after that
   final decision.

The scene uses `setAnimationLoop`. Rendering is event-driven through
`Experience._needsRender`, with small, explicit exceptions for active
animation. `EnvSphere` owns the visible background; the ground plane is only
visible on the contact section.

`World` creates the six section scene groups through `SectionSceneFactory`.
The home-only Baku carousel is initialized by the idempotent
`World.ensureCarouselInitialized()` method, including when a user reaches home
after a content-route deep link.

## Theme, language and metadata

`ThemeManager` stores `auto` or `inverse` in `localStorage('jlz:theme')`.
`ContentReveal` applies the result per section: auto uses the light/dark value
from `WorldConfig`; inverse flips it. It also notifies the 3D layer through
`jlz:theme-applied`.

`i18n.ts` owns EN/RU strings and language persistence. `router.ts` applies
translations and `pageMeta.ts` updates title, description, canonical, Open
Graph and Twitter values on route and language changes.

## Lifecycle and events

`EventBus.ts` owns typed events (`jlz:webgl-ready`, `jlz:webgl-failed`,
`jlz:section-change`, `jlz:route-change`) and bridges them to `window` for
existing DOM listeners. Other DOM interaction events are intentionally local
contracts; inspect their producer and consumer before changing their payload.

Every owner of a listener, timer, render target, texture or DOM node is
responsible for disposing it. `Experience.destroy()` tears down the top-level
runtime; router replacement disposes page-specific WorkCards before replacing
the DOM.

## Key modules

| Area            | Primary modules                                                       |
| --------------- | --------------------------------------------------------------------- |
| Bootstrap       | `entry-shell.ts`, `entry-app.ts`, `main-app.ts`                       |
| Routing/content | `router.ts`, `pages/`, `sections/*/template.ts`                       |
| Runtime         | `Experience.ts`, `Renderer.ts`, `World.ts`, `WorldConfig.ts`          |
| Scene elements  | `Experience/World/*`, `SectionSceneFactory.ts`                        |
| UI              | `JoystickNav.ts`, `UIMenu.ts`, `FullscreenOverlay.ts`, `WorkCards.ts` |
| Core services   | `ThemeManager.ts`, `i18n.ts`, `pageMeta.ts`, `EventBus.ts`            |

For code-level invariants see [RULES.md](RULES.md); for running and testing
the project see [DEVELOPMENT.md](DEVELOPMENT.md).
