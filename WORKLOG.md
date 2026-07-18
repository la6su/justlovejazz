# Worklog

## 2026-07-18 — Parallax plane-to-still Works fullscreen

### Decision

Separated the content models that had become mixed together. The home Works
stream is a flat infinite horizontal parallax strip: drag moves real TSL planes
while their textures counter-travel inside a generous UV buffer. Frames keep a
single scale and horizon; the viewport clips their neighbours instead of using
card rotation, fabric bend or depth staggering. `/works` retains
its semantic UIkit composition and lazy real-plane companion. A selected plane
settles its parallax, aligns with the camera and fills the viewport while a
bounded TSL film burn opens several softly warped emulsion holes with an amber
exposure wash, a dark char band and a white-hot edge. The centre case resolves
first on section arrival; right and left neighbours register on asymmetric
beats, and texture parallax begins only after each still becomes legible.
UIkit then crossfades one decoded
fullscreen still over it; there is no nested three-image gallery, horizontal
aperture, autoplay or shared-video fallback. The approved `coming-soon` film
and poster now belong exclusively to Play Showreel.

Works post grading is neutral while `CasePlane` pre-inverts the shared filmic
curve. The same authored sRGB still therefore keeps its density between the
TSL plane and DOM fullscreen instead of becoming brighter or developing bloom
artefacts during parallax. A restrained anisotropy level stabilises the moving
texture on high-DPI displays.

Generated a coherent eight-image Studio Console preview set from the approved
reference direction. Every project preview is a versioned 1440×810 JPEG with a
monochrome base and restrained `#b8ed69` / `#45d7bc` signals; the previous
assets remain intact for comparison.

### Verification

- Browser-checked the home strip drag and `/works` on native WebGPU: frames
  counter-travel without bending; the selected real plane expands,
  the fullscreen shell contains exactly one matching still, video source stays
  empty and the unobscured previous arrow updates title, counter and poster.
- Browser-checked the centre/right/left arrival, source-colour parity and the
  multi-origin burn handoff. The active transition reached the 144 Hz display
  cadence during the final pass.
- Type-check, production build and all 86 unit tests pass. Full repository
  gates are recorded after the final polish.

## 2026-07-18 — Editorial Works reveal and high-refresh diagnostics

### Decision

Replaced the home Works cube-face unfold with a centre-first depth reveal that
keeps all real `CasePlane` surfaces in their final three-card composition. A
shared TSL alpha wipe resolves each image from its centre. Fullscreen handoff is
now a 0.96s focus → travel gesture: neighbouring planes fade first, the CRT
signal arrives late and UIkit takes ownership only after the selected plane has
nearly reached the camera. Plane-origin metadata and controls join with a short
project-owned fade while UIkit remains the modal state/focus owner.

Restored the intended post-splash broken-square portal echo as one precompiled
instanced draw call, not a random particle system. Corrected DevPanel FPS to
measure real pipeline renders: an idle on-demand scene now reports 0 instead of
the browser callback rate. Capped native WebGPU DPR at 1.5 (matching the desktop
WebGL2 ceiling) to cut full-screen post fill work by 44% on high-refresh Retina
setups without reducing geometry or effect quality tier.

### Verification

- Browser-checked the splash portal, centre-first home Works arrival, the
  slower mid-handoff frame and successful first-video fullscreen takeover on
  native WebGPU.
- Static Studio reports 0 rendered FPS; active Works reports the actual browser
  render cadence rather than an unrelated `requestAnimationFrame` counter.
- Lint (0 errors, 54 existing warnings), type-check, production build and all
  86 unit tests pass. The parallel Playwright run passed 10/12; both timing-
  sensitive mobile route/menu scenarios pass together with one worker.
- Repository-wide `format:check` remains blocked by 30 pre-existing unrelated
  files; every file touched for this change is formatted and `git diff --check`
  passes.

## 2026-07-18 — Stable startup and Works frame pacing

### Decision

Made the inline splash the only startup entrance: the cube now starts settled,
the redundant 3D trace opener was removed and the procedural PMREM source was
reduced to the resolution its soft reflections actually need. Home Works
textures and TSL planes now prewarm before Enter becomes ready.

The cube's CPU deformation retains its 30fps upload cadence but now follows a
damped energy envelope instead of stopping on a timer. `/works` render activity
is scoped to its two visible cards, so hidden reveal values cannot keep the
renderer alive after the route settles. Removed the unused BoxGeometry UV
attribute before vertex welding so rounded edges share normals without seams.
WebGL2 now uses a 1.5 DPR ceiling and one third-resolution separable bloom pass;
the native WebGPU premium profile is unchanged.

### Verification

- Target-file formatting, lint (0 errors, 54 existing warnings), type-check,
  production build, 86 unit tests and all 12 Playwright scenarios pass.
- Browser QA reached the display limit at 72 FPS on WebGPU. The tested WebGL2
  Works frame improved from 46 FPS / 21.7 ms to 87 FPS / 11.5 ms; both backends
  return the intro renderer to idle after the splash reveal.
- Repository-wide `format:check` remains blocked by 32 pre-existing unrelated
  files, tracked in `NEXT.md`.

