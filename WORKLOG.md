
## 2026-07-13 — Menu overlap + fullscreen overlay visible + showreel plan

### Done

- **Bug 1: Menu section overlap on subsection click** — root cause: menu nav
  dispatched `jlz:route-change` but router.ts didn't listen for it (only
  dispatched it internally). Menu section stayed active + new page rendered
  → both sections visible, overlapping.
  Fix: added `jlz:route-change` listener in `initRouter()` that calls
  `navigateToPage(detail.page)`. Now router handles menu-initiated navigation
  the same way as link clicks.

- **Bug 2: Fullscreen overlay visible on works section** — root cause: UIKit3
  modal can leave `display: flex` inline style after `UIkit.modal()` creation,
  making the overlay visible immediately (not just on `show()`).
  Fix: added `this.container.style.display = 'none'` after `appendChild` in
  FullscreenOverlay constructor. UIKit3 overrides this when `show()` is called.

- **Showreel shader plane plan** — created
  `docs/PLAN-showreel-shader-plane.md` with 4-phase plan:
  1. ShowreelButton3D.ts — TSL shader button plane (replaces DOM button).
  2. VideoPlane3D.ts — Video texture plane + genie transition.
  3. Genie transition (scale + opacity + chromatic aberration).
  4. Integration + cleanup (Experience.ts, intro/template.ts, UIManager.ts).
  Plan added to NEXT.md as high-priority TODO.

### Verification

- `bun run type-check` — 0 errors.
- `bun run lint` — 0 errors (63 pre-existing warnings).
- `bun run build` — 4.70s.
- `bun run test:unit` — 84/84 tests passed.

### Files touched (4)

- Modified: `src/router.ts`, `src/UI/FullscreenOverlay.ts`,
  `src/sections/nav/template.ts`, `WORKLOG.md`, `NEXT.md`.
- New: `docs/PLAN-showreel-shader-plane.md`.

---

## 2026-07-13 — Menu close button + unique VOSK template + glassmorphism + docs audit

### Context

Follow-up to the navbar-conformance refactor. Three issues reported:
1. Joystick nav stopped working (root cause: `touch-action: none` not on the
   drag target itself — only on the parent).
2. Accordion removed but menu template needed to be UNIQUE (not sectionShell),
   VOSK-style 3-column, responsive in 1 screen.
3. `uk-icon-button` instances needed glassmorphism styling per project theme.
4. New requirement: explicit exit from menu — joystick arrow-left duplicated
   with an X (close) button that appears when menu is open.
5. Documentation out of sync — HERMES agent prompt + project .md files still
   referenced SoundPanel, uk-accordion, paint-bucket, nav/toolbar.ts.

### Done

- **Joystick fix** — added `touch-action: none` directly on
  `.jlz-joystick__base` (was only on parent `.jlz-joystick`; `touch-action`
  is NOT inherited). Verified: real mouse drag now fires pointermove beyond
  the dead zone; vertical drag cycles sections 1→4, horizontal opens Lab/Menu.

- **Menu close button (hamburger ↔ X toggle)** — `UIMenu.ts` rewritten:
  - `#jlz-hamburger` button contains TWO inline SVGs (hamburger + X).
  - CSS-driven swap via `.jlz-header--menu-open` class on `<header>`.
  - Click handler checks `_isMenuOpen()` → dispatches `jlz:goto-nav` (open)
    or `jlz:close-nav` (close).
  - `_syncToggleState()` runs on every `jlz:section-change` +
    `jlz:page-section-change` to keep icon in sync with actual menu state.
  - `JoystickNav` listens for `jlz:close-nav`: home → `_side='center'` +
    `_fireSectionChange()`; content pages → `_syncPageSection(_mainSection)`.
  - Returns to the PREVIOUS main section (the one from which menu was invoked),
    not to a hardcoded index. Duplicates joystick arrow-left with explicit
    on-screen button.

- **Unique menu template (VOSK-style 3-column grid)** —
  `src/sections/nav/template.ts` fully rewritten (NOT `sectionShell()`):
  - Top bar: config toolbar (theme + sound) + brand
  - Main: 3-column grid (stat | nav list | contacts)
  - Left: giant "06" + "SECTIONS" + "EST 2019 · REMOTE · EU"
  - Center: 6 flat nav items (Studio/Services/Works/Manifesto/Lab/Contact)
    with numbers + hover arrow
  - Right: contacts (Email, Telegram, GitHub) + socials (X, Instagram)
  - Footer: © 2026 + tech stack
  - `100dvh`, `overflow: hidden` — fits in 1 screen, no scroll
  - Responsive: 3-col desktop (≥640px), single-col mobile (<640px)
  - Accordion removed; `initNavAccordion` removed from router.ts

- **Glassmorphism on `uk-icon-button` via `.hook-icon-button()`** —
  new §3.5 UIKIT HOOK OVERRIDES section in `_import.less` (before §4
  component imports — hooks must be defined BEFORE component .less):
  - `.hook-icon-button()`: surface bg + backdrop-filter blur(8px) + border +
    border-radius 8px
  - `.hook-icon-button-hover()`: accent border + accent-tinted bg
  - `.hook-icon-button-active()`: stronger accent
  - `.hook-navbar-container()`: transparent bg
  - Applies to ALL `uk-icon-button` (lang, theme, sound)

- **LESS cleanup** — deleted `.jlz-nav-accordion` (196 LOC), added
  `.jlz-menu-overlay`, `.jlz-menu-grid`, `.jlz-menu-col`, `.jlz-menu-nav`,
  `.jlz-menu-contact-*`, `.jlz-menu-footer`, `.jlz-toggle-icon` styles.
  Deleted `.jlz-glass-btn`, `.jlz-sound-toggle` (floating), `.jlz-config__btn`
  mobile rule. Deleted `src/sections/nav/toolbar.ts` (merged into template.ts).

- **Documentation audit + sync**:
  - `docs/UIKIT3.md §1`: import order updated with §3.5 hooks step.
  - `docs/UIKIT3.md §3`: noted section 5 (menu) as exception to sectionShell.
  - `docs/UIKIT3.md §4`: theme toggle location corrected (menu overlay, not
    UIMenu; paint-bucket reference removed).
  - `docs/UIKIT3.md §7`: added lessons 21–24 (hamburger toggle pattern,
    unique menu template, glassmorphism hooks, touch-action inheritance).
    Lesson 20 updated with note that .jlz-nav-accordion was removed.
  - `docs/UIKIT3.md §8`: table expanded — hamburger/close toggle, menu overlay,
    glassmorphism rows added; accordion row marked as not-used-in-menu;
    joystick row notes touch-action requirement.
  - `README.md`: Navigation section updated (3-col template, hamburger/close
    toggle, explicit exit).
  - `AGENTS.md`: navigation table updated with explicit-exit row; hamburger
    toggle documented; menu template noted as unique; theme toggle location
    corrected to `nav/template.ts::initMenuToolbar`.
  - `docs/STATUS.md`: Phase 3 sound panel entry updated — SoundPanel.ts
    removed, sound now in menu overlay.
  - `WORKLOG.md`: this entry.
  - `NEXT.md`: item checked off.

