# ARCHITECTURE

## Stack

| Layer | Tech |
|-------|------|
| Language | TypeScript (strict) |
| Build | Vite 8 (rolldown) |
| 3D | Three.js 18.4 + TSL (Node Materials) |
| GPU | WebGPU primary, WebGL fallback |
| UI | UIkit 3 + Less |
| Scroll | Lenis (smooth) |

## Entry & Runtime

```
src/entry.ts          → sync reduced-motion, defer Less + app bootstrap
src/main-app.ts       → bootstrap(), route gate (data-app-mode)
src/main.ts           → re-exports entry.ts (legacy)
src/core/Bootstrapper.ts → wires Experience, events, managers
src/Experience/Experience.ts → single render loop (update → rAF)
```

## Modules & Responsibilities

| Module | Role |
|--------|------|
| **Experience** | Single render loop state holder |
| **Renderer** | Canvas, DPR, capability detection, post-processing GL |
| **CameraStateManager** | Returns `CameraTarget { position, target, fov }` from scroll progress. Never touches Camera directly. |
| **SceneContentManager** | Creates/disposes 3D scene objects per step. String-keyed (`step01`–`step08`). 14+ animation types. |
| **WorldConfig** | Per-step config: camera preset, fog, post-processing |
| **PostProcessingManager** | Per-step presets (bloom, vignette, grain, chromatic). Crossfades on transition. |
| **GalleryManager** *(works only)* | FSM: `LIST ↔ EXPAND ↔ CONTRACT` via scale/position |
| **GalleryScene** *(works only)* | 3D cards, orbs. Visibility per `worldState.uiShowGallery` |
| **UIManager** | Route-aware UI init |

## Scene Architecture (8 steps)

```
step01  Smoke    — volumetric plane layers + starfield
step02  Ball     — metallic sphere + glass orbs
step03  Beams    — vertical energy beams + particles
step04  City     — abstract core shapes + fields
step05  Neon     — neon columns + gravity grid floor
step06  Flow     — flow field lines
step07  Droplets — rain drip + surface reflections
step08  Galaxy   — spiral dust + nebula planes
```

Each step is a self-contained scene in `SectionSequences.ts`.
`CameraStateManager` interpolates camera between steps based on scroll.
`PostProcessingManager` crossfades bloom/vignette/grain/per-step presets.

## Page → Scene Mapping

| Page | data-page | Steps | Role |
|------|-----------|-------|------|
| Home | home | step07, step08 | Dropbox/fun |
| Trinity | trinity | step01, step02 | Intro entry |
| Works | works | step03, step05 | Beauty/gene |
| Contact | contact | step04, step06 | City/scene |

Each page gets 2 scenes — full control per scene.

## Capability and Fallback

Runtime capability is resolved once and propagated through renderer decisions:

- `webgpu`: primary renderer path.
- `webgl`: fallback path with quality constraints.
- `unsupported`: controlled UI state without runtime crashes.

Capability-driven choices must stay in one decision layer, not duplicated in many modules.

## Render Pipeline

```
scene → AA → bloom extract → mip bloom → composite
       → chromatic → grain → vignette → output
```

Quality tiers: `high` (full) / `medium` (reduced bloom) / `low` (disabled).

## Asset Lifecycle

```
preload → activateContext → use → deactivateContext → dispose
```

Assets managed by priority (`pre`/`must`/`sub`). Disposal only by inactive context.

## Routes

| Route | File | Role |
|-------|------|------|
| Home | index.html | studio positioning |
| Trinity | trinity.html | process/method |
| Works | works.html | interactive portfolio |
| Contact | contact.html | commissions |
