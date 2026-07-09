# CHANGELOG

## 2026-07-11 (post-audit)

### 8→6 sections unification, uk-light theme system, mobile-first, BakuCarousel fixes, tokens merge

This session consolidated the codebase around a 6-section cube model, replaced
the custom theme override system with UIKit native inverse, and converted all
sizing to rem units. Multiple BakuCarousel bugs from the 8→6 refactor were fixed.

**8→6 sections — 1:1 with cube faces:**
- Removed `Section3Flexible` (idx 3) and `Section5Innovative` (idx 5) from active code.
  Files remain on disk as dead code (see `STATUS.md` → "Dead code candidates").
- 6 sections × 6 cube faces (Lab=Top, Intro=Front, About=Right, Works=Back,
  Contact=Bottom, Process=Left). SplashCube now rotates per section to show the
  active face.
- `WorldConfig.RAW` renumbered from 7 intervals to 5 (`/5` divisor, 6 buckets).
- `SectionSceneFactory.SECTION_CREATORS[6]` — `createSection0,1,2,4,6,7` (creators
  keep their original numbers; index 3 maps to `createSection4` = Works).
- `Experience.ts` SECTION_LABELS/SUBTITLES trimmed to 6. `isLightSection` now
  `idx === 0 || idx === 1 || idx === 4` (Lab/Intro/Contact).
- `JoystickNav` CONTACT_INDEX 6→4, PROCESS_INDEX 7→5, sectionCount 8→6.
- `UIMenu` MAIN_SECTION_INDICES `[1,2,3,4]` (was `[1,2,3,4,5,6]`).
- `EnvSphere` 8→6 patterns (removed Flexible purple + Innovative glow).
- Commits: `7e2f480`, `273684b`, `63c3729`.

**UIKit native `uk-light` theme system (replaces custom overrides):**
- `_import.less`: `@inverse-global-color-mode: none → light` (enables `uk-light` class).
- New `src/core/ThemeManager.ts` — 3 modes (auto/light/dark), localStorage
  persistence, `jlz:theme-applied` event for 3D sync.
- `UIMenu.ts`: 3-button toggle (Auto/Light/Dark) in modal with `uk-button-group`.
- `Experience.ts`: `themeManager.setAutoTheme(isLightSection)` on section change
  (guarded with `data-page === 'home'`).
- `router.ts`: `themeManager.setAutoTheme(false)` on content pages.
- `entry-app.ts`: `themeManager.apply()` on startup.
- Removed 50+ LOC of `body.light-theme .uk-*` overrides from `main.less`.
- 3D sync: in manual light/dark mode, EnvSphere pattern overrides to match
  (light→Intro, dark→About) so 3D bg + text color stay readable together.
- Commit: `59be014`.

**Mobile-first rem-based sizing:**
- `main.less`: `html { font-size: 0.85rem }` mobile → `1rem` ≥640px.
- `master-quantum-flares/_import.less`: 76 px values converted to rem
  (font-size, margin, gutter, control-height, box-shadow, border-radius).
  7 hairline borders kept as px for crispness.
- `@global-line-height: 1.7 → 1.5` (compact for mobile).
- `@global-border-width: 2px → 1px` (modern).
- `master-qf` colors mapped to `@jlz-*` tokens (single source of truth).
- `@inverse-global-color-mode: dark → light` (matches ThemeManager).
- Commit: `c8da0d9`.

**Responsive sections:**
- All home + content page sections: `class="uk-section uk-section-small
  uk-section-medium@s uk-section-large@m"` (was `uk-section uk-section-large`).
- Custom px padding on `.jlz-page-section` removed (UIKit handles natively).

**BakuCarousel fixes (post-8→6 refactor):**
- Section index 4→3 in `World.ts` (`sceneGroups[3]` for works) + `Experience.ts`
  (`getCarousel()`). Commit: `273684b`.
- Race condition in `Experience.ts`: `_bakuCarouselActive` was computed AFTER the
  `_needsRender` check — on the frame when `setActive(true)` triggered, the stale
  `false` value meant `world.update()` was skipped, so `carousel.update()` never
  ran, and `morphT` stalled at ~0.35. Moved the `isAnimating` computation before
  the `_needsRender` check. Commit: `63c3729`.
- Also fixed hardcoded section indices (cursorFollow idx===4→3, `Math.min(idx+1,
  7)→5`, drawTrail `fromIndex===4→3`).

**Tokens merge (deduplication):**
- `src/styles/tokens.less` → DELETED (content moved to `src/assets/_import.less`
  §1 design tokens + §2 CSS custom properties).
- `src/styles/` directory removed.
- `master-quantum-flares/_import.less` de-duplicated: removed all UIKit globals
  (`@global-font-family`, `@global-color`, `@global-background`, `@global-margin`,
  `@global-gutter`, `@global-control-height`, `@inverse-global-color-mode`, etc.).
  master-qf now only adds QF visual personality (font weights, status colors,
  box-shadows, glitch/scanline effects). Commit: `63c3729`.

**Studio portfolio content + footer + 3D↔theme sync:**
- Home 6 sections reframed as a web design studio portfolio.
- 6 content pages: services, cases, process, team, journal, contact (was QF
  music-band theme).
- `router.ts` ROUTES map updated: `/services /cases /process /team /journal /contact`.
- `UIMenu` PAGE_LINKS updated: Home/Services/Work/Process/Team/Journal/Contact.
- Unified footer: minimal bar (brand + 3 social icons), `position: fixed; bottom: 0`,
  hidden on home where Contact section serves as the home footer.
- Commit: `be233f8`.

**Docs:**
- All .md docs audited + updated for the 6-section, uk-light, mobile-first reality.
- New `docs/AUDIT_2026-07-11.md` comprehensive audit report (LOC, files, structure,
  current state, dead code candidates, doc status, recommendations).
- `STATUS.md` rewritten (sections table 8→6, added ThemeManager + mobile-first +
  content pages + footer rows, added "Dead code candidates" table).
- `ARCHITECTURE.md` updated (z-index map includes footer + tm-header, added
  ThemeManager + Router + Footer module rows, added 3 new events, added Theme
  system + Mobile-first sizing sections, EnvSphere 8→6 patterns).
- `RULES.md` updated: Rule 14 (6 section IDs + cube face mapping), Rule 34
  (DrawTrail idx 3), Rule 37 (EnvSphere 6 patterns + `[0,1,0,0,0,0]`), Rule 40
  (all 6 section creators), Rule 43 (JoystickNav 1-4 + Lab=0/Process=5). New
  rules 45-48: uk-light theme system, mobile-first rem sizing, responsive
  sections, tokens location.
- `UIKIT3.md`: §4 verified (uk-light + ThemeManager), §10 added (mobile-first
  rem sizing + px→rem conversion record), §3.1 updated (responsive section
  classes), §1 updated (tokens location), §2 updated (mobile-first html
  font-size, uk-light scoped overrides).
- `ENVIRONMENT.md` + `JUNNI_REFERENCE.md` factual fixes (section count 8→6,
  EnvSphere patterns 8→6, Contact section index 6→4).

---

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
