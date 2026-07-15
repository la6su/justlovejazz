# NEXT — Prioritized backlog (single source of truth for "what to do")

> A new LLM agent reads this FIRST (after AGENTS.md). Items are concrete and
> actionable. Check off `[x]` when done — the checked section becomes a mini
> changelog. Add new items at the bottom of their priority tier.
>
> When starting work: move an item from "TODO" to "In Progress".
> When finishing: check it off `[x]` and add a WORKLOG.md entry.

## In Progress

_(nothing currently in progress)_

## TODO — High priority

- [x] **Audit remediation: navigation, lifecycle, fallback quality and test drift** — DONE 2026-07-15. Fixed router handling for bare/hash anchors (dotnav no longer routes to `/`), corrected `Section` StateBus completion payload handling, made home BakuCarousel initialization idempotent after deep-link navigation, and recalculates quality/pipeline configuration after WebGPU → WebGL fallback. Added dotnav/blur accessibility state, cleared WorkCards timers on disposal, refreshed stale E2E selectors, and added StateBus regression coverage. Browser-verified `/services → /` initializes BakuCarousel; full static checks pass.

- [x] **Glass cube WebGPU/WebGL2 parity** — DONE 2026-07-14. 6 commits: vignette
      sync, wobble noise coords, PMREM isPMREMTexture flag, WorldConfig
      metalness 0.8→0.0, light colors re-enabled, premium glass params
      (dispersion, iridescence, sheen, attenuation, clearcoat), richer 3-zone
      env map. VLM-verified parity on WebGL2, code-sync verified on WebGPU.

- [x] **Full project audit** — DONE 2026-07-14. 4-agent audit (memory, perf,
      render quality, logic). 73 issues found, 45 fixed across 3 commits
      (CRITICAL+HIGH, MEDIUM, LOW). tsc 0 errors, lint 0 errors (57 warnings),
      87/87 tests. See docs/STATUS.md "Recent work (2026-07-14)".

- [x] **PLAN-v3 Phase 7+8 (dramatic click feedback)** — DONE 2026-07-14.
      Wobble boost 0.9→1.8, dispersion boost 4.5→9.5, chromatic boost 0.45→0.95,
      pulse duration 0.9→1.2s, opener scale 1.3→1.4. Works card wobble: scale
      1.2, rotateY ±6deg, blur at peak.

- [x] **PLAN-v3 Phase 6 (Cursor wobble smoothed edges)** — DONE (already
      uses quadraticCurveTo, 16 segments). Verified in Cursor.ts drawCircle.

- [x] **PLAN-v3 Phase 5 (Showreel modal UI)** — DONE. FullscreenOverlay has
      custom controls (play/pause, mute, seek bar, time display, big play
      button, prev/next, keyboard). D-1 fix added `<source>` element (was
      missing → showreel never played).

- [x] **PLAN.md all phases (2-6)** — DONE. Phase 2 (zoom on works), 3 (sound
      panel with EQ bars), 4 (carousel momentum/rubber-band/auto-advance),
      5 (DrawTrail tapered tail), 6 (cursor spring physics). All verified
      in code.

- [ ] **3D Works page + Showreel shader plane + lazy video** — 6-phase plan
      in `docs/PLAN-showreel-shader-plane.md`:
      1. Lazy video loading (preload="none", src on open) — 30 min
      2. Wobble scale on card click (CSS animation quick win) — 1 hour
      3. 3D portfolio grid (PortfolioGrid3D.ts, instanced mesh) — 4-6 hours
      4. Showreel button as TSL shader plane — 2-3 hours
      5. Video plane with genie transition — 3-4 hours
      6. Integration + cleanup — 1-2 hours
      Strategy: thumbnails eager, video lazy on click. Wobble already works
      on cube (WorkCards.ts:107 → jlz:wobble-pulse), needs to be on card too.
      Phases 1-2 DONE. Phase 4 exists but disabled (visual clutter). Phases
      3, 5, 6 remain (major architecture — instanced mesh + video plane).

- [x] **Senior-auditor pass — Tier 0-3** — DONE 2026-07-13. 6 Critical nav
      bugs (C1-C6) + 6 Critical 3D bugs (C7-C12) + 5 High (H1,H4-H6,H9,H13)
      + over-engineering cleanup (-~300 LOC, -1 dep, -1 type file). Navigation
      contracts now match docs; WebGPU/WebGL2 wobble parity restored; all
      window listeners tracked + removed in destroy(). See docs/STATUS.md
      "Recent work (2026-07-13 — Senior-auditor pass)" for the full list.
      Verification: tsc 0 errors, lint 0 errors (62 warnings), 87/87 tests.