## 2026-07-18 — Works cursor signal repair

### Decision

Rebuilt the legacy blue DrawTrail as a short-lived Studio Console signal: a
real TSL ribbon in lime and teal, with its width aligned perpendicular to the
pointer path. The former fixed camera-right offset made horizontal movement
collapse into zero-area triangles, which is why the tail looked broken or
absent. The trace now receives an explicit idle-energy decay and keeps the
on-demand renderer alive only while it settles. It appears throughout the
standalone `/works` route and remains absent from the home media stream.

### Verification

- Browser-checked the standalone Works composition and its cursor-safe media
  field after the route visibility change.
- Type-check, lint (0 errors, 54 existing warnings), production build and 86
  unit tests pass.

## 2026-07-18 — CRT-first Works fullscreen handoff

### Decision

Replaced the sequential plane-to-overlay choreography with one short 0.34s
handoff. The selected real `CasePlane` owns the TSL CRT-on pulse; the UIkit
overlay then takes over directly without an aperture or delayed metadata
animation. The decoded poster remains the continuity surface until the first
video frame has composited. A case without a dedicated film now explicitly
uses the approved studio reel, so opening the first playable case cannot settle
on a black video stage. Fullscreen previous/next controls are deliberately
large on both desktop and mobile.

### Verification

- Browser-checked the first `EBB VIBES` case: the studio reel is visible on
  first open, including during the short transition; the enlarged controls are
  present.
- Type-check, lint (0 errors, 54 existing warnings), production build and 86
  unit tests pass. The full Playwright run passed 11 of 12 scenarios; its only
  failure was a parallel `/works` semantic-grid mount timeout. The exact
  scenario passes when rerun in isolation.

## 2026-07-18 — Works handoff and compact staging

### Decision

Kept a real 3D plane visible through the plane-to-modal seam until its matching
DOM poster has decoded. This removes the first-project black frame without
substituting an unrelated fallback video. Video posters now remain visible
until the browser has rendered the first video frame, so arrow navigation uses
the same no-black-frame contract.

Below UIkit's `@m` grid breakpoint, `WorksPlaneStage` switches from its
two-column coordinates to a deliberate vertical pair. The compact route hides
the decorative background title, removes duplicate card telemetry and reserves
safe space for the topbar and lower navigator. The semantic UIkit grid and the
visible Three.js planes now describe the same layout.

### Verification

- Browser-checked the first `EBB VIBES` plane handoff and the following
  `MONO SUNDAY` video path: both kept authored media visible.
- Added a 390 × 844 Chromium check for the mobile `/works` pair. Type-check,
  lint (0 errors, 54 existing warnings), production build, 86 unit tests and
  12 Playwright scenarios pass.

## 2026-07-18 — Infinite Works media and plane handoff

### Decision

Replaced the small planar Works slider with an infinite, non-autoplay media
stream of twelve large, texture-shared TSL `CasePlane` instances. Drag velocity
now bends the actual subdivided planes, so the effect is material resistance
rather than a rotating-card carousel. Added a lazy `WorksPlaneStage` for
`/works`: DOM controls retain semantics, focus and keyboard access but the
visible case imagery is real Three.js media. Both the home stream and route
stage expand a selected plane before the UIkit detail opens, with the exact
same source texture during the handoff. The legacy cursor trail stays out of
the home stream so it cannot cross its artwork.

The home composition now deliberately frames three substantial cases at once,
with breathing room, restrained fabric-like bending at the two outer edges and
large previous/next controls. It has no visible DOM copy or console module:
the only title is a quiet outlined `WORKS` CanvasTexture on a real plane behind
the media, revealed with the cube-to-stream handoff.

### Verification

- Visually checked the desktop `/works` 3D stage, velocity distortion, direct
  plane opening, three-case home composition, title-plane depth and arrow
  controls; no browser errors.
- Type-check, lint and production build pass; full regression checks follow
  before the change is staged.

## 2026-07-18 — Planar Works case slider

### Decision

Replaced the rotating home Works ring with a non-autoplay horizontal slider of
real Three.js `CasePlane` surfaces. Each plane owns a TSL vertex wobble,
per-plane reveal and explicit GPU disposal; the shared fullscreen overlay
remains the detail owner. The semantic `/works` grid now uses the same compact
plane response, signal-edge treatment and click wobble rather than oversized
card tilt or project-colour gradients.

### Verification

- Visually checked the home slider, `/works` desktop composition and opening a
  case directly from a 3D plane; no browser errors were reported.
- Lint (0 errors; 54 existing warnings), type-check, production build, 86 unit
  tests and all 11 Playwright Chromium scenarios pass.

## 2026-07-18 — Monochrome console contrast

### Decision

Reduced the active visual system to a black/white environment and two fixed UI
signals: lime `#b8ed69` and teal `#45d7bc`. The console frame keeps its
character through discrete signal segments rather than gradients. Telegram,
storyline controls and bottom modules now define both dark and inverse surfaces
explicitly; EnvSphere, fog, ground and glass reflections are neutral grayscale.

### Verification

