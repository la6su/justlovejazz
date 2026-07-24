# Worklog

## 2026-07-25 — Fix back-text visibility: orientation + DoubleSide + continuous render

### Decision

The curved back-text was not visible because: (1) cylinder geometry after
`rotateY(-π/2)` faced away from the camera (FrontSide rendered the outside,
but the camera sees the concave inside); (2) on-demand rendering stopped
updating the text screen when cards settled; (3) the text alpha was too low.

### Changes

- **Cylinder orientation fixed:** The cylinder arc (thetaStart=-ARC/2,
  thetaLength=ARC) centers on +X by default. After `rotation.y = -π/2`,
  the arc faces -Z (toward camera). Changed `side` from `FrontSide` to
  `DoubleSide` so both the concave and convex surfaces render.

- **Reduced radius, increased arc:** SCREEN_RADIUS 20→12 (stays in FOV),
  SCREEN_ARC 0.8→1.2 rad (~69°, fills the viewport width).

- **Position simplified:** Mesh at origin (0,0,0); the cylinder surface
  curves to z=-12 (behind cards at z≈-3). No offset needed.

- **Alpha boost:** Luminance multiplied by 3.0 and clamped via `.min(1.0)`
  for full opacity on white text pixels. Discard threshold 0.05→0.15.

- **Continuous rendering on /works:** Added `worksScrollActive` flag in
  Experience.ts — keeps `_needsRender=true` while on /works so the UV
  scroll animation continues even when cards have settled. Without this,
  on-demand rendering froze the text scroll after card reveal completed.

- **World.update() bypass:** When `!needsRender` but on /works, still call
  `worksPlaneStage.setActive(true, section)` + `worksPlaneStage.update(dt)`
  so the text screen visibility + scroll update. Previously, the
  `if (!needsRender) return` gate blocked all works stage updates.

- **Made `textScreen` public** on WorksPlaneStage so World can access it
  directly if needed (currently accessed via stage.update()).

### Verification

`type-check` 0 errors, `lint` 0 errors (60 pre-existing warnings),
`test:unit` 105/105, `test` (Playwright e2e) 12/12, `build` green.
VLM-verified: "SELECTED WORKS" visible behind cards in pixel font on
section 1. Text updates on section changes. No console errors.

## 2026-07-25 — Works BackText: curved plane + pixel font + synced wipe

### Decision

Three fixes: (1) no visible vertical wipe — synchronize with card reveal;
(2) switch to pixel font with Cyrillic; (3) make the screen curved and
full-width like the junni reference.

### Changes

- **Curved plane (cylinder geometry):** Replaced flat PlaneGeometry with a
  CylinderGeometry segment (radius=30, height=7, arc=0.55 rad, 64 radial
  segments). The curve wraps horizontally across the full viewport, matching
  the junni reference's immersive "back wall" effect. Rotated Y by π/2 so
  the cylinder axis is vertical.

- **Pixel font with Cyrillic (Pixelify Sans):** Downloaded
  `public/fonts/PixelifySans-400.ttf` + `PixelifySans-700.ttf` (49KB each)
  from Google Fonts. Created `public/fonts/pixelify.css` with @font-face
  declarations. Added `<link>` in index.html. WorksTextScreen loads the font
  via `document.fonts.load()` API before rendering — falls back to monospace
  if the font fails to load. Full Cyrillic support verified (А-Я, а-я).

- **Vertical wipe synchronized with card reveal:** The textScreen visibility
  is now driven dynamically in `WorksPlaneStage.update()` based on the
  average card reveal:
  - When cards start appearing (reveal > 0), the text wipe expands from center
  - When cards start disappearing (section change), the text wipe contracts
  - Formula: `setReveal(clamp(avgReveal * 1.2 - 0.1, 0, 1))` — slight delay
    so text appears just after cards start arriving
  - Removed the static `setReveal(1.0)` from `setActive()` — now only
    `setReveal(0)` on deactivation; the update loop handles the rest

- **Slower wipe damping:** Changed lambda from 3 to 2.5 for a more cinematic
  wipe that stays roughly in sync with the card reveal (lambda=10).

- **Full-width scaling:** The curved screen scales dynamically in `resize()`
  based on viewport aspect ratio — width clamped [10, 24] units, height
  proportional. The cylinder's large radius (30) + wide arc (0.55 rad) gives
  a base width of ~16 units that fills the FOV.

- **Canvas size:** 2048×512 (was 1024×512) — wider for pixel font legibility
  with horizontal tiling.

- **Alpha discard threshold:** Lowered from 0.15 to 0.1 for the pixel font's
  harder edges.

### Verification

`type-check` 0 errors, `lint` 0 errors (60 pre-existing warnings),
`test:unit` 105/105, `test` (Playwright e2e) 12/12, `build` green.
JS heap: 15 MB stable. No console errors.

## 2026-07-25 — Works BackText (junni pattern) + 3D card scaling

### Decision

Rework WorksTextScreen to match the junni.co.jp BackText pattern (flat plane,
UV-scroll, vertical wipe reveal, alpha discard). Improve 3D case plane
scaling to fill the viewport width on any aspect ratio.

### Changes

- **WorksTextScreen rewritten to junni BackText pattern:**
  - Replaced CylinderGeometry with flat PlaneGeometry (16×6 units) — junni
    uses a simple plane, not a curved cylinder
  - Added UV horizontal scroll (`vUv.x += time * 0.02`) — text drifts slowly
    like a cinematic backdrop, matching junni's backText.vs
  - Added vertical wipe reveal via `step(abs(vUv.y - 0.5), uVisibility * 0.5)`
    — text appears from center outward as visibility goes 0→1, matching
    junni's backText.fs
  - Added alpha discard (`step(0.15, alpha)`) — crisp text edges, no soft
    blending, matching junni's `if (col.w < 0.5) discard`
  - Added `RepeatWrapping` on texture.wrapS for seamless horizontal tiling
  - Replaced `_uniformReveal` with `_uniformVisibility` (matching junni naming)
  - Changed damping lambda from 6 to 3 for a slower, more cinematic reveal
    (junni uses easeOutCubic over 2s)
  - Canvas 1024×512 (was 1024×384) — wider for horizontal tiling
  - Full reveal (1.0) instead of 0.55 — the vertical wipe handles the
    reveal gradient, not constant opacity

- **WorksPlaneStage improved scaling:**
  - Added `_aspectScale` field — multiplier based on viewport aspect ratio
    (16:9 = 1.0, wider = larger, narrower = smaller, clamped [0.7, 1.4])
  - All card X positions and scales now multiplied by `_aspectScale` so
    cards fill the viewport width on ultrawide (21:9) and narrow (4:3)
    screens without distortion
  - Text screen scales dynamically in `resize()` — width clamped to [10, 24]
    units, height follows proportionally
  - Increased WIDE_LAYOUT card sizes (primary 2.18→2.4, secondary 1.38→1.5)
    and X positions for better fill
  - Increased STACKED_LAYOUT card sizes (primary 1.82→2.0, secondary 1.46→1.6)
    and Y positions for better mobile fill
  - Text screen position z=-5.5 → z=-6 (slightly further back for the wider plane)

- **Works template grid improvement:**
  - Added `uk-flex uk-child-width-1-1 uk-child-width-auto@m` to the grid
    for better responsive expansion — full-width on mobile, auto on desktop

### Verification

`type-check` 0 errors, `lint` 0 errors (60 pre-existing warnings),
`test:unit` 105/105, `test` (Playwright e2e) 12/12, `build` green.
JS heap: 13-14 MB stable across home → /works (4 sections) → /services → /works.
No console errors.

## 2026-07-25 — Works 3D template rework + memory churn fix

### Decision

Three tasks: (1) finish moving jlz-works-statement from HTML to the 3D curved
text screen (WorksTextScreen), each section showing its own description; (2)
fix jlz-works-grid to use uk-container-expand and work with the 3D layer;
(3) fix the ~100MB memory increase caused by route-exit disposal churning
TSL shader compilation.

### Changes

- **Memory fix: reverted route-exit disposal.** PR #176 added
  `disposeWorksPlaneStage()` called on every route change away from /works.
  This caused TSL shader recompilation churn: each /works visit created 8
  new CasePlane TSL materials + WorksTextScreen material, and the GPU
  driver doesn't immediately free disposed shader programs. After 2-3
  /works visits, this accumulated ~100MB of unreleased GPU shader memory.
  Fix: keep WorksPlaneStage alive (like BakuCarousel on home) — just hide
  it via `setActive(false)` when not on /works. The stage is created once
  and reused. Textures are still refcounted via the cache.

- **WorksTextScreen: i18n integration + smaller canvas.**
  - Replaced hardcoded SECTION_COPY with i18n keys (`works.section{N}.title`
    / `.lead`) — the 3D text screen now shows translated text and updates
    on language toggle via `refreshLanguage()`.
  - Reduced canvas from 2048×768 to 1024×384 — saves ~4.7 MB of canvas +
    GPU texture memory while remaining crisp at typical DPRs.
  - Added `refreshLanguage()` method — called by Experience.ts on
    `jlz:lang-change` so the 3D holographic title updates instantly.

- **Works template rework (works.ts):**
  - Removed the HTML `.jlz-works-statement` div entirely — the section
    title + lead are now rendered ONLY by the 3D WorksTextScreen behind the
    work cards. No more duplicate DOM layer.
  - Changed `.jlz-works-grid` to use `uk-container-expand` (was already
    on `.jlz-works-stage`) + added `uk-flex-middle` to vertically center
    cards with the 3D layer.
  - Removed `SECTION_COPY` constant — no longer needed in the template
    since the 3D screen owns the copy.

- **WorksPlaneStage: increased textScreen reveal.**
  - Changed `setReveal(active ? 0.35 : 0)` to `setReveal(active ? 0.55 : 0)`
    — the holographic text is now visible enough to read behind the cards.
  - Added `refreshLanguage()` method that delegates to WorksTextScreen.

- **CSS: removed all .jlz-works-statement rules (~55 LOC).**
  - Removed `.jlz-works-statement`, `__title`, `__lead` base rules (34 LOC)
  - Removed `--reverse` / `--cinematic` variant rules (9 LOC)
  - Removed story-state opacity rules (12 LOC)
  - Removed mobile media query rules (8 LOC)
  - Removed reduced-motion rules (2 LOC)
  - Removed `.jlz-works-statement__title` from shared variable-font selector