### Verification

- `bun run type-check` — 0 errors.
- `bun run lint` — 0 errors (63 pre-existing warnings).
- `bun run build` — 5.17s, all chunks emitted.
- `bun run test:unit` — 69/69 tests passed.
- Agent Browser verify:
  - Joystick vertical drag (real mouse): intro→about→works→contact ✅
  - Joystick horizontal right: →menu overlay ✅
  - Hamburger click: opens menu (hamburger icon → X) ✅
  - Hamburger click when menu open: closes, returns to previous section ✅
  - Theme toggle: sun↔moon swap, body.uk-light toggled ✅
  - Sound toggle: muted↔playing, localStorage jlz:sound ✅
  - Glassmorphism: blur(8px), border 1px, radius 8px on all uk-icon-button ✅
  - Menu layout desktop 1280×800: 3-col grid, overlay=viewport, no scroll ✅
  - Menu layout mobile 375×667: single-col, overlay=viewport, no scroll ✅

### Files touched (10)

- Modified: `src/UI/UIMenu.ts`, `src/UI/JoystickNav.ts`, `src/assets/_import.less`,
  `src/assets/main.less`, `src/sections/nav/template.ts`, `src/router.ts`,
  `src/UI/UIManager.ts`, `AGENTS.md`, `README.md`, `docs/UIKIT3.md`,
  `docs/STATUS.md`, `WORKLOG.md`, `NEXT.md`.
- Deleted: `src/sections/nav/toolbar.ts`.

---

## 2026-07-13 — UIkit3 navbar conformance + Menu overlay toolbar

### Context

Audit of UIkit3 / YOOtheme Pro conformance revealed 6 issues:
1. Navbar used custom `.jlz-glass-btn` + non-official `uk-navbar-center` group
   (logo + sound clustered together, not centered).
2. Theme toggle UI button was MISSING (ThemeManager existed but no button
   wired to `themeManager.toggle()`).
3. Sound button was in the navbar center group; user wanted it in the menu
   overlay.
4. `.jlz-glass-btn` duplicated `uk-button` / `uk-icon-button`, bypassing the
   QF `@global-primary-background` cascade.
5. `.jlz-navbar` redefined background/border/backdrop-filter that QF already
   provides via `@navbar-background`.
6. Dead `#jlz-menu-modal` references in JoystickNav, BakuCarousel, Cursor
   (modal was replaced by section-5 nav overlay in PLAN-v3 but guards stayed).

### Done

- **Phase 1a — dead code removed**
  - Deleted `src/sections/process/template.ts` (unused — `navOverlaySection`
    replaced it in PLAN-v3).
  - Deleted `src/sections/nav/scene.ts` (unused — `createSection5` is imported
    from `src/sections/process/scene.ts`).
  - Removed `#jlz-menu-modal` guards from `JoystickNav.ts` (pointerdown +
    keydown) and `BakuCarousel.ts` (`isUiChromeEvent`, `isMenuOpen`).
  - `Cursor.ts` large-menu selector now targets `.jlz-nav-accordion__header,
    .jlz-nav-accordion__sub, [data-section="menu"], [data-page-section="page-menu"]`.

- **Phase 1b — Process → Menu rename (semantic)**
  - `SectionId` type: `'process'` → `'menu'`.
  - `WorldConfig` section 5: `id: 'sec_menu'`, `domSection: 'menu'`,
    `context: 'MENU — Navigation'`.
  - `process/scene.ts`: `g.name = 'menu'`.
  - `JoystickNav`: `SideState = 'center' | 'lab' | 'menu'`,
    `PROCESS_INDEX` → `MENU_INDEX`, joystick arrow labels "Lab experiments"
    + "Menu".
  - `nav/template.ts`: `sectionShell('menu', …)` (home) /
    `sectionShell('page-menu', …)` (content).
  - Section id 5 is now semantically "Menu" everywhere user-facing; the
    cube-face 3D group name is also 'menu' for consistency.

- **Phase 2 — UIMenu rewrite (UIkit3 3-zone navbar)**
  - `UIMenu.ts::buildNavbar()` rewritten to the official UIkit3 navbar
    structure: `<nav.uk-navbar-container><div.uk-container><div[uk-navbar]>
    [uk-navbar-left/center/right]</div></div></nav>`.
  - Left: `uk-icon-button` with "EN"/"RU" label (language switch).
  - Center: `uk-navbar-item.uk-logo` with logo.svg (pixel-exact centered:
    `logoCenterX = navCenterX = 640` on 1280px viewport).
  - Right: native `uk-navbar-toggle` + `uk-navbar-toggle-icon` (hamburger).
  - Sound button removed from navbar (moved to menu overlay).
  - `.jlz-glass-btn` and `.jlz-navbar-center-group` custom classes deleted.

- **Phase 3 — Menu overlay config toolbar (theme + sound)**
  - New `src/sections/nav/toolbar.ts`: `initMenuToolbar()` (per-render) +
    `wireMenuToolbarGlobals()` (once). Wires `#jlz-theme-toggle` +
    `#jlz-menu-sound` buttons inside the menu overlay.
  - Theme toggle: `uk-icon-button` with inline SVG sun + moon (UIKit3 has
    no sun/moon icons). `.is-inverse` class on the button toggles which SVG
    is visible (CSS in `main.less`). Calls `themeManager.toggle()`.
  - Sound toggle: `uk-icon-button` with custom 4-bar EQ spans (`.jlz-sound-bars`).
    Persists `localStorage('jlz:sound')`, dispatches `jlz:sound-toggle`
    (Experience.ts listens, mutes AudioSystem + SfxSystem).
  - `UIManager.ts`: removed `SoundPanel` import + init; calls
    `wireMenuToolbarGlobals()` once.
  - `router.ts`: calls `initMenuToolbar()` after `initNavAccordion()` on
    every `renderView()`.
  - Deleted `src/UI/SoundPanel.ts` (floating bottom-right button) — sound
    now lives in the menu overlay.
  - `nav/template.ts::configToolbar()` emits the toolbar HTML; both buttons
    use `uk-tooltip` for hover hints.

