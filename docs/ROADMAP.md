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

### F. Lazy Loading _(partially implemented — see `src/entry.ts`, `vite.config.ts`, `GalleryScene`, `public/sw.js`)_

- Phase 0: skeleton HTML + critical inline CSS + deferred Less / app (`index.html`, `src/entry.ts`)
- Phase 1: Vite `manualChunks` — `vendor-three`, `vendor-ui`, `vendor-misc`, `chunk-ui`, `chunk-scene`, `main-app`
- Phase 2: on-demand gallery card textures (visible carousel slots + click prefetch)
- Phase 3: full CSS still bundled via Less; optional future: split `@font-face` / subset fonts
- Phase 4: production Service Worker (`public/sw.js`, registered from `src/main-app.ts`)

### G. Production _(implemented)_

- a11y: skip link, nav landmark, modal `role` / `aria-*` / focus trap, `prefers-reduced-motion` (Lenis, gallery transitions, Less)
- Lighthouse ≥ 90: not automated here — run Lighthouse on `npm run preview` build
- WebGL2 fallback: `Renderer` uses `THREE.WebGLRenderer` when `DeviceCapability.mode === 'webgl'`; gallery uses `ProjectMaterialWebGL`; post-processing TSL remains WebGPU-only
- Service Worker: static asset caching (`public/sw.js`, registered from `src/main-app.ts`)
- SceneContent lazy-loaded via `import()` — defers 3D section content

### G (remaining)

- E2E tests
- Further chunk tuning (TSL / post split), optional CDN headers documentation
