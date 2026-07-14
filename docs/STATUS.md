# STATUS — Single Source of Truth

> Updated: 2026-07-14 (post-audit + glass polish). Branch: `main`. Build green. ~10.9K TS LOC, 74 TS files.
> Glass cube premium quality (dispersion, iridescence, sheen, attenuation).
> Full 4-agent audit complete (73 issues found, 45 fixed across CRITICAL/HIGH/MEDIUM/LOW).
> PLAN-v3 Phase 7+8 done (dramatic click feedback). All PLAN.md phases complete.

## Project

SPA studio portfolio — **6 SPA routes** (one HTML entry: `index.html`), each
with **4 main sections** + 2 secret side sections (6 = 1:1 cube faces).
Inline splash overlay → Enter click → 3D scene. Single font: Inter.
Navigation: JoystickNav (pure DOM + dotnav) + UIMenu (transparent navbar).
Theme: per-section inverse (auto=light / inverse=dark) via ThemeManager + ContentReveal.
i18n: EN/RU fully wired (200+ keys, `data-i18n` on all templates).
Meta tags: route-based per-page title/description/OG (i18n-aware).
Mobile-first: `html { font-size: 0.85rem }` mobile → `1rem` ≥640px.

Blog: standalone HTML (`blog.html` + 4 articles), SEO-optimized.

## Pages (6 SPA routes)

| Page | Route | Sections (joystick down/up) |
| --- | --- | --- |
| home | `/` | 01 Studio / 02 Services / 03 Works / 04 Manifesto |
| services | `/services` | 01 Creative Direction / 02 Interactive Dev / 03 Motion & Realtime / 04 AI Systems |
| works | `/works` | 4 sections × 2 large 3D tilt cards = 8 case studies |
| manifesto | `/manifesto` | 01 Purpose / 02 Clarity / 03 Emotion / 04 Simplicity |
| lab | `/lab` | 01 Shader Lab / 02 Audio Reactive / 03 Generative / 04 GPU Particles |
| contact | `/contact` | 01 Email / 02 Social / 03 Location / 04 Form |

## Current state

| Item | Status |
| --- | --- |
| 3D scene (WebGPU + WebGL2 fallback, parity) | ✅ |
| 6 SPA routes (one HTML entry, inline splash) | ✅ |
| Unified `sectionShell()` — ONE wrapper for all pages | ✅ |
| Seamless inline splash (Enter button + SVG squares + progress ring) | ✅ |
| **Enter button DISABLED until `jlz:webgl-ready`** (no early activation) | ✅ |
| three.js lazy loading (dynamic import, non-blocking FCP) | ✅ |
| JoystickNav — pure DOM + dotnav timeline | ✅ |
| UIMenu — transparent navbar + dropdowns + theme toggle | ✅ |
| BakuCarousel — home page Works section (idx 3) only | ✅ |
| **Works page — 4 sections × 2 large 3D tilt cards (8 projects)** | ✅ |
| **ProjectOverlay reused** (home carousel + works page cards) | ✅ |
| **SplashCube — day34-accurate jelly wobble** (BoxGeometry + mergeVertices) | ✅ |
| **Cube wobble tuned** (uWobble=0.95, SIZE_SCALE=0.09, 2-octave noise) | ✅ |
| **Ground plane — section 4 (bottom) ONLY** | ✅ |
| Per-section inverse theme (ContentReveal) | ✅ |
| Custom cursor — codrops-style (skip redraw when idle) | ✅ |
| BlurFade — cinematic blur+stagger for titles | ✅ |
| NoiseText — console typewriter for eyebrow numbers | ✅ |
| Footer removed — joystick sole bottom UI | ✅ |
| Blog standalone (blog.less, SEO, JSON-LD) | ✅ |
| **i18n — EN/RU fully wired** (200+ keys, `data-i18n` on all templates) | ✅ |
| **Route-based meta tags** (per-page title/description/OG, i18n-aware) | ✅ |
| SEO — sitemap 6 SPA pages + JSON-LD + meta tags | ✅ |
| Performance — CubeCamera throttle + bloom skip + leak fixes | ✅ |
| Mobile QA — 390px viewport passed | ✅ |
| Lighthouse — Performance 100 (FCP ~200ms) | ✅ |
| Ponytail audit — -632 LOC dead code removed | ✅ |
| **Senior-auditor pass — Tier 0-3** (nav fixes + parity + leaks + cleanup) | ✅ |
| TypeScript strict + ESLint + Prettier | ✅ |
| 87 unit tests (pageMeta 32 + i18n 20 + motionPolicy 10 + ThemeManager 9 + JoystickNav 9 + EventBus 5 + Noise 2) | ✅ |
| **Camera far=1000** (black hole fix preserved) | ✅ |
| **Naming refactor** (createSection0-5, userData.carousel preserved) | ✅ |
| **RenderPipeline crash guard** (line 644 — the actual `if`, line 641 is the comment) | ✅ |
| **Post-processing** (vignette, refract, border, chromatic preserved) | ✅ |

