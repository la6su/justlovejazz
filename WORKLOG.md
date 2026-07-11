# WORKLOG — Chronological decision journal (NEWEST FIRST)

> Read the TOP entry first — it's the latest context. Each entry captures
> WHAT was done, WHY (decisions), and WHAT'S NEXT. This is different from
> git log (commit messages) and CHANGELOG.md (release notes) — it's the
> "why" journal that survives context window resets.
>
> Format: `## YYYY-MM-DD — Session goal` → Done / Decisions / Files / Next

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
