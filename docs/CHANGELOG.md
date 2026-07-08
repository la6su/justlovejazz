# CHANGELOG

## 2026-07-10

### Docs actualization + EnvSphere + WebGPU/WebGL2 parity + YAGNI cleanup

**EnvSphere — new procedural background:**
- `src/Experience/World/EnvSphere.ts` — BackSide sphere mesh (`SphereGeometry(40, 32, 16)`)
  + `MeshBasicMaterial` + procedural `CanvasTexture` (2048×1024, sRGB). `fog: false`,
  `depthTest: false`, `depthWrite: false`, `frustumCulled: false`, `renderOrder=-1000`.
- 6 per-section patterns mixed by animated `uSection` weights (HSV gradient, grey gradient,
  blue-grey gradient, radial glow, off-white gradient). Canvas redrawn when dirty or every
  ~200ms for animated patterns.
- Replaces `scene.background` Color (was flat) and the prior Atlas Aurora CanvasTexture.
- `attachToScene()` is a no-op — mesh is visible, `scene.background` stays null.

**Particle system fix:**
- `SectionSceneFactory.hideGeometry()` now keeps both `THREE.Points` AND `THREE.InstancedMesh`
  visible (was only keeping `THREE.Points` — instanced particles were getting hidden).
- `makeInstancedParticles` uses `MeshBasicNodeMaterial` with TSL `positionNode` (drift) +
  `colorNode` (twinkle) + `opacityNode` (soft circle). 1 draw call for 500–2000 instances.

**Subtitles system re-added:**
- `src/UI/Subtitles.ts` — short UI hints per section ("Scroll to explore", "Drag · Click to open",
  etc.). Positioned at bottom-center (`.jlz-hint`), fades in on `jlz:section-change`,
  auto-fades after 4s. `dispose()` clears timer + removes listener.

**WebGPU/WebGL2 color parity:**
- WebGL2 `COMPOSITE_FSG` now applies exact `sRGBTransferOETF` encode (was missing sRGB encode —
  manual `mix(pow(c, 0.41666)*1.055 - 0.055, c*12.92, step(c, 0.0031308))`). Matches
  `TSLRenderPipeline`'s `outputColorTransform=true` (default) on WebGPU.
- ACES epsilon fix: `+ 0.0001` in denominator prevents NaN on black pixels; both paths lift
  shadows identically.
- Bloom bright-extract parity: WebGL2 now uses `smoothstep(threshold, threshold+0.1, luminance)`
  matching `BloomNode` exactly (was quadratic `c*(c-threshold)` which diverged).
- Portable integer hash for film grain: `fract((p3.x+p3.y)*p3.z)` with
  `p3 = fract(vec3(p.xyx)*0.1031); p3 += dot(p3, p3.yzx+33.33)`. NOT `sin()`-based —
  sin() precision differs GLSL vs WGSL → grain mismatch. Now bit-identical across backends.

**YAGNI cleanup:**
- Deleted: `PerfMonitor` (YAGNI — on-demand rendering made FPS tracking redundant).
- Inlined `Bootstrapper` into `main-app.ts` (3 lines: new Experience + await init + onReady cb).
- Inlined `WorldAtmosphere` into `World.ts` (fog logic at `init()` + `updateTransform()` call sites).
- Removed `World.advance` alias — `Experience.ts` calls `world.updateTransform()` directly.
- Removed `Section.switchViewingState` delegate — callers use `switchState()` directly.
- Simplified `SectionSceneFactory`: replaced 6 named wrappers with `SECTION_CREATORS[6]` array;
  `byIndex(i)` does `SECTION_CREATORS[i] ?? SECTION_CREATORS[0]`.
- Removed `lenis` dependency.
- Trimmed `WorldState` dead fields.

**Fog parity:**
- `World.ts` owns `scene.fog` (per-section `FogExp2`): `init()` creates it,
  `updateTransform()` updates color+density on section index change (reuses instance),
  `dispose()` nulls it.
- `Renderer.ts` no longer overrides `scene.fog` (was overwriting per-section fog with
  stale envColor + 0.03 density).