## Recent work (2026-07-14 — Glass cube polish + full audit + PLAN-v3)

- **Glass cube WebGPU/WebGL2 parity** (6 commits): vignette sync, wobble noise
  coords, PMREM isPMREMTexture flag, WorldConfig metalness 0.8→0.0 (was metal!),
  light colors re-enabled, premium glass params (dispersion 0.5, iridescence 0.3,
  sheen 0.4, attenuation 2.0, clearcoat 0.6/0.08), richer 3-zone env map.
- **Full 4-agent audit** (73 issues found, 45 fixed):
  - CRITICAL (3): FullscreenOverlay video `<source>`, Section state machine,
    BakuCarousel setTimeout leak.
  - HIGH (8): IntersectionObserver, JoystickNav querySelectorAll cache, Cursor
    DOM write gating, StateBus lazy alloc, BakuCarousel texture mipmaps +
    depthWrite, JunniParticles sprite mipmaps, BlurFade/NoiseText i18n,
    SfxSystem AudioContext resume.
  - MEDIUM (20): perf (FPS circular buffer, WebGPU params reuse), render
    (ParticleBurst scale flicker, EnvSphere toneMapped, fog colors, bloom
    resRatio, border gate), logic (bootstrap retry, UIMenu sound, sound default,
    bigPlay opacity, Camera FOV dt-lerp, Cursor flicker, SplashCube rotation).
  - LOW (14): UIManager listener, particleTexture dispose, ErrorTracker guard,
    ground depthWrite, additive glow toneMapped, PostProcessing presets,
    BakuCarousel click guard, WorkCards debounce, Camera shake, dead verifyWebGPU.
- **PLAN-v3 Phase 7+8** (dramatic click feedback): wobble boost 0.9→1.8,
  dispersion boost 4.5→9.5, chromatic boost 0.45→0.95, pulse duration 0.9→1.2s,
  opener scale 1.3→1.4. Works card wobble: scale 1.2, rotateY ±6deg, blur at peak.
- **PLAN.md all phases complete**: Phase 2 (zoom), 3 (sound panel), 4 (carousel
  momentum), 5 (DrawTrail tapered), 6 (cursor spring) all implemented.
- Verification: tsc 0 errors, lint 0 errors (57 warnings), 87/87 tests pass.

## Recent work (2026-07-13 — Senior-auditor pass)

- **Tier 0: Navigation logic fixes** (6 Critical + 1 High):
  - C1+C2: JoystickNav._syncPageSection now only updates _mainSection for
    indices 1-4 (not 0/5). _navigateHorizontal page-mode reuses the
    _mainSection/_side model. Hamburger X / ArrowLeft from menu on content
    pages now returns to the PREVIOUS main section (was always section 1).
  - C3: Hash navigation from menu — navigateToPage parses hash, dispatches
    jlz:goto-section-by-hash after render. JoystickNav.goToSectionByHash()
    finds the target section. Document-capture handler skips data-nav-href
    anchors. Menu subsection clicks now land on the target section.
  - C4+C5: FullscreenOverlay + WorkCards call stopImmediatePropagation for
    Arrow keys. JoystickNav early-returns when window.jlzOverlayOpen.
  - C6: EventBus.emit() now bridges to window.dispatchEvent — fixes
    hamburger↔X sync dead on home routes. Router uses eventBus.emit for
    jlz:route-change (RULES §44 compliance).
  - H1: FullscreenOverlay z-index raised to 10010 (above navbar 10001).
  - Added 3 page-mode regression tests (87 total, was 84).

- **Tier 1: 3D pipeline fixes** (6 Critical + 5 High):
  - C7: triggerWobblePulse writes cubeMaterial.wobble on WebGL2 (was WebGPU-only).
  - C8: Noise parity gap documented (mx_noise_float vs Ashima snoise).
  - C9: jlz:goto-nav + jlz:wobble-pulse listeners stored as fields, removed in destroy().
  - C10: SplashCube.dispose clears pulse timers + disposes speckleTex normalMap.
  - C11: BakuCarousel canvas pointerenter/leave stored as fields, removed in dispose().
  - C12: Camera.pulse timer stored as field, cleared in destroy().
  - H4: Deleted PlayButton3D.ts (129 LOC dead render path).
  - H5: WireframeTypography uses Vite JSON import (no sync XHR).
  - H6: MeshTransmissionMaterial samples tier-gated (low=2, medium=4, high=6).
  - H9: CubeCamera.update wrapped in try/finally.
  - H13: ContentReveal re-applies theme on jlz:route-change.

- **Tier 2: Over-engineering cleanup** (-~300 LOC, -1 dep, -1 type file):
  - Deleted: AudioSystem.ts (87 LOC dead), footer.ts (6 LOC), templates.ts
    (6 LOC), lab/template.ts (27 LOC), three-webgpu-node-materials.d.ts
    (42 LOC duplicate).
  - Cut 4 no-op methods: setTransmissionEnabled, setProgress, setEnvAndCamera,
    setSplashProgress.
  - Removed dead: floatRenderTargets, _progress, bus.emit('intro:done'),
    initEnterButton, Section.ts bus.on/off listeners.
  - Renamed: sections/process/ → sections/menu/.
  - Shrunk: ErrorTracker sendBeacon infra (dead __ERROR_ENDPOINT__).
  - Removed: codebase-memory-mcp from package.json.

