# ROADMAP

## Done

| Phase | Description |
|-------|-------------|
| A. Core Infra | Three.js + Vite + TS, WebGPU renderer, WorldConfig per section |
| B. Camera | Scroll-driven lerp, organic shake, FOV accents, Baku follow |
| C. Post-Processing | Bloom, vignette, grain via TSL |
| D. Gallery | 3D gallery, expand/contract transitions, ProjectDetail modal |
| E. Performance | DPR cap (max 2), Bicubic filtering, asset disposal |

## Next

### F. Lazy Loading

- Phase 0: skeleton HTML (~14 KB) → instant first paint
- Phase 1: Vite manualChunks (vendor + scene + UI + main)
- Phase 2: on-demand texture loading per card
- Phase 3: deferred fonts + heavy assets
- Phase 4: CDN cache + Service Worker

### G. Production

- a11y (prefers-reduced-motion, keyboard, focus, semantic UI, Escape/back)
- Lighthouse ≥ 90
- E2E tests
- WebGL fallback path