**UI overhaul (prior commit, documented now):**
- `src/templates.ts` rewrite: hero meta pill, mix-weight taglines, section indices (01–06),
  3 glassmorphism feature cards (innovative), 3 glass CTA buttons (contact), animated scroll hints.
- `src/assets/main.less` §15 (+674 LOC): `.jlz-layout--*` modifiers, `.jlz-eyebrow`,
  `.jlz-section-title` (200 weight), `.jlz-feature-card` glassmorphism, `.jlz-glass-btn`,
  cinematic `text-shadow` on dark sections, stagger reveal via `:nth-child` delays.
- Reduced-motion respected; mobile responsive @600px.

## 2026-07-09

### Visual overhaul — premium WebGPU path + 21st.dev paper-shader background

**Premium WebGPU path:**
- `DeviceCapability.isRealWebGPU` flag — set in `Renderer.init()` after backend detection
- `worldDNA` TSL shader: `attachWorldDNA()` connects 4 TSL nodes
  (`positionNode`, `colorNode`, `emissiveNode`, `roughnessNode`) on real WebGPU.
- Real glass transmission (`transmission=1.0`) on premium path via `MeshPhysicalNodeMaterial`.
- Ambient breathing: 1-frame refresh every ~2.5s in idle. Respects `prefers-reduced-motion`.

**Baku fresnel iridescence:**
- Root cause of "didn't see shader effects" on cube: `worldDNA` used `normalLocal`
  (constant per flat face) → shader was uniform → invisible.
- Fix: fresnel-based iridescence (`1 - dot(normalWorld, viewDir)`) + position-based shimmer.

**Diagnostic logging:**
- `Renderer.init()` logs final render path + isRealWebGPU + EnvSphere path.

**21st.dev MCP integration:**
- API key format: `21st_sk_...` (old `an_sk_...` format rejected).
- Used `get_component({ id: 5732 })` and `get_component({ id: 16166 })`.

## 2026-07-08

### Event-driven animations + on-demand rendering + bug fixes

**Navigation:**
- CircularNav: vertical drag (DOWN=next, UP=prev). `goToDirection` public.
- Fixed direction bug: `commitTransition()` takes `dir` parameter (was reading `_progress=0`).
- Rapid swipe fix: `goToDirection` and `pointerDown` complete current transition first.
- Softer animations: `_ease` 0.14→0.08, sensitivity 0.008→0.006, threshold 0.92→0.85.

**On-demand rendering:**
- `_needsRender` flag gates `renderer.update()`. Zero draw calls when idle.
- Triggers: CircularNav transition, BakuCarousel morph/scroll, intro/opener, camera shake,
  ParticleBurst, ambient breathing (1-frame/2.5s).
- `World.update(dt, needsRender)` skips baku/particles/carousel when false.
- Cursor (DOM) always updates — not gated.

**Event-driven animations:**
- Baku cube: static when idle. Rotates ~30° during transition.
- Particles: static (drift removed entirely).
- Section.update(): no-op (emissive pulse removed).
- worldDNA displacement: scaled by transition progress (cube flat when idle).
- DrawTrail: works section (idx=3) ONLY.

**Bug fixes:**
- NoiseText: `data-rot` attribute added → rotation animation works.
- Contact section: bg → dark. White text was unreadable.
- CursorLight: DELETED (was continuous spring-follow light, conflicted with on-demand).
- DebugStats: DELETED, merged into DevPanel (Tweakpane).
- BakuCarousel: blocks pointer events during CircularNav transition.
- `cursor.update()` moved outside `_needsRender` block.

**Tests:**
- `CircularNav.test.ts` — 29 tests (state machine, direction regression, rapid swipe, boundaries).

**Proxy/HMR:**
- `server.hmr: false`, `allowedHosts: ['project.6la.ru']`
- `block-vite-client` plugin: strips `@vite/client` from HTML + stubs HTTP
- All `import.meta.hot` removed from source
- `main.less` imported with `?inline`

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
