# ROADMAP

## Done

| Phase | Description |
|-------|-------------|
| A. Core Infra | Three.js + Vite + TS, WebGPU renderer, WorldConfig per section |
| B. Camera | Scroll-driven lerp, organic shake, FOV accents, Baku follow |
| C. Post-Processing | Bloom, vignette, grain via TSL |
| D. Gallery | 3D gallery, expand/contract transitions, ProjectDetail modal |
| E. Performance | DPR cap (max 2), Bicubic filtering, asset disposal |
| H. Multi-Page Studio Template | Shared template across `index/trinity/works`, dedicated interactive works route |

## Next

### F. Lazy Loading _(partially implemented — see `src/entry.ts`, `vite.config.ts`, `GalleryScene`, `public/sw.js`)_

- Phase 0: skeleton HTML + critical inline CSS + deferred Less / app (`index.html`, `src/entry.ts`)
- Phase 1: Vite `manualChunks` — `vendor-three`, `vendor-ui`, `vendor-misc`, `chunk-ui`, `chunk-scene`, `main-app`
- Phase 2: on-demand gallery card textures (visible carousel slots + click prefetch)
- Phase 3: full CSS still bundled via Less; optional future: split `@font-face` / subset fonts
- Phase 4: production Service Worker (`public/sw.js`, registered from `src/main-app.ts`)

### G. Production _(implemented)_

- a11y: skip link, nav landmark, modal `role` / `aria-*` / focus trap, `prefers-reduced-motion` (Lenis, gallery transitions, Less)
- Lighthouse CI: GitHub Action + local `npm run lhci` script, thresholds defined
- WebGL2 fallback: `Renderer` uses `THREE.WebGLRenderer` when `DeviceCapability.mode === 'webgl'`; gallery uses `ProjectMaterialWebGL`; post-processing TSL remains WebGPU-only
- Service Worker: static asset caching (`public/sw.js`, registered from `src/main-app.ts`)
- Error tracking: `ErrorTracker` — zero-dependency unhandled rejection/error handler, sends to configurable endpoint
- Console cleanup: all `console.log/info/warn` removed from production code; errors guarded with `import.meta.env.DEV`
- SceneContent lazy-loaded via `import()` — defers 3D section content
- Chunk splitting: 5 chunks — `chunk-world` (700KB), `chunk-content` (567KB gzip: 144KB), `chunk-ui` (234KB), `chunk-text` (121KB), `main-app` (21KB)

### G (remaining)

- E2E tests: Playwright smoke suite passes locally (`chromium`) — CI integration and stable runner policy still pending
- CDN headers documentation (optional)

### I. Studio Completion (active)

- Visual system unification across all routes (content-specific, not duplicated messaging)
- Works route final polish to studio-grade (preview transitions, metadata density, keyboard/a11y refinement)
- Perf/a11y budgets and Lighthouse closure