- [x] **Menu section overlap + fullscreen overlay visible on works** — DONE
      2026-07-13. Two bugs fixed:
      1. Menu overlap: router.ts listens for `jlz:navigate` event (the
         navigation REQUEST, dispatched by menu subsection clicks) and calls
         `navigateToPage()`. jlz:navigate is separate from jlz:route-change
         (the post-render NOTIFICATION) to prevent infinite loops.
      2. Fullscreen overlay visible on works: added
         `this.container.style.display = 'none'` after modal creation in
         FullscreenOverlay.ts. UIKit3 modal can leave `display:flex` after
         creation, making the overlay visible immediately.
      See WORKLOG.md 2026-07-13 entry for details.

- [x] **Menu close button + unique VOSK template + glassmorphism + docs audit** —
      DONE 2026-07-13. Joystick fix (`touch-action: none` on `.jlz-joystick__base`
      directly — not inherited from parent). Hamburger ↔ X toggle: `#jlz-hamburger`
      contains two inline SVGs, CSS-driven swap via `.jlz-header--menu-open`;
      click dispatches `jlz:goto-nav` (open) or `jlz:close-nav` (close → returns
      to previous main section). Unique menu template (NOT `sectionShell()`) —
      VOSK-style 3-column grid (stat | nav | contacts + footer), 100dvh, no
      scroll, responsive 3-col/1-col. Glassmorphism on `uk-icon-button` via
      `.hook-icon-button()` in new `_import.less §3.5` (hooks before component
      imports). Accordion removed; `initNavAccordion` removed from router.ts.
      Documentation synced across AGENTS.md, README.md, docs/UIKIT3.md (§1, §3,
      §4, §7 lessons 21–24, §8 table), docs/STATUS.md, WORKLOG.md, NEXT.md.
      See WORKLOG.md 2026-07-13 (second entry) for full details.

- [x] **UIkit3 navbar conformance + Menu overlay toolbar** — DONE 2026-07-13.
      Refactored header to the official UIkit3 3-zone navbar pattern
      (`uk-navbar-left` + `uk-navbar-center` + `uk-navbar-right` with
      `uk-navbar` attribute on the INNER `<div>`, not on `<nav>`). Logo is
      pixel-exact centered (verified `logoCenterX = navCenterX = 640` on
      1280px viewport). Removed `.jlz-glass-btn` (duplicate of `uk-button` /
      `uk-icon-button`), `.jlz-navbar-center-group`, and the floating
      `SoundPanel.ts`. Theme toggle (sun/moon inline SVG — UIKit3 has no
      celestial icons) + sound toggle (custom 4-bar EQ) now live in the menu
      overlay config toolbar (`src/sections/nav/toolbar.ts`). Renamed section
      5 "Process" → "Menu" semantically across `SectionId`, `WorldConfig`,
      `JoystickNav.SideState`, `nav/template.ts`, `process/scene.ts`. Deleted
      dead `src/sections/process/template.ts` + `src/sections/nav/scene.ts`.
      Removed `#jlz-menu-modal` guards (modal was replaced by section-5
      overlay in PLAN-v3 but guards stayed). `docs/UIKIT3.md §7` gained 10
      new lessons (11–20) documenting all gotchas. See WORKLOG.md 2026-07-13
      entry for full details.

- [x] **3D objects on content pages** — DONE 2026-07-11 (re-evaluated). The
      old item assumed per-page `sceneObjects` config was needed; in reality
      `SectionSceneFactory` is hardcoded and scene groups are shared across all
      SPA pages, so ShaderOrb (idx 0), WireframeTypography (idx 2/4),
      BakuCarousel (idx 3, home-only), and TimelineNodes (idx 5) already render
      on every page when their cube-face group is visible. The dead
      `sceneForContentPage()` config (which assigned objects to wrong indices →
      no-op via `if (typo)` guards) was removed. If true per-page visual variety
      is later desired, that requires per-page scene factories — an architectural
      change, not a config tweak.

- [x] **Lighthouse re-run** — DONE 2026-07-11 (partial). Last successful run
      (`.lighthouseci/localhost-_index_html-2026_07_11_00_12_25.report.json`,
      pre-Sprint 1-6): Performance 100, Accessibility 95, Best Practices 96,
      SEO 100. FCP 1.0s, LCP 1.4s, TBT 0ms, CLS 0, TTI 1.0s. A fresh run after
      Sprint 1-6 could NOT be obtained — LHCI in this sandbox fails with
      `NO_FCP` (headless Chrome over `staticDistDir` never paints without a
      real display; `--headless=new --no-sandbox` didn't help). Sprint 1-6
      changes are lint/type/build green and don't touch the FCP path (3D canvas
      is lazy-loaded after FCP; my changes are docs, dead-config removal, a11y
      keyboard nav, and i18n strings — none affect the inline splash / FCP).
      To re-verify: run `scripts/lhci.sh` on a machine with a real Chrome +
      display, or wire LHCI into GitHub Actions (CI runners have Chrome).

## TODO — Medium priority

