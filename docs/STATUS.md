# STATUS — Single Source of Truth

> Updated: 2026-07-13. Branch: `main`. Build green. ~11.6K TS LOC, 81 TS files.
> Cube wobble fixed (day34-accurate). Autonomous improvement plan in `docs/PLAN.md`.

## Project

SPA studio portfolio — **6 SPA routes** (one HTML entry: `index.html`), each
with **4 main sections** + 2 secret side sections (6 = 1:1 cube faces).
Inline splash overlay → Enter click → 3D scene. Single font: Inter.
Navigation: JoystickNav (pure DOM + dotnav) + UIMenu (transparent navbar).
Theme: 2-mode global flip (auto=light / inverse=dark) via ThemeManager.
i18n: EN/RU fully wired (130+ keys, `data-i18n` on all templates).
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
| **Cube wobble tuned** (uWobble=0.70, SIZE_SCALE=0.07, smoothed) | ✅ |
| **Ground plane — section 4 (bottom) ONLY** | ✅ |
| Per-section inverse theme (ContentReveal) | ✅ |
| Custom cursor — codrops-style (skip redraw when idle) | ✅ |
| BlurFade — cinematic blur+stagger for titles | ✅ |
| NoiseText — console typewriter for eyebrow numbers | ✅ |
| Footer removed — joystick sole bottom UI | ✅ |
| Blog standalone (blog.less, SEO, JSON-LD) | ✅ |
| **i18n — EN/RU fully wired** (130+ keys, `data-i18n` on all templates) | ✅ |
| **Route-based meta tags** (per-page title/description/OG, i18n-aware) | ✅ |
| SEO — sitemap 6 SPA pages + JSON-LD + meta tags | ✅ |
| Performance — CubeCamera throttle + bloom skip + leak fixes | ✅ |
| Mobile QA — 390px viewport passed | ✅ |
| Lighthouse — Performance 100 (FCP ~200ms) | ✅ |
| Ponytail audit — -632 LOC dead code removed | ✅ |
| TypeScript strict + ESLint + Prettier | ✅ |
| 9 unit tests (EventBus 5 + Noise 2 + motionPolicy 2) | ✅ |
| **Camera far=1000** (black hole fix preserved) | ✅ |
| **Naming refactor** (createSection0-5, userData.carousel preserved) | ✅ |
| **RenderPipeline crash guard** (line 641 preserved) | ✅ |
| **Post-processing** (vignette, refract, border, chromatic preserved) | ✅ |

## Recent work (2026-07-13)

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
