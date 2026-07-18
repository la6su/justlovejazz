# Worklog

Short, newest-first decisions that help the next maintainer. Do not copy task
inventories or release notes here. Git history retains the detailed record.

---

<!-- WORKLOG:ENTRIES -->

## 2026-07-18 — Entry typography and navigation refinement

### Decision

Moved the 3D word treatment to the lower Contact/Manifesto frame only. Its
glyphs now wait for the frame to settle, then reveal once through CPU-side
transforms that remain identical on WebGPU and WebGL2; reduced motion resolves
immediately. Updated the existing square-path splash copy into a multilingual
entry while preserving its concentric geometry and centered Enter control,
removed the top-bar signal, moved the chapter control to the right and
expanded Menu to seven destinations including Lab and a direct Blog route.
UIkit button and
icon-button hooks now share the compact cinematic control language, while the
Contact launcher is deliberately black-on-white in both runtime theme modes.
The entry handoff no longer throws random gravity-driven particles: three
deterministic broken-square light frames now echo the splash geometry, contract
through the cube and dissolve in 1.05 seconds using one 12-instance mesh.

### Verification

- Visually checked the splash, top bar, Menu, contact CTA and lower 3D HELLO
  frame in a live desktop browser.
- Type-check, lint (0 errors; 54 existing warnings), build, 86 unit tests and
  all 11 Playwright Chromium tests pass.

## 2026-07-18 — Editorial Works and variable typography foundation

### Decision

Made the Works route a dark editorial media stage with asymmetric UIkit grids,
oversized type and restrained weight animation while keeping semantic project
buttons and `FullscreenOverlay`. Onest Variable is now self-hosted as separate
Latin and Cyrillic subsets across the SPA and standalone Blog. Removed the
renderer pipeline's hidden default CRT border and all section vignette values;
the fullscreen viewer now owns a fixed dark contrast contract in inverse mode.
Works no longer calls production projects “Experiments”: Lab is reserved for
separately loaded 3D R&D scenes. The product-wide content model is capability,
problem, response and proof, expressed as rhythm rather than repeated lists.

### Verification

- Visually checked Works in both theme modes and Russian, then opened a project
  from its card and checked the fullscreen viewer contrast and controls.
- Type-check, lint (0 errors; 54 existing warnings), production build, 86 unit
  tests and all 11 Playwright Chromium tests pass, including the mobile story.
  Repository-wide formatting now reports the known 32-file baseline.

## 2026-07-18 — Vertical interaction and layer polish

### Decision

Restored native vertical scrolling for the four story frames after interaction
testing showed that horizontal navigation was less discoverable. The Works
carousel now ignores the wheel, claims only a horizontal drag after a small
axis check, and has lower rotational response and momentum. The splash and
project modal each own a higher layer than the fixed chrome; the modal also
declares its own dark UIkit inverse mode. Removed the scanline overlay and the
active CRT screen-border pass.

### Verification

- Checked the splash layering in a live desktop browser session.
- Type-check, lint (0 errors; 54 existing warnings), production build, 86 unit
  tests and all 9 Playwright Chromium tests pass.

## 2026-07-18 — Vertical cinematic narrative

### Decision

Replaced the joystick interaction with a native vertical scroll-snap story
across the four main frames. A TSL `CinematicField` now carries one continuous
line, travelling energy and fluid islands through the 3D scene. Menu uses the
canonical section-5 state as a full-screen desktop/compact mobile top sheet;
the canonical section-0 slot keeps its stable Lab identity internally but now
presents a public Contact finale with Telegram as the primary action. UIkit
continues to own Menu nav expansion and close-button semantics. The remaining
chrome is deliberately lighter: the top bar has no shared glass backing, the
chapter control sits beside Contact, and section footers use an editorial rule
instead of a second floating panel. The app no longer enables CRT scanlines or
the renderer's global screen-border pass. The Works carousel only owns a
horizontal drag, preserving native vertical scrolling and direct card taps.

### Verification

- Visually checked Studio, Services, Menu and Contact at 1440 × 900 and
  390 × 844, including sheet close behavior, story jumps and the shader layer.
- Browser console remained clear. Lint has 0 errors; type-check, production
  build, all 86 unit tests and all 9 Chromium tests pass. The Three bundle is
  332.53 KB gzip, inside its 350 KB budget. Repository-wide formatting still
  reports the known baseline (43 files) tracked by the dedicated backlog item.

## 2026-07-16 — Video-first project presentation

### Decision

Rebuilt the Works route as four responsive editorial compositions on UIkit's
native grid, with asymmetric desktop layouts and two full-width mobile frames.
The fullscreen viewer remains a UIkit full modal but now reserves separate
regions for compact metadata, video and controls; project films autoplay muted
and loop, while a staged 1.45-second reveal makes the transition legible. The
shared placeholder film is used until each project receives its own video.

### Verification

- Visually checked Works and the fullscreen viewer at 1440 × 900 and 390 × 844;
  project-edge spacing is equal to the subpixel on both viewports and autoplay
  is active in the open modal.
- Scoped formatting, lint (0 errors), type-check, production build and all 89
  unit tests pass. The full Chromium suite passed 8 of 9 tests; the unrelated
  secret-accordion test repeatedly timed out while headless GPU startup held
  the page, before its assertions ran.

## 2026-07-16 — Secret-section shader backdrop

### Decision

Removed the Lab `ShaderOrb` and Menu `TimelineNodes` entirely. `EnvSphere`
remains the sole background owner and now adds a single low-frequency
procedural colour field only while either secret section is active. Lab uses a
cool cyan-to-violet wash; Menu uses a midnight indigo-to-plum wash. The layer
fades in and out, respects reduced motion, and refreshes its CanvasTexture at
10 fps only on secret sections, with no particles or render targets.

