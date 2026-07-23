# Architecture

## System boundary

The product is one Vite SPA entry (`index.html`) plus standalone blog pages.
The SPA owns the shared 3D scene and a transparent DOM layer; blog pages do not
boot the scene. The product itself is the portfolio: each route must demonstrate
the capability it describes through its composition, interaction and content,
not act as a generic brochure around a separate gallery.

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

| Route        | Page key    | Main sections                                         |
| ------------ | ----------- | ----------------------------------------------------- |
| `/`          | `home`      | Studio, Services, Works, Manifesto                    |
| `/services`  | `services`  | Creative Direction, Realtime build, Motion, AI        |
| `/works`     | `works`     | Four case-study groups                                |
| `/manifesto` | `manifesto` | Purpose, Clarity, Emotion, Simplicity                 |
| `/lab`       | `lab`       | Shader Lab, Audio Reactive, Generative, GPU Particles |
| `/contact`   | `contact`   | Email, Social, Location, Form                         |

The world is always six sections, in this fixed order. `WorldConfig.ts` is the
source for their IDs and section data; `SplashCube.FACE_ROTATIONS` is the
source for the cube's displayed orientation.

| Index | Canonical ID              | Role           | Cube face     | Primary source module                                       |
| ----- | ------------------------- | -------------- | ------------- | ----------------------------------------------------------- |
| 0     | `lab` / `sec_lab`         | Contact finale | Front (+Z)    | `sections/lab/scene.ts`; `sections/lab-overlay/template.ts` |
| 1     | `intro` / `sec_intro`     | Story frame 1  | Right (+X)    | `sections/intro/scene.ts`                                   |
| 2     | `about` / `sec_about`     | Story frame 2  | Back (-Z)     | `sections/about/scene.ts`                                   |
| 3     | `works` / `sec_works`     | Story frame 3  | Left (-X)     | `sections/works/scene.ts`                                   |
| 4     | `contact` / `sec_contact` | Story frame 4  | Y tilt `−π/4` | `sections/contact/scene.ts`                                 |
| 5     | `menu` / `sec_menu`       | Menu sheet     | Y tilt `+π/4` | `sections/menu/scene.ts`; `sections/nav/template.ts`        |

Home sections use `data-section`; content-page sections use
`data-page-section`. The public Contact finale intentionally reuses the stable
section-0 `lab` identifier so renderer configuration, deep links and the
six-section contract do not fork. The `/lab` route is a catalogue of
experiments, not a Works category. Each accepted experiment is an isolated 3D
scene loaded only after the visitor opens it; experiment dependencies and
assets must not join the shared startup bundle. The catalogue can remain
lightweight and semantic before those scenes load. The menu template is the
one intentional exception to the shared content section shell. Contact and Menu deliberately
use tilted side-face views rather than literal top/bottom cube rotations;
changing that visual model requires updating `SplashCube.FACE_ROTATIONS` and
this table.

## Navigation and UI composition

`CinematicNav` owns a native vertical story track and its continuous
progress signal.

- The four main sections are full-viewport scroll-snap frames. Trackpad,
  mouse-wheel and touch retain their native vertical scrolling behavior.
- DOM and 3D discrete arrivals share the midpoint between adjacent frames;
  transform and material values continue blending across the complete interval.
- The storyline jumps among frames. Up/down, Page Up/Page Down, Home and
  End provide keyboard equivalents.
- Menu (5) enters as a top sheet; the Contact finale (0) enters from the
  bottom. Escape or their close controls restore the current story frame.
- The Menu is a navigation-only, two-column desktop composition and a compact
  mobile sheet. UIkit `uk-nav` owns its expandable parents; sub-links carry
  `data-nav-href` for SPA navigation.
- `UIMenu.ts` creates the compact fixed top bar, preference controls and the
  Contact launcher. `data-cinematic-sheet` is the single application-owned
  sheet state; opening a sheet makes background frames inert and closing it
  restores focus to the launcher.

`navigateToPage()` preserves same-origin hashes. Bare `href="#"` links are
local controls, never routes. A link such as `/works#section-works-02` renders
the route first and then asks `CinematicNav` to move the vertical track to
the target frame.

## Rendering path

`Renderer` owns the canvas, renderer instance and `RenderPipeline`.

1. `DeviceCapability` performs an initial feature/tier assessment.
2. `WebGPURenderer` is attempted when available.
3. If its backend resolves to a fallback, or WebGPU is unavailable, a
   `WebGLRenderer` is created.
4. `setFinalRendererMode()` recalculates renderer mode, DPR cap, quality tier
   and post-processing from the backend actually selected.
5. `PostProcessingManager` and the pipeline configuration refresh after that
   final decision. Visible post-processing intensities are supplied by the
   active `WorldConfig` section; backend code only owns its implementation
   details such as bloom blur shape.

The scene uses `setAnimationLoop`. Rendering is event-driven through
`Experience._needsRender`, with small, explicit exceptions for active
animation. `EnvSphere` owns the visible background; the ground plane is only
visible on the contact section.

