# Worklog

This file contains only current operational decisions. Detailed historical
context remains available in Git history and release-level changes in
`docs/CHANGELOG.md`.

## 2026-07-27 — Lab route gamepad

`/lab` uses a centered, lazy-loaded 3D gamepad instead of the shared BakuCube.
The gamepad reuses the scene environment, has no private renderer, PMREM target
or per-frame animation, and owns/disposes only its local geometry and
materials. Route changes explicitly toggle the Lab object and cube, so the
home scene is unchanged and the experiment route does not retain its visual
after exit.

## 2026-07-25 — Synchronise `/works` UI captions with 3D planes

### Decision

The semantic DOM controls and `WorksPlaneStage` must share one frustum layout
contract. UIKit remains the markup and accessibility owner; scoped Less only
positions the caption buttons over the corresponding Three.js planes.

### Implementation

- `.jlz-works-composition` is an absolute viewport layer.
- Desktop uses the same normalized values as `WIDE_LAYOUT`: first plane 52%
  wide at 8%/47%, second 32% wide at 61%/66%.
- Mobile mirrors `STACKED_LAYOUT`: first plane 68% wide at 13%/25%, second 60%
  wide at 24%/75%.
- Captions use the native 16:9 ratio and are anchored to the plane bottom;
  no duplicate media or alternate interaction layer was introduced.

### Verification

Visual checks passed at 1280×720 and 390×844. The caption bounds now match the
visible 3D plane bounds; focusable buttons and fullscreen overlay ownership are
unchanged.

## 2026-07-25 — Works typography and UIKit-native layout pass

Keep Press Start 2P only for the Works BackText signature. It is self-hosted
with Cyrillic coverage, rendered at 2× source resolution, and redrawn after
font loading. Shared UI typography remains Onest. Plane scales expose outer
gutters and a visible gap between cases on wide and portrait screens.

The previous Pixelify Sans assets were removed. Menu launcher, Contact launcher,
menu columns, menu container and nav sublists now use UIKit flex utilities for
their existing layout behavior; only project-specific spacing and visual states
remain in `main.less`.

## 2026-07-25 — Documentation policy

Completed audits and plans are removed from the active documentation tree once
their decisions are implemented. `AGENTS.md` routes future agents to the
small set of current sources; this file remains historical context rather than
a required session log.