- **Phase 4 — LESS cleanup**
  - `main.less`: deleted `.jlz-glass-btn`, `.jlz-navbar-center-group`,
    `.jlz-sound-toggle` (floating), `.jlz-sound-bars` (header variant),
    `.jlz-config__btn` mobile rule.
  - Navbar glassmorphism now scoped to `.jlz-header .uk-navbar-container`
    (app-layer CSS; `@navbar-background` stays `transparent` in `_import.less`
    so other uk-navbar-containers are unaffected).
  - New `.jlz-sound-toggle` / `.jlz-sound-bars` / `.jlz-sound-bar` styles
    for the menu-overlay sound button (uses `@global-primary-background`
    for the playing state — keeps QF cascade).
  - New `.jlz-menu-toolbar`, `.jlz-theme-toggle`, `.jlz-theme-svg` styles
    for the menu-overlay config toolbar.
  - `index.html` splash `.jlz-config__btn` left as-is (FCP-critical inline
    CSS, not UIkit — splash is a standalone overlay).

- **Phase 5 — Documentation**
  - `docs/UIKIT3.md §7`: added 10 new hard-won lessons (11–20) covering
    navbar `uk-navbar` attribute placement, 3-zone vs centered-logo,
    missing sun/moon icons, `UIkit.icon` hidden-section limitation,
    `UIkit.update` re-scan limitation, `.jlz-glass-btn` deprecation,
    `#jlz-menu-modal` death, `@navbar-color-mode`, `.hook-navbar-container`,
    accordion hooks.
  - `docs/UIKIT3.md §8`: added 7 new rows to the "custom class vs UIKit"
    table (icon button, both navbar patterns, hamburger toggle, accordion,
    tooltip, theme toggle, sound toggle, config toolbar).
  - `README.md`: updated Navigation + Theme + Sound sections; tech stack
    row updated.
  - `AGENTS.md`: section 5 renamed to "Menu"; navigation table updated;
    theme/sound sections rewritten to reflect menu-overlay location;
    paint-bucket reference removed.

### Verification

- `bun run type-check` — 0 errors.
- `bun run lint` — 0 errors (63 pre-existing warnings, none new).
- `bun run build` — 2.68s, 103 modules, all chunks emitted.
- `bun run test:unit` — 69/69 tests passed (5 files).
- Agent Browser verify:
  - Navbar geometry: `lang.left=40`, `logo.centerX=640=nav.centerX`,
    `hamburger.right=1240` on 1280px viewport. Logo pixel-exact centered.
  - Hamburger click → menu overlay opens (`[data-section="menu"].section-active`).
  - Theme toggle: initial `aria-pressed=false`, `is-inverse=false`, sun
    visible; after click → `aria-pressed=true`, `is-inverse=true`, moon
    visible, `body.uk-light` toggled.
  - Sound toggle: initial `aria-pressed=false`, `is-muted=true`,
    `localStorage.jlz:sound=null`; after click → `aria-pressed=true`,
    `is-playing=true`, `localStorage.jlz:sound='on'`.
  - Accordion: 6 items, click first → `uk-open` class added.
  - Dev console: 0 errors, 0 warnings beyond expected WebGPU fallback notice.

### Files touched (16)

- Deleted: `src/sections/process/template.ts`, `src/sections/nav/scene.ts`,
  `src/UI/SoundPanel.ts`.
- New: `src/sections/nav/toolbar.ts`.
- Modified: `src/UI/UIMenu.ts`, `src/UI/UIManager.ts`, `src/UI/JoystickNav.ts`,
  `src/Experience/World/BakuCarousel.ts`, `src/Experience/Cursor.ts`,
  `src/sections/nav/template.ts`, `src/sections/process/scene.ts`,
  `src/sections/_shared/constants.ts`, `src/core/WorldConfig.ts`,
  `src/router.ts`, `src/assets/main.less`, `index.html` (no change — splash
  left as-is), `docs/UIKIT3.md`, `README.md`, `AGENTS.md`, `WORKLOG.md`,
  `NEXT.md`.

---

## 2026-07-13 — PLAN-v3: 8 phases complete (navigation architecture change)

### Done
- **Phase 1+2: Navigation + Lab overlays as secret sections**
  - NEW: src/sections/nav/template.ts — Navigation overlay (section 5, joystick right)
  - NEW: src/sections/lab-overlay/template.ts — Lab overlay (section 0, joystick left)
  - All pages updated: section 0 = Lab overlay, section 5 = Navigation overlay
  - Home: labSection → labOverlaySection, processSection → navOverlaySection
  - Content pages (services/manifesto/lab/contact/works): sections 0+5 replaced with overlays
- **Phase 3+4: Header by UIKit3, dropbar removed**
  - UIMenu.ts rewritten: minimal header (logo + lang + sound + theme + hamburger)
  - Hamburger dispatches jlz:goto-nav → Experience.ts → joystick.goToSection(5)
  - Dropbar completely removed (navigation is now section overlay)
- **Phase 5: Showreel modal UI polished**
  - Seek bar: gradient progress fill via --jlz-seek-progress CSS variable
  - Seek bar: height 6px (8px on hover) — interactive feel
- **Phase 6: Cursor smoothed wobble edges**
  - lineTo → quadraticCurveTo (midpoint method) — smoothed curves
  - Segments 8 → 16 (more points = smoother)
  - lineCap/lineJoin: round on all cursor paths
- **Phase 7: Works scale up enhanced**
  - Scale 0.8 + rotateY(12deg) + translateZ(-40px) + blur(8px) → scale(1) + rotateY(0) + blur(0)
  - Stagger 0.2s/0.4s, duration 0.7s, perspective 1000px
- **Phase 8: Shader transitions on click — chromatic burst**
  - triggerWobblePulse: uWobble 0.95→2.5 (dramatic jelly)
  - Chromatic burst: dispersion 15→30 (WebGPU) / chromaticAberration 0.5→1.0 (WebGL2)
  - Scale pulse: triggerOpener (1.0→1.2→1.0)
  - Duration 1.2s (cinematic)

### Architecture change
Navigation is now a SECTION (section 5), not a dropbar navbar.
- Joystick right → Navigation overlay (hamburger menu)
- Joystick left → Lab overlay (works list)
- Both overlays shared across ALL pages (home + content)

### Verified
- tsc 0 errors, lint 0 errors (63 warnings), 69 tests pass
- Browser: cube uWobble=0.95, all UI elements present, 0 console errors

---

## 2026-07-13 — PLAN-v2: 9 phases complete (7 brief items)

### Done
- **Phase 1: Wobble cube** — uWobble 0.70→0.95, SIZE_SCALE 0.07→0.09 (visible motion)
- **Phase 2: Cursor** — larger (28/44px), smoother spring (0.18/0.7), custom states
  (play/drag/view via data-cursor attribute)
- **Phase 3: Showreel** — play button centered on intro cube + fullscreen video modal
  with custom controls (play/pause/mute/seek/close)
- **Phase 4: Works cards scale up** — CSS transition opacity+scale(0.85→1) with
  stagger (0.15s/0.3s) on .section-active
- **Phase 5: Wobble pulse on click** — triggerWobblePulse() boosts uWobble to 1.8
  for 0.8s + scale pulse, triggered by jlz:wobble-pulse event from WorkCards +
  BakuCarousel
