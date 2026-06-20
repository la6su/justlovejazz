# ARCHITECTURE

## Stack

Vite 8 (rolldown) · TypeScript strict · three 0.184 + TSL · WebGPU primary / WebGL fallback · UIkit 3 + Less · Lenis · troika-three-text · Playwright · bun.

## Entry & Runtime

```
index.html → /src/entry-shell.ts → entry-app.ts (router init, splash, modal mount)
  → main-app.ts (bootstrap, dissolve transition)
  → core/Bootstrapper.ts → Experience.ts (single render loop: update → rAF)
  → src/styles/tokens.css (design tokens, consumed globally)
```

## Modules

| Module | Role |
|--------|------|
| Experience | Single render loop. Owns Sizes, Time, Camera, Renderer, World, StateBus, Portfolio, Overlay, ProjectDetail, PerfMonitor |
| Renderer | Canvas, DPR, capability detection, post-processing pipeline (WebGPU TSL + WebGL ShaderMaterial) |
| World | Section[] composition, Baku, Lights, Atmosphere, Ground. Scene groups with per-component animation. Config-driven via WorldConfig |
| Section | Base class: viewingState, cameraTransform, ppParams, fade, context-driven dispose |
| SectionSceneFactory | 6 junni-inspired scene compositions (BG sphere, grid, crosses, text ring, light strips, chrome sphere) |
| WorksPortfolio | 3D card carousel. Raycast tap, swipe, arrow input. expandCard/collapseCard morph. Lazy-load textures |
| ProjectOverlay | Studio UI overlay synced with 3D carousel (nav arrows, title, counter, description, tags) |
| ProjectDetail | Fullscreen modal with project texture background. UIkit modal + custom close |
| PostProcessingManager | Per-section presets (bloom/vignette/grain/chromatic/bloomRadius/bloomThreshold), crossfade via lerp |
| RenderPipeline | WebGPU: native RenderPipeline + BloomNode. WebGL: custom RT ping-pong. Both have parity |
| CinematicLights | 5-light setup (key/fill/rim/volumetric/hemi). setMood sets targets, update() lerps + volumetric orbits |

## Routes (SPA hash)

| Route | data-page | Steps | Role |
|-------|-----------|-------|------|
| `#/` | home | step05, step06 | Studio positioning |
| `#/trinity` | trinity | step01, step02 | Process/method |
| `#/works` | works | step03, step04 | Interactive portfolio (pure slider) |

Contact: not implemented. Works page hides Baku + ground + scene groups (pure slider).

## WorldConfig

6 RAW scenes (step01–step06), each defines: camera, baku, post, fog, lights, camFovOffset/Duration/Smoothing, bloomRadius/Threshold. PAGE_MAP maps routes to step pairs.

## Works page flow

1. Swipe/arrows → change project in UI overlay
2. Tap (raycast on card mesh) → navigate + expandCard morph to fullscreen
3. At peak → ProjectDetail modal (texture bg + blur scrim)
4. Esc/bg click → collapseCard back to carousel

## Memory lifecycle

All window listeners (Sizes, Renderer, Camera, Input, Cursor) have destroy()/dispose() with bound handler refs. Experience.destroy() calls all. No HMR leaks.

## A11y

prefers-reduced-motion, ARIA roles, focus management, skip-link, modal aria-modal.

## Design tokens

`src/styles/tokens.css`: --jlz-* custom properties. Less bridge in tokens.less. All components token-driven.

## 3D↔UI sync

- `jlz:section-change` CustomEvent dispatched on section transition → ContentReveal highlights matching DOM element
- ContentReveal: [data-section] dimmed, .section-active highlighted
- CinematicLights: setMood + update(dt) lerp colors/intensities per section