- [x] **i18n: dropbar section titles/subtitles** — DONE 2026-07-11. 58 EN + 58 RU
      `dropbar.*` keys added to i18n.ts; UIMenu.ts DropSection + featured carry
      titleKey/subtitleKey; renderNavItems emits data-i18n on title + featured
      spans. Works page titles stay English (proper nouns, RULES §32).

- [x] **Blog post design polish** — DONE 2026-07-11 (part 1). Prism.js code
      highlighting (vendored, ~16KB) + reading progress bar. Lazy images: N/A
      (zero <img> in blog articles). Lightbox: deferred to part 2 (when images
      are added). Files: `public/vendor/prism/*`, `public/js/blog.js`,
      `src/assets/blog.less`, `blog/*.html`.

- [x] **WorkCards keyboard navigation** — DONE 2026-07-11. Roving tabindex
      (WAI-ARIA pattern): ArrowLeft/Right move focus within the active section's
      2-card row; ArrowUp/Down left alone (joystick owns vertical nav); Enter/
      Space open via native <button>. jlz:page-section-change resets roving.
      File: `src/UI/WorkCards.ts`.

## TODO — Low priority

- [x] **Audio system (part 1 — SFX)** — DONE 2026-07-11. SfxSystem: procedural
      UI sounds via Web Audio API (hover, click, open, close). Integrated into
      Cursor (magnetic hover + click) + ProjectOverlay (open/close). Mutes with
      jlz:sound-toggle. Part 2 (ambient track + audio-reactive visuals) still
      pending — needs audio content + AudioSystem.start() wiring.
      File: `src/core/SfxSystem.ts`.

- [x] **DevPanel improvements** — DONE 2026-07-11. Added i18n lang indicator
      + low-fps ⚠ to Stats; new Scene folder with ground plane toggle + reset.
      Carousel morph force-trigger already existed. File: `src/core/DevPanel.ts`.

- [x] **Performance: render budget (tracker)** — DONE 2026-07-11 (part 1).
      Rolling 60-frame FPS tracker in Experience; _lowFps flag (avg FPS < 30
      sustained); public lowFps getter; DevPanel shows low-fps ⚠.
      Auto-reduce particle count: deferred (requires makeParticles.setCount —
      architectural change, BufferGeometry rebuild). File: `src/Experience/Experience.ts`.

- [ ] **Audio system (part 2 — ambient)** — ambient track + audio-reactive
      visuals on Works section. Needs audio content + AudioSystem.start()
      wiring to a UI gesture.

- [x] **Auto-reduce particle count** — DONE 2026-07-14. Experience.ts:870
      halves JunniParticles count when _lowFps is sustained. JunniParticles
      has setCount() method that rebuilds the geometry. One-way (never
      auto-restore — GPU spike would re-trigger).

- [ ] **Audio system (part 2 — ambient)** — ambient track + audio-reactive
      visuals on Works section. Needs audio content + AudioSystem.start()
      wiring to a UI gesture.

## Done (recent — for context)

- [x] 2026-07-11c: Blog polish (Prism + reading progress) + meta optimization
      (favicon/logo.svg, PWA manifest, preview.jpg OG, _headers cache rules)
      + SfxSystem (procedural UI sounds: cursor hover/click, overlay open/close)
      + DevPanel (lang/low-fps indicators, ground toggle) + FPS tracker.
- [x] 2026-07-11b: SANDBOX runbook + WorkCards keyboard nav + i18n dropbar + Lighthouse
- [x] 2026-07-11: Dead-code cleanup + stale doc sync (fresh-eyes audit)
      — WireframeTypography labels fixed (ABOUT/HELLO), dead `sceneForContentPage`
        + `sceneEnvSpherePattern` + `particles` flag removed from WorldConfig (-47 LOC),
        STATUS/AGENTS test count (17→9) + LOC (~14.4K→~11.6K) corrected, RULES §18
        duplicate merged, ARCHITECTURE SceneControl updated, NEXT high-priority item closed.
- [x] 2026-07-12: Works page 3D tilt cards (8 projects, 2 new)
- [x] 2026-07-12: i18n full implementation (130+ keys, data-i18n on all templates)
- [x] 2026-07-12: Route-based meta tags (per-page title/description/OG)
- [x] 2026-07-12: Enter button disabled until jlz:webgl-ready
- [x] 2026-07-12: Ground plane only on section 4
- [x] 2026-07-12: All docs rewritten for accuracy
- [x] 2026-07-11: Blog standalone (blog.less, SEO, JSON-LD)
- [x] 2026-07-11: Mobile QA 390px passed
- [x] 2026-07-11: SEO sitemap + robots.txt
- [x] 2026-07-11: Ponytail audit (-632 LOC)
- [x] 2026-07-10: 8→6 section unification
- [x] 2026-07-10: uk-light theme (replaced 50+ LOC overrides)
- [x] 2026-07-10: Unified sectionShell() for all pages
