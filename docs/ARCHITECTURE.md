# ARCHITECTURE

## Stack

Vite 8 (rolldown) · TypeScript strict · three 0.184 + TSL · WebGPU primary / WebGL fallback · UIkit 3 + Less · Lenis · troika-three-text · Playwright.

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
| World | Section[] composition, Baku, Lights, Atmosphere, Ground. Config-driven via WorldConfig |
| Section | Base class: viewingState (ready/viewing/passed), cameraTransform, ppParams, fade in/out, context-driven dispose |
| WorksPortfolio | 3D card carousel. Swipe/tap/arrow input. expandCard/collapseCard morph transition |
| ProjectDetail | Fullscreen modal with project texture background. UIkit modal + custom close |
| PostProcessingManager | Per-section presets (bloom/vignette/grain/chromatic/bloomRadius/bloomThreshold), crossfade via lerp |
| RenderPipeline | WebGPU: native RenderPipeline + BloomNode. WebGL: custom RT ping-pong. Both have parity |

## Routes (SPA hash)

| Route | data-page | Steps | Role |
|-------|-----------|-------|------|
| `#/` | home | step05, step06 | Studio positioning |
| `#/trinity` | trinity | step01, step02 | Process/method |
| `#/works` | works | step03, step04 | Interactive portfolio |

Contact: not implemented (`PageKey = 'home' | 'trinity' | 'works'`).

## WorldConfig

6 RAW scenes (step01–step06), each defines: camera (pos/target/fov), baku (role/opacity/color), post (bloom/vignette/grain/chromatic), fog, lights, camFovOffset/Duration/Smoothing, bloomRadius/Threshold. PAGE_MAP maps routes to step pairs.

## Works page flow

1. Swipe (velocity > 0.12) or arrows → change project in preview overlay
2. Tap (click < 8px) → `expandCard(idx)` → card morphs to fullscreen (0.5s easeInOutCubic)
3. At peak → `ProjectDetail.open()` → fullscreen modal with texture background
4. Esc / bg click / close button → `collapseCard()` → card returns to carousel

## Memory lifecycle

All window listeners (Sizes, Renderer, Camera, Input) have `destroy()`/`dispose()` with bound handler refs. `Experience.destroy()` calls all. No HMR leaks.

## A11y

- `prefers-reduced-motion`: Camera, SmoothScroll, GalleryManager, World, tokens.css
- Splash: `role=status`, `aria-live`, `role=progressbar` with `aria-valuenow`
- Nav: `role=navigation` + `aria-label`
- Modal: `aria-modal`, focus moved in, close button with `aria-label`
- Skip-link in index.html

## Design tokens

`src/styles/tokens.css`: CSS custom properties (`--jlz-*`) for color, typography (1.250 scale), spacing (4px base), z-index, motion (duration + easing matrix), `prefers-reduced-motion` overrides. Less bridge in `tokens.less`. All components use tokens — no hardcoded values.
