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

- [ ] **3D objects on content pages** — ShaderOrb, WireframeTypography currently
      only on home. Add per-section `sceneObjects` config for content pages
      (services, manifesto, lab) so they have visual variety beyond the baku cube.
      Files: `src/core/WorldConfig.ts` (content page configs), `src/core/World.ts`
      (scene group visibility logic already supports it — just needs config).

- [ ] **Lighthouse re-run** — after all 2026-07-12 changes (works cards, i18n, meta).
      Run `scripts/lhci.sh` + `lighthouserc.json`. Target: Performance ≥90,
      Accessibility ≥95, SEO ≥95, Best Practices ≥95.

## TODO — Medium priority

- [ ] **i18n: dropbar section titles/subtitles** — UIMenu dropbar currently shows
      English-only section titles + subtitles. Add `data-i18n` to
      `NAV_ITEMS[].sections[].title/subtitle` + dictionary keys.
      File: `src/UI/UIMenu.ts`, `src/core/i18n.ts`.

- [ ] **Blog post design polish** — code syntax highlighting (Prism.js or highlight.js),
      better image handling (lazy loading, lightbox), reading progress indicator.
      Files: `blog/*.html`, `src/assets/blog.less`.

- [ ] **WorkCards keyboard navigation** — arrow keys to move between cards,
      Enter to open. Currently mouse/touch only. File: `src/UI/WorkCards.ts`.

## TODO — Low priority

- [ ] **Audio system** — splash config sound toggle exists but no audio content.
      Add ambient track + audio-reactive visuals on Works section.

- [ ] **DevPanel improvements** — add i18n lang indicator, ground plane toggle,
      carousel morph force-trigger. File: `src/core/DevPanel.ts`.

- [ ] **Performance: render budget** — track frame time in DevPanel,
      auto-reduce particle count if FPS < 30 for 60 frames.

## Done (recent — for context)

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
