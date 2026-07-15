# Active plan — Works 3D and showreel

This is the sole detailed active product plan. It complements the one-line
backlog item in [`NEXT.md`](../NEXT.md); it does not replace it.

## Goal

Evolve the Works experience without regressing first paint, the WebGPU/WebGL2
fallback, keyboard access or the existing project overlay.

## Already complete

- Video elements use `preload="none"`; `FullscreenOverlay` assigns the source
  when a video is opened.
- Works cards provide a CSS wobble and synchronise a cube wobble pulse before
  opening the project overlay.
- `ShowreelButton3D.ts` exists as a TSL implementation, but the intro scene
  deliberately does not instantiate it because the previous composition was
  visually cluttered.

## Remaining decisions and phases

### 1. Approve the visual direction for the intro showreel trigger

Decide whether the 3D trigger should return, be redesigned, or remain absent.
If it returns, instantiate `ShowreelButton3D` only after validating its scale,
placement and contrast against the glass cube on both renderer backends.

### 2. Prototype a 3D Works grid

Prototype a small, disposable `PortfolioGrid3D` behind a feature boundary:

- use TSL materials and an explicit texture strategy;
- retain semantic DOM fallback and keyboard access until the prototype is
  accepted;
- profile raycasting, textures and DPR on real WebGPU and WebGL2 devices;
- keep `FullscreenOverlay` as the project-detail owner.

Do not replace `WorkCards` until the prototype passes visual, accessibility and
performance review.

### 3. Decide on video-plane integration

Only after a real showreel asset and approved interaction exist, assess a
`VideoPlane3D` transition. It must load on explicit user action, preserve
native controls/fallback and degrade cleanly to the DOM overlay.

### 4. Integrate or remove prototypes

For every accepted prototype, document its owner in Architecture and remove the
superseded path. For every rejected prototype, delete it rather than retaining
dead render paths.

## Exit criteria

- No regression to splash/FCP or WebGPU/WebGL fallback.
- No increase in persistent render work when the scene is idle.
- Keyboard, reduced-motion and overlay behaviour stay correct.
- `format:check`, lint, type-check, build, unit and Playwright checks pass.
- Real-device visual QA covers at least one WebGPU and one WebGL2 path.
