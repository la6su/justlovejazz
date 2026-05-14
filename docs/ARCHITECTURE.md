# ARCHITECTURE

## Project Summary

WebGL/WebGPU interactive portfolio with multi-page routing (`index`, `trinity`, `works`).
TypeScript + Vite MPA + Three.js/TSL. Shared runtime + route-specific content roles.

## Entry & Runtime

```
src/entry.ts                  → sync reduced-motion dataset, defer Less + app bootstrap
src/main-app.ts               → `bootstrap()`, route mode gate (`data-app-mode`)
src/main.ts                   → re-exports `./entry` (legacy path for tooling)
src/core/Bootstrapper.ts       → wires Experience, events, managers
src/Experience/Experience.ts   → single render loop (update → requestAnimationFrame)
```

### Contracts

| Module | Responsibility |
|--------|---------------|
| **Bootstrapper** | Init ordering only. No animation logic. Calls `experience.init()`. |
| **Renderer** | Canvas, DPR, async init, capability detection, post-processing |
| **CameraStateManager** | Returns `CameraTarget { position, lookAt, fov }`. Never touches Camera directly. |
| **WorldConfig** | Single source of truth for section behavior (camera, baku, lighting, post, UI) |
| **GalleryManager** | FSM: `LIST ↔ EXPAND ↔ CONTRACT` via scale/position on active card |
| **GalleryScene** | 3D objects (cards, orbs). Visibility per `worldState.uiShowGallery` |
| **UIManager** | Route-aware UI init (`works` portfolio only on `data-page="works"`) |

## Render Pipeline

```
scene → anti-aliasing → bright extraction → mip bloom → composite
       → chromatic aberration → grain → vignette → output
```

Quality tiers: `high` (full WebGPU) / `medium` (reduced) / `low` (no expensive bloom).

## Asset Lifecycle

```
preload → activateContext → use → deactivateContext → dispose
```

Assets managed by priority (`pre`/`must`/`sub`). Never dispose from generic cleanup loops.

## Route Behavior

- `index.html`: studio overview narrative in shared template.
- `trinity.html`: process/system narrative in shared template.
- `works.html`: dedicated portfolio interactions (sticky selector + open detail).

## Core Types

```ts
type RendererMode = 'webgpu' | 'webgl' | 'unsupported'
type QualityTier = 'high' | 'medium' | 'low'
type NarrativePhase = 'AWAKENING' | 'DISCOVERY' | 'DEEP_DIVE' | 'CONNECTION'

interface CameraTarget { position: Vector3; lookAt: Vector3; fov: number }
interface WorldState { uiShowGallery: boolean; cameraTarget: CameraTarget; ... }
```

## Key Sections

| Phase | Scroll Range | showGallery | Baku Role |
|-------|-------------|-------------|-----------|
| AWAKENING | 0–0.2 | no | normal |
| DISCOVERY | 0.2–0.5 | no | glass |
| DEEP_DIVE | 0.5–0.8 | **yes** | project |
| CONNECTION | 0.8–1.0 | no | line |
