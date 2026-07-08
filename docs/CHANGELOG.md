# CHANGELOG

## 2026-07-11

### Navigation rewrite — JoystickNav replaces CircularNav, 8 sections, SplashCube rewrite

**JoystickNav (pure DOM, replaces CircularNav):**
- `src/UI/JoystickNav.ts` — pure DOM joystick (no `three-joystick` library import).
  Base + ball + hint, fixed bottom-center.
- 2D navigation: vertical drag cycles 6 MAIN sections (Intro→About→…→Contact),
  horizontal drag toggles to SECRET side sections (Lab ← center → Process).
- Trigger model: ONE section change per drag (`TRIGGER_DISTANCE = 35px`). Ball snaps
  back to center after trigger. `DEAD_ZONE = 6px` ignores micro-movements.
- Keyboard: ArrowUp/Down/Left/Right, Home (→ Intro), End (→ Contact).
- `isActive()` true for ~400ms after trigger (feeds `_needsRender`).
- Constructor: `new JoystickNav(scene, camera, 8, { sectionLabels })`.

**8 sections (was 6):**
- Added `Section0Lab` (idx 0, secret left) and `Section7Process` (idx 7, secret right).
- `WorldConfig.RAW` now has 8 entries. Ranges use `/7` divisor (8 buckets across 0..1).
- `SectionSceneFactory.SECTION_CREATORS[8]` array — `createSection0` through `createSection7`.
- World initial state: section 1 (Intro), NOT section 0. EnvSphere starts on section 1
  (`_sectionWeights = [0, 1, 0, 0, 0, 0, 0, 0]`).

**EnvSphere — 8 patterns:**
- Added section 0 (Lab): light blue-grey HSV (`hue: 0.6, sat: 0.06, val: 0.88`).
- Added section 7 (Process): deep blue-black gradient (`0x080810 → 0x12121e`).
- Existing 6 patterns kept (intro HSV rainbow, about grey, flexible dark purple,
  works blue-grey, innovative center glow, contact off-white).

**SplashCube rewrite — single BoxGeometry + CubeCamera:**
- Was: 6 separate plane faces with NodeMaterial + `attachWorldDNA` TSL nodes.
- Now: single `BoxGeometry(1.6)` + `MeshPhysicalMaterial` (transmission=0, iridescence=1,
  clearcoat=1, roughness=0.05, envMapIntensity=2.0).
- Reflections: `CubeCamera` renders a content scene (6 gradient planes + Apple logo/text
  textures) into `WebGLCubeRenderTarget(256)`, used as `material.envMap`.
- Edges: `EdgesGeometry` from BoxGeometry with animated rainbow HSL vertex colors
  (12 edges total, not 6×4=24 from separate planes).
- Opener: scale pulse (single mesh — NOT face separation).
- No premium/parity material split — same `MeshPhysicalMaterial` on both paths.
  `worldDNA.ts` + `attachWorldDNA()` exist but are NOT called by SplashCube.

**Subtitles — short UI hints per section:**
- `src/UI/Subtitles.ts` — `.jlz-hint` bottom-center. Listens to `jlz:section-change`,
  shows short hint ("Scroll to explore", "Drag · Click to open", etc.), auto-fades 4s.
- Hints defined for: intro, about, flexible, challenge, innovative, contact (6 main sections).

**Particle system — `makeParticles` (THREE.Points):**
- `src/Sections/_shared/makeParticles.ts` — shared `THREE.Points` factory used by all 8
  section creators.
- Built-in `PointsMaterial` (NOT NodeMaterial — reduces WebGL2 uniform groups).
- `baseOpacity` cached in `material.userData`. `frustumCulled = false`. Static when idle.
- `makeInstancedParticles.ts` still exists (legacy) but is NOT used by section factories.

**Removed (cleanup):**
- `three-joystick` library import — JoystickNav is pure DOM.
- `CircularNav` active usage — file kept as legacy but not imported by Experience.
- `PerfMonitor`, `Bootstrapper`, `WorldAtmosphere`, `lenis` — confirmed gone from active code.