### Verification

- Confirmed Lab and Menu joystick transitions in Chromium; neither section
  reports a browser runtime error.
- Type-check, lint, production build, 89 unit tests and 9 Chromium E2E tests
  passed.

## 2026-07-16 — Unified secret-section accordions

### Decision

Made the two persistent secret sections one compact pattern at every viewport.
Lab now renders its six existing projects only as a native UIkit Accordion;
Menu uses its native UIkit Nav accordion inline rather than a desktop dropdown.
Both panels are vertically centred within the usable viewport, reserve space
for the fixed top bar and joystick, and remove the nonessential Menu footer
and studio meta copy.

### Verification

- Added a 390 × 844 Chromium regression check for the shared Lab/Menu
  accordion accessibility state.
- Lint (0 errors), type-check, unit tests, production build and 9 Chromium
  E2E tests passed.

## 2026-07-16 — Right-rail section navigator

### Decision

Kept the existing UIkit `uk-dotnav` and moved it into a project-specific,
fixed right rail using UIkit's vertical modifier. Desktop labels mirror the
current page headings so route and language changes do not create a second
navigation dictionary. Mobile keeps the same accessible controls as compact
markers without visible labels.

### Verification

- Checked desktop and 390px layouts in auto/inverse modes; the rail keeps
  contrast and no longer shares the joystick's transformed positioning context.

## 2026-07-16 — WebGPU/WebGL glass and typography parity

### Decision

Removed a duplicate post-processing preset layer that overrode `WorldConfig`
and left WebGPU chromatic aberration active. The 3D words now use a compact,
bundled Comfortaa Bold subset with independently floating glyph meshes. The
cube uses one transparent reflective shell plus a low-frequency CPU-driven
jelly deformation for legibility without duplicated contours. Physical transmission in
the current WebGPU post path samples an incompatible scene-colour target and
turns the cube dark and milky; the shared shell keeps the intended motion and
silhouette consistent on both backends.

### Verification

- Forced WebGPU and WebGL2 captures of the 3D-text section have no RGB fringe,
  runtime errors or material-colour divergence; the cube and individual glyphs
  move between consecutive captures.
- Type-check, lint, production build and the 89-unit-test suite passed.

## 2026-07-16 — Glass-cube backend parity baseline

### Decision

Kept the required WebGL GLSL transmission fallback because the current Three.js
NodeMaterial transmission path calls `getCanvasTarget`, unavailable on
`WebGLRenderer`. Removed its Drei-derived multi-sampling, anisotropic blur and
temporal distortion: those were a second optical model, not a renderer
equivalent. The fallback now uses one restrained sample and the same physical
parameters, PMREM and motion intent as WebGPU.

### Verification

- Type-check, lint and production build passed; the 89-unit-test suite passed.
- A forced-WebGL experiment confirmed the shared TSL transmission path fails
  exactly at the unsupported `getCanvasTarget` call, so it was not retained.

## 2026-07-16 — Splash import boundary and performance budgets

### Decision

Isolated Vite's virtual preload helper into its own runtime chunk. Previously,
the helper shared the 3D Experience chunk and made the HTML preload Three.js,
despite the dynamic import in the splash shell. The shell now preloads only its
1.9 KB gzip startup graph; the lazy app bootstrap owns Three.js delivery.

### Verification

- Production `index.html` preloads only `chunk-runtime`; it has no direct
  Three.js, UIkit or World preload.
- Production build, type-check, unit and Playwright suites passed after the
  change.

## 2026-07-16 — UIkit/YOOtheme composition and CI parity

### Decision

Added a project-owned Quantum Flares palette bridge after the selected
variation, keeping the vendored theme untouched while restoring semantic JLZ
tokens for UIkit and QF effects. Documented the same layer ownership and
licensed-theme adoption workflow for future agents. CI now runs the required
Vitest suite before its production build.

### Verification

- The personal `uikit-yootheme-theme` skill passed its validator.
- Workflow YAML parsed successfully; 89 unit tests passed locally.
- Earlier in this session, lint (0 errors), type-check, production build, 89
  unit tests and 7 Playwright tests passed. Repository-wide Prettier remains a
  separate baseline task.

## 2026-07-15 — Documentation consolidation

### Decision

Replaced overlapping status, naming and completed-plan documents with a small
ownership model: source/tests → rules → architecture → backlog → history.
The documentation now reflects the current topbar, two-column menu,
per-section theme and six SPA routes.

### Verification

- Cross-checked routes, UI composition, theme and renderer fallback against
  the current source.
- `prettier --check` passes for all maintained Markdown documentation.
- Lint passed with 0 errors and 57 warnings; type-check, production build,
  89 unit tests and 7 Playwright Chromium tests passed.
- Repository-wide `bun run format:check` currently reports 63 files, including
  files outside this changeset; it is tracked as a separate formatting task.

## 2026-07-15 — Navigation and renderer lifecycle hardening

### Decision

Bare anchors remain local controls, route hashes survive SPA navigation and the
home carousel initialises idempotently after a deep link. Renderer quality data
is refreshed after the final WebGPU/WebGL backend selection.

### Verification

- Browser-verified `/services → /` and carousel initialization.
- Lint, type-check, build and unit tests passed at the time of the change.

## 2026-07-14 — Rendering parity and audit remediation

### Decision

Prioritised material parity, lifecycle cleanup and event-driven rendering after
a broad audit. Detailed findings are intentionally retained in Git commits,
not duplicated in active documentation.
