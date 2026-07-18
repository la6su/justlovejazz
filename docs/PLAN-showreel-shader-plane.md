# Active plan — Works 3D and showreel

This is the sole detailed active product plan. It complements the one-line
backlog item in [`NEXT.md`](../NEXT.md); it does not replace it.

## Goal

Evolve the Works experience without regressing first paint, the WebGPU/WebGL2
fallback, keyboard access or the existing project overlay.

## Current implementation slice

Keep the editorial DOM foundation as the accessible project owner while the
home Works scene demonstrates the same media through real Three.js planes. The
Works route keeps UIkit Grid/Cover, semantic buttons and `FullscreenOverlay`;
the home Baku slider provides the spatial counterpart without replacing those
controls.

Telegram sharing, generated social cards and Contact-system extensions are
explicitly deferred until their product copy and scope are rewritten.

Works contains released or presentable authored outcomes, including video and
interactive case studies. Lab experiments remain a separate route and future
lazy-loaded runtime; the Works taxonomy must not use “Experiments” as a generic
project category.

## Already complete

- Video elements use `preload="none"`; `FullscreenOverlay` assigns the source
  when a video is opened.
- Works cards provide a CSS wobble and synchronise a cube wobble pulse before
  opening the project overlay.
- The former circular Baku carousel is now a non-autoplay flat infinite media
  strip. Its large `CasePlane` cards are TSL NodeMaterials with buffered UV
  counter-travel, asymmetric contact-sheet arrival and explicit resource
  disposal. Home deliberately frames large cases with clipped neighbours;
  arrows are the only visible DOM interaction in that section.
- Plane-origin fullscreen handoff settles the selected plane's texture
  parallax, aligns that real plane with the camera and runs one bounded TSL
  multi-origin photographic film burn while it fills the viewport. UIkit then
  crossfades the same decoded still above it. Works does not inherit, load or
  autoplay the studio reel;
  that asset belongs exclusively to Play Showreel. `/works` mirrors UIkit's
  compact vertical grid in `WorksPlaneStage`, including its safe-area and
  caption treatment; fullscreen navigation uses large controls.
- `/works` now uses a lazy `WorksPlaneStage`: DOM buttons remain accessible
  captions and keyboard controls, while all visible case media is rendered by
  true Three.js planes. A selected plane expands and burns into the shared
  UIkit `FullscreenOverlay`; the overlay receives one copy of the same source
  texture so there is no image or aspect swap during the handoff.
- `ShowreelButton3D.ts` exists as a TSL implementation, but the intro scene
  deliberately does not instantiate it because the previous composition was
  visually cluttered.

## Remaining decisions and phases

### 1. Approve the visual direction for the intro showreel trigger

Decide whether the 3D trigger should return, be redesigned, or remain absent.
If it returns, instantiate `ShowreelButton3D` only after validating its scale,
placement and contrast against the glass cube on both renderer backends.

### 2. Evaluate a 3D Works route companion

Only if the accepted planar slider needs a counterpart on `/works`, prototype a
small, disposable `PortfolioGrid3D` behind a feature boundary:

- use TSL materials and an explicit texture strategy;
- retain semantic DOM fallback and keyboard access until the prototype is
  accepted;
- profile raycasting, textures and DPR on real WebGPU and WebGL2 devices;
- keep `FullscreenOverlay` as the project-detail owner.

Do not replace `WorkCards`; any 3D companion remains secondary to the semantic
DOM grid until it passes visual, accessibility and performance review.

### 3. Decide on video-plane integration

Only after a real showreel asset and approved interaction exist, assess a
`VideoPlane3D` transition. It must load on explicit user action, preserve
native controls/fallback and degrade cleanly to the DOM overlay.

### 4. Integrate or remove prototypes

For every accepted prototype, document its owner in Architecture and remove the
superseded path. For every rejected prototype, delete it rather than retaining
dead render paths.

### 5. Coordinate transitions with the wider experience

Treat route, Menu and fullscreen-project transitions as one motion language,
not three unrelated effects. Prototype a single temporary fullscreen TSL pass
that renders only while a transition is active and releases its resources when
settled. It must preserve `FullscreenOverlay` and UIkit as the semantic owners.

Standalone Blog pages must not boot the Three.js runtime for continuity; use a
lightweight document/CSS handoff with the same timing and visual motif. Lab
opens an isolated dynamically imported scene behind an explicit loading state.
Low-tier devices use a simple mask/opacity transition, and reduced-motion skips
spatial distortion entirely.

## Exit criteria

- No regression to splash/FCP or WebGPU/WebGL fallback.
- No increase in persistent render work when the scene is idle.
- Keyboard, reduced-motion and overlay behaviour stay correct.
- `format:check`, lint, type-check, build, unit and Playwright checks pass.
- Real-device visual QA covers at least one WebGPU and one WebGL2 path.