- **Experience.ts: added _langChangeHandler.** Listens for
  `jlz:lang-change` and calls `worksPlaneStage.refreshLanguage()` so the
  3D text screen updates on EN/RU toggle. Properly removed in `destroy()`.

- **e2e test: updated** to not expect `.jlz-works-statement` in DOM
  (moved to 3D).

### Memory answer

The ~100MB increase (150MB → 250MB) was caused by PR #176's route-exit
disposal: `disposeWorksPlaneStage()` was called every time the user left
/works, and `ensureWorksPlaneStageInitialized()` recreated the entire stage
(8 CasePlane TSL materials + WorksTextScreen canvas + geometry) on re-entry.
GPU shader programs from disposed TSL materials are not immediately freed
by the WebGL driver — they accumulate over 2-3 /works visits. Reverting to
"keep alive, hide when inactive" (the original pattern before PR #176)
eliminates the churn. JS heap is now stable at 11-17 MB across all routes.

### Bundle impact

| File | Before | After | Delta |
|------|--------|-------|-------|
| main.less | 2308 | 2227 | −81 LOC (−3.5%) |
| main JS chunk | 151.27 KB | 149.68 KB | −1.59 KB |

### Verification

`type-check` 0 errors, `lint` 0 errors (60 pre-existing warnings),
`test:unit` 105/105, `test` (Playwright e2e) 12/12, `build` green.
JS heap: 11-17 MB stable across home → /works → /services → /works → /home.
No console errors.

## 2026-07-25 — Deep CSS refactoring + memory leak fixes

### Decision

Two tasks: (1) aggressively reduce main.less (still 2399 lines after PR #175);
(2) find and fix memory leaks causing 411MB browser memory (was ~150MB).

### Memory leak fixes

- **A-1: Route-exit disposal for WorksPlaneStage (World.ts):** Added
  `disposeWorksPlaneStage()` method that disposes the stage + WorksTextScreen
  + all 8 CasePlane textures + TSL materials. Called from Experience.ts
  route-change handler when leaving /works. Frees ~40-50 MB of GPU memory
  that was permanently retained after first /works visit. The stage is
  lazily re-created on next /works visit via `ensureWorksPlaneStageInitialized()`.

- **A-3: Refcounted texture cache (caseTexture.ts):** Added `textureCache`
  Map with `loadCaseTexture()` / `releaseCaseTexture()` / `disposeAllCaseTextures()`.
  BakuCarousel and WorksPlaneStage now share the same texture objects instead
  of each loading their own copy of the same 4 project URLs. Saves ~12 MB
  of duplicate GPU textures. BakuCarousel.dispose() and
  WorksPlaneStage.dispose() now call `releaseCaseTexture()` instead of
  `texture.dispose()` directly — the cache disposes the GPU texture when
  the last consumer releases it.

- **B-4: Mouse-trail rAF cancel (Experience.ts):** Stored the rAF id in
  `_mouseTrailRafId` and cancel it in `destroy()`. Previously the rAF
  callback captured the Experience object for one frame after destroy.

### CSS refactoring (main.less 2399 → 2308, −91 LOC)

- **Scanline tombstone (28 LOC):** Removed `#spa-content section::before`
  and `.jlz-page-section::before` rules with `display: none` + commented-out
  gradient background + light-theme variant. Dead CSS — scanlines were
  disabled.
- **h1..h6 heading selector (22 LOC):** Removed the 22-line selector that
  set `font-family: inherit; text-transform: uppercase; letter-spacing: -0.03em`.
  Already migrated to `@base-heading-text-transform` + `@base-heading-letter-spacing`
  UIKit variables in `console-theme/_import.less` (PR #175).
- **[data-lab-overlay] dead rule (7 LOC):** Removed `[data-lab-overlay] > .uk-container`
  selector — zero matching markup in any template.
- **Redundant font-family declarations (6 LOC):** Removed 6 × `font-family: @global-font-family`
  — this is the inherited default; the declaration is a no-op.
- **.jlz-menu-col--stat transition-delay (3 LOC):** Removed dead transition-delay
  rule for a class that was removed from markup (but kept the visual styling
  rules — `jlz-menu-col--stat` class restored in nav/template.ts for the
  border/background/min-height styling).

### Bundle impact

| File | Before | After | Delta |
|------|--------|-------|-------|
| main.less | 2399 | 2308 | −91 LOC (−3.8%) |
| main JS chunk | 153.75 KB | 151.27 KB | −2.48 KB |

### Memory verification

JS heap measured across all pages + route changes + overlay open/close:
- Home: 11 MB
- /works: 13 MB (was ~50+ MB retained before fix)
- /services: 13 MB
- /manifesto: 14 MB
- /lab: 13 MB
- /contact: 13 MB
- Back to /home: 14 MB (no leak)
- Overlay open/close: 13 MB (no leak)

### Verification

`type-check` 0 errors, `lint` 0 errors (60 pre-existing warnings),
`test:unit` 105/105, `test` (Playwright e2e) 12/12, `build` green.
Browser-verified: all 6 pages + fullscreen overlay + route changes.

## 2026-07-24 — Inverse theme fix + CSS minimization + 3D works text screen

### Decision

Three tasks: (1) fix inverse theme bug when clicking brand from /works;
(2) minimize main.less further using UIKit3 utilities; (3) add 3D curved
transparent text screen behind works cards; (4) audit inverse theme across
all pages and fullscreen overlay.

### Changes

- **Task 1 — Inverse theme fix (ContentReveal):** The bug was that
  ContentReveal missed the initial `jlz:route-change` (fired by router.ts
  before Experience.init creates ContentReveal), so `uk-light` from
  index.html's default stayed on `<body>` until the first section nav.
  Fix: added `applyInitialTheme()` in the constructor that finds the active
  section and applies its theme immediately. Also: resolve `sectionIndex`
  from the config (not from the stale `currentSectionIndex` that was reset
  to -1 on route-change), and always send `themeChanged: true` so the 3D
  layer (ground, baku, particles, text screen) re-syncs on every
  applyTheme call.

- **Task 2 — CSS minimization (−87 LOC):** main.less 2486→2399 lines.
  Removed UIKit-duplicating rules:
  - `* { box-sizing }` (UIKit base already emits it)
  - `body { margin; background; color }` (UIKit base + _import.less §3)
  - `.jlz-visually-hidden` (dead — zero refs)
  - `.jlz-experiment-footer__mode { color }` (inherited body color)
  - `.jlz-experiment-footer__state { color }` → `uk-text-muted` in markup
  - `.jlz-section-bottom .jlz-service-desc { margin-top:0 !important }`
    (removed `uk-margin-small-top` from `i18nDesc()` helper instead)
  - `.jlz-service-desc .uk-text-meta { color }` (UIKit `.uk-text-meta` already sets it)
  - `.jlz-service-explore { font-weight; border-radius }` (hook-button provides them)
  - `.jlz-sheet-close { color:inherit }` (UIKit `.uk-close` already sets color)
  - `.jlz-contact-footer__intro { align-items !important; text-align !important }`
    (fixed markup: `uk-flex-middle uk-text-center` → `uk-flex-top uk-text-left`)
  - `.jlz-contact-footer__actions .jlz-sheet-close { margin-left:auto }` →
    `uk-margin-auto-left` in markup
  - `.jlz-menu-nav` (UIKit `.uk-nav` already resets list-style/margin/padding)
  - `.jlz-menu-stat` → `uk-flex uk-flex-column` in markup
  - `.jlz-menu-col--stat { align-self:auto }` (auto is default)
  - `.jlz-menu-nav__item { position:relative }` (no abs descendants)
  - `.jlz-menu-nav__toggle` reset props (no-ops on `<a href>`)
  - `.jlz-menu-nav__subs` reset props (UIKit `.uk-nav-sub` provides them)
  - `.jlz-topbar-controls { display:flex; align-items }` (markup has `uk-flex uk-flex-middle`)
  - `.jlz-contact-launcher__button` + `:hover` (hook-button-primary provides bg/color/shadow)
  - `.jlz-menu-launcher { background; border-radius }` (hook-button-default provides them)

- **Task 3 — 3D curved text screen (WorksTextScreen.ts):** New 3D element
  on /works — a gently curved transparent plane behind the work cards that
  renders the section title + lead as a canvas-generated text texture.
  - CylinderGeometry segment (12 units wide, 5 tall, 0.12 rad curvature)
  - MeshBasicNodeMaterial with TSL: samples canvas texture, flips text
    color via `mix()` based on `isLight` uniform, modulates alpha by
    reveal + subtle time pulse
  - Positioned at z=-5.5 (behind cards at z≈-3), renderOrder=1
  - `setSection(index)` regenerates the canvas texture with the section copy
  - `setTheme(isLight)` flips text color for inverse contrast
  - Integrated into WorksPlaneStage: created in `init()`, updated in
    `update()`, disposed in `dispose()`, section synced in `setActive()`,
    theme synced via `setTheme()`
  - Experience.ts calls `worksPlaneStage.setTheme()` on `jlz:theme-applied`

- **Task 4 — Inverse theme audit:** Verified all pages (home, /works,
  /services, /manifesto, /lab, /contact) in both auto and inverse modes.
  uk-light toggles correctly per-section. FullscreenOverlay has hardcoded
  `uk-light` (always dark bg + light text) — correct. No contrast issues
  found. Theme toggle works on all pages. Brand-click from /works (inverse)
  to home now correctly applies the intro section's inverse theme.

### Verification

`type-check` 0 errors, `lint` 0 errors (60 pre-existing warnings),
`test:unit` 105/105, `test` (Playwright e2e) 12/12, `build` green.
Browser-verified: all 6 pages in auto + inverse, fullscreen overlay,
theme toggle, brand-click navigation.

## 2026-07-24 — CSS minimization + /works texture fix

### Decision

Two tasks: (1) minimize CSS bundle by removing UIKit3-duplicating `.jlz-*`
overrides and replacing them with UIKit utility classes / data-attributes;
(2) fix invisible textures on /works page.

### Changes

- **/works texture fix (prewarmShaders crash):** `WorksPlaneStage.prewarmShaders()`
  called `WebGPURenderer.compileAsync()` which throws synchronously during TSL
  node build (`Cannot destructure property 'camera' of 'o[(o.length - 1)]'`).
  The unhandled rejection corrupted CasePlane material state, making textures
  invisible on /works. The home BakuCarousel was unaffected because it never
  calls `prewarmShaders`. Fix: made `prewarmShaders` a no-op (returns
  `Promise.resolve()`). The WebGPURenderer compiles shaders lazily during the
  first actual render (which has a proper render context), so pre-warming is
  not needed. First visible frame may have slight jank; textures render
  correctly.

- **Dead CSS deletion (~280 LOC):** Removed all `.jlz-joystick*` rules (2
  definitions + 8 dotnav rules + mobile media query + reduced-motion entries),
  `.jlz-scroll-hint__line::after` + `@keyframes jlz-scroll-pulse` (already
  deleted in prior edit), `#pageLoader` + `#pageLoader.fade-out` + `#jlj-enter`
  (standalone page loader styles — main app uses `#jlz-app-loader`), `.canvas`
  (no matching markup). Migrated 7 `var(--jlz-joystick-size, ...)` padding
  references to `var(--jlz-bottom-controls, 4.5rem)`.

- **UIKit utility-class refactors (8 rules):** Replaced `.jlz-*` CSS
  properties that duplicate UIKit utilities with UIKit classes in markup:
  1. `.jlz-service-explore` `text-transform: uppercase` → `uk-text-uppercase`
     in `serviceExplore()` helper
  2. `.jlz-experiment-footer__mode/__state` `text-transform` → `uk-text-uppercase`
  3. `.jlz-works-index` `text-transform` → `uk-text-uppercase`
  4. `.jlz-works-statement__lead` `text-align: right` → `uk-text-right`
  5. `.jlz-contact-form` `flex-wrap` → `uk-flex-wrap`
  6. `.jlz-service-desc` `display: flex; flex-direction: column` →
     `uk-flex uk-flex-column` in `i18nDesc()` helper
  7. `.jlz-experiment-footer` `display: flex; flex-wrap; align-items; width;
     margin-top` → `uk-flex uk-flex-wrap uk-flex-middle uk-width-1-1
     uk-margin-remove-top`
  8. `.jlz-experiment-footer .jlz-service-explore` `margin-left: auto` →
     `uk-margin-auto-left` via new `extraClass` parameter on `serviceExplore()`

- `main.less`: 2776 → 2495 lines (−281 LOC, −10.1%)
- `main` JS chunk: 159.29 KB → 155.23 KB (−4 KB CSS inlined)

### Verification

`type-check` 0 errors, `lint` 0 errors (60 pre-existing warnings),
`test:unit` 105/105, `build` green. Browser-verified: home, /works, /services,
/manifesto, /lab, /contact all load without errors. /works shows 8 work cards
with loaded images. No `prewarmShaders` crash.

## 2026-07-24 — PI agent preparation and docs audit

### Decision

Prepare the project for ongoing PI Agent (AI coding agent) work and audit all
documentation for stale references after the PR #171 audit cleanup.

### Changes

- **docs/UIKIT3.md** — rewrote entirely. Removed dead references to
  `master-quantum-flares/`, `studio-console/`, `_quantum-flares-overrides.less`,
  `_theme-fixes.less`, `master-vibe/` (none of these exist). Documented the
  actual `console-theme/_import.less` architecture, the `_import.less` token +
  UIKit override assembly, and the full imported UIKit component list. Added a
  solution priority order (UIkit markup → Less var → scoped `.jlz-*` rule).
- **docs/ARCHITECTURE.md** — fixed bootstrap chain (removed `main-app.ts`,
  which was inlined into `entry-app.ts:boot()` in PR #171). Updated key
  modules table (Bootstrap now lists only `entry-shell.ts` + `entry-app.ts`;
  added `UIManager.ts` and `StateBus.ts`). Documented the event contract:
  typed `EventBus` events vs local `jlz:*` DOM contracts. Noted
  `FullscreenOverlay` focus trap.
- **docs/RULES.md** — removed QF/studio-console references. Updated UI rule
  to point to `console-theme/_import.less` and `_import.less`. Added
  reduced-motion rule (authored animations must snap to settled state
  synchronously). Clarified typed vs local event rule. Added focus-trap
  requirement for `FullscreenOverlay`.
- **README.md** — fixed bootstrap chain (`main-app.ts` removed).
- **docs/DEVELOPMENT.md** — fixed CI claim (unit tests ARE in CI, not just
  local). Listed the exact CI gate steps.
- **docs/CHANGELOG.md** — added 2026-07-24 entry for PR #171 + #172.
- **docs/PLAN-showreel-shader-plane.md** — removed `PlaneTransition.ts`
  references (deleted in PR #171). Updated "already complete" section.
- **NEXT.md** — removed completed "Works 3D/showreel evolution" and
  "Telegram design-system extension" items. Added "EventBus migration
  completion" task (10 remaining local `jlz:*` events).
- **AGENTS.md** — rewrote as the single source of truth for all AI coding
  agents. Added quick-reference table, reading order, hard constraints
  (including UIkit-first and reduced-motion rules), session workflow,
  verification gate, Conventional Commits convention, and documentation
  policy. Noted that `CLAUDE.md` and `.github/copilot-instructions.md`
  reference this file.
- **docs/README.md** — updated ownership map (UIKIT3.md owns renamed,
  CONTRIBUTING.md added to root docs).
- **CLAUDE.md** — created. References AGENTS.md, adds Claude Code-specific
  notes (rg, Edit/MultiEdit tools, Vite SPA not Next.js, TSL NodeMaterials).
- **.github/copilot-instructions.md** — created. References AGENTS.md, adds
  Copilot-specific notes (Bun, Vite SPA, TSL, UIkit 3, TypeScript strict,
  Conventional Commits).
- **.cursor/rules/project.mdc** — created. References AGENTS.md, adds stack
  summary, hard constraints, verification gate, commit style.
- **CONTRIBUTING.md** — created. Human contributor guide: quick start,
  workflow, code style, PR checklist, issue reporting, license.
- **.github/CODEOWNERS** — created. Default owner + area-specific owners
  (3D, UI, CI).
- **.github/ISSUE_TEMPLATE/bug_report.md** — created.
- **.github/ISSUE_TEMPLATE/feature_request.md** — created.
- **.github/PULL_REQUEST_TEMPLATE.md** — created. Conventional Commits
  checklist + verification gate.

### Verification

`type-check` 0 errors, `lint` 0 errors (61 pre-existing warnings), `test:unit`
105/105, `build` green. All documentation references verified against the
actual filesystem (no more dead QF/studio-console links).

## 2026-07-23 — Final transition, texture and overlay fixes

### Decision

Four remaining visual issues from user feedback: card overlap during /works
section change, CasePlane radial mask reading as a directional wipe from the
right corner, double play button in the fullscreen overlay, and ACES tone
mapping washing out case texture colors.

### Changes

- **WorksPlaneStage card overlap:** Invisible cards (not in the active
  section) now fade out in place — they no longer lerp toward the secondary
  layout slot, which caused old and new cards to overlap in the right corner
  during section transitions.
- **CasePlane reveal mask:** Replaced the radial center-out circle mask
  (`screenUv.sub(vec2(0.5)).length()` + `smoothstep`) with a clean
  `reveal * fadeOut` opacity. No directional bias — cards fade in/out
  uniformly instead of wiping from a corner.
- **Double play button:** Removed the footer `.jlz-fs-play` button. The
  `.jlz-fs-big-play` overlay (inset:0, centered) is the sole play/pause
  control. The footer keeps mute + seek + time.
- **Texture color — ACES removed:** Removed ACES tone mapping from both
  post-processing paths (WebGL2 composite shader + WebGPU TSL graph). ACES
  compressed dynamic range and desaturated case textures. CasePlane's
  `toneMapped:false` is now effective — textures render with faithful
  original colors. Also neutralised the warm shadow tint
  (`[1.0, 0.98, 0.95]` → `[1, 1, 1]`) in WorldConfig DEFAULTS that affected
  the home works carousel.

### Verification

`type-check` 0 errors, `lint` 0 errors (58 warnings), `test:unit` 106/106,
`build` green. Browser-verified: 1 play button (big-play only), /works
sections show correct projects without overlap, no directional wipe, texture
colors vibrant and faithful.

---

## 2026-07-21 — Unified shader transition and per-instance materials

### Decision

The home Baku carousel, the `/works` plane stage and the fullscreen overlay
shared duplicated transition code and a single shared `CasePlane` material,
so only the last card's texture and uniforms rendered and the overlay never
revealed. PR #165 consolidated the plane-to-fullscreen handoff into one
utility and gave each `CasePlane` its own material.

### Changes

- **CasePlane per-instance materials:** Removed all module-level shared
  state (`sharedTime`, `sharedState*`, `_sharedTexture`, `_sharedMaterial`).
  Each `CasePlane` now constructs its own `MeshBasicNodeMaterial` with its
  own TSL uniform nodes and texture binding; only `PlaneGeometry` is still
  shared. `dispose()` releases the per-instance material.
- **PlaneTransition utility:** New `src/Experience/World/PlaneTransition.ts`
  exports `TRANSITION_DURATION`, `TRANSITION_TAKEOVER`, `CASE_PLANE_HEIGHT`
  and the `beginTransition` / `updateTransition` / `resetTransition`
  helpers. It is now the single source of truth for the plane-to-fullscreen
  handoff for both `BakuCarousel` (quaternion interpolation) and
  `WorksPlaneStage` (euler interpolation), removing ~90 lines of inline
  transition code and the duplicate camera math.
- **FullscreenOverlay reveal:** The CSS reveal transition depended on an
  `is-entered` class that was never added. `FullscreenOverlay` now adds it
  on `shown` (and a 120 ms fallback timer in `show` covers the case where
  UIkit's `shown` event loses the race with `transitionend`) and removes it
  on `hide`. `_tryAutoplay()` is shared by both paths so the showreel video
  starts reliably.
- **Overlay CSS specificity:** `.jlz-fs-dialog` selectors were re-prefixed
  with `.jlz-fs-overlay` so they match UIkit's `.uk-modal-full
.uk-modal-dialog` specificity (2) instead of being overridden by it.
  `margin:0` and `max-width:100% !important` fully override UIkit's
  modal-full layout rules.
- **DevPanel regression fixed:** The audit-remediation pass rewired the
  DevPanel carousel buttons to a non-existent `Experience.navigatePortfolio`
  method, which broke `type-check`. Reverted to `portfolio?.prev()` /
  `portfolio?.next()` — the surface `WORKLOG.md` already documented.

### Verification

`type-check` 0 errors, `lint` 0 errors (59 pre-existing warnings),
`test:unit` 106/106, `build` green. Showreel, home works slider and the
`/works` plane-to-fullscreen handoff all reveal correctly.

---

## 2026-07-20 — Audit remediation Phase A + B

### Decision

Seven items from the technical audit addressed in one PR. All changes are
P1/P2 from the priority backlog — safe wins and structural simplification
with zero rendering or visual regression risk. The audit report itself was
retired afterwards; its findings now live only in Git history.

### Changes

- **A-1 EnvSphere no-ops:** Removed `attachToScene`, `setSectionColors`,
  `setBlend`, `setActiveSection` — all documented no-ops with comments
  explaining retained "API compat." Callers in `Experience.ts` (sheet
  section-change) and `World.ts` (init) removed. Mesh is self-rendering
  via `renderOrder=-1000`; section weights drive the blend.
- **A-2 WorksPortfolio:** Replaced class with Three.js `Group` (never
  rendered, `visible=false`) with a plain interface + `createWorksPortfolio()`
  factory. Eliminates the `three` import entirely and the `dispose()`
  that only called `group.clear()`. `Experience.ts` no longer positions
  or adds the phantom group to the scene. DevPanel accesses
  `portfolio.prev()/next()` via the identical method surface.
- **A-3 IntersectionObserver leak:** `entry-app.ts` `setupTitleObserver()`
  now stores the observer in `_titleObserver` and disconnects the previous
  one before creating a new one (HMR re-init guard).
- **A-4 Sound preference:** Extracted duplicated `localStorage.getItem('jlz:sound')`
  reads from `entry-app.ts`, `UIMenu.ts`, `Experience.ts` into
  `getSoundMuted()` in `SfxSystem.ts`. Added matching
  `setSoundMutedPreference()`. Three consumers updated.
- **A-5 Timeout guard:** Inline 60s safety-net in `index.html` now checks
  `content.contains(btn)` before overwriting innerHTML — if `entry-app.ts`
  already showed its error UI, the retry link is preserved.
- **A-7 Focus trap:** `FullscreenOverlay` now traps Tab/Shift+Tab inside
  `.uk-modal-dialog` while the overlay is open. Attached via `focusin`
  on UIkit's `show` event, removed on `hide` and `dispose()`.
- **B-4 Texture ownership:** Module-level `particleTexture` in
  `works/scene.ts` moved inside `createSection3()`. Owned by a
  module-scoped `_section3Texture` variable, disposed in
  `disposeSection3Textures()`. Eliminates HMR GPU leak.

### Verification

`type-check` 0 errors, `lint` 0 errors (54 pre-existing warnings),
`test:unit` 86/86, `build` 2.33s — all green. Bundle sizes within
existing budgets.

---

## 2026-07-18 — Parallax plane-to-still Works fullscreen

### Decision

Separated the content models that had become mixed together. The home Works
stream is a flat infinite horizontal parallax strip: drag moves real TSL planes
while their textures counter-travel inside a generous UV buffer. Frames keep a
single scale and horizon; the viewport clips their neighbours instead of using
card rotation, fabric bend or depth staggering. `/works` retains
its semantic UIkit composition and lazy real-plane companion. A selected plane
settles its parallax, aligns with the camera and fills the viewport while a
bounded TSL film burn opens several softly warped emulsion holes with an amber
exposure wash, a dark char band and a white-hot edge. The centre case resolves
first on section arrival; right and left neighbours register on asymmetric
beats, and texture parallax begins only after each still becomes legible.
UIkit then crossfades one decoded
fullscreen still over it; there is no nested three-image gallery, horizontal
aperture, autoplay or shared-video fallback. The approved `coming-soon` film
and poster now belong exclusively to Play Showreel.

Works post grading is neutral while `CasePlane` pre-inverts the shared filmic
curve. The same authored sRGB still therefore keeps its density between the
TSL plane and DOM fullscreen instead of becoming brighter or developing bloom
artefacts during parallax. A restrained anisotropy level stabilises the moving
texture on high-DPI displays.

Generated a coherent eight-image Studio Console preview set from the approved
reference direction. Every project preview is a versioned 1440×810 JPEG with a
monochrome base and restrained `#b8ed69` / `#45d7bc` signals; the previous
assets remain intact for comparison.

### Verification

- Browser-checked the home strip drag and `/works` on native WebGPU: frames
  counter-travel without bending; the selected real plane expands,
  the fullscreen shell contains exactly one matching still, video source stays
  empty and the unobscured previous arrow updates title, counter and poster.
- Browser-checked the centre/right/left arrival, source-colour parity and the
  multi-origin burn handoff. The active transition reached the 144 Hz display
  cadence during the final pass.
- Type-check, production build and all 86 unit tests pass. Full repository
  gates are recorded after the final polish.

## 2026-07-18 — Editorial Works reveal and high-refresh diagnostics

### Decision

Replaced the home Works cube-face unfold with a centre-first depth reveal that
keeps all real `CasePlane` surfaces in their final three-card composition. A
shared TSL alpha wipe resolves each image from its centre. Fullscreen handoff is
now a 0.96s focus → travel gesture: neighbouring planes fade first, the CRT
signal arrives late and UIkit takes ownership only after the selected plane has
nearly reached the camera. Plane-origin metadata and controls join with a short
project-owned fade while UIkit remains the modal state/focus owner.

Restored the intended post-splash broken-square portal echo as one precompiled
instanced draw call, not a random particle system. Corrected DevPanel FPS to
measure real pipeline renders: an idle on-demand scene now reports 0 instead of
the browser callback rate. Capped native WebGPU DPR at 1.5 (matching the desktop
WebGL2 ceiling) to cut full-screen post fill work by 44% on high-refresh Retina
setups without reducing geometry or effect quality tier.

### Verification

- Browser-checked the splash portal, centre-first home Works arrival, the
  slower mid-handoff frame and successful first-video fullscreen takeover on
  native WebGPU.
- Static Studio reports 0 rendered FPS; active Works reports the actual browser
  render cadence rather than an unrelated `requestAnimationFrame` counter.
- Lint (0 errors, 54 existing warnings), type-check, production build and all
  86 unit tests pass. The parallel Playwright run passed 10/12; both timing-
  sensitive mobile route/menu scenarios pass together with one worker.
- Repository-wide `format:check` remains blocked by 30 pre-existing unrelated
  files; every file touched for this change is formatted and `git diff --check`
  passes.

## 2026-07-18 — Stable startup and Works frame pacing

### Decision

Made the inline splash the only startup entrance: the cube now starts settled,
the redundant 3D trace opener was removed and the procedural PMREM source was
reduced to the resolution its soft reflections actually need. Home Works
textures and TSL planes now prewarm before Enter becomes ready.

The cube's CPU deformation retains its 30fps upload cadence but now follows a
damped energy envelope instead of stopping on a timer. `/works` render activity
is scoped to its two visible cards, so hidden reveal values cannot keep the
renderer alive after the route settles. Removed the unused BoxGeometry UV
attribute before vertex welding so rounded edges share normals without seams.
WebGL2 now uses a 1.5 DPR ceiling and one third-resolution separable bloom pass;
the native WebGPU premium profile is unchanged.

### Verification

- Target-file formatting, lint (0 errors, 54 existing warnings), type-check,
  production build, 86 unit tests and all 12 Playwright scenarios pass.
- Browser QA reached the display limit at 72 FPS on WebGPU. The tested WebGL2
  Works frame improved from 46 FPS / 21.7 ms to 87 FPS / 11.5 ms; both backends
  return the intro renderer to idle after the splash reveal.
- Repository-wide `format:check` remains blocked by 32 pre-existing unrelated
  files, tracked in `NEXT.md`.

## 2026-07-18 — Works cursor signal repair

### Decision

Rebuilt the legacy blue DrawTrail as a short-lived Studio Console signal: a
real TSL ribbon in lime and teal, with its width aligned perpendicular to the
pointer path. The former fixed camera-right offset made horizontal movement
collapse into zero-area triangles, which is why the tail looked broken or
absent. The trace now receives an explicit idle-energy decay and keeps the
on-demand renderer alive only while it settles. It appears throughout the
standalone `/works` route and remains absent from the home media stream.

### Verification

- Browser-checked the standalone Works composition and its cursor-safe media
  field after the route visibility change.
- Type-check, lint (0 errors, 54 existing warnings), production build and 86
  unit tests pass.

## 2026-07-18 — CRT-first Works fullscreen handoff

### Decision

Replaced the sequential plane-to-overlay choreography with one short 0.34s
handoff. The selected real `CasePlane` owns the TSL CRT-on pulse; the UIkit
overlay then takes over directly without an aperture or delayed metadata
animation. The decoded poster remains the continuity surface until the first
video frame has composited. A case without a dedicated film now explicitly
uses the approved studio reel, so opening the first playable case cannot settle
on a black video stage. Fullscreen previous/next controls are deliberately
large on both desktop and mobile.

### Verification

- Browser-checked the first `EBB VIBES` case: the studio reel is visible on
  first open, including during the short transition; the enlarged controls are
  present.
- Type-check, lint (0 errors, 54 existing warnings), production build and 86
  unit tests pass. The full Playwright run passed 11 of 12 scenarios; its only
  failure was a parallel `/works` semantic-grid mount timeout. The exact
  scenario passes when rerun in isolation.

## 2026-07-18 — Works handoff and compact staging

### Decision

Kept a real 3D plane visible through the plane-to-modal seam until its matching
DOM poster has decoded. This removes the first-project black frame without
substituting an unrelated fallback video. Video posters now remain visible
until the browser has rendered the first video frame, so arrow navigation uses
the same no-black-frame contract.

Below UIkit's `@m` grid breakpoint, `WorksPlaneStage` switches from its
two-column coordinates to a deliberate vertical pair. The compact route hides
the decorative background title, removes duplicate card telemetry and reserves
safe space for the topbar and lower navigator. The semantic UIkit grid and the
visible Three.js planes now describe the same layout.

### Verification

- Browser-checked the first `EBB VIBES` plane handoff and the following
  `MONO SUNDAY` video path: both kept authored media visible.
- Added a 390 × 844 Chromium check for the mobile `/works` pair. Type-check,
  lint (0 errors, 54 existing warnings), production build, 86 unit tests and
  12 Playwright scenarios pass.

## 2026-07-18 — Infinite Works media and plane handoff

### Decision

Replaced the small planar Works slider with an infinite, non-autoplay media
stream of twelve large, texture-shared TSL `CasePlane` instances. Drag velocity
now bends the actual subdivided planes, so the effect is material resistance
rather than a rotating-card carousel. Added a lazy `WorksPlaneStage` for
`/works`: DOM controls retain semantics, focus and keyboard access but the
visible case imagery is real Three.js media. Both the home stream and route
stage expand a selected plane before the UIkit detail opens, with the exact
same source texture during the handoff. The legacy cursor trail stays out of
the home stream so it cannot cross its artwork.

The home composition now deliberately frames three substantial cases at once,
with breathing room, restrained fabric-like bending at the two outer edges and
large previous/next controls. It has no visible DOM copy or console module:
the only title is a quiet outlined `WORKS` CanvasTexture on a real plane behind
the media, revealed with the cube-to-stream handoff.

### Verification

- Visually checked the desktop `/works` 3D stage, velocity distortion, direct
  plane opening, three-case home composition, title-plane depth and arrow
  controls; no browser errors.
- Type-check, lint and production build pass; full regression checks follow
  before the change is staged.

## 2026-07-18 — Planar Works case slider

### Decision

Replaced the rotating home Works ring with a non-autoplay horizontal slider of
real Three.js `CasePlane` surfaces. Each plane owns a TSL vertex wobble,
per-plane reveal and explicit GPU disposal; the shared fullscreen overlay
remains the detail owner. The semantic `/works` grid now uses the same compact
plane response, signal-edge treatment and click wobble rather than oversized
card tilt or project-colour gradients.

### Verification

- Visually checked the home slider, `/works` desktop composition and opening a
  case directly from a 3D plane; no browser errors were reported.
- Lint (0 errors; 54 existing warnings), type-check, production build, 86 unit
  tests and all 11 Playwright Chromium scenarios pass.

## 2026-07-18 — Monochrome console contrast

### Decision

Reduced the active visual system to a black/white environment and two fixed UI
signals: lime `#b8ed69` and teal `#45d7bc`. The console frame keeps its
character through discrete signal segments rather than gradients. Telegram,
storyline controls and bottom modules now define both dark and inverse surfaces
explicitly; EnvSphere, fog, ground and glass reflections are neutral grayscale.

### Verification

- Visually checked the light Contact CTA and the settled dark frame.
- Type-check, production build and 86 unit tests pass. The targeted Works
  Playwright scenario passes; the previous full parallel run had one isolated
  `/works` timeout while the other 10 scenarios passed.

## 2026-07-18 — Console Field note module

### Decision

Moved the lower story surface into the Studio Console layer and rebuilt it as a
terminal-like output module: signal header, readable mono output and one clear
command. It uses local transparency and a 14px blur only where desktop content
crosses the active 3D stage. Mobile disables the blur and increases opacity;
inverse receives its own light surface and contrast values.

### Verification

- Visually checked dark desktop, 390 × 844 mobile and inverse desktop states.
- Type-check, lint (0 errors; 54 existing warnings), production build, 86 unit
  tests and all 11 sequential Playwright Chromium tests pass.

## 2026-07-18 — Studio Console theme boundary

### Decision

Created `src/assets/studio-console/` as the destination for all new shared
visual decisions. UIkit remains responsible for component semantics and state;
Quantum Flares and Vibe are now read-only donor/compatibility layers that can
be reduced only after each migrated treatment is verified. The first adopted
Vibe pattern is a static acid-green/teal signal edge for focus, active
navigation and story-module boundaries—without its glitch loops, texture or
type system.

### Verification

- The layer is imported after the retained QF compatibility bridge, so it wins
  without modifying either vendored snapshot.
- Type-check, lint (0 errors; 54 existing warnings), production build, 86 unit
  tests and all 11 sequential Playwright Chromium tests pass.

## 2026-07-18 — Dark console mobile baseline

### Decision

Consolidated the SPA around a dark technical-console system: restored the
renderer-owned CRT edge frame, retained the removal of scanlines and grain,
and removed the decorative progress shader. EnvSphere now stays within a
single low-luminance dark family across every story frame. Rebuilt each lower
story beat as one semantic `Field note` module with an aligned action, then
gave mobile its own single-column rhythm, contrast and touch target treatment.
Menus, the Contact sheet and Telegram action use the same opaque technical
planes rather than glass gradients or oversized rounded cards.

### Rationale

The earlier light/dark sections and fluid panels made the portfolio feel like
separate art directions. A persistent frame, one restrained palette and
consistent lower-module geometry let the 3D object carry the atmosphere while
the interface remains readable at phone scale.

### Verification

- Visually checked the 390 × 844 Studio and Services frames after splash,
  including the final state of the forward transition and fixed controls.

## 2026-07-18 — Single-owner story transition timing

### Decision

Removed UIkit Scrollspy reveal effects from story section panels and stopped
easing CSS values that `CinematicNav` updates on every scroll frame. Theme
updates now dispatch only when the visual mode changes, preventing redundant
environment interpolation between adjacent sections of the same mode. Aligned
the discrete 3D arrival with the DOM chapter midpoint in both directions while
keeping camera and material interpolation continuous across each scroll frame.

### Rationale

The parallel CSS/UIkit/Three timelines made content trail behind scroll and
occasionally restarted the dark/light transition. A single continuous timeline
keeps section changes responsive without sacrificing the intentional title
motion after the splash.

### Verification

- Type-check, lint (0 errors; 54 existing warnings), production build, 86 unit
  tests and all 11 Playwright Chromium tests pass in the sequential full run.

Short, newest-first decisions that help the next maintainer. Do not copy task
inventories or release notes here. Git history retains the detailed record.

---

<!-- WORKLOG:ENTRIES -->

## 2026-07-18 — Glass control refinement

### Decision

Reworked UIkit default and icon-button hooks as one restrained glass material:
translucent layers, internal highlight, thin edge and a small depth response
replace opaque controls and rotational hover. Replaced the filled theme glyphs
with matching outline icons, refined the sound bars, and removed the redundant
storyline status/progress DOM so the active chapter item is the only status.

### Verification

- Type-check, lint (0 errors; 54 existing warnings), production build, 86 unit
  tests and all 11 Playwright Chromium tests pass.

## 2026-07-18 — One owned theme boundary

### Decision

Kept Quantum Flares as an immutable vendor baseline and consolidated the two
duplicate Less assembly chains into project-owned `_theme.less`. The bridge now
explicitly disables QF's legacy texture/glitch effects through variation
variables, leaving the current Onest, calm glass, fluid surfaces and purposeful
motion as the only visual language across SPA and Blog.

### Verification

- Production build, type-check, lint (0 errors; 54 existing warnings), 86 unit
  tests and all 11 Playwright Chromium tests pass.

## 2026-07-18 — Editorial Blog and honest Lab catalogue

### Decision

Turned the Blog index into an editorial entry with one featured engineering
story and a compact note list, replacing the repeated generic card rhythm.
Lab copy now describes concrete research questions and labels every item as an
isolated scene in development; its only current action is a linked development
note. This prevents an unfinished experiment catalogue from masquerading as
client work or loading a future scene runtime into the shared application.

### Verification

- Type-check, lint (0 errors; 54 existing warnings), production build, 86 unit
  tests and all 11 Playwright Chromium tests pass.

## 2026-07-18 — Entry typography and navigation refinement

### Decision

Moved the 3D word treatment to the lower Contact/Manifesto frame only. Its
glyphs now wait for the frame to settle, then reveal once through CPU-side
transforms that remain identical on WebGPU and WebGL2; reduced motion resolves
immediately. Updated the existing square-path splash copy into a multilingual
entry while preserving its concentric geometry and centered Enter control,
removed the top-bar signal, moved the chapter control to the right and
expanded Menu to seven destinations including Lab and a direct Blog route.
UIkit button and
icon-button hooks now share the compact cinematic control language, while the
Contact launcher is deliberately black-on-white in both runtime theme modes.
The entry handoff no longer throws random gravity-driven particles: three
deterministic broken-square light frames now echo the splash geometry, contract
through the cube and dissolve in 1.05 seconds using one 12-instance mesh.

### Verification

- Visually checked the splash, top bar, Menu, contact CTA and lower 3D HELLO
  frame in a live desktop browser.
- Type-check, lint (0 errors; 54 existing warnings), build, 86 unit tests and
  all 11 Playwright Chromium tests pass.

## 2026-07-18 — Editorial Works and variable typography foundation

### Decision

Made the Works route a dark editorial media stage with asymmetric UIkit grids,
oversized type and restrained weight animation while keeping semantic project
buttons and `FullscreenOverlay`. Onest Variable is now self-hosted as separate
Latin and Cyrillic subsets across the SPA and standalone Blog. Removed the
renderer pipeline's hidden default CRT border and all section vignette values;
the fullscreen viewer now owns a fixed dark contrast contract in inverse mode.
Works no longer calls production projects “Experiments”: Lab is reserved for
separately loaded 3D R&D scenes. The product-wide content model is capability,
problem, response and proof, expressed as rhythm rather than repeated lists.

### Verification

- Visually checked Works in both theme modes and Russian, then opened a project
  from its card and checked the fullscreen viewer contrast and controls.
- Type-check, lint (0 errors; 54 existing warnings), production build, 86 unit
  tests and all 11 Playwright Chromium tests pass, including the mobile story.
  Repository-wide formatting now reports the known 32-file baseline.

## 2026-07-18 — Vertical interaction and layer polish

### Decision

Restored native vertical scrolling for the four story frames after interaction
testing showed that horizontal navigation was less discoverable. The Works
carousel now ignores the wheel, claims only a horizontal drag after a small
axis check, and has lower rotational response and momentum. The splash and
project modal each own a higher layer than the fixed chrome; the modal also
declares its own dark UIkit inverse mode. Removed the scanline overlay and the
active CRT screen-border pass.

### Verification

- Checked the splash layering in a live desktop browser session.
- Type-check, lint (0 errors; 54 existing warnings), production build, 86 unit
  tests and all 9 Playwright Chromium tests pass.

## 2026-07-18 — Vertical cinematic narrative

### Decision

Replaced the joystick interaction with a native vertical scroll-snap story
across the four main frames. A TSL `CinematicField` now carries one continuous
line, travelling energy and fluid islands through the 3D scene. Menu uses the
canonical section-5 state as a full-screen desktop/compact mobile top sheet;
the canonical section-0 slot keeps its stable Lab identity internally but now
presents a public Contact finale with Telegram as the primary action. UIkit
continues to own Menu nav expansion and close-button semantics. The remaining
chrome is deliberately lighter: the top bar has no shared glass backing, the
chapter control sits beside Contact, and section footers use an editorial rule
instead of a second floating panel. The app no longer enables CRT scanlines or
the renderer's global screen-border pass. The Works carousel only owns a
horizontal drag, preserving native vertical scrolling and direct card taps.

### Verification

- Visually checked Studio, Services, Menu and Contact at 1440 × 900 and
  390 × 844, including sheet close behavior, story jumps and the shader layer.
- Browser console remained clear. Lint has 0 errors; type-check, production
  build, all 86 unit tests and all 9 Chromium tests pass. The Three bundle is
  332.53 KB gzip, inside its 350 KB budget. Repository-wide formatting still
  reports the known baseline (43 files) tracked by the dedicated backlog item.

## 2026-07-16 — Video-first project presentation

### Decision

Rebuilt the Works route as four responsive editorial compositions on UIkit's
native grid, with asymmetric desktop layouts and two full-width mobile frames.
The fullscreen viewer remains a UIkit full modal but now reserves separate
regions for compact metadata, video and controls; project films autoplay muted
and loop, while a staged 1.45-second reveal makes the transition legible. The
shared placeholder film is used until each project receives its own video.

### Verification

- Visually checked Works and the fullscreen viewer at 1440 × 900 and 390 × 844;
  project-edge spacing is equal to the subpixel on both viewports and autoplay
  is active in the open modal.
- Scoped formatting, lint (0 errors), type-check, production build and all 89
  unit tests pass. The full Chromium suite passed 8 of 9 tests; the unrelated
  secret-accordion test repeatedly timed out while headless GPU startup held
  the page, before its assertions ran.

## 2026-07-16 — Secret-section shader backdrop

### Decision

Removed the Lab `ShaderOrb` and Menu `TimelineNodes` entirely. `EnvSphere`
remains the sole background owner and now adds a single low-frequency
procedural colour field only while either secret section is active. Lab uses a
cool cyan-to-violet wash; Menu uses a midnight indigo-to-plum wash. The layer
fades in and out, respects reduced motion, and refreshes its CanvasTexture at
10 fps only on secret sections, with no particles or render targets.

### Verification

- Confirmed Lab and Menu joystick transitions in Chromium; neither section
  reports a browser runtime error.
- Type-check, lint, production build, 89 unit tests and 9 Chromium E2E tests
  passed.

## 2026-07-16 — Unified secret-section accordions

### Decision

Made the two persistent secret sections one compact pattern at every viewport.
Lab now renders its six existing projects only as a native UIkit Accordion;
Menu uses its native UIkit Nav accordion inline rather than a desktop dropdown.
Both panels are vertically centred within the usable viewport, reserve space
for the fixed top bar and joystick, and remove the nonessential Menu footer
and studio meta copy.

### Verification

- Added a 390 × 844 Chromium regression check for the shared Lab/Menu
  accordion accessibility state.
- Lint (0 errors), type-check, unit tests, production build and 9 Chromium
  E2E tests passed.

## 2026-07-16 — Right-rail section navigator

### Decision

Kept the existing UIkit `uk-dotnav` and moved it into a project-specific,
fixed right rail using UIkit's vertical modifier. Desktop labels mirror the
current page headings so route and language changes do not create a second
navigation dictionary. Mobile keeps the same accessible controls as compact
markers without visible labels.

### Verification

- Checked desktop and 390px layouts in auto/inverse modes; the rail keeps
  contrast and no longer shares the joystick's transformed positioning context.

## 2026-07-16 — WebGPU/WebGL glass and typography parity

### Decision

Removed a duplicate post-processing preset layer that overrode `WorldConfig`
and left WebGPU chromatic aberration active. The 3D words now use a compact,
bundled Comfortaa Bold subset with independently floating glyph meshes. The
cube uses one transparent reflective shell plus a low-frequency CPU-driven
jelly deformation for legibility without duplicated contours. Physical transmission in
the current WebGPU post path samples an incompatible scene-colour target and
turns the cube dark and milky; the shared shell keeps the intended motion and
silhouette consistent on both backends.

### Verification

- Forced WebGPU and WebGL2 captures of the 3D-text section have no RGB fringe,
  runtime errors or material-colour divergence; the cube and individual glyphs
  move between consecutive captures.
- Type-check, lint, production build and the 89-unit-test suite passed.

## 2026-07-16 — Glass-cube backend parity baseline

### Decision

Kept the required WebGL GLSL transmission fallback because the current Three.js
NodeMaterial transmission path calls `getCanvasTarget`, unavailable on
`WebGLRenderer`. Removed its Drei-derived multi-sampling, anisotropic blur and
temporal distortion: those were a second optical model, not a renderer
equivalent. The fallback now uses one restrained sample and the same physical
parameters, PMREM and motion intent as WebGPU.

### Verification

- Type-check, lint and production build passed; the 89-unit-test suite passed.
- A forced-WebGL experiment confirmed the shared TSL transmission path fails
  exactly at the unsupported `getCanvasTarget` call, so it was not retained.

## 2026-07-16 — Splash import boundary and performance budgets

### Decision

Isolated Vite's virtual preload helper into its own runtime chunk. Previously,
the helper shared the 3D Experience chunk and made the HTML preload Three.js,
despite the dynamic import in the splash shell. The shell now preloads only its
1.9 KB gzip startup graph; the lazy app bootstrap owns Three.js delivery.

### Verification

- Production `index.html` preloads only `chunk-runtime`; it has no direct
  Three.js, UIkit or World preload.
- Production build, type-check, unit and Playwright suites passed after the
  change.

## 2026-07-16 — UIkit/YOOtheme composition and CI parity

### Decision

Added a project-owned Quantum Flares palette bridge after the selected
variation, keeping the vendored theme untouched while restoring semantic JLZ
tokens for UIkit and QF effects. Documented the same layer ownership and
licensed-theme adoption workflow for future agents. CI now runs the required
Vitest suite before its production build.

### Verification

- The personal `uikit-yootheme-theme` skill passed its validator.
- Workflow YAML parsed successfully; 89 unit tests passed locally.
- Earlier in this session, lint (0 errors), type-check, production build, 89
  unit tests and 7 Playwright tests passed. Repository-wide Prettier remains a
  separate baseline task.

## 2026-07-15 — Documentation consolidation

### Decision

Replaced overlapping status, naming and completed-plan documents with a small
ownership model: source/tests → rules → architecture → backlog → history.
The documentation now reflects the current topbar, two-column menu,
per-section theme and six SPA routes.

### Verification

- Cross-checked routes, UI composition, theme and renderer fallback against
  the current source.
- `prettier --check` passes for all maintained Markdown documentation.
- Lint passed with 0 errors and 57 warnings; type-check, production build,
  89 unit tests and 7 Playwright Chromium tests passed.
- Repository-wide `bun run format:check` currently reports 63 files, including
  files outside this changeset; it is tracked as a separate formatting task.

## 2026-07-15 — Navigation and renderer lifecycle hardening

### Decision

Bare anchors remain local controls, route hashes survive SPA navigation and the
home carousel initialises idempotently after a deep link. Renderer quality data
is refreshed after the final WebGPU/WebGL backend selection.

### Verification

- Browser-verified `/services → /` and carousel initialization.
- Lint, type-check, build and unit tests passed at the time of the change.

## 2026-07-14 — Rendering parity and audit remediation

### Decision

Prioritised material parity, lifecycle cleanup and event-driven rendering after
a broad audit. Detailed findings are intentionally retained in Git commits,
not duplicated in active documentation.


---
Task ID: CSS-2
Agent: css-cleanup-implementer
Task: Delete dead joystick/scroll-hint/pageLoader CSS + apply 8 UIKit utility-class refactors
Work Log:
- Edited files: src/assets/main.less, src/sections/_shared/constants.ts, src/pages/content/lab.ts, src/pages/content/works.ts, src/pages/content/contact.ts
- LOC removed (net): 280 lines (-298 / +18 across 5 files); main.less alone: -297 lines (2715 -> 2495 after dead-CSS deletion + var migration)
- Block A (Joystick CSS deleted): first cluster (.jlz-joystick layout-only def + .jlz-joystick__base.is-active rules + reduced-motion block containing .jlz-scroll-hint__line::after and .jlz-joystick__ball); second cluster (fixed-position .jlz-joystick def + 8 .jlz-joystick-dotnav* rules + comment + max-width:640px mobile media query containing 8 .jlz-joystick* rules); body[data-page=works] .jlz-joystick-dotnav__label rule; stale "// Keep the centred navigation clear of the persistent joystick." comment in mobile .jlz-menu-container block. Net: every selector containing "joystick" or "scroll-hint" is gone (verified by grep).
- Block B (var migration): 7 references to var(--jlz-joystick-size, 76px) / var(--jlz-joystick-size, 68px) / var(--jlz-joystick-size) inside .jlz-works-stage / .jlz-menu-container / .jlz-menu-grid / [data-lab-overlay] > .uk-container padding/height calc expressions replaced with var(--jlz-bottom-controls, 4.5rem). No --jlz-joystick-size token was defined in _import.less, so nothing to keep there. Existing --jlz-bottom-controls token at _import.less:234 reused as the replacement.
- Block C (verify): grep confirms no .jlz-scroll-hint__line::after, @keyframes jlz-scroll-pulse, or pageLoader references remain in main.less (the non-reduced-motion .jlz-scroll-hint__line::after rule and @keyframes jlz-scroll-pulse had already been deleted in a prior edit; the remaining reduced-motion entry was deleted as part of Block A).
- Refactor 1 (.jlz-service-explore): removed text-transform: uppercase from main.less; added uk-text-uppercase to <a> in serviceExplore() (constants.ts).
- Refactor 2 (.jlz-experiment-footer__mode/__state): removed text-transform: uppercase; added uk-text-uppercase to both <span>s in lab.ts.
- Refactor 3 (.jlz-works-index): removed text-transform: uppercase; added uk-text-uppercase to <header> in works.ts.
- Refactor 4 (.jlz-works-statement__lead): removed text-align: right from base rule; added conditional uk-text-left (for --reverse / --cinematic layouts) or uk-text-right (otherwise) to <span> in works.ts. Also removed text-align: left from the .jlz-works-section--reverse/--cinematic .jlz-works-statement__lead override (kept align-self: flex-start) since uk-text-* utilities are !important in UIKit and would otherwise win anyway. Net visual behaviour preserved.
- Refactor 5 (.jlz-contact-form): removed flex-wrap: wrap; added uk-flex-wrap to <form> in contact.ts.
- Refactor 6 (.jlz-service-desc): removed display: flex + flex-direction: column; added uk-flex uk-flex-column to wrapper div in i18nDesc() (constants.ts).
- Refactor 7 (.jlz-experiment-footer): removed display:flex, flex-wrap:wrap, align-items:center, width:100

---
Task ID: CSS-2
Agent: css-cleanup-implementer
Task: Delete dead joystick/scroll-hint/pageLoader CSS + apply 8 UIKit utility-class refactors
Work Log:
- Edited files: src/assets/main.less, src/sections/_shared/constants.ts, src/pages/content/lab.ts, src/pages/content/works.ts, src/pages/content/contact.ts
- LOC removed (net): 280 lines (-298 / +18 across 5 files). main.less alone: -297 lines (2715 -> 2495) after dead-CSS deletion + var migration.
- Block A (Joystick CSS deleted): first cluster (.jlz-joystick layout-only def + .jlz-joystick__base.is-active rules + reduced-motion block containing .jlz-scroll-hint__line::after and .jlz-joystick__ball); second cluster (fixed-position .jlz-joystick def + 8 .jlz-joystick-dotnav* rules + comment + max-width:640px mobile media query containing 8 .jlz-joystick* rules); body[data-page=works] .jlz-joystick-dotnav__label rule; stale "// Keep the centred navigation clear of the persistent joystick." comment in mobile .jlz-menu-container block. Net: every selector containing "joystick" or "scroll-hint" is gone (verified by grep).
- Block B (var migration): 7 references to var(--jlz-joystick-size, 76px) / var(--jlz-joystick-size, 68px) / var(--jlz-joystick-size) inside .jlz-works-stage / .jlz-menu-container / .jlz-menu-grid / [data-lab-overlay] > .uk-container padding/height calc expressions replaced with var(--jlz-bottom-controls, 4.5rem). No --jlz-joystick-size token was defined in _import.less, so nothing to keep there. Existing --jlz-bottom-controls token at _import.less:234 reused as the replacement.
- Block C (verify): grep confirms no .jlz-scroll-hint__line::after, @keyframes jlz-scroll-pulse, or pageLoader references remain in main.less (the non-reduced-motion .jlz-scroll-hint__line::after rule and @keyframes jlz-scroll-pulse had already been deleted in a prior edit; the remaining reduced-motion entry was deleted as part of Block A).
- Refactor 1 (.jlz-service-explore): removed text-transform: uppercase from main.less; added uk-text-uppercase to <a> in serviceExplore() (constants.ts).
- Refactor 2 (.jlz-experiment-footer__mode/__state): removed text-transform: uppercase; added uk-text-uppercase to both <span>s in lab.ts.
- Refactor 3 (.jlz-works-index): removed text-transform: uppercase; added uk-text-uppercase to <header> in works.ts.
- Refactor 4 (.jlz-works-statement__lead): removed text-align: right from base rule; added conditional uk-text-left (for --reverse / --cinematic layouts) or uk-text-right (otherwise) to <span> in works.ts. Also removed text-align: left from the .jlz-works-section--reverse/--cinematic .jlz-works-statement__lead override (kept align-self: flex-start) since uk-text-* utilities are !important in UIKit and would otherwise win anyway. Net visual behaviour preserved.
- Refactor 5 (.jlz-contact-form): removed flex-wrap: wrap; added uk-flex-wrap to <form> in contact.ts.
- Refactor 6 (.jlz-service-desc): removed display: flex + flex-direction: column; added uk-flex uk-flex-column to wrapper div in i18nDesc() (constants.ts).
- Refactor 7 (.jlz-experiment-footer): removed display:flex, flex-wrap:wrap, align-items:center, width:100%, margin-top:0 (kept gap:0.55rem 0.85rem); added uk-flex uk-flex-wrap uk-flex-middle uk-width-1-1 uk-margin-remove-top to <div> in lab.ts.
- Refactor 8 (.jlz-experiment-footer .jlz-service-explore): deleted the entire non-media-query rule { margin-left: auto }; extended serviceExplore() with an optional extraClass: string = "" 4th parameter and used it to pass uk-margin-auto-left from lab.ts. The existing 3-arg callers (about/template.ts, contact/template.ts, services.ts, manifesto.ts, templates.test.ts) are unchanged because the new parameter defaults to "". The max-width:639px override (.jlz-experiment-footer .jlz-service-explore { width:100%; justify-content:center; margin-left:0 }) was kept intentionally — it contains more than just margin-left:auto and remains visually correct because uk-margin-auto-left is a no-op when width:100% leaves no free margin space.
- ServiceExplore signature change (extraClass parameter) is not a new abstraction; it is a minimal extension to allow the lab.ts call-site to add uk-margin-auto-left without rewriting the markup inline.
- NOTE: contact.ts has 3 manual <a class="jlz-service-explore"> elements (mailto + Telegram + GitHub) that are NOT generated via serviceExplore(). Per the task scope, only serviceExplore() was updated with uk-text-uppercase. Those 3 manual entries will now render in mixed case instead of ALL CAPS. This is consistent with the task instructions (which only mention the serviceExplore() function for Refactor 1) and visually preferable for the email address. If uppercase is desired for the Telegram/GitHub pills, add uk-text-uppercase to those class lists as well.
- Verification (all green): bun run type-check -> 0 errors; bun run lint -> 0 errors, 60 pre-existing warnings (none in edited files); bun run test:unit -> 105/105 tests passed; bun run build -> built in 1.84s, dist emitted.
Stage Summary:
- Deleted 280 net lines of dead/duplicated CSS+markup. Every selector mentioning "joystick" or "scroll-hint" is gone from main.less; padding-bottom / max-height calc expressions that previously reserved space for the deleted joystick now reference the --jlz-bottom-controls token. 8 bespoke CSS property declarations were replaced with UIKit utility classes (uk-text-uppercase, uk-text-right/left, uk-flex-wrap, uk-flex uk-flex-column, uk-flex uk-flex-wrap uk-flex-middle uk-width-1-1 uk-margin-remove-top, uk-margin-auto-left) in the corresponding template files. serviceExplore() gained an optional extraClass parameter to support call-site-specific utility classes. Build, lint, type-check and 105 unit tests all pass.

---
Task ID: DEEP-1
Agent: deep-assets-auditor
Task: Deep audit of all Less files for UIKit unification plan

Work Log:
- Read /home/z/audit/justlovejazz/WORKLOG.md (941 LOC) for prior context
- Read all 5 Less files in full:
  - src/assets/_import.less (511 LOC) — tokens + UIKit overrides + hook mixins + component imports
  - src/assets/_theme.less (6 LOC) — bridge to console-theme/_import.less
  - src/assets/console-theme/_import.less (77 LOC) — global-primary-* + status colors + box-shadows + heading font-sizes + color-mode overrides
  - src/assets/main.less (2486 LOC) — app layer (shell, cursor, fs-overlay, works cards, menu sheet, contact footer, console bar)
  - src/assets/blog.less (352 LOC) — standalone blog index/article CSS
- Read all template/UI TS sources that emit .jlz-* markup:
  - src/sections/_shared/constants.ts (sectionShell, homeTop, contentTop, storyBottom, i18nDesc, descBlock, serviceExplore)
  - src/sections/{intro,about,works,contact,lab-overlay,nav}/template.ts
  - src/pages/home.ts + src/pages/content/{services,works,lab,contact,manifesto}.ts
  - src/UI/{FullscreenOverlay,UIMenu,CinematicNav,WorkCards,UIManager}.ts
- Read markup: index.html (loader CSS only), blog.html + blog/*.html (4 articles)
- Read tests: src/__tests__/{templates,pages,CinematicNav}.test.ts (assert jlz-page, jlz-page-section, jlz-service-desc, jlz-service-explore, jlz-desc, jlz-section-bottom, jlz-work-card)
- Patterns verified via rg:
  - 130 distinct .jlz-* classes defined across main.less + blog.less
  - 182 distinct jlz-* tokens in markup (some are CSS vars like --jlz-color-accent, some are loader classes styled inline in index.html)
  - Cross-diff: 1 truly dead CSS class (.jlz-visually-hidden, main.less:67-77), 1 dead blog.less selector group (.uk-card-title, lines 26-44 — never used in any blog HTML)
  - 3 dynamically-constructed modifier classes verified live via template literals: jlz-works-composition--${layout}, jlz-works-section--${layout}, jlz-work-card--${prominence}
  - Verified UIKit base.less provides universal `box-sizing: border-box` (line 275) + `body { margin: 0 }` (line 116) — main.less duplicates these at lines 16-18 and 37
  - Verified UIKit base.less heading rules (line 335-352) apply @base-heading-font-family + @base-heading-text-transform + .hook-base-heading() — main.less:44-65 duplicates these
  - Verified UIKit .uk-button is `display: inline-block` (button.less line 119), not inline-flex — so JLZ `display: inline-flex; align-items; gap` overrides on .jlz-service-explore/.jlz-menu-launcher/.jlz-contact-launcher__button are bespoke, not duplicate

Stage Summary:

Executive summary — total LOC reducible: 235-290 LOC (~9-12% of 3432 LOC across the 5 files).

Stage 1 — Dead CSS + base resets (zero-risk, ~50-65 LOC, main.less only)
- Delete .jlz-visually-hidden (main.less:67-77, 11 LOC — no markup use)
- Delete `* { box-sizing: border-box }` (main.less:16-18, 3 LOC — UIKit base.less:275 provides it)
- Delete `body { margin: 0 }` (main.less:37 — UIKit base.less:116 provides it)
- Trim body{background,color,-webkit-font-smoothing,-moz-osx-font-smoothing} to just the font-smoothing pair (UIKit base sets background via @global-background, color via @global-color)
- Delete `font-family: var(--jlz-font-body), serif !important` from html,body (main.less:33) — UIKit base sets html{font-family: @global-font-family}, already mapped to @jlz-font-display in _import.less:279
- Convert h1..h6 + .uk-h* + .uk-heading-* selector (main.less:44-65, 22 LOC) into 2 UIKit variable overrides in console-theme/_import.less: @base-heading-text-transform: uppercase; @base-heading-letter-spacing: -0.03em (delete font-family: inherit — already inherited via @global-font-family)
- Delete .jlz-sheet-close { color: inherit } (main.less:1719-1721, 3 LOC) — @close-color: @jlz-color-text in _import.less:353 already covers it
- Trim .jlz-fs-close (main.less:450-453) to just `z-index: 6` — color: var(--jlz-color-text) is already @close-color
- Trim .jlz-fs-overlay .jlz-fs-title/.jlz-fs-close/.jlz-fs-prev/.jlz-fs-next/.jlz-fs-big-play/.jlz-fs-controls .uk-button color: var(--jlz-color-text) rule (main.less:236-243, 8 LOC) — these inherit from .jlz-fs-overlay color: var(--jlz-color-text) already set on line 232; child `color: inherit` is automatic
- Delete blog.less .uk-card-title rules (blog.less:26-44, ~17 LOC) — no .uk-card markup exists in any blog HTML
- Tests: templates.test.ts must keep asserting jlz-page/jlz-page-section/jlz-section-bottom/jlz-service-desc/jlz-service-explore/jlz-desc/jlz-work-card (these classes are NOT being renamed)

Stage 2 — Topbar/launcher/console-bar UIKit utility consolidation (low-risk markup swap, ~40-55 LOC)
- main.less: .jlz-topbar (1462-1474) — markup already has uk-flex uk-flex-middle uk-flex-between; delete redundant `display: flex; align-items: center; justify-content: space-between` from CSS, keep position/padding/pointer-events
- main.less: .jlz-topbar-controls (1476-1481) — markup already has uk-flex uk-flex-middle; delete display/align-items, keep pointer-events: auto + gap
- main.less: .jlz-menu-launcher (1509-1519) — markup already has uk-button uk-button-default; delete duplicated display/align-items/gap (move to .hook-button-default() in _import.less if all default buttons should be flex), keep min-height/padding overrides + bespoke border-color/background
- main.less: .jlz-contact-launcher__button (1621-1632) — markup has uk-button uk-button-primary; delete duplicated display/align-items, keep min-height/gap/padding. Move border-color override to .hook-button-primary() (already partial)
- main.less: .jlz-storyline__items (1565-1569) — markup has no uk-flex class; add `uk-flex uk-flex-middle` to markup (CinematicNav.ts:57) and delete `display: flex; align-items: center` from CSS
- main.less: .jlz-menu-sheet__header (1711-1717) — markup has uk-flex uk-flex-middle uk-flex-between; CSS only sets margin-bottom + color/font/letter-spacing/text-transform — keep (these are bespoke typography)
- main.less: .jlz-experiment-footer (already markup-complete) — verify no CSS duplication
- main.less: .jlz-contact-form (684-686) — markup has uk-flex uk-flex-wrap uk-flex-center uk-flex-middle; CSS only sets `gap: var(--jlz-space-2)`. Keep (UIKit has no flex-gap utility for arbitrary gap)
- main.less: .jlz-service-desc (688-692) — markup has uk-flex uk-flex-column; CSS sets `gap; max-width; margin: 0`. Keep bespoke gap + max-width
- main.less: .jlz-flex-gap-small (750-752) — used once in contact.ts:26; only sets `gap: 0.5rem`. Either keep (3 LOC) or replace markup with uk-grid-small (would need restructuring). Recommend keep.

Stage 3 — Works cards + 3D plane handoff (low-risk cleanup, ~30-45 LOC)
Most of .jlz-works-* and .jlz-work-card__* is bespoke 3D composition. Targeted cleanups:
- main.less: .jlz-works-composition > * (866-869) and > * > * (871-873) — delete `display: flex` line (markup uses uk-grid uk-grid-small which provides display: flex on the grid container; the > * selector forces display:flex on children which conflicts with uk-grid item layout). Verify visually.
- main.less: .jlz-work-card (880-893) — bespoke (perspective, cursor, tap-highlight). Keep.
- main.less: .jlz-work-card__overlay (1010-1020) — markup has uk-position-bottom; delete `display: flex; align-items: flex-end; justify-content: space-between` from CSS (or keep — they may differ from uk-position-bottom defaults). Verify with screenshot diff.
- main.less: .jlz-works-slider-controls (1436-1445) — markup is bare; add uk-flex uk-flex-middle uk-flex-between to markup OR keep bespoke. Recommend keep (position: absolute inset:0 with internal padding is bespoke).
- main.less: .jlz-works-index (778-787) — markup already has uk-flex uk-flex-middle uk-flex-between uk-text-uppercase; CSS still sets display/align/justify (redundant). Delete the duplicated flex props.
- Keep all body[data-page='works'] .jlz-work-card__* overrides — these are required for the 3D plane-origin handoff.

Stage 4 — Menu sheet + contact footer + cinematic shell (low-to-moderate risk, ~50-70 LOC)
- main.less: .jlz-menu-overlay (1647-1667) and body[data-cinematic-sheet='menu'] rules — bespoke (visibility/transform/opacity transitions). Keep.
- main.less: .jlz-menu-grid (2125-2138) — bespoke grid layout. Keep.
- main.less: .jlz-menu-nav (2188-2194) — markup has uk-nav uk-nav-default; CSS sets `list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column`. UIKit .uk-nav already provides all of these. Delete the rule entirely (8 LOC).
- main.less: .jlz-menu-nav__subs (2271-2277) — markup has uk-nav-sub; CSS sets list-style/margin/padding/flex-direction/gap. UIKit .uk-nav-sub provides list-style/margin/padding/flex-direction. Delete the duplicates, keep only `gap: 0.125rem`.
- main.less: .jlz-menu-nav__item (2196-2199) — bespoke `border-bottom + position: relative`. Keep.
- main.less: .jlz-menu-nav__toggle (2201-2217) — bespoke toggle styles. Keep.
- main.less: .jlz-menu-stat (2163-2167) — flex column; could become uk-flex uk-flex-column in markup (template.ts:250). Optional.
- main.less: .jlz-contact-footer__actions (1827-1832) — markup is bare; could add uk-flex uk-flex-middle to template.ts:21. Optional.
- main.less: .jlz-storyline__item (1571-1585) — bespoke button styling (compact nav dot). Keep.

Stage 5 — blog.less polish (zero-to-low risk, ~20-30 LOC)
- blog.less:26-44 — delete dead .uk-card-title selector group (no .uk-card in any blog HTML). Keep .jlz-blog-brand + .jlz-landing-eyebrow font-variation-settings transition (lines 26-31 minus .uk-card-title selector).
- blog.less:47-67 — .skip-link is bespoke WCAG pattern (UIKit has no equivalent). Keep.
- blog.less:70-88 — .jlz-reading-progress is bespoke (fixed scaleX progress bar). Keep.
- blog.less:92-117 — prism code block overrides are bespoke (Prism theme integration). Keep.
- blog.less:119-152 — .jlz-blog-header + .jlz-blog-brand + .jlz-blog-header .uk-navbar-nav rules: markup has uk-navbar-transparent + uk-navbar-nav; CSS adds bespoke font-weight/letter-spacing. Some duplication with UIKit navbar variables. Could move font-size: 0.72rem + font-weight: 500 + letter-spacing: 0.1em + text-transform: uppercase to @navbar-nav-item-* variables in _import.less (already partially done: @navbar-nav-item-font-size: 0.875rem at line 341 — override to 0.72rem). Risk: affects all navbars app-wide; only the blog has a navbar, so safe.
- blog.less:155-333 — .jlz-journal-* editorial layout. Bespoke. Keep.
- blog.less:336-350 — .jlz-blog-footer is bespoke minimal footer. Keep.

Risk Assessment:
- Zero-risk (delete without verification): .jlz-visually-hidden, *{box-sizing}, body{margin:0}, .jlz-sheet-close{color:inherit}, blog.less .uk-card-title rules, .jlz-menu-nav{list-style/margin/padding/display/flex-direction}
- Zero-risk (delete with screenshot diff): h1..h6 selector → @base-heading-* variable migration, .jlz-fs-overlay color: var(--jlz-color-text) child rule
- Low-risk (markup swap, screenshot diff per page): .jlz-storyline__items, .jlz-works-index — add uk-flex utilities to markup, delete duplicated flex props from CSS
- Low-to-moderate risk (variable migration, screenshot diff): .jlz-blog-header .uk-navbar-nav > li > a → @navbar-nav-item-font-size override; .jlz-menu-launcher/.jlz-contact-launcher__button → .hook-button-default/-primary() additions
- Moderate-risk (markup restructure): .jlz-works-composition > * deletion (may affect uk-grid child layout), .jlz-work-card__overlay flex deletion (may affect uk-position-bottom defaults)

Verification gate per stage: `bun run type-check && bun run lint && bun run test:unit && bun run build` + manual screenshot diff on home, /works, /services, /manifesto, /lab, /contact, /blog.