**Docs:**
- All 9 .md docs (AGENTS, README, STATUS, ARCHITECTURE, RULES, CHANGELOG, ENVIRONMENT,
  AUTONOMY, JUNNI_REFERENCE) rewritten to reflect 8-section + JoystickNav + SplashCube
  rewrite. Removed outdated premium/parity material split for SplashCube. Updated
  navigation model, sections table, EnvSphere patterns, particle system description.

## 2026-07-10

### EnvSphere + WebGPU/WebGL2 parity + YAGNI cleanup

**EnvSphere — procedural background:**
- `src/Experience/World/EnvSphere.ts` — BackSide sphere mesh + `MeshBasicMaterial` +
  procedural `CanvasTexture` (2048×1024, sRGB). `fog: false`, `depthTest: false`,
  `depthWrite: false`, `frustumCulled: false`, `renderOrder=-1000`.
- Per-section patterns mixed by animated `uSection` weights. Canvas redrawn when dirty
  or every ~200ms for animated patterns.
- Replaces `scene.background` Color and prior Atlas Aurora CanvasTexture.
- `attachToScene()` is a no-op — mesh is visible, `scene.background` stays null.

**WebGPU/WebGL2 color parity:**
- WebGL2 `COMPOSITE_FSG` applies exact `sRGBTransferOETF` encode.
- ACES epsilon fix (`+ 0.0001` in denominator) prevents NaN on black pixels.
- Bloom bright-extract parity: `smoothstep(threshold, threshold+0.1, luminance)`.
- Portable integer hash for film grain (NOT `sin()`-based — precision differs GLSL vs WGSL).

**YAGNI cleanup:**
- Deleted `PerfMonitor` (YAGNI). Inlined `Bootstrapper` into `main-app.ts`.
- Inlined `WorldAtmosphere` into `World.ts`. Removed `World.advance` alias.
- Removed `Section.switchViewingState` delegate. Simplified `SectionSceneFactory`.
- Removed `lenis` dependency. Trimmed `WorldState` dead fields.

**Fog parity:**
- `World.ts` owns `scene.fog` (per-section `FogExp2`). `Renderer.ts` no longer overrides.

**UI overhaul:**
- `src/templates.ts` rewrite + `src/assets/main.less` §15 (+674 LOC): glassmorphism cards,
  cinematic typography, stagger reveal, mix-weight taglines, section indices.

## 2026-07-09

### Premium WebGPU path + 21st.dev MCP integration

- `DeviceCapability.isRealWebGPU` flag — set in `Renderer.init()` after backend detection.
- `worldDNA` TSL shader: `attachWorldDNA()` connects 4 TSL nodes on real WebGPU.
- Real glass transmission (`transmission=1.0`) on premium path via `MeshPhysicalNodeMaterial`.
- Ambient breathing: 1-frame refresh every ~2.5s in idle. Respects `prefers-reduced-motion`.
- 21st.dev MCP integration (API key `21st_sk_...`).

## 2026-07-08

### Event-driven animations + on-demand rendering

- CircularNav (legacy, now replaced by JoystickNav): vertical drag, `goToDirection` public.
- On-demand rendering: `_needsRender` flag gates `renderer.update()`. Zero draw calls when idle.
- Event-driven animations: baku/particles/section.update all static when idle.
- DrawTrail: Works section ONLY. CursorLight: DELETED. DebugStats: merged into DevPanel.
- `CircularNav.test.ts` — 29 tests (state machine, direction regression, rapid swipe).
- Vite HMR reload loop fixed (`block-vite-client` plugin, `?inline` CSS imports).

## 2026-07-05

### Dead-code purge + memory-leak fixes + proxy fixes

- Deleted: SmoothScroll, CameraAnchors, BorderOverlay, FlexibleSlides, AssetManager, GPUResourceManager.
- WorksPortfolio simplified 322→60 LOC (metadata-only).
- Shared `MeshPhysicalNodeMaterial` (1 uniform group, not 6).
- Built-in materials for particles/ground/cards.
- `BakuCarousel.dispose()` called by `World.disposeSceneGroups()`.

## 2026-06-28

### Optimization sprints + a11y + SEO

- `visibilitychange` pauses render loop. Lazy KTX2Loader. `disposeMaterialDeep()` util.
- Prerendered home sections (SEO). a11y: skip-link, focus-trap, noscript.
- TypeScript strict mode. ESLint 9 flat config + Prettier.
