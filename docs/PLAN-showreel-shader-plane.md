# PLAN — Showreel button as TSL shader plane + video on plane with genie effect

## Goal

Replace the DOM showreel button (`#jlz-showreel-trigger` in `intro/template.ts`)
with a Three.js TSL shader plane positioned in front of the cube (like
`PlayButton3D`). On click → video plays on a separate plane with a "genie"
transition (scale + opacity from button position to fullscreen).

## Current state

- Showreel button: DOM `<button>` with SVG ring + play icon + label.
  Positioned `top: 50%; left: 50%; transform: translate(-50%, -50%)` —
  centered on cube. Opens `FullscreenOverlay` (UIKit3 modal) with video.
- `PlayButton3D` already exists (`src/Experience/World/PlayButton3D.ts`) —
  TSL shader ring in front of cube. Used as reference for the new button.
- `FullscreenOverlay` (`src/UI/FullscreenOverlay.ts`) — UIKit3 modal with
  `<video>` element + controls. Works but is a DOM overlay, not 3D.

## Plan — 4 phases

### Phase 1: Showreel button as TSL shader plane (`ShowreelButton3D.ts`)

New file: `src/Experience/World/ShowreelButton3D.ts`

- Three.js `Mesh` with `PlaneGeometry(0.4, 0.4)` positioned at `z = 1.5`
  (in front of cube, same depth as PlayButton3D).
- TSL `NodeMaterial` with:
  - Circular play button shape (discard fragments outside circle).
  - Animated stroke ring (like PlayButton3D but larger, more visible).
  - Play triangle in center (filled with accent color).
  - Hover: ring stroke-animation (dashoffset), triangle scale 1.15.
- Raycasting: `Experience.ts` raycasts on click → if hit ShowreelButton3D →
  dispatch `jlz:showreel-play` event.
- Position: center of cube face (same as current DOM button).

### Phase 2: Video plane (`VideoPlane3D.ts`)

New file: `src/Experience/World/VideoPlane3D.ts`

- Three.js `Mesh` with `PlaneGeometry(16, 9)` (16:9 aspect).
- `VideoTexture` from `<video>` element (hidden in DOM, used only as source).
- `MeshBasicNodeMaterial` with TSL nodes for:
  - Video texture mapping.
  - Genie transition: scale + opacity + position animation from button
    position to fullscreen center.
  - Chromatic aberration on transition (dramatic effect).
- Hidden by default (`visible = false`). Shown on `jlz:showreel-play`.
- Video controls: custom DOM overlay (play/pause/seek) positioned over the
  3D plane via CSS `pointer-events: none` on canvas + `auto` on controls.

### Phase 3: Genie transition

In `VideoPlane3D.ts`:

- On `jlz:showreel-play`:
  1. Start position: button 3D position (small, in front of cube).
  2. Animate to fullscreen position (z = 0, scale = viewport size).
  3. Duration: 0.8s, easing: cubic-bezier(0.65, 0, 0.35, 1) (cinematic).
  4. Chromatic aberration peaks at mid-transition, fades at end.
  5. Video starts playing when plane reaches fullscreen.
- On close:
  1. Reverse: fullscreen → button position.
  2. Video pauses at start of transition.
  3. Plane hides when transition completes.

### Phase 4: Integration + cleanup

- `Experience.ts`: add `ShowreelButton3D` + `VideoPlane3D` to scene.
  Raycaster: click ShowreelButton3D → `jlz:showreel-play`.
- Remove DOM showreel button from `intro/template.ts`.
- Keep `FullscreenOverlay` for project-mode (poster + info) — only showreel
  moves to 3D. Project overlay stays DOM-based (simpler, works with
  BakuCarousel card click).
- `UIManager.ts`: showreel handler dispatches `jlz:showreel-play` instead
  of opening FullscreenOverlay.

## Technical notes

- TSL NodeMaterial: use `MeshBasicNodeMaterial` (no lighting needed —
  emissive video texture).
- VideoTexture: `<video>` element hidden in DOM (`display: none`),
  `VideoTexture` updates on `requestVideoFrameCallback` or `timeupdate`.
- Raycasting: add ShowreelButton3D to Experience raycaster targets.
- Mobile: VideoPlane3D scales to viewport width, maintains 16:9 aspect.

## Files to create

- `src/Experience/World/ShowreelButton3D.ts` — TSL shader button plane.
- `src/Experience/World/VideoPlane3D.ts` — Video texture plane + genie transition.

## Files to modify

- `src/Experience/Experience.ts` — add ShowreelButton3D + VideoPlane3D,
  raycaster wiring.
- `src/sections/intro/template.ts` — remove DOM showreel button.
- `src/UI/UIManager.ts` — showreel handler dispatches jlz:showreel-play.
- `src/assets/main.less` — remove .jlz-showreel-* styles (no longer DOM).

## Verification

- `bun run type-check` — 0 errors.
- `bun run lint` — 0 errors.
- `bun run build` — OK.
- `bun run test:unit` — all tests pass.
- Browser: click showreel button → genie transition → video plays →
  close → reverse transition.