## Recent work (2026-07-13 — earlier)

- **Cube wobble fixed** — day34-accurate pattern after 7 tuning iterations.
  Root cause: `RoundedBoxGeometry` gave non-perpendicular normals on face
  interiors → flat-plane shift. Fixed with `BoxGeometry + manual rounding +
  mergeVertices + computeVertexNormals` (day34 pattern). Final params:
  uWobble=0.70, SIZE_SCALE=0.07, 2-octave noise (high-freq removed), slowed
  time speeds, reduced squash/breathe. VLM: "soft jelly, edges flowing,
  barely visible, elegant" (7/10).
- **Geometry optimized** — segments 32 → 24 (39% fewer vertices: 6144 → 3750).
- **Hermes agent delegation** — wrote detailed prompt for geometry topology
  debugging, Hermes applied fix correctly (commit 72f5d9b).
- **Autonomous plan created** — `docs/PLAN.md` with 8 phases: zoom on works,
  sound panel, custom carousel physics, DrawTrail rewrite, wobble cursor,
  typography + theme polish.
- **Phase 2: Zoom pulse** — Camera.pulse() method (two-phase FOV transition),
  triggered on section change + cube.triggerOpener() for combined effect.
- **Phase 3: Sound panel** — originally `src/UI/SoundPanel.ts` (floating
  bottom-right button). **REMOVED** in the UIkit3 navbar conformance refactor
  — sound toggle now lives in the menu overlay config toolbar
  (`#jlz-menu-sound` inside `src/sections/nav/template.ts::configToolbar`).
  Same 4-bar EQ animation, same `jlz:sound-toggle` event, same localStorage
  key. See WORKLOG.md 2026-07-13 entry.
- **Phase 4: Carousel enhancements** — momentum (velocity decay 0.92/frame),
  rubber-band (0.35x resistance beyond half-card-width), auto-advance
  (4500ms interval, pause on hover/drag), snap-back on release. New methods:
  getNearestSnapAngle(), startAutoAdvance(), stopAutoAdvance(), setHovered().
- **Phase 5: DrawTrail junni-style** — tapered tail (width 100%→10% head to
  tail, smoothstep curve), white hot core at head, brighter flowing energy.
  Replaces uniform-width "brush" with comet-like tail.
- **Phase 6: Wobble cursor** — spring-damper physics replaces lerp for outer
  circle (skaltenegger pattern). Magnetic fix: spring eases cursor to element
  center with organic wobble instead of instant snap. stiffness=0.25, damping=0.55.
- **All 6 phases verified** — tsc 0 errors, lint 0 errors, browser test:
  cube wobble visible, sound panel toggles, cursor exists, 0 console errors.

## Recent work (2026-07-12)

- **Works page redesign** — new template with 4 sections × 2 large 3D tilt cards
  (8 projects total, 2 new projects added: Indigo Drift, Crimson Hours).
  CSS-3D perspective + rotateX/Y tracked to cursor via `--rx`/`--ry` custom props.
  Click → `jlz:open-project` event → reuses ProjectOverlay.
- **i18n full implementation** — `src/core/i18n.ts` expanded to 130+ keys (EN/RU).
  `data-i18n` attributes added to all templates (home sections, content pages, nav).
  `applyTranslations()` wired into router on every `renderView()` + `jlz:lang-change`.
- **Route-based meta tags** — `src/core/pageMeta.ts` created. `applyMetaTags(page)`
  called on every route change + lang change. Updates title, description, OG,
  Twitter, canonical, `<html lang>`.
- **Enter button fix** — was activating too early (4s/5s fallback fired before
  3D init under throttling). Now ALWAYS visible but DISABLED (`pointer-events:none`,
  `opacity:0.5`) until `jlz:webgl-ready`. 60s hard fallback → load error (NOT Enter).
- **Ground plane fix** — was visible on all sections except Works (`!showGallery`).
  Now visible ONLY on section 4 (bottom cube face). `groundOpacity` 0.05 → 0.25.
- **`jlz:webgl-failed` event** — added to EventBus. Emitted on init crash →
  load error shown instead of Enter.

## Remaining work

→ **Moved to [`NEXT.md`](../NEXT.md)** — single source of truth for the backlog.
   Concrete, actionable, prioritized. Check off items as done.

## Proxy/dev config

| Setting | Value |
| --- | --- |
| `server.hmr` | `false` |
| `server.allowedHosts` | `['project.6la.ru']` |
| `block-vite-client` plugin | Strips @vite/client + stubs HTTP |
| CSS import | `?inline` suffix |
| Port | 5173 (vite dev) / 3000 (preview) |