- Visually checked the light Contact CTA and the settled dark frame.
- Type-check, production build and 86 unit tests pass. The targeted Works
  Playwright scenario passes; the previous full parallel run had one isolated
  `/works` timeout while the other 10 scenarios passed.

## 2026-07-18 — Console Field note module

### Decision

Moved the lower story surface into the Studio Console layer and rebuilt it as a
terminal-like output module: signal header, readable mono output and one clear
command. It uses local transparency and a 14px blur only where desktop content
crosses the active 3D stage. Mobile disables the blur and increases opacity;
inverse receives its own light surface and contrast values.

### Verification

- Visually checked dark desktop, 390 × 844 mobile and inverse desktop states.
- Type-check, lint (0 errors; 54 existing warnings), production build, 86 unit
  tests and all 11 sequential Playwright Chromium tests pass.

## 2026-07-18 — Studio Console theme boundary

### Decision

Created `src/assets/studio-console/` as the destination for all new shared
visual decisions. UIkit remains responsible for component semantics and state;
Quantum Flares and Vibe are now read-only donor/compatibility layers that can
be reduced only after each migrated treatment is verified. The first adopted
Vibe pattern is a static acid-green/teal signal edge for focus, active
navigation and story-module boundaries—without its glitch loops, texture or
type system.

### Verification

- The layer is imported after the retained QF compatibility bridge, so it wins
  without modifying either vendored snapshot.
- Type-check, lint (0 errors; 54 existing warnings), production build, 86 unit
  tests and all 11 sequential Playwright Chromium tests pass.

## 2026-07-18 — Dark console mobile baseline

### Decision

Consolidated the SPA around a dark technical-console system: restored the
renderer-owned CRT edge frame, retained the removal of scanlines and grain,
and removed the decorative progress shader. EnvSphere now stays within a
single low-luminance dark family across every story frame. Rebuilt each lower
story beat as one semantic `Field note` module with an aligned action, then
gave mobile its own single-column rhythm, contrast and touch target treatment.
Menus, the Contact sheet and Telegram action use the same opaque technical
planes rather than glass gradients or oversized rounded cards.

### Rationale

The earlier light/dark sections and fluid panels made the portfolio feel like
separate art directions. A persistent frame, one restrained palette and
consistent lower-module geometry let the 3D object carry the atmosphere while
the interface remains readable at phone scale.

### Verification

- Visually checked the 390 × 844 Studio and Services frames after splash,
  including the final state of the forward transition and fixed controls.

## 2026-07-18 — Single-owner story transition timing

### Decision

Removed UIkit Scrollspy reveal effects from story section panels and stopped
easing CSS values that `CinematicNav` updates on every scroll frame. Theme
updates now dispatch only when the visual mode changes, preventing redundant
environment interpolation between adjacent sections of the same mode. Aligned
the discrete 3D arrival with the DOM chapter midpoint in both directions while
keeping camera and material interpolation continuous across each scroll frame.

### Rationale

The parallel CSS/UIkit/Three timelines made content trail behind scroll and
occasionally restarted the dark/light transition. A single continuous timeline
keeps section changes responsive without sacrificing the intentional title
motion after the splash.

### Verification

- Type-check, lint (0 errors; 54 existing warnings), production build, 86 unit
  tests and all 11 Playwright Chromium tests pass in the sequential full run.

Short, newest-first decisions that help the next maintainer. Do not copy task
inventories or release notes here. Git history retains the detailed record.

---

<!-- WORKLOG:ENTRIES -->

## 2026-07-18 — Glass control refinement

### Decision

Reworked UIkit default and icon-button hooks as one restrained glass material:
translucent layers, internal highlight, thin edge and a small depth response
replace opaque controls and rotational hover. Replaced the filled theme glyphs
with matching outline icons, refined the sound bars, and removed the redundant
storyline status/progress DOM so the active chapter item is the only status.

### Verification

- Type-check, lint (0 errors; 54 existing warnings), production build, 86 unit
  tests and all 11 Playwright Chromium tests pass.

## 2026-07-18 — One owned theme boundary

### Decision

Kept Quantum Flares as an immutable vendor baseline and consolidated the two
duplicate Less assembly chains into project-owned `_theme.less`. The bridge now
explicitly disables QF's legacy texture/glitch effects through variation
variables, leaving the current Onest, calm glass, fluid surfaces and purposeful
motion as the only visual language across SPA and Blog.

### Verification

- Production build, type-check, lint (0 errors; 54 existing warnings), 86 unit
  tests and all 11 Playwright Chromium tests pass.

## 2026-07-18 — Editorial Blog and honest Lab catalogue

### Decision

Turned the Blog index into an editorial entry with one featured engineering
story and a compact note list, replacing the repeated generic card rhythm.
Lab copy now describes concrete research questions and labels every item as an
isolated scene in development; its only current action is a linked development
note. This prevents an unfinished experiment catalogue from masquerading as
client work or loading a future scene runtime into the shared application.

### Verification

- Type-check, lint (0 errors; 54 existing warnings), production build, 86 unit
  tests and all 11 Playwright Chromium tests pass.

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