The inline splash is the only startup entrance animation. The shared cube is
already settled when the curtain opens. On home, the case-stream textures are
decoded and its TSL materials are compiled before Enter becomes ready, keeping
first-use GPU work out of the Works navigation transition.

`World` creates the six section scene groups through `SectionSceneFactory`.
`EnvSphere` remains the only ambient background layer; the former decorative
story-line shader was removed to preserve a single dark console field. The
inline splash hands off through one short instanced broken-square portal echo;
it is precompiled behind the loader, renders for about one second and does not
create a persistent particle simulation. The
home-only Baku case stream is initialized by the idempotent
`World.ensureCarouselInitialized()` method, including when a user reaches home
after a content-route deep link. Its large `CasePlane` surfaces wrap as a flat
infinite media strip. The frame and its buffered texture counter-travel at
different rates, producing horizontal parallax without bending, rotating,
shrinking or depth-staggering the case planes. The viewport deliberately clips
the neighbouring cases. On arrival, a contact-sheet exposure resolves the
centre plane first, then the right and left neighbours on asymmetric beats;
texture parallax stays at rest until each plane is legible. Its only DOM
controls are the accessible previous/next buttons. `/works` lazily
initializes `WorksPlaneStage`: it renders the visible case imagery as genuine
Three.js planes while semantic DOM buttons retain keyboard/focus behaviour.
`DrawTrail` is a transient Studio Console cursor signal on the standalone
`/works` route only; it decays after pointer movement and stays out of the home
media stream.
At UIkit's `@m` breakpoint the stage mirrors the semantic grid's vertical pair
instead of retaining desktop coordinates. The home stream counter-travels each
texture inside its real plane while drag moves the planes themselves. On open,
all three entry points (showreel, home slider, /works cards) use one unified
DOM cinematic depth-push reveal — there is no 3D plane-to-fullscreen handoff,
which was removed to avoid a double effect. `CasePlane` textures render with
faithful original colors: `toneMapped:false` on the material and no ACES tone
mapping in the composite shader. The UIkit fullscreen
detail then crossfades the same decoded still above it, with no second carousel,
cinema aperture, video fallback or source/aspect swap. UIkit remains the owner
of visibility, focus, Escape and arrow-key navigation. The only fullscreen
video source is the approved Play Showreel asset; its poster remains visible
until the first video frame is composited.

The development FPS panel counts actual calls to the render pipeline, not the
browser's independent animation callback cadence; an idle on-demand scene reads
zero. Native WebGPU and WebGL2 both cap DPR at 1.5 so full-screen post processing
does not unnecessarily miss alternate v-sync deadlines on high-refresh panels.

## Theme, language and metadata

`ThemeManager` stores `auto` or `inverse` in `localStorage('jlz:theme')`.
`ContentReveal` applies the result per section: auto resolves to the shared
dark console mode; inverse is the explicit accessibility alternative. It also
notifies the 3D layer through `jlz:theme-applied`.

`i18n.ts` owns EN/RU strings and language persistence. `router.ts` applies
translations and `pageMeta.ts` updates title, description, canonical, Open
Graph and Twitter values on route and language changes.

Onest Variable is self-hosted in separate Latin and Cyrillic subsets. The
Unicode ranges in `public/fonts/onest.css` let the browser request only the
needed subset; `_import.less` owns the application font tokens. Weight-axis
animation is a progressive typographic layer and must settle immediately when
reduced motion is requested.

## Editorial content model

Every primary route follows a compact narrative rhythm: capability, problem,
response, proof. These are story beats, not a mandatory four-card layout; the
page composition should express them with typography, media, 3D state and
transition timing. Copy stays short, concrete and useful in both languages.

- Works presents authored case studies and showreel/video material.
- Blog turns the same proof into readable process, decisions and outcomes; its
  standalone pages share brand typography and editorial rhythm without loading
  the 3D runtime.
- Lab presents separately loaded interactive 3D experiments. An experiment may
  prove a technique later used in a case study, but it is never labelled as a
  client work merely because it is visually complete.

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

| Area            | Primary modules                                                        |
| --------------- | ---------------------------------------------------------------------- |
| Bootstrap       | `entry-shell.ts`, `entry-app.ts`, `main-app.ts`                        |
| Routing/content | `router.ts`, `pages/`, `sections/*/template.ts`                        |
| Runtime         | `Experience.ts`, `Renderer.ts`, `World.ts`, `WorldConfig.ts`           |
| Scene elements  | `Experience/World/*`, `SectionSceneFactory.ts`                         |
| UI              | `CinematicNav.ts`, `UIMenu.ts`, `FullscreenOverlay.ts`, `WorkCards.ts` |
| Core services   | `ThemeManager.ts`, `i18n.ts`, `pageMeta.ts`, `EventBus.ts`             |

For code-level invariants see [RULES.md](RULES.md); for running and testing
the project see [DEVELOPMENT.md](DEVELOPMENT.md).
