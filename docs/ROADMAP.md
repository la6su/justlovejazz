# ROADMAP

## Done

| Phase | Description |
|-------|-------------|
| A. Core Infra | Three.js + Vite + TS, WebGPU renderer, 8-step WorldConfig |
| B. Camera | Scroll-driven lerp, organic shake, FOV accents |
| C. Post-Processing | Bloom, vignette, grain via TSL, per-step presets |
| D. Gallery | 3D gallery, expand/contract transitions |
| E. Performance | DPR cap (max 2), Bicubic filtering, asset disposal |
| H. Multi-Page Studio | Shared template, route-specific content |
| I. Scene Port | 8 cinematic steps (smoke→galaxy), low-light mood |
| J. Templater | Lightweight string templating for page content |

## Active

### K. Per-Page Scenes (current)

Split 8 scenes across 4 pages (2 scenes each):

| Page | Steps | Scenes |
|------|-------|--------|
| Trinity | step01, step02 | smoke, ball |
| Works | step03, step05 | beams, neon |
| Home | step07, step08 | drop, galaxy |
| Contact | step04, step06 | city, flow |

**Goal:** Full control per scene, no cross-page mixing.

### L. Scene Content Polish

For each step:
1. Add `ensureUV()` on MeshStandardMaterial geometries (UV warning fix)
2. Proper composition (no chaos, cinematic framing)
3. Low-light mood (ambient 0x030308, bloom ≤ 0.3)

## Planned

### M. Templater Integration
- Replace hardcoded page content with Templater
- Define templates: `hero`, `section`, `nav`, `footer`
- Data-driven content per page

### N. Mobile QA
- Reduced movement per `prefers-reduced-motion`
- Touch interaction on works
- Mobile quality tier enforcement

### O. Production Hardening
- CDN headers doc
- LHCI thresholds closure
- E2E Playwright CI
- ErrorTracker endpoint
