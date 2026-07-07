# CHANGELOG

## 2026-07-08

### Event-driven animations + on-demand rendering + bug fixes

**Navigation:**
- CircularNav: vertical drag (DOWN=next, UP=prev). `goToDirection` public.
- Fixed critical direction bug: `commitTransition()` determined direction by reading `_progress` (which was 0) → always went backward. Now takes `dir` parameter.
- Rapid swipe fix: `goToDirection` and `pointerDown` complete current transition before starting new one (`_completeTransition()`).
- Softer animations: `_ease` 0.14→0.08, sensitivity 0.008→0.006, threshold 0.92→0.85.

**On-demand rendering:**
- `_needsRender` flag gates `renderer.update()`. Zero draw calls when idle.
- Triggers: CircularNav transition, BakuCarousel morph/scroll, intro/opener, camera shake.
- `World.update(dt, needsRender)` skips baku/particles/carousel when false.
- Cursor (DOM) always updates — not gated.

**Event-driven animations:**
- Baku cube: static when idle. Rotates ~30° (was 90°) during transition. No continuous rotation.
- Particles: static (drift removed entirely).
- Section.update(): no-op (emissive pulse removed).
- worldDNA displacement: scaled by transition progress (cube flat when idle).
- DrawTrail: works section (idx=3) ONLY (was about+flexible).

**Bug fixes:**
- NoiseText: `data-rot` attribute was missing → rotation animation never played. Now stores random value.
- Contact section: bg 0xf5f5f0 (light cream) → 0x0a0a0f (dark). White text was unreadable.
- CursorLight: DELETED (was continuous spring-follow light, conflicted with on-demand).
- DebugStats: DELETED, merged into DevPanel (Tweakpane).
- BakuCarousel: blocks pointer events during CircularNav transition (was stealing drag).
- `cursor.update()` moved outside `_needsRender` block (was freezing when idle).

**Tests:**
- Added `CircularNav.test.ts` — 29 tests (state machine, direction regression, rapid swipe, boundaries).

**Proxy/HMR:**
- `server.hmr: false`, `allowedHosts: ['project.6la.ru']`
- `block-vite-client` plugin: strips `@vite/client` from HTML + stubs HTTP
- All `import.meta.hot` removed from source
- `main.less` imported with `?inline` (prevents @vite/client in CSS)

## 2026-07-05

### Dead-code purge + memory-leak fixes + proxy fixes

- Deleted: SmoothScroll, CameraAnchors, BorderOverlay, FlexibleSlides, AssetManager, GPUResourceManager
- WorksPortfolio simplified 322→60 LOC (metadata-only)
- Shared MeshPhysicalNodeMaterial (1 uniform group, not 6)
- Built-in materials for particles/ground/cards
- `BakuCarousel.dispose()` now called by `World.disposeSceneGroups()`
- Vite HMR reload loop fixed (block-vite-client plugin)

## 2026-06-28

### Optimization sprints + a11y + SEO

- `visibilitychange` pauses render loop
- Lazy KTX2Loader
- `disposeMaterialDeep()` util
- Prerendered home sections (SEO)
- a11y: skip-link, focus-trap, noscript
- TypeScript strict mode enabled
- ESLint 9 flat config + Prettier
