# CHANGELOG

## 2026-07-12 — Works page 3D cards + i18n + meta tags + splash/ground fixes

### Works page redesign
- New template: 4 sections × 2 large 3D tilt cards = 8 case studies
- 2 new projects added to `Data/Projects.ts`: Indigo Drift, Crimson Hours
- Cover images generated (indigo-drift, crimson-hours) via image-generation skill
- CSS 3D: `perspective` on button, `rotateX/Y` on `__inner` via `--rx`/`--ry`
  custom props, `transform-style: preserve-3d` for parallax depth (image, sheen, overlay layers)
- Click → `jlz:open-project { idx }` event → Experience opens ProjectOverlay
  (reuses same overlay as home BakuCarousel)
- `src/UI/WorkCards.ts` — tilt + click handler. Idempotent `initWorkCards()`
  called on every `jlz:route-change`. Single batched rAF for all card updates.
- `prefers-reduced-motion` → tilt disabled

### i18n — full implementation
- `src/core/i18n.ts` expanded: 130+ keys (EN/RU), flat dot notation
  (`home.studio.title`, `services.creativeDirection.lead`, `common.explore`, `meta.works.title`)
- `data-i18n` attributes added to ALL templates: 6 home sections, 4 content pages,
  UIMenu nav labels (57 data-i18n occurrences total)
- `contentTop()` extended with `titleKey`/`leadKey` params → emits `data-i18n` on `<h2>`/`<p>`
- `data-i18n-placeholder` for input placeholder attributes
- `applyTranslations()` wired into `router.ts` — runs on every `renderView()` + `jlz:lang-change`
- Project names stay English (proper nouns)

### Route-based meta tags
- `src/core/pageMeta.ts` created — `applyMetaTags(page)`
- Called in `router.ts` on every route change + `jlz:lang-change`
- Updates: `<title>`, `<meta description>`, `<html lang>`, OG (title/description/url/site_name/type),
  Twitter Card, `<link canonical>`
- All values from i18n dictionary → switch language → meta switches

### Enter button fix (CRITICAL)
- **Problem:** Enter button activated too early (4s fallback in entry-app.ts,
  5s fallback in index.html). Under CPU/network throttling, `Experience.init()`
  takes 10-20s — fallbacks fired before 3D was ready, letting users click into
  an uninitialized scene (no carousel, no baku cube, broken camera).
- **Fix:** Enter button is ALWAYS visible but DISABLED (`pointer-events:none`,
  `opacity:0.5`, `cursor:not-allowed`) until `jlz:webgl-ready` fires.
  `.is-ready` class activates it (`pointer-events:auto`, `opacity:1`).
- Fallbacks increased to 60s → show LOAD ERROR (not Enter) if init hangs/crashes.
- `jlz:webgl-failed` event added to EventBus — emitted on init crash → load error.
- `main-app.ts` emits `jlz:webgl-failed` in catch block.

### Ground plane fix
- **Problem:** `groundPlane.visible = !showGallery` showed ground on ALL sections
  except Works — floor visible everywhere, cluttering the void aesthetic.
- **Fix:** `groundPlane.visible = currentSectionIndex === 4` — ground visible
  ONLY on section 4 (bottom cube face -Y). All other sections float in void.
- Section 4 `groundOpacity` increased 0.05 → 0.25 (visibly grounded).

### Docs
- AGENTS.md, RULES.md, ARCHITECTURE.md, STATUS.md, UIKIT3.md fully rewritten
  for accuracy (removed stale landing/dock/8-section refs, added i18n/meta/
  WorkCards/Enter/ground contracts)
- RULES.md expanded: 51 rules with bug provenance (was 49, added Enter/ground/i18n/meta/WorkCards)

## 2026-07-11 — Multi-page architecture + code review fixes

### Architecture
- Multi-page: splash (/) → app (/app) → blog (/blog + /blog/[slug]) → landing (/landing)
- Vite multi-page input (index + app + landing + blog + 4 articles)
- Splash: inline CSS+JS ~15KB, FCP-critical. Config switchers (theme/sound). Enter → /app
- App loader: CRT curtains + progress bar (15→40→55→85→95→100%). 6s timeout fallback
- Landing: prerendered semantic HTML5, UIkit3 + QF theme, no JS-dependent styles
- Blog: 4 articles (2 case studies + 2 process notes), JSON-LD BlogPosting, OG/Twitter meta

### Theme
- 2-mode: auto (global light) / inverse (global dark). YooTheme Pro approach
- ThemeManager: global flip, not per-section. `setAutoTheme()` removed
- EnvSphere: global theme sync (auto→Intro light pattern, inverse→About dark)
- `_import.less`: `@global-primary-background = @jlz-color-accent` (QF anchor)
- Removed: @button-*, @card-*, @progressbar-* overrides (QF handles via @global-*)

### Navigation
- Cube-map layout on ALL pages: 0=secret, 1=intro(start), 2-4=main, 5=secret
- Vertical cycles 1-4, horizontal toggles 0/5 (same as home Lab↔Process)
- Slider nav: per-page labels (PAGE_SLIDER_LABELS), visible on all app pages
- Secret sections removed from UIMenu (hidden = hidden)
- JoystickNav: `_navigateVertical` boundary fix (wasInSide capture)

### 3D
- SplashCube: RoundedBoxGeometry (bevel 0.04) — smooth edges, no aliasing
- CubeCamera restored (512×512) + material.envMap connected
- MSAA 4× on scene WebGLRenderTarget (fixes edge aliasing on WebGL2)
- Opener: scale pulse 1.0→1.3→1.0 (was broken — openerProgress never applied to mesh)
- Particles: removed from 4 sections (kept only Intro + Works)
- EnvSphere: removed per-section changeSection (global theme only)
- BG.ts: deleted (dead computation, bg.color never read)
- DrawTrail: renders on mousemove (Works section, rAF-throttled)

### UI
- Custom cursor: codrops-style (inner dot + noisy circle). Red on hover. Bump on click.
- Dock: 2-row bottom bar (tools 70px + footer ~48px) on ALL pages. Joystick 110px, centered
- Subtitles: NoiseText scramble on [data-eyebrow] (merged with old .jlz-eyebrow)
- Services + Manifesto: cube-map layout, mobile-first content, PROCESS_STEPS shared

### Code review fixes
- Experience.destroy(): clear window.experience + Experience.instance + cancel rAF
- Dead code: setAutoTheme, jlj:navigate, JoystickNavOptions, UIMenuOptions.sectionLabels
- EventBus: jlz:route-change added to AppEvents

### Ponytail audit (~315 LOC removed)
- Dead presets (sec_flexible/sec_innovative) in PostProcessingManager + Lights
- StateBus: snapshot/hasAnimations/activeAnimations/reset
- DeviceCapability: 6 dead TierConfig fields + 2 dead methods
- makeInstancedParticles: 2 no-ops + World.ts caller
- 6 barrel index.ts files (sections)
- Noise.ts: dead fade/lerp/grad/noise4d (kept organicValue)
- landing.less: removed duplicates with UIKit base
- UIManager: empty init() removed

### Docs
- 8 historical docs removed (AUDIT, STORYBOARD, IMPROVEMENT_PLAN, AUTONOMY, etc.)
- AGENTS/STATUS/RULES/ARCHITECTURE/UIKIT3 rewritten — concise, LLM-optimized
- CHANGELOG trimmed to latest entry