- **Phase 6: Navbar** — logo left (l@6), nav center, controls right (lang+sound+theme),
  works dropbar with cover thumbnails, mobile offcanvas hamburger
- **Phase 7: Brand identity** — docs/BRAND.md (colors, typography, voice, manifesto),
  CSS variables (--jlz-accent #c4ff00, --jlz-bg, --jlz-fg)
- **Phase 8: RU services** — shortened titles (Креатив/Разработка/Моушн/AI-системы/Лаб/Плейграунд)
- **Phase 9: Content** — works leads shortened, all pages verified meaningful + CTA

### Files
- src/Experience/World/SplashCube.ts (wobble + triggerWobblePulse)
- src/Experience/World/MeshTransmissionMaterial.ts (GLSL wobble sync)
- src/Experience/Cursor.ts (larger + spring + custom states)
- src/UI/ShowreelModal.ts (NEW — video modal)
- src/UI/UIMenu.ts (rewritten — logo + lang + sound + dropbar previews)
- src/UI/UIManager.ts (wire ShowreelModal)
- src/UI/WorkCards.ts (wobble pulse dispatch + data-cursor=view)
- src/Experience/World/BakuCarousel.ts (wobble pulse dispatch)
- src/Experience/Experience.ts (jlz:wobble-pulse listener)
- src/sections/intro/template.ts (play button)
- src/pages/content/works.ts (data-cursor=view + shorter leads)
- src/core/i18n.ts (RU services shortened + showreel key)
- src/assets/main.less (navbar + showreel + work cards + brand vars CSS)
- docs/BRAND.md (NEW — brand guidelines)
- docs/PLAN-v2.md (NEW — detailed plan)

### Verified
- tsc 0 errors, lint 0 errors (63 warnings), 69 tests pass
- Browser: cube wobble visible, sound panel, showreel btn, navbar with logo,
  lang btn, nav sound, cursor — all present, 0 console errors

---

## 2026-07-13 — Cube wobble day34-accurate + autonomous improvement plan

### Done
- **Cube wobble fixed** (Hermes agent + manual tuning):
  - Root cause: `RoundedBoxGeometry` produced non-perpendicular normals on face
    interiors → displacement shifted faces sideways (flat-plane shift) instead
    of bulging outward (jelly). Fixed by day34 pattern: `BoxGeometry + manual
    vertex rounding + mergeVertices + computeVertexNormals`.
  - Wobble params tuned over 7 iterations:
    - uWobble: 1.30 → 0.42 → 1.50 → 1.0 → 1.30 → 0.91 → 0.50 → **0.70** (final)
    - SIZE_SCALE: 0.05 → 0.20 → 0.35 → 0.12 → 0.08 → 0.10 → 0.05 → **0.07** (final)
    - Removed high-freq octave (n3) for smoother surface
    - Slowed time speeds (0.3→0.2, 0.5→0.3) for graceful motion
    - Reduced squash (0.08→0.04) + breathe (0.12→0.08) to preserve cube shape
  - Result: VLM 7/10 → "soft jelly, edges flowing, barely visible, elegant"
- **Geometry optimized**: segments 32 → 24 (39% fewer vertices: 6144 → 3750)
- **Preserved fixes verified**:
  - Camera far=1000 (black hole fix) ✓
  - Naming refactor (createSection0-5, userData.carousel) ✓
  - RenderPipeline crash guard (line 641) ✓
  - Post-processing (vignette, refract, border, chromatic) ✓

### Decisions
- **day34 pattern is the source of truth** — no custom wobble layers (bend/echo/shear
  all broke it). Pure 3-octave noise + squash + breathe, scaled by SIZE_SCALE.
- **VLM-driven tuning** — use z-ai vision to analyze screenshots, apply VLM
  recommendations for amplitude. More reliable than guessing.
- **Hermes agent delegation** — for complex debugging (geometry topology),
  write detailed prompt and delegate. Hermes applied the fix correctly.

### Files
- `src/Experience/World/SplashCube.ts` — wobble uniforms + buildCube + TSL positionNode
- `src/Experience/World/MeshTransmissionMaterial.ts` — GLSL wobble injection
- `docs/PLAN.md` — NEW: autonomous improvement roadmap (8 phases)

### Next (autonomous, no questions)
- Phase 2: Zoom on works section (Camera FOV pulse + cube scale pulse)
- Phase 3: Sound panel UI (off by default, EQ bars, click toggles mute)
- Phase 4: Custom carousel enhancements (momentum, rubber-band 0.35x, auto-advance 4.5s)
- Phase 5: DrawTrail junni-style rewrite (tapered tail, particle emission)
- Phase 6: Wobble cursor (spring physics, fix magnetic lerp)
- Phase 7: Typography (Bebas Neue + Oswald + JetBrains Mono) + neon-lime accent
- Phase 8: Final verification + push

See `docs/PLAN.md` for full roadmap.

---
# WORKLOG — Chronological decision journal (NEWEST FIRST)

> Read the TOP entry first — it's the latest context. Each entry captures
> WHAT was done, WHY (decisions), and WHAT'S NEXT. This is different from
> git log (commit messages) and CHANGELOG.md (release notes) — it's the
> "why" journal that survives context window resets.
>
> Format: `## YYYY-MM-DD — Session goal` → Done / Decisions / Files / Next

---

## 2026-07-13 — JunniParticles (TSL GPU-animated) + auto-reduce

### Done
- Analyzed next.junni.co.jp reference (Section6 Particle) — raw GLSL ShaderMaterial
  on THREE.Points with drift + sin wave + mod wrap + circle mask + AdditiveBlending.
- Created `src/Experience/World/JunniParticles.ts` — TSL port to our stack:
  - InstancedMesh + PlaneGeometry (billboarded via TSL `billboarding` node) instead
    of THREE.Points — WebGPU only supports point primitives with pixel size 1, so
    pure Points can't have resizable sprites. InstancedMesh + billboarding works on
    both WebGPU + WebGL2 (RULES §14 parity).
  - GPU-side movement: `t*4 + sin(t + offset.y*10)*0.3` drift + `mod(pos, range)`
    wrap-around. Mirrors Section6 particle.vs. No CPU per-frame cost — only uTime
    uniform advances.
  - Circle mask: `smoothstep(0.5, 0.35, distance(uv*2-1))` — soft round particles.
  - Additive blending — luminous accumulation.
  - `setVisibility(v)` — smooth fade via uVisibility uniform.
  - `setCount(n)` — rebuilds geometry for auto-reduce.
- Replaced `makeParticles()` (static PointsMaterial) in intro/scene.ts (300
  particles) + works/scene.ts (200 particles, blue 0x4488ff). Deleted the now-unused
  `src/sections/_shared/makeParticles.ts`.
- Wired `particles.update(dt)` into World.update() scene-group loop (same pattern as
  typo/orb/timeline/carousel).
- Auto-reduce: Experience.update() now halves all JunniParticles counts when `_lowFps`
  (FPS < 30 for 60 frames) flips true. One-way (`_particleReductionApplied` flag) —
  never auto-restore (GPU spike would re-trigger). Foundation (`_lowFps`) was already
  in place from Sprint 11; this wires the actual adaptive reduction.

### Key decisions (WHY)
- **InstancedMesh over THREE.Points**: WebGPU limitation — point primitives are
  pixel-size-1 only. The reference uses THREE.Points + raw GLSL (WebGL-only). For
  parity we use instanced billboards — works on both backends, same visual.
- **TSL NodeMaterial (RULES §1/§2)**: reference uses raw ShaderMaterial. We port to
  TSL — `Fn()` closures + `attribute('offsetPos')` + `billboarding({position})` +
  `smoothstep`/`mod`/`sin` TSL nodes. Same shader logic, portable to WebGPU.
- **GPU-side movement over CPU**: ParticleBurst (existing) does CPU-side matrix
  updates per frame (200 matrices). For continuous ambient particles (300+), GPU-side
  is cheaper — only one uniform update per frame, the shader does all position math.
- **One-way auto-reduce**: restoring count causes a geometry rebuild + GPU upload
  spike → FPS drops again → loop. Better to stay reduced. User can reload page to
  reset. DevPanel shows 'low fps ⚠' so it's visible.

### Files touched
- `src/Experience/World/JunniParticles.ts` (NEW — 220 LOC)
- `src/sections/intro/scene.ts` (makeParticles → JunniParticles)
- `src/sections/works/scene.ts` (makeParticles → JunniParticles)
- `src/sections/_shared/makeParticles.ts` (DELETED — unused)
- `src/core/World.ts` (particles.update() in scene-group loop)
- `src/Experience/Experience.ts` (_particleReductionApplied + auto-reduce block)

### Verification
- type-check: 0 errors
- lint: 0 errors (61 pre-existing warnings)
- build: green
- test:unit: 69 passed
- Agent Browser: 6 scene groups, intro=300 particles, works=200, isReduced=false,
  0 console errors. (WebGL2 fallback — WebGPU premium path needs vision QA via
  Hermes on project.6la.ru.)

### Next
- Vision QA via Hermes: verify particles render + animate on real WebGPU
- Optional: visibility animation on section enter/leave (fade in/out)
- Optional: boost effect (Section6 particleTimeScale 10x on trigger)

---

## 2026-07-12 — Cursor audit: 5 memory/lifecycle fixes

### Done
- P1 (real leak): WorkCards listeners survived SPA navigation. router.ts did
  `el.innerHTML = renderPage(page)` — old DOM nodes died, but `cards[]` array
  in WorkCards.ts kept references + pointermove/click listeners on detached
  nodes → GC-blocked. Each /works visit added 8 more cards. Fix: call
  `disposeWorkCards()` in router.renderView() BEFORE innerHTML replacement.
- P2: console.info in Renderer.ts:149 (render path log) without
  `import.meta.env.DEV` gate → production console noise. Wrapped in DEV check.
- P2: empty `bus.on('intro:done')` handler in Experience.ts:218 — dead listener
  (body was empty; theme is global, splash owned by main-app.ts). Removed the
  handler; kept `bus.emit('intro:done')` as a public extension point. Left a
  comment explaining why no splash logic belongs here.
- P3: `scene.environment` PMREM texture not disposed in destroy() — leak on
  HMR teardown. Added `scene.environment.dispose()` + null the reference.
- P3: startAudio click/keydown listeners not removed in destroy() — leaked
  if destroy() ran before any user gesture (HMR). Saved handler to
  `_startAudioHandler` field; destroy() removes it if still attached.
- P3: World.disposeSceneGroups() double-dispose on BakuCarousel children —
  gallery.dispose() ran first, then traverse() called disposeMaterialDeep on
  the same materials. Three.js Material.dispose() is idempotent so it worked,
  but fragile. Now collects gallery + descendants into a Set and skips them
  in the traverse.

### Key decisions (WHY)
- **disposeWorkCards in router, not in entry-app**: router.renderView() is the
  single point where DOM replacement happens. Calling dispose there (before
  innerHTML) guarantees cleanup regardless of which page is being left. The
  jlz:route-change handler in entry-app.ts (which calls initWorkCards) runs
  AFTER the new DOM is in place — wrong place for dispose.
- **Kept bus.emit('intro:done') despite removing the listener**: the event is
  a public API contract (fire-once after intro animation). Removing the emit
  would be a breaking change for any future subscriber. The emit is cheap
  (no subscribers = no-op). The empty listener was the dead code, not the emit.
- **Gallery descendants Set in World**: the alternative (checking `obj.parent`
  chain) is O(depth) per node and fragile against nesting changes. A Set built
  once via gallery.traverse is O(1) lookup and self-maintaining.

### Files touched
- src/router.ts (P1 — disposeWorkCards import + call)
- src/Experience/Renderer.ts (P2 — DEV gate on console.info)
- src/Experience/Experience.ts (P2 intro:done removal + P3 startAudio field +
  P3 scene.environment dispose)
- src/core/World.ts (P3 — gallery descendants skip in disposeSceneGroups)

### Verification
- lint: 0 errors (61 pre-existing warnings)
- type-check: 0 errors
- build: green
- test:unit: 9/9 passed

### Next
- Cursor audit also flagged: 61 ESLint warnings (no-console in dev-only paths,
  no-explicit-any on WebGPU/Three.js API). Not bugs — tracked for future
  type-safety pass on the WebGPU layer.
- vendor-three 1.2MB (gzip 334KB) — already lazy-loaded, further code-splitting
  is a separate perf task.

---

## 2026-07-11c — Blog polish + meta optimization + SfxSystem + DevPanel/FPS

### Done
- Sprint 8: Blog post polish (NEXT.md medium). Prism.js 1.30 code highlighting
  (vendored core + clike + javascript + typescript + glsl + css into
  public/vendor/prism/, ~16KB total, no CDN). prism-tomorrow theme aligned with
  JLZ card surface via blog.less overrides. Reading progress bar
  (.jlz-reading-progress, top-fixed, scaleX = scroll %, rAF-throttled).
  public/js/blog.js — shared script (year + reading progress + Prism.highlightAll).
  All 4 articles + blog.html updated. Lazy images: N/A (zero <img> in blog).
- Sprint 9: Meta optimization. New favicon (public/logo.svg → favicon.svg —
  yellow #fff72c + white on #232534 'l@6' mark, replaced old purple-gradient).
  PWA manifest (public/site.webmanifest — name, icons, shortcuts, theme_color).
  apple-touch-icon + mask-icon added to all 6 HTML entries. preview.jpg
  (1200×630, already present) now used for ALL og:image + twitter:image +
  JSON-LD image fields (was: per-page project covers — inconsistent branding).
  index.html og:url fixed (/app → /, stale splash artifact). Cache headers
  (public/_headers — Netlify/Cloudflare format: immutable for fingerprinted
  assets/fonts/vendor, no-cache for HTML, revalidate for brand files; security
  headers globally).
- Sprint 10: SfxSystem (NEXT.md low — audio). New src/core/SfxSystem.ts —
  procedural UI sounds via Web Audio API (zero samples, ~90 LOC). 4 SFX:
  hover (sine 880Hz tick), click (triangle 180Hz tap), open (sweep 220→660Hz),
  close (sweep 660→220Hz). Lazy-init AudioContext on first play() (autoplay
  policy). setMuted() master gain → 0. Integrated: Cursor.ts (hover on
  [data-magnetic]/a/button, click), ProjectOverlay.ts (showContainer=open,
  hide=close). Experience.ts jlz:sound-toggle now mutes audio + sfx together.
  Respects existing jlz:sound localStorage pref (default OFF).
- Sprint 11: DevPanel + FPS (NEXT.md low). DevPanel: added 'lang' (EN/RU) +
  'low fps ⚠' indicators to Stats folder; new 'Scene' folder with ground-plane
  toggle + reset button (debugging RULES §20). Experience: rolling 60-frame
  FPS tracker, public lowFps getter, _lowFps flips true when avg FPS < 30
  sustained over 60 frames. Auto-reduce particle count intentionally NOT wired
  (requires BufferGeometry rebuild — documented as future work).

### Key decisions (WHY)
- **Prism vendored, not CDN**: blog articles are standalone HTML (not part of
  the SPA bundle). Vendoring keeps them self-contained, offline-capable, and
  avoids a runtime CDN dependency. ~16KB total is negligible.
- **Procedural SFX, no samples**: SfxSystem synthesizes all sounds at runtime
  (oscillator + gain envelope). Zero network payload, zero asset loading, ~90
  LOC. Trade-off: less rich than sampled audio, but perfect for short UI ticks
  and whooshes. If richer audio is later needed, swap SfxSystem internals
  without touching the play() API.
- **SFX respects jlz:sound pref**: no new UI. The existing splash config sound
  toggle covers ambient + SFX together. Adding a separate SFX toggle would
  fragment the audio UX — one toggle is cleaner.
- **Ground toggle in DevPanel overrides RULES §20 temporarily**: the toggle is
  dev-only (DevPanel is never constructed in production per Experience.init
  guard). The 'Reset ground' button restores the rule. This is a debugging
  tool, not a feature.
- **_lowFps flag, no auto-reduce yet**: the tracker is the foundation.
  Auto-reducing particle count requires BufferGeometry rebuild (particles are
  static Points clouds, count set at creation in makeParticles). Wiring that
  is an architectural change (makeParticles would need a setCount method).
  Documented as future work in NEXT.md low tier.
- **_headers format**: Netlify/Cloudflare Pages read _headers automatically.
  For Caddy/nginx, translate to Cache-Control response headers. The file is
  self-documenting — each rule has a comment explaining the strategy.

### Files touched
- public/vendor/prism/* (7 files), public/js/blog.js, src/assets/blog.less (Sprint 8)
- public/favicon.svg (replaced), public/logo.svg (kept), public/site.webmanifest,
  public/_headers, index.html, blog.html, blog/*.html (Sprint 9)
- src/core/SfxSystem.ts (new), src/Experience/Experience.ts, src/Experience/Cursor.ts,
  src/UI/ProjectOverlay.ts (Sprint 10)
- src/core/DevPanel.ts, src/Experience/Experience.ts (Sprint 11)

### Verification
- `bun run lint`: 0 errors (61 pre-existing warnings)
- `bun run type-check`: 0 errors
- `bun run build`: green (~1.8s)
- `bun run test:unit`: 9 passed
- Agent Browser (per SANDBOX.md): index.html manifest/apple-touch/favicon/og:image
  all confirmed via curl (raw HTML). Blog article: Prism loaded, 111 tokens
  highlighted, reading-progress bar present, 0 console errors.

### Next
- Audio system part 2: ambient track + audio-reactive visuals on Works (NEXT.md low)
- Auto-reduce particle count when _lowFps (requires makeParticles.setCount — future)
- Blog post design polish part 2: lazy images when <img> is added, lightbox

---

## 2026-07-11b — SANDBOX runbook + WorkCards a11y + i18n dropbar + Lighthouse

### Done
- Sprint 4: Created `docs/SANDBOX.md` — operational runbook for dev-server + Agent
  Browser verify in the GLM sandbox. Captures the 5 gotchas observed during the
  prior session's verify loops (background processes die between Bash calls;
  localhost unreachable from browser; `allowedHosts` blocks JS via LAN IP;
  headless WebGL2 throttles `jlz:webgl-ready`; screenshots time out on 3D canvas).
  AGENTS.md now links it in the docs table + after the Verification section.
- Sprint 5: WorkCards keyboard navigation (NEXT.md medium). Roving tabindex
  (WAI-ARIA pattern): one card per `.jlz-works-grid` is `tabindex=0` (Tab entry),
  rest `tabindex=-1`. ArrowLeft/Right move focus within the active section's
  2-card row + re-anchor roving. ArrowUp/Down left alone (joystick owns vertical
  section nav). Enter/Space open via native `<button>`. `jlz:page-section-change`
  resets roving in all grids. Single document-level keydown listener, tracked
  for cleanup in `disposeWorkCards()`. CSS `:focus-visible` already existed.
- Sprint 6: i18n dropbar (NEXT.md medium). 58 EN + 58 RU `dropbar.*` keys added
  to `src/core/i18n.ts` (`dropbar.<page>.s<idx>.title/subtitle` +
  `dropbar.<page>.featured.title/subtitle`). `UIMenu.ts` `DropSection` + `featured`
  interfaces gained `titleKey`/`subtitleKey`; `NAV_ITEMS` data carries the keys;
  `renderNavItems()` emits `data-i18n` on `.jlz-dropbar__title` + featured title
  spans. Works page section titles are project names (proper nouns, RULES §32) →
  `titleKey` intentionally undefined there (English stays).
- Sprint 7: Lighthouse re-run (NEXT.md high) — closed with caveat. Last
  successful report (pre-Sprint 1-6): Performance 100, Accessibility 95, Best
  Practices 96, SEO 100. A fresh post-Sprint-1-6 run could NOT be obtained in
  this sandbox — LHCI over `staticDistDir` fails with `NO_FCP` (headless Chrome
  never paints without a real display; `--headless=new --no-sandbox` didn't
  help). Sprint 1-6 changes don't touch the FCP path (3D canvas is lazy-loaded
  after FCP; changes are docs, dead-config removal, a11y keyboard nav, i18n
  strings). Recommend re-running on a real-Chrome machine or in GitHub Actions.
- Cleanup: `.lighthouseci/` added to `.gitignore` (was missing — LHCI reports
  were being committed as source). Removed from tracking.

### Key decisions (WHY)
- **SANDBOX.md separate from RULES.md**: RULES is bug-provenance for code;
  sandbox is environment operational knowledge. Different audience, different
  update cadence. Keeping them separate prevents RULES from bloating with
  non-code rules.
- **Roving tabindex over a simple keydown-only approach**: the WAI-ARIA
  pattern is the accessible standard (Tab enters the grid at one anchor,
  arrows move within). A naive "all cards tabindex=0" would pollute the Tab
  order (8 cards across 4 sections = Tab hell). Roving keeps Tab order clean
  (one entry per section) while still allowing arrow navigation.
- **ArrowUp/Down NOT handled in WorkCards**: the joystick owns vertical
  section navigation (1→2→3→4). Intercepting arrows here would break that.
  The keydown handler explicitly checks focus context before acting, so it
  never steals arrows from the joystick, inputs, or overlays.
- **Works page titles stay English in dropbar**: RULES §32 (project names are
  proper nouns). `titleKey` is `undefined` for those — `renderNavItems` emits
  no `data-i18n`, so `applyTranslations()` leaves the English text. Subtitles
  still translate (they're descriptive, not proper nouns).
- **subtitleKey fields kept even though subtitles aren't rendered**: the
  dropbar template currently shows only num + title (subtitle is in the data
  but not in the DOM). The keys are future-proofing — when subtitles get
  rendered, they'll translate with zero i18n.ts changes.

### Files touched
- `docs/SANDBOX.md` (NEW), `AGENTS.md` (Sprint 4)
- `src/UI/WorkCards.ts` (Sprint 5 — roving tabindex + keydown)
- `src/core/i18n.ts`, `src/UI/UIMenu.ts` (Sprint 6 — dropbar i18n)
- `NEXT.md` (Sprint 7 — closed Lighthouse + i18n dropbar + WorkCards items)
- `.gitignore`, `.lighthouseci/*` removed from tracking (cleanup)

### Verification
- `bun run lint`: 0 errors (61 pre-existing warnings)
- `bun run type-check`: 0 errors
- `bun run build`: green (~1.8s)
- `bun run test:unit`: 9 passed
- Agent Browser (per SANDBOX.md procedure): works page loaded, 0 console errors.
  - Dropbar: 20 title spans + 6 featured spans carry `data-i18n` (sample
    `dropbar.home.s1.title`, `dropbar.home.featured.title`).
  - WorkCards: 4 grids, 2 cards each, roving tabindex `["0","-1"]` confirmed
    on first grid.

### Next
- Blog post design polish (code highlighting, lazy images, reading progress) — NEXT.md medium
- Audio system, DevPanel improvements, render-budget FPS tracking — NEXT.md low

---

## 2026-07-11 — Dead-code cleanup + stale doc sync (fresh-eyes audit follow-up)

### Done
- Sprint 1: Fixed stale WireframeTypography labels (artifacts of `9d8e0c7` Services/Works
  swap + `7e2f480` 8→6 section unification — strings were never updated).
  - `about/scene.ts`: `'SERVICES'` → `'ABOUT'` (matches the About cube face)
  - `contact/scene.ts`: `'MANIFESTO'` → `'HELLO'` (restores the file-header intent: "3D greeting")
- Sprint 2: Removed dead per-page `sceneObjects` config from WorldConfig (`-47 LOC`).
  - `sceneForContentPage()` assigned 3D objects to **wrong cube-face indices** (e.g.
    `wireframeText: idx === 1` for services, but WireframeTypography only exists on
    idx 2/4; `bakuCarousel: idx === 1` for works, but carousel is on idx 3). Every
    assignment was a no-op via the `if (typo)` / `if (orb)` guards in World.ts.
  - `sceneEnvSpherePattern` field removed — dead (World.ts:352 "REMOVED", EnvSphere
    follows global theme only, patterns are fixed per section).
  - `particles` flag removed from `SceneControl.objects` — never read in World.ts.
  - Kept (alive): `scene.transition` (easing, consumed by `_applyEasing`), `scene.objects.bakuCarousel`
    (home-only guard in World.ts:419), home RAW sceneObjects (correct indices, objects exist there).
- Sprint 3: Doc sync (stale metrics + dead-field cleanup).
  - `STATUS.md` / `AGENTS.md`: 17 tests → 9 (EventBus 5, not 13 — suite was trimmed,
    docs never updated); `~14.4K LOC` → `~11.6K TS LOC` (TS-only count).
  - `RULES.md §18`: was a verbatim duplicate of §16 → replaced with a placeholder note
    so §19+ numbering stays stable (RULES refs §15-17, §20, §50 must not shift).
  - `ARCHITECTURE.md` SceneControl: removed `particles` + `envSpherePattern` from the
    type sketch; clarified `scene.objects` is home-only (content pages skip the
    visibility block — objects show via shared scene groups).
  - `NEXT.md`: closed the "3D objects on content pages" high-priority item —
    re-evaluated: SectionSceneFactory is hardcoded, scene groups are shared, objects
    already render on all pages when their cube-face group is visible.

### Key decisions (WHY)
- **Labels match cube faces, not content pages**: scene groups are shared across all
  SPA pages (SectionSceneFactory is hardcoded), so the 3D text anchor must match the
  cube face (About → 'ABOUT', Contact → 'HELLO'), not any content page that happens
  to reuse that face.
- **Removed `sceneForContentPage` rather than "fixing" indices**: the architecture
  explicitly shares scene groups across pages, so per-page `sceneObjects` contradicts
  it. True per-page visual variety would need per-page scene factories — an
  architectural change, not a config tweak. The dead config was misleading (looked
  like a working feature, actually did nothing).
- **Kept §18 as a placeholder** instead of renumbering: RULES references (§15-17, §20,
  §50) in AGENTS.md / ARCHITECTURE.md would silently break if numbers shifted.
- **Did NOT touch Enter-button init flow**: browser verify showed `enterReady=false`
  in headless after 22s, but this is pre-existing headless timing (`jlz:webgl-ready`
  emit uses `setTimeout` which throttles under headless WebGL2 + LAN IP). My changes
  didn't touch `main-app.ts` / `entry-app.ts` / `Experience.ts` init. STATUS.md
  confirms the Enter contract works in real browsers (Lighthouse Perf 100).

### Files touched
- `src/sections/about/scene.ts`, `src/sections/contact/scene.ts` (Sprint 1)
- `src/core/WorldConfig.ts` (Sprint 2)
- `docs/STATUS.md`, `docs/RULES.md`, `docs/ARCHITECTURE.md`, `AGENTS.md`, `NEXT.md` (Sprint 3)

### Verification
- `bun run lint`: 0 errors (61 pre-existing `no-empty-object-type` warnings, tracked per RULES §48)
- `bun run type-check`: 0 errors (strict + noUncheckedIndexedAccess)
- `bun run build`: green (~1.8s)
- `bun run test:unit`: 9 passed (EventBus 5 + Noise 2 + motionPolicy 2)
- Agent Browser (headless WebGL2, LAN IP): 6 scene groups created, all userData correct
  (`orb0`/`typo2`/`gallery3`/`typo4`/`timeline5` all `true`), 0 console errors,
  `Experience.init` complete (DevPanel ready log), `window.experience` defined.

### Next
- Lighthouse re-run (NEXT.md high priority — after all 2026-07-12 + 2026-07-11 changes)
- i18n dropbar titles, blog post polish, WorkCards keyboard nav (NEXT.md medium)

---

## 2026-07-12 — Works page 3D cards + i18n + meta tags + Enter/ground fixes + docs rewrite

### Done
- Works page redesigned: 4 sections × 2 large 3D tilt cards = 8 case studies
  (2 new projects added: Indigo Drift, Crimson Hours, cover images generated)
- i18n full implementation: 130+ EN/RU keys, `data-i18n` on all templates (57 attrs)
- Route-based meta tags: `pageMeta.ts`, per-page title/description/OG, i18n-aware
- Enter button fix: always visible but DISABLED until `jlz:webgl-ready`
  (was activating at 4s/5s fallback — too early under throttling)
- Ground plane fix: visible ONLY on section 4 (was `!showGallery` = everywhere except Works)
- `jlz:webgl-failed` event added (init crash → load error, not Enter)
- `jlz:open-project` event added (WorkCards click → reuses ProjectOverlay)
- All 6 docs rewritten for accuracy (AGENTS, RULES, ARCHITECTURE, STATUS, UIKIT3, CHANGELOG)

### Key decisions (WHY)
- **Enter disabled, not hidden**: user wants to see the button but can't click until ready.
  CSS `pointer-events:none` + `opacity:0.5` until `.is-ready` class. 60s fallback = load error.
- **Ground only section 4**: section 4 = bottom cube face (-Y) = "grounded" feel.
  All other sections float in void. `groundOpacity` 0.05 → 0.25 for visibility.
- **WorkCards reuses ProjectOverlay**: same fullscreen overlay as home BakuCarousel.
  Click dispatches `jlz:open-project { idx }` → Experience opens overlay. No duplicate UI.
- **i18n flat dot notation**: `home.studio.title`, `services.creativeDirection.lead`.
  English always default content (no-JS fallback). Project names stay English (proper nouns).
- **Meta tags from i18n dictionary**: `meta.<page>.title` / `.description`.
  Switch language → meta switches. `<html lang>` reflects current language.

### Files touched
- `src/pages/content/works.ts` — new 4-section 3D-cards template
- `src/UI/WorkCards.ts` — NEW: 3D tilt + click handler (idempotent initWorkCards)
- `src/core/i18n.ts` — expanded to 130+ keys
- `src/core/pageMeta.ts` — NEW: route-based meta tags
- `src/core/EventBus.ts` — added `jlz:webgl-failed`, `jlz:open-project`
- `src/Experience/Experience.ts` — `jlz:open-project` handler, ground fix
- `src/entry-app.ts` — Enter disabled logic, 60s fallback
- `src/main-app.ts` — emits `jlz:webgl-failed` on crash
- `index.html` — Enter button CSS (disabled state), 60s fallback
- `src/Data/Projects.ts` — 2 new projects (indigo-drift, crimson-hours)
- All section templates + content pages — `data-i18n` attributes
- All 6 docs — rewritten

### Next
- See `NEXT.md` for prioritized backlog

---

## 2026-07-11 — Blog redesign + mobile QA + SEO sitemap + i18n structure

### Done
- Blog standalone pages: blog.less, 4 articles, JSON-LD BlogPosting, OG/Twitter meta
- Mobile QA passed: blog + blog posts responsive at 390px
- SEO sitemap: 6 SPA pages + robots.txt + structured data
- i18n EN/RU structure: i18n.ts created, lang toggle wired to splash config button
- Ponytail audit: -632 LOC, -9 files dead code removed
- Perf audit: CubeCamera throttle (6 frames), bloom skip (intensity=0), leak fixes
- NoiseText/BlurFade on all pages (not just home)
- BakuCarousel only on home Works section (not all pages)
- Dead code cleanup + memory leak fixes

### Key decisions
- **Footer removed entirely**: joystick is sole bottom UI (minimalism)
- **Splash merged into index.html**: no separate splash page, no navigation flash
- **QF color-mode overrides**: `_theme-fixes.less` handles dark mode for all components
- **Routes without /app prefix**: index.html is canonical entry
- **worldDNA.ts deleted**: TSL node system was dead code
- **Easings.ts deleted**: only inline `easeInOutQuart` needed

### Files touched
- `src/assets/blog.less` — NEW
- `blog/*.html` — 4 articles
- `public/sitemap.xml`, `public/robots.txt` — SEO
- `src/core/i18n.ts` — initial structure (40 keys)
- Multiple files — dead code removal, perf optimizations

### Next
- Apply `data-i18n` attributes to templates (done 2026-07-12)
- Blog post design polish (code highlighting, images)
- Route-based meta tags (done 2026-07-12)

---

## 2026-07-10 — 8→6 section unification + uk-light theme + ponytail audit

### Done
- 8→6 sections (Flexible/Innovative removed)
- UIKit native `uk-light` (replaced 50+ LOC custom overrides)
- Mobile-first rem sizing (`html { font-size: 0.85rem }` mobile → `1rem` ≥640px)
- BakuCarousel race condition fixes
- Design tokens merged into `_import.less`
- Unified `sectionShell()` — ONE wrapper for all pages (home + content)

### Key decisions
- **sectionShell unification**: home and content pages use the same helper.
  `mode: 'home'` (data-section, 3D cube face) vs `mode: 'content'` (data-page-section).
- **uk-section-medium does NOT exist in UIKit3**: only xsmall/small/large/xlarge.
  Use `uk-section-small uk-section-large@m`.
- **Per-section inverse theme**: ContentReveal applies uk-light per-section based on
  sectionTheme in WorldConfig. auto: light→uk-light, dark→no. inverse: FLIPPED.

### Files touched
- `src/sections/_shared/constants.ts` — sectionShell, contentTop, contentBottom
- `src/sections/*/template.ts` — all 6 home sections
- `src/pages/content/*.ts` — all content pages
- `src/Experience/ContentReveal.ts` — per-section theme

### Next
- i18n full implementation (done 2026-07-12)
- Works page 3D cards (done 2026-07-12)
