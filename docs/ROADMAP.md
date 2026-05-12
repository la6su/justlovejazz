# ROADMAP.md

## Phases & Status

### A. Core Infrastructure ✅ DONE
- Three.js + Vite + TS setup
- Cinematic lighting system
- World configs per section
- Camera/Renderer/Scene bootstrap

### B. Cinematic Camera ✅ DONE
- Smooth lerp camera movement per scroll
- Baku / scene object camera follow
- Organic camera shake
- Planar masks transitions between sections

### C. Post-Processing ✅ DONE
- Bloom, vignette, grain chain
- TSL shaders for environment + lighting

### D. Gallery ✅ DONE (D1)
- D1: 3D gallery with expand/contract transitions
- D2: ProjectDetail modal overlay
- D3: Build pipeline verification

### E. Performance ✅ DONE
- DPR capping (max 2)
- Text compression
- Asset cache + lazy loading

### F. Lazy Loading (Next)
- Phase 0: Fast invisible skeleton (~14 KB): minimal HTML + SVG + CSS → instant first paint — a breakthrough fast.
- Phase 1: JS chunk splitting
- Phase 2: Deferred assets (textures, large modules)
- Phase 3: On-screen cache management

### G. Production
- Accessibility (a11y)
- Lighthouse 90+
- E2E tests
