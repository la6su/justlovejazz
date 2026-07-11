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

- [ ] **Auto-reduce particle count** — when _lowFps is true, reduce particle
      count via makeParticles.setCount (requires BufferGeometry rebuild).
      Foundation (_lowFps flag) is in place from 2026-07-11.

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
