# CHANGELOG

## 2026-07-09

### Visual overhaul — premium WebGPU path + 21st.dev paper-shader background

**Premium WebGPU path (PR #118):**
- `DeviceCapability.isRealWebGPU` flag — set in `Renderer.init()` after backend detection
- `worldDNA` TSL shader resurrected: `attachWorldDNA()` now connects 4 TSL nodes
  (`positionNode`, `colorNode`, `emissiveNode`, `roughnessNode`) on real WebGPU.
  Opacity safety verified via `NodeMaterial.js:843,878` (vec3 colorNode → vec4 → a *= opacity).
- Real glass transmission (`transmission=1.0`) on premium path via `MeshPhysicalNodeMaterial`.
  Parity path keeps `MeshPhysicalMaterial` + opacity-glass.
- Ambient breathing: 1-frame refresh every ~2.5s in idle. Advances `worldDNA.uTime`
  on premium, EnvSphere/shader on parity. Respects `prefers-reduced-motion`.

**Baku fresnel iridescence (PR #121):**
- Root cause of "didn't see shader effects" on cube: `worldDNA` used `normalLocal`
  (constant per flat face) → shader was uniform → invisible.
- Fix: fresnel-based iridescence (`1 - dot(normalWorld, viewDir)`) + position-based
  shimmer (`positionLocal` varies across face). Rim glow amplitude 0.10 → 0.50 (5x).

**Background system evolution (PR #119 → #130):**
- PR #119: Aurora mesh-gradient (3 drifting orbs) + grain amplitude halved. User: "swims".
- PR #120: Static EnvSphere (no rotation/noise) + `mix()` orbs (was `add()` — invisible on white).
- PR #123: Bold cinematic (4 orbs, saturated colors, vignette).
- PR #124: Skybox render pattern (`depthTest=false`, `renderOrder=-1000`, `toneMapped=false`).
- PR #125: Atlas Aurora port from 21st.dev (component id: 16166) — TSL shader on BackSide sphere.
- PR #126: CanvasTexture fallback for WebGL2 parity path + diagnostic logging.
- PR #127: Fixed black bg bug — orbs were on +Z hemisphere (behind camera). Flipped to -Z.
- PR #128: Switched to `scene.background = equirectangular CanvasTexture` (native, most reliable).
- PR #129: Paper-shader background plane (@reuno-ui port, TSL NodeMaterial).
- PR #130: **Final** — paper-shaders in dark grey palette (`0x1a1a1a` → `0x4a4a4a`),
  opaque, sole background. Matches @reuno-ui "Background Paper Shade with grey shaders".

**Background system (final state):**
- `ShaderBackground` (`src/Experience/World/ShaderBackground.ts`) — `MeshBasicNodeMaterial`
  with `positionNode` (vertex displacement) + `colorNode` (noise + color mix).
- Port of [@reuno-ui/background-paper-shaders](https://21st.dev/@reuno-ui/components/background-paper-shaders)
  (21st.dev id: 5732, fetched via 21st MCP).
- Dark grey palette, opaque, fullscreen at `z=-30`, `renderOrder=-1000`.
- `EnvSphere` (Atlas Aurora) disabled — `attachToScene()` not called, `scene.background` not set.

**Diagnostic logging (PR #126):**
- `Renderer.init()` now logs: `[Renderer.init] Final path: WebGPU (WebGPUBackend) | isRealWebGPU=true | EnvSphere=TSL shader (premium)`
- Helps debug "I don't see the background" — immediately shows which path is active.

**21st.dev MCP integration:**
- API key format: `21st_sk_...` (old `an_sk_...` format rejected by server).
- Used `get_component({ id: 5732 })` to fetch @reuno-ui paper-shaders source code.
- Used `get_component({ id: 16166 })` to fetch Atlas Aurora source code.

**Post-processing:**
- Grain amplitude halved across all 6 section presets (PR #119). Was "too obvious",
  now subtle dither (its actual purpose — break up banding in dark gradients).

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
