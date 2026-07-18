# Refactor Worklog — UIkit KISS cleanup

Goal: eliminate `.jlz-*` duplication of UIkit, remove dead code & overengineering,
update stale docs, bring project to a clean working state. KISS.

## Branch
`refactor/uikit-kiss-cleanup` (off `main`)

## Entry audit findings (Task 1)
(see appended Task 1 section below)

---
Task ID: 1
Agent: audit
Task: Comprehensive duplication/dead-code audit of webgpu repo

Work Log:
- Read REFACTOR-WORKLOG.md for context; confirmed task scope is read-only.
- Inventoried every `.jlz-*` selector in `src/assets/main.less`, `src/assets/blog.less`, `src/assets/_import.less`, and the inline `<style>` in `index.html` / `blog.html` (projects/*.html and blog/*.html have no inline styles).
- For each unique class, ran `rg -l "<cls>"` across `src/**/*.ts`, `*.html`, `projects/*.html`, `blog/*.html` (excluding the LESS source itself) and marked USED / DEAD. Re-checked dynamic-template classes (`--${layout}` in `works.ts:80,97`) which `rg -F` initially missed.
- Cross-checked classes emitted in TS markup but never defined in CSS; produced a list of 22 unstyled class names.
- Tallied every `jlz:` custom event for dispatch vs listen counts; verified false positives (`jlz:lang`, `jlz:sound`, `jlz:theme`, `jlz:devpanel`, `jlz:force-cursor` are localStorage keys, not events; `jlz:webgl-ready/failed` are emitted via `eventBus.emit()`).
- Confirmed `ShowreelButton3D` is disabled in `src/sections/intro/scene.ts:16-18` → all showreel raycaster handlers in `Experience.ts:601-666, 742-744, 817-818, 955-967, 1064-1074, 1170-1178` and the `#jlz-showreel-trigger` query in `UIManager.ts:39-46` are dead paths.
- Searched for unused TS modules by counting external importers per file via `rg -l "from '.*<base>'"`; confirmed `MeshTransmissionMaterial.ts`, `roundedRectGeometry.ts` are never imported; confirmed `ErrorTracker.ts` and `DevPanel.ts` are dynamically imported (false positives).
- Tallied usage counts for every `uk-*` component class; compared against the live imports in `_import.less:466-523` to identify both dead-live imports AND commented-out imports whose component is actually used (3 stale-comment bugs).
- Searched every font/texture/asset path under `public/` and `src/assets/fonts/` for references in src/HTML; identified 14+ dead asset files.
- Read every doc (`docs/ARCHITECTURE.md`, `docs/RULES.md`, `docs/UIKIT3.md`, `docs/BRAND.md`, `docs/DEVELOPMENT.md`, `docs/README.md`, `AGENTS.md`, `README.md`, `NEXT.md`, `docs/PLAN-studio-console-theme.md`, `docs/PLAN-showreel-shader-plane.md`) and compared each path/file/module claim against current `LS` of `src/`, `docs/`, `public/`.
- Verified the six-section route table in `docs/ARCHITECTURE.md:30-50` against `src/router.ts:13-20` and `src/core/WorldConfig.ts:148-373`.
- Read the full text of `FullscreenOverlay.ts`, `UIMenu.ts`, `CinematicNav.ts`, `WorkCards.ts`, `UIManager.ts`, `_shared/constants.ts`, `works/template.ts`, `nav/template.ts`, `lab-overlay/template.ts`, `intro/about/contact/template.ts`, `pages/content/services.ts`, `pages/content/contact.ts`, `pages/content/works.ts` to map every emitted `jlz-*` class.
- Read each core abstraction (`StateBus.ts`, `EventBus.ts`, `motionPolicy.ts`, `pageMeta.ts`, `DevPanel.ts`, `ErrorTracker.ts`, `ThemeManager.ts`) and its importers to judge whether the abstraction earns its complexity.

Stage Summary:

## A. `.jlz-*` class inventory

### A.0 Scope
- `_import.less` defines NO `.jlz-*` selectors (only `@jlz-*` Less vars + `--jlz-*` CSS custom properties) — out of scope for the duplication complaint.
- `main.less` defines ~165 unique `.jlz-*` selectors (3,616 lines total).
- `blog.less` defines 22 unique `.jlz-*` selectors.
- `index.html` inline `<style>` defines 11 `.jlz-*` classes (splash/loader/config).

### A.1 DEAD `.jlz-*` selectors (defined in CSS, never referenced in any `.ts` template or HTML)
Grouped by area; line citations are the first definition in `main.less` unless noted.

| Area | Class | First def | Notes |
| --- | --- | --- | --- |
| Scroll hint | `.jlz-scroll-hint` | `main.less:457` | No template emits it |
| Scroll hint | `.jlz-scroll-hint__label` | `main.less:468` | Dead |
| Scroll hint | `.jlz-scroll-hint__line` | `main.less:476` | Dead (incl. `::after` at 484, 1003) |
| Help / hint | `.jlz-help-hint` | `main.less:3021` | Dead (incl. media at 3037) |
| Help / hint | `.jlz-joystick__arrow-label` | `main.less:3040` | Dead (incl. `--left/--right` at 3043,3046) |
| Numeral utility | `.jlz-numeral` | `main.less:1064` | Dead |
| Numeral utility | `.jlz-numeral--sm` | `main.less:1070` | Dead |
| Numeral utility | `.jlz-numeral--date` | `main.less:1074` | Dead |
| Text utility | `.jlz-text-subtle` | `main.less:1093` | Dead — duplicates `uk-text-meta` |
| Flex gap utility | `.jlz-flex-gap-large` | `main.less:1183` | Dead (only `--small` is used) |
| Joystick | `.jlz-joystick` | `main.less:1196` | Joystick removed; only `--jlz-joystick-size` CSS var remains in use |
| Joystick | `.jlz-joystick__base` | `main.less:1324` (media) | Dead |
| Joystick | `.jlz-joystick__ball` | `main.less:1329` (media) | Dead |
| Joystick nav | `.jlz-joystick-dotnav` | `main.less:1216` | Reimplements `uk-dotnav`; no template emits it |
| Joystick nav | `.jlz-joystick-dotnav__label` | `main.less:1255` | Dead |
| Joystick nav | `.jlz-joystick-dotnav__marker` | `main.less:1267` | Dead (incl. `::after` at 1280) |
| Showreel overlay | `.jlz-showreel-overlay` | `main.less:2006` | Dead; `FullscreenOverlay.ts` owns the overlay now |
| Showreel trigger | `.jlz-showreel-trigger` | `main.less:2018` | Dead — only `#jlz-showreel-trigger` (id) is queried in `UIManager.ts:41`, no element carries that id |
| Showreel trigger | `.jlz-showreel-trigger__ring` | `main.less:2040` | Dead (incl. media at 2133) |
| Showreel trigger | `.jlz-showreel-trigger__circle` | `main.less:2052` | Dead (incl. media at 2144) |
| Showreel trigger | `.jlz-showreel-trigger__icon` | `main.less:2087` | Dead |
| Showreel trigger | `.jlz-showreel-trigger__label` | `main.less:2104` | Dead (incl. media at 2137) |
| Showreel keyframe | `@keyframes jlz-showreel-stroke` | `main.less:2074` | Dead |
| Lab overlay | `.jlz-lab-overlay-top` | `main.less:3462` | Lab overlay is gone; `lab-overlay/template.ts` now renders `jlz-contact-footer__*` |
| Lab overlay | `.jlz-lab-overlay-bottom` | `main.less:3466` | Dead (incl. media at 3583) |
| Lab accordion | `.jlz-lab-accordion` | `main.less:3471` | Dead — reimplements `uk-accordion` (imported but unused); no template emits any `.jlz-lab-accordion*` |
| Lab accordion | `.jlz-lab-accordion__item` | `main.less:3482` | Dead |
| Lab accordion | `.jlz-lab-accordion__title` | `main.less:3486` | Dead |
| Lab accordion | `.jlz-lab-accordion__num` | `main.less:3515` | Dead |
| Lab accordion | `.jlz-lab-accordion__name` | `main.less:3519` | Dead |
| Lab accordion | `.jlz-lab-accordion__meta` | `main.less:3524` | Dead |
| Lab accordion | `.jlz-lab-accordion__content` | `main.less:3531` | Dead |
| Lab accordion | `.jlz-lab-accordion__preview` | `main.less:3536` | Dead |
| Lab accordion | `.jlz-lab-accordion__image` | `main.less:3548` | Dead |
| Lab accordion | `.jlz-lab-accordion__action` | `main.less:3556` | Dead |
| Blog | `.jlz-blog-content` (+ children) | `blog.less:27,29,30,42,44,45,98,99,109,117,162,166,167,173,183,189,193` | No blog HTML uses it |
| Blog | `.jlz-blog-eyebrow` | `blog.less:379` | Dead |
| Blog | `.jlz-back-link` | `blog.less:407` | Dead |

Comment-only mentions of removed classes (already deleted, NOT a target): `.jlz-event-row`, `.jlz-gallery-tile`, `.jlz-corner-label`, `.jlz-hint`, `.jlz-hint__text`, `.jlz-case-tile`, `.jlz-contact-link`, `.jlz-timeline`, `.jlz-service-card`, `.jlz-principle-card`, `.jlz-showreel-modal`, `.jlz-nav-link`, `.jlz-navbar-toggle`, `.jlz-toggle-icon`, `.jlz-help-content/controls/divider/dropdown/joystick/key/text/text-row/title`, `.jlz-joystick-svg` (see `main.less:371,511,513,514,1054,1079,1187,3016-3018,3031,3051,3052`).

### A.2 `.jlz-*` classes emitted in TS/HTML but NEVER DEFINED in CSS (orphan markup — silently unstyled)

| Class | Emitted at | Notes |
| --- | --- | --- |
| `.jlz-bottom-module` | `sections/_shared/constants.ts:111` | Inherits `.jlz-cinematic-shell` styling via same element; class itself has 0 rules |
| `.jlz-bottom-module__meta` | `sections/_shared/constants.ts:112` | 0 rules — visible only via inheritance |
| `.jlz-bottom-module__content` | `sections/_shared/constants.ts:116` | 0 rules |
| `.jlz-case-plane` | `pages/content/works.ts:46` | Marker only, 0 rules |
| `.jlz-work-card--primary` / `--secondary` | `pages/content/works.ts:46` | 0 rules — only base `.jlz-work-card` styled |
| `.jlz-work-slot--primary` / `--secondary` | `pages/content/works.ts:45` | 0 rules — wrappers have no styling |
| `.jlz-works-grid` | `pages/content/works.ts:97` | 0 rules — only used as a `querySelector` hook in `WorkCards.ts:100,104` |
| `.jlz-works-page` | `pages/content/works.ts:107` | 0 rules |
| `.jlz-works-slider-arrow--prev` / `--next` | `sections/works/template.ts:13,17` | 0 rules — only `.jlz-works-slider-arrow.uk-icon-button` is styled |
| `.jlz-telegram-cta__halo` | `sections/lab-overlay/template.ts:24` | 0 rules |
| `.jlz-telegram-cta__icon` | `sections/lab-overlay/template.ts:25` | 0 rules |
| `.jlz-telegram-cta__copy` | `sections/lab-overlay/template.ts:26` | 0 rules |
| `.jlz-telegram-cta__label` | `sections/lab-overlay/template.ts:27` | 0 rules |
| `.jlz-telegram-cta__handle` | `sections/lab-overlay/template.ts:28` | 0 rules |
| `.jlz-telegram-cta__arrow` | `sections/lab-overlay/template.ts:30` | 0 rules (only `.jlz-telegram-cta` base + media at `main.less:2945` exist) |
| `.jlz-fs-info` | `UI/FullscreenOverlay.ts:74` | 0 rules — wrapper div for cat/title/desc |
| `.jlz-fs-play` | `UI/FullscreenOverlay.ts:94` | 0 rules — only `.jlz-fs-big-play` is styled |
| `.jlz-lang-toggle` | `UI/UIMenu.ts:54` | 0 rules — only `.jlz-lang-label` and `.jlz-theme-toggle` siblings are styled |
| `.jlz-menu-launcher__label` | `UI/UIMenu.ts:76` | 0 rules — only `.jlz-menu-launcher` and `__glyph` are styled |
| `.jlz-contact-launcher__arrow` | `UI/UIMenu.ts:86` | 0 rules — `__button` and `__orb` are styled, `__arrow` (a `<span uk-icon>`) is unstyled |
| `.jlz-menu-col--nav` | `sections/nav/template.ts:304` | 0 rules — only `.jlz-menu-col--stat` is styled |
| `.jlz-menu-nav__item--direct` | `sections/nav/template.ts:269` | 0 rules — modifier class with no styles |
| `.jlz-menu-nav__direct-link` | `sections/nav/template.ts:270` | 0 rules |
| `.jlz-menu-nav__sub-item` | `sections/nav/template.ts:289` | 0 rules |
| `.jlz-menu-sheet__eyebrow` | `sections/nav/template.ts:337` | 0 rules — only `.jlz-menu-sheet__header` is styled |

These should either be styled (if visual intent exists) or removed from markup (if they are vestigial). The `--primary/--secondary/--feature/--reverse` etc. variants that DO have rules but are emitted via template-literal interpolation are NOT in this list (they are defined and used).

### A.3 `.jlz-*` classes that REIMPLEMENT UIkit components/behaviors UIkit already owns

| Custom class | file:line | UIkit equivalent | Notes |
| --- | --- | --- | --- |
| `.jlz-fs-overlay` + `.jlz-fs-dialog/.fs-close/.fs-meta/.fs-info/.fs-cat/.fs-title/.fs-desc/.fs-meta-end/.fs-counter/.fs-tags/.fs-tag/.fs-media-stage/.fs-poster/.fs-video/.fs-big-play/.fs-controls/.fs-seek/.fs-time/.fs-volume/.fs-prev/.fs-next` | `main.less:524-885`; emitted from `FullscreenOverlay.ts:65-105` | `uk-modal uk-modal-full` + `uk-modal-dialog` + `uk-modal-close-full` + `uk-modal-title` + `uk-modal-body` + `uk-modal-footer` + `uk-slider` (for prev/next) | The container already IS `uk-modal uk-modal-full uk-light`; every child is custom. Prev/next use `uk-slidenav-*` icons but not the `uk-slider` API. |
| `.jlz-menu-overlay` + `.jlz-menu-container/.menu-grid/.menu-col/.menu-col-title/.menu-nav/.menu-nav__item/.menu-nav__toggle/.menu-nav__label/.menu-nav__arrow/.menu-nav__subs/.menu-nav__sub-link/.menu-stat/.menu-stat__num/.menu-stat__label/.menu-sheet__header/.menu-sheet__eyebrow/.menu-sheet__close` | `main.less:2528-2646, 3144-3456`; emitted from `nav/template.ts:249-345` | `uk-offcanvas` or `uk-modal uk-modal-full` (sheet) + `uk-nav uk-nav-default` + `uk-parent`/`uk-nav-sub` + `uk-grid` (the markup already uses `uk-nav`/`uk-nav-default`/`uk-parent`/`uk-nav-sub`/`uk-nav-parent-icon` — UIKit owns the accordion behaviour) | The actual nav behaviour IS UIkit. The custom CSS only re-implements the **layout shell** (full-bleed sheet, 2-col grid, stat column). UIkit `uk-offcanvas-bar` / `uk-modal-dialog` could provide most of this. |
| `.jlz-joystick-dotnav` + `__label` + `__marker` + `::after` | `main.less:1216-1313` | `uk-dotnav uk-dotnav-vertical` (component IS imported in `_import.less:495` but never used) | Pure duplication. The custom version is also DEAD (A.1). |
| `.jlz-lab-accordion*` | `main.less:3471-3568` | `uk-accordion` (imported in `_import.less:484` but never used) | Pure duplication. Also DEAD (A.1). |
| `.jlz-works-slider-arrow` (+ `:hover`/`:focus-visible`) | `main.less:2303-2348`; emitted from `sections/works/template.ts:13,17` as `class="jlz-works-slider-arrow jlz-works-slider-arrow--prev/next uk-icon-button"` | The element already carries `uk-icon-button`; the custom class only adds positioning + `:hover` border treatment. The `:hover` border could be a UIkit hook (`.hook-icon-button-hover` already exists in `_import.less:430`). | Mild duplication. |
| `.jlz-sheet-close` | `main.less:2600`; emitted as `class="uk-close-large jlz-sheet-close"` | Element already carries `uk-close-large` + `uk-close`. Custom class adds positioning only. | Borderline. |
| `.jlz-storyline` + `__items/__item/__number/__label/__hint` | `main.less:2422-2490`; emitted from `CinematicNav.ts:50-83` | `uk-dotnav uk-dotnav-vertical` for the nav rail + `uk-text-meta` for hint | This is bespoke (custom progress markers), not a strict 1:1 duplication, but it duplicates the dotnav concept entirely. |
| `.jlz-contact-launcher__button` | `main.less:2501`; emitted as `class="uk-button uk-button-primary jlz-contact-launcher__button"` | Element already carries `uk-button uk-button-primary`; custom class only adds orb + arrow layout | Borderline. |
| `.jlz-menu-launcher` | `main.less:2388`; emitted as `class="uk-button uk-button-default jlz-menu-launcher"` | Element already carries `uk-button uk-button-default`; custom class only adds the hamburger glyph layout | Borderline. |
| `.jlz-sound-toggle` | `main.less:3058-3135`; emitted as `class="uk-icon-button jlz-sound-toggle"` | Element already carries `uk-icon-button`; custom class adds the 4-bar equalizer animation (no UIKit equivalent) | Justified — UIKit has no animated EQ icon. |
| `.jlz-theme-toggle` | `main.less:3122-3135`; emitted as `class="uk-icon-button jlz-theme-toggle"` | UIKit has no sun/moon toggle. Custom SVG + `is-inverse` state. | Justified. |

### A.4 `.jlz-*` utility classes duplicating UIkit utility classes

| Custom class | file:line | UIkit equivalent | Notes |
| --- | --- | --- | --- |
| `.jlz-numeral` / `--sm` / `--date` | `main.less:1064-1077` | `uk-text-meta` + `uk-width-*` for the min-width | DEAD anyway (A.1) |
| `.jlz-text-subtle` | `main.less:1093` | `uk-text-meta` (already provides muted tone) | DEAD anyway (A.1) |
| `.jlz-flex-gap-small` / `-large` | `main.less:1179-1185` | UIkit `uk-flex` has no `gap`; modern CSS `gap-*` or `uk-grid` is the alternative. `--small` is used in `contact.ts:26`; `--large` is DEAD | `--small` partially justified; `--large` deletable. |
| `.jlz-section-top` / `.jlz-section-bottom` | `main.less:1037-1048` | `uk-section` padding utilities (`uk-section-small`, `uk-section-large@m`) — already used by `sectionShell()` in `_shared/constants.ts:71` | The custom classes only add fixed `padding-top: calc(48px + var(--jlz-space-6))` to clear the topbar. Justified for that one job. |
| `.jlz-eyebrow` | `main.less:1016-1035` | `uk-text-meta` + `uk-text-small` + monospace family (UIKit does not own a "terminal eyebrow" pattern) | Justified — bespoke typography. |
| `.jlz-contact-form` | `main.less:1086-1089` | `uk-form-stacked` / `uk-flex` (the markup already uses `uk-flex uk-flex-center uk-flex-middle`) | The custom class only adds `flex-wrap: wrap; gap: var(--jlz-space-2)`. Could be `uk-flex uk-flex-wrap` + `uk-margin-small-right` on children. Borderline. |
| `.jlz-service-explore` + `__dot` | `main.less:1117-1135`; emitted as `class="jlz-service-explore uk-button uk-button-default uk-button-small uk-margin-top"` | UIKit button already owns sizing; `__dot` is a tiny decorative bullet | Borderline — `__dot` is genuinely bespoke (custom pill marker). The `jlz-service-explore` class itself adds `letter-spacing: 0.15em` which could be a UIKit hook. |
| `.jlz-experiment-footer` + `__mode/__state` | `main.less:1139-1174` | `uk-text-meta` + `uk-flex` (the markup already uses `uk-flex uk-flex-wrap`) | Bespoke console labels — justified. |

## B. Dead / unused code

### B.1 Dead TS modules (exports never imported anywhere)

| File | Export | Status |
| --- | --- | --- |
| `src/Experience/World/MeshTransmissionMaterial.ts:20` | `class MeshTransmissionMaterial` | DEAD — 0 external importers |
| `src/Utils/roundedRectGeometry.ts:1` | (only an inline comment, no exports) | DEAD file — 0 importers, 0 exports |
| `src/Experience/World/ShowreelButton3D.ts:29` | `class ShowreelButton3D` | Effectively dead — referenced only via TS type imports (`import('...').ShowreelButton3D`) in `Experience.ts:1172,1178`; the 3D button is disabled at `src/sections/intro/scene.ts:16-18` so `_getShowreelButton()` always returns null and every showreel handler early-returns |

### B.2 Commented-out `.less` imports in `_import.less` — verification

Live imports that should be COMMENTED OUT (component never used anywhere in markup):

| Line | Import | Usage count | Verdict |
| --- | --- | --- | --- |
| `_import.less:464` | `progress.less` | `uk-progress` = 0 usages | DEAD IMPORT |
| `_import.less:465` | `badge.less` | `uk-badge` = 0 usages | DEAD IMPORT |
| `_import.less:467` | `divider.less` | `uk-divider` = 0 usages (only `uk-table-divider`, owned by table.less) | DEAD IMPORT |
| `_import.less:478` | `overlay.less` | `uk-overlay` = 0 usages | DEAD IMPORT |
| `_import.less:482` | `slider.less` | `uk-slider` = 2 usages (`sections/works/scene.ts`, `Experience/World/BakuCarousel.ts`) — needs verification of which | KEEP |
| `_import.less:483` | `sticky.less` | `uk-sticky` = 0 usages | DEAD IMPORT |
| `_import.less:484` | `accordion.less` | `uk-accordion` = 0 usages (uk-nav extends Accordion internally but nav.less is what's actually used) | DEAD IMPORT |
| `_import.less:486` | `notification.less` | `uk-notification` = 0 usages | DEAD IMPORT |
| `_import.less:491` | `article.less` | `uk-article` = 0 usages | DEAD IMPORT |
| `_import.less:495` | `dotnav.less` | `uk-dotnav` = 0 usages | DEAD IMPORT |
| `_import.less:497` | `marker.less` | `uk-marker` = 0 usages | DEAD IMPORT |
| `_import.less:498` | `subnav.less` | `uk-subnav` = 0 usages | DEAD IMPORT |
| `_import.less:462` | `icon.less` | `uk-icon` = 32 usages | KEEP |
| `_import.less:476` | `close.less` | `uk-close` = 3 usages | KEEP |
| `_import.less:479` | `modal.less` | `uk-modal` = 8 usages | KEEP |
| `_import.less:487` | `tooltip.less` | `uk-tooltip` = 5 usages | KEEP |
| `_import.less:490` | `grid.less` | `uk-grid` = 9 usages | KEEP |
| `_import.less:493` | `form.less` | `uk-form` = 1 usage (`pages/content/contact.ts:55-57`) | KEEP |
| `_import.less:500` | `iconnav.less` | `uk-iconnav` = 5 usages (blog footers) | KEEP |
| `_import.less:503` | `nav.less` | `uk-nav` = 6 usages | KEEP |
| `_import.less:504` | `navbar.less` | `uk-navbar` = 66 usages | KEEP |
| `_import.less:505` | `slidenav.less` | `uk-slidenav` = 2 usages | KEEP |

Commented-out imports that ARE ACTUALLY USED — **stale-comment BUG** (component used but stylesheet not loaded → component renders with browser defaults):

| Line | Import | Usage |
| --- | --- | --- |
| `_import.less:477` | `spinner.less` (commented out) | `projects/ebb-vibes.html:25`, `undercurrent.html:24`, `till-at-night.html:24`, `mono-sunday.html:24` all emit `<div uk-spinner="ratio:2">`. Spinner does not render. (Note: projects/*.html do not load UIkit CSS at all — see B.3 — so this is one of several broken class refs.) |
| `_import.less:492` | `table.less` (commented out) | `blog/undercurrent-webgpu-fluid.html:184`, `blog/on-demand-rendering.html:196` emit `<table class="uk-table uk-table-divider">`. Table renders with browser defaults instead of UIkit table styling. |
| `_import.less:494` | `form-range.less` (commented out) | `src/UI/FullscreenOverlay.ts:100` emits `<input class="jlz-fs-seek uk-range" type="range">`. The seek bar is an unstyled native range input; `.jlz-fs-seek` (`main.less:769-772`) only sets `flex:1; cursor:pointer`. |

Correctly-commented imports (component never used):
- `_import.less:466` `label.less` (uk-label = 0)
- `_import.less:468` `search.less` (uk-search = 0)
- `_import.less:485` `tab.less` (uk-tab = 0)
- `_import.less:488` `drop.less` (uk-drop = 0)
- `_import.less:489` `offcanvas.less` (uk-offcanvas = 0)
- `_import.less:496` `leader.less` (uk-leader = 0)
- `_import.less:499` `thumbnav.less` (uk-thumbnav = 0)

### B.3 Unused assets (referenced nowhere in `src/`, `*.html`, `public/_headers`)

| Asset | Status |
| --- | --- |
| `public/assets/text-1.png` | DEAD — 0 references |
| `public/assets/text-2.png` | DEAD — 0 references |
| `public/assets/textures/sec2-bg-text.png` | DEAD — 0 references |
| `public/assets/textures/flexible-title.png` | DEAD — 0 references |
| `public/textures/glass-flakes.png` | DEAD — 0 references |
| `public/fonts/helvetiker_bold.typeface.json` | DEAD — 0 references (only `src/assets/fonts/comfortaa_bold_subset.typeface.json` is imported by `WireframeTypography.ts:10`) |
| `src/assets/fonts/helvetiker_bold.typeface.json` | DEAD — 0 references |
| `public/fonts/inter.css` | DEAD — never linked from any HTML |
| `public/fonts/inter-400.woff2` | DEAD — only referenced by `inter.css` which is itself unused |
| `public/fonts/inter-700.woff2` | DEAD (same) |
| `public/fonts/inter-900.woff2` | DEAD (same) |
| `public/logo.png` | DEAD — 0 references (`logo.svg` is the one in use) |
| `public/icons.svg` | DEAD — only `public/_headers:48` references the path for caching; no HTML/TS uses it as a UIkit icon sprite |
| `public/basis/basis_transcoder.js` + `.wasm` | DEAD — 0 references in src/HTML (only mentioned in `public/basis/README.md`) |
| `public/fonts/Onest-OFL.txt` | Vestigial license stub — `onest.css` is what's linked, not this txt |
| `public/fonts/Comfortaa-OFL.txt` | Vestigial license stub — the only font actually used from Comfortaa is the inlined JSON in `src/assets/fonts/comfortaa_bold_subset.typeface.json` |

### B.4 Dead DOM/JS wiring

| Wiring | Producer | Consumer | Verdict |
| --- | --- | --- | --- |
| `#jlz-showreel-trigger` id selector | None (no element with this id is ever created) | `UIManager.ts:41` (`target.closest('#jlz-showreel-trigger')`) | DEAD — handler never fires; `_showreelHandler` only ever invoked via `jlz:showreel-play` event listener in `Experience.ts:620` |
| `jlz:showreel-play` event dispatch | `Experience.ts:661` (inside `_showreelClickHandler`, gated on `_getShowreelButton()` returning non-null) | `Experience.ts:620` (`_showreelPlayHandler`) | DEAD PATH — `ShowreelButton3D` is disabled at `intro/scene.ts:16-18`, so `_getShowreelButton()` always returns null (line 1178), so the dispatch at line 661 never executes. Listener is wired but never receives the event. |
| `_showreelRaycaster`, `_showreelNdc`, `_showreelHovered`, `_showreelMoveHandler`, `_showreelClickHandler`, `_showreelPlayHandler` (and their `removeEventListener` calls in `dispose()`) | `Experience.ts:65-67, 601-666, 1064-1074` | All gated on `_getShowreelButton()` | Effectively dead. Removal requires touching `Experience.ts:59-67, 601-666, 742-744, 817-818, 955-967, 1064-1074, 1170-1178` plus `ShowreelButton3D.ts` itself plus comments in `intro/scene.ts:3-18` and `intro/template.ts:4-7,31-32`. |
| `jlz:section-change` event type | `EventBus.ts:11` (type union) | Emitted by `Experience.ts:414,865`; listened by `ContentReveal.ts:17,39,62` (via `eventBus.on`) | LIVE — wired correctly through EventBus bridge to window |
| `jlz:webgl-ready` / `jlz:webgl-failed` | `main-app.ts:78,85` (via `eventBus.emit`) | `entry-app.ts:181,187` (via `eventBus.on`) | LIVE |
| All other `jlz:*` events tallied | (see Work Log) | (see Work Log) | All wired; only `jlz:showreel-play` is a dead path |

## C. Overengineering signals

### C.1 TS abstractions — verdict per module

| Module | Lines | Importers | Verdict |
| --- | --- | --- | --- |
| `src/core/EventBus.ts` | 73 | `Experience.ts`, `ContentReveal.ts`, `main-app.ts`, `entry-app.ts`, `router.ts` | **Earns complexity.** Typed event payloads + automatic bridge to `window.dispatchEvent` for legacy listeners. Removing it would scatter type casts across 5 files. The 4 typed events (`webgl-ready`, `webgl-failed`, `section-change`, `route-change`) are exactly the lifecycle contracts that benefit from compile-time safety. |
| `src/core/StateBus.ts` | 197 | `Section.ts`, `World.ts`, `Experience.ts` | **Earns complexity.** Real animation engine (channels + easing + tick loop) replacing scattered `requestAnimationFrame` lerpers. Used by 3 importers; the singleton + `done:` event pattern is consistent. |
| `src/core/motionPolicy.ts` | 11 | `Experience.ts`, `Camera.ts`, `BakuCarousel.ts`, `Lights.ts`, `WorksPlaneStage.ts`, `main-app.ts` | **Borderline.** Only 2 functions: `prefersReducedMotion()` (5 importers) and `syncReducedMotionDataset()` (1 importer + tests). Could be inlined into a single shared util, but the dedicated file is harmless. Keeping it is fine. |
| `src/core/pageMeta.ts` | 87 | `router.ts` | **Earns complexity.** Per-route meta + canonical + OG/Twitter system. Used on every `renderView()` + every `jlz:lang-change`. Inlining would force the router to know about i18n meta keys. |
| `src/core/DevPanel.ts` | 311 | `Experience.ts:394` (dynamic import, dev-only) | **Earns complexity for dev mode.** Tweakpane-based diagnostics panel with FPS/draw-call/heap stats + exposure/ground-plane toggles + BakuCarousel prev/next/morph triggers. Heavy but only loaded when `import.meta.env.DEV`. The `unknown` casts (`this.exp as unknown as {...}`) to read private fields are ugly but localized. |
| `src/core/ErrorTracker.ts` | 41 | `main-app.ts:33` (dynamic import) | **Borderline.** A `console.error` wrapper with dedup + `unhandledrejection`/`error` listeners + ResizeObserver-loop suppression. The sendBeacon path was already removed (line 3-4 comment). Could be inlined as 20 lines in `main-app.ts`, but the dedup + benign-error guard justifies a small module. Keeping it is fine. |
| `src/core/ThemeManager.ts` | 72 | `ContentReveal.ts`, `UIMenu.ts` | **Earns complexity.** Owns `localStorage('jlz:theme')` + `auto`/`inverse` mode + dispatches `jlz:theme-change`. |
| `src/core/SfxSystem.ts` | 127 | `Experience.ts` | **Earns complexity.** Web Audio ambient sound system with mute + `jlz:sound-toggle` integration. |
| `src/core/i18n.ts` | 643 | `router.ts`, `UIMenu.ts`, `DevPanel.ts`, `ContentReveal.ts`, `pageMeta.ts` | **Earns complexity** (large EN/RU dictionary + `applyTranslations` + `t()`). The 643 lines are mostly string data, not code. |

### C.2 Repeated markup patterns across `src/sections/*/template.ts` and `src/pages/content/*.ts`

| Pattern | Locations | Could collapse to |
| --- | --- | --- |
| Home TOP block: `<div class="jlz-section-top uk-text-center uk-flex uk-flex-column uk-flex-middle"><span class="jlz-eyebrow" data-eyebrow data-eyebrow-text="NN">NN</span><h2 class="studio-title uk-heading-{tier} uk-margin-small-top uk-margin-remove-bottom" data-i18n="…">…</h2><p class="uk-text-lead uk-margin-small-top" data-i18n="…">…</p></div>` | `sections/intro/template.ts:12-16`, `sections/about/template.ts:7-11`, `sections/contact/template.ts:7-11` (3x identical except `data-eyebrow-text`, heading tier, i18n keys) | A `homeTop(eyebrow, titleKey, leadKey, tier)` helper in `_shared/constants.ts` (sibling of `contentTop()` which already exists at lines 88-105) |
| Home Explore button: `<a href="…" class="jlz-service-explore uk-button uk-button-default uk-button-small uk-margin-top"><span class="jlz-service-explore__dot" aria-hidden="true"></span><span data-i18n="common.explore">Explore</span></a>` | `sections/intro/template.ts:24-27`, `sections/about/template.ts:19-22`, `sections/contact/template.ts:20-23`, `pages/content/services.ts:67-72` (already extracted as local `serviceExplore()` helper), `pages/content/contact.ts:14-17, 27-30, 31-34` (3 inline copies) | Promote `serviceExplore(href, labelKey?)` from local helper in `services.ts` to `_shared/constants.ts`; use everywhere |
| `<div class=" uk-margin-small-top"><p class="uk-text-meta uk-margin-remove" data-i18n="…">…</p>…</div>` (note the stray leading space inside `class="…"`) | `sections/intro/template.ts:20`, `sections/about/template.ts:15`, `sections/contact/template.ts:15`, `pages/content/services.ts:59`, `pages/content/contact.ts:43` (5x with the same typo: `class=" uk-margin-small-top"`) | A `descBlock(lines: {key, text}[])` helper in `_shared/constants.ts` |
| `jlz-page` wrapper with `labOverlaySection('content')` + 4 main sections + `navOverlaySection('content')` | `pages/content/services.ts:77-108`, `pages/content/manifesto.ts` (same shape), `pages/content/lab.ts` (same shape), `pages/content/contact.ts:68-83`, `pages/content/works.ts:106-114` (5x same boilerplate) | A `contentPageShell(pageKey, mainSections: string[])` helper that wraps the 4 main sections + the two overlays |
| `serviceExplore()` helper | `pages/content/services.ts:67-72` (local) | Move to `_shared/constants.ts` and use from `contact.ts`, `intro/about/contact template.ts` |

### C.3 CSS blocks in `main.less` that re-implement layout primitives instead of using UIkit grid/flex/width

| Block | Lines | What it does | UIkit alternative |
| --- | --- | --- | --- |
| `.jlz-works-composition` + `--feature/--equal/--reverse/--cinematic` | `main.less:1487-1530, 1740-1742, 1836-1840, 1893-1902, 1931-1935` | Reimplements `uk-grid` responsive column widths via custom class modifiers. The markup at `pages/content/works.ts:97` ALREADY uses `uk-grid uk-grid-small` + `cardWidth()` returning `uk-width-2-3@m` etc. The custom `.jlz-works-composition` modifiers add `> * > *` nested-flex rules that could be `uk-flex uk-flex-column uk-height-1-1`. | Drop `.jlz-works-composition*` entirely; rely on `uk-grid` + `uk-width-*@m` (already present) + `uk-flex` for the inner column. |
| `.jlz-menu-grid` + `.jlz-menu-col` + `.jlz-menu-col--stat` + `.jlz-menu-col--nav` | `main.less:3165-3199` | Reimplements `uk-grid` + `uk-width-*` 2-column layout. The markup at `sections/nav/template.ts:342` does NOT use `uk-grid` — it relies entirely on `.jlz-menu-grid` custom CSS. | Replace with `uk-grid uk-grid-large uk-child-width-1-2@m` (or stat:nav ratio via `uk-width-1-4@m` + `uk-width-3-4@m`). |
| `.jlz-works-slider-controls` + `.jlz-works-slider-arrow` | `main.less:2292-2348` | Custom absolute-positioned prev/next button container. UIKit `uk-slider` + `uk-slider-container` provides `uk-slidenav-previous/next` + positioning. The Works section already uses `uk-icon-button` for the buttons. | Could use `uk-slider`'s `uk-position-*` utilities; the BakuCarousel already has its own slider logic, so this needs verification. |
| `.jlz-cinematic-shell .jlz-topbar` overrides | `main.less:3597-3615` | Overrides the same `.jlz-topbar` defined at `main.less:2354, 2982, 3003` (three separate definitions) — late cascade to override earlier rules. | Three `.jlz-topbar` definitions in the same file (`2354`, `2982`, `3003`) is itself a smell. Consolidate. |
| `.jlz-page .uk-container-expand` (`main.less:364`) + `.uk-container-expand` width:1440px override | `main.less:364-369` | Reimplements `uk-container-xlarge` (UIkit has `uk-container-xlarge`/`uk-container-expand`). | Replace with `uk-container uk-container-xlarge`. |
| `.jlz-flex-gap-small` / `-large` | `main.less:1179-1185` | Reimplements `gap` for `uk-flex`. UIKit does not provide `gap` utilities (a known gap). | Keep `--small` (used in `contact.ts:26`); delete `--large` (dead). |

## D. Documentation drift

### D.1 `docs/UIKIT3.md` — STALE (most material)
| Line | Claim | Reality |
| --- | --- | --- |
| 9 | "`src/assets/master-quantum-flares/` is a vendored snapshot of the licensed YOOtheme Pro Quantum Flares UIkit theme. The active starting variation is `master-quantum-flares/styles/black-blue.less`." | `src/assets/` contains ONLY `_import.less`, `blog.less`, `console-icons.ts`, `fonts/`, `main.less` (verified via `LS`). No `master-quantum-flares/`. |
| 17 | "Studio Console visual language — owner: `studio-console/`" | `studio-console/` does NOT exist. |
| 18 | "Legacy QF compatibility bridge — owner: `_quantum-flares-overrides.less`, `_theme-fixes.less`" | Neither file exists. |
| 19 | "Vendor/reference themes — `master-quantum-flares/`, `master-vibe/`" | Neither directory exists. |
| 27-30 | Both Less entries compile in the order: `@import './_import.less'; @import './_theme.less';` | `main.less:9` only has `@import './_import.less';`. `blog.less:13` only has `@import './_import.less';`. Neither imports `_theme.less` (which does not exist). |
| 32-37 | "`_theme.less` is the temporary assembly boundary: it imports the retained QF baseline and its compatibility bridge, then the project-owned `studio-console/` layer." | `_theme.less` does not exist. |
| 48-49 | "Put the project-owned styling decision in `studio-console/`." | `studio-console/` does not exist. |
| 52 | "do not rebuild modal, off-canvas, navbar, nav, accordion, grid, button, icon button or form behaviour" | The codebase rebuilds modal (`FullscreenOverlay.ts`/`.jlz-fs-*`), accordion (`.jlz-lab-accordion*`, dead), grid (`.jlz-works-composition`, `.jlz-menu-grid`). Doc is aspirational, not descriptive. |

### D.2 `docs/RULES.md` — STALE
| Line | Claim | Reality |
| --- | --- | --- |
| 47-48 | "Put every new shared visual decision in `studio-console/`; Quantum Flares remains only a temporary compatibility layer during migration." | `studio-console/` does not exist. Quantum Flares is not present anywhere in `src/`. |
| 74 | "Treat `public/basis/` and `references/` as vendored/reference material." | `public/basis/` exists but is unused (B.3). `references/` does NOT exist. |

### D.3 `docs/PLAN-studio-console-theme.md` — STALE
| Line | Claim | Reality |
| --- | --- | --- |
| 5 | "Make `studio-console/` the project theme for one WebGPU studio interface. Quantum Flares and Vibe remain read-only donor layers during migration" | None of `studio-console/`, `master-quantum-flares/`, `master-vibe/` exist. |
| 11 | "Keep `master-quantum-flares/` and `master-vibe/` immutable vendor/reference snapshots." | Neither directory exists. |
| 17 | "Foundation — complete. Add the `studio-console/` boundary…" | Marked complete but the boundary does not exist. |

### D.4 `docs/ARCHITECTURE.md` — MOSTLY ACCURATE
| Line | Claim | Reality |
| --- | --- | --- |
| 30-37 | Route table `/` `/services` `/works` `/manifesto` `/lab` `/contact` | Matches `src/router.ts:13-20` exactly. ✓ |
| 43-50 | Six-section model: 0=lab/Contact finale, 1=intro, 2=about, 3=works, 4=contact, 5=menu | Matches `src/core/WorldConfig.ts:148-374`. ✓ |
| 116 | "`World` creates the six section scene groups through `SectionSceneFactory`." | Matches `src/core/SectionSceneFactory.ts` existence + `src/core/World.ts` usage. ✓ |
| 192-195 | "`EventBus.ts` owns typed events (`jlz:webgl-ready`, `jlz:webgl-failed`, `jlz:section-change`, `jlz:route-change`)" | Matches `src/core/EventBus.ts:5-19`. ✓ |
| 134-136 | "`DrawTrail` is a transient Studio Console cursor signal on the standalone `/works` route only; it decays after pointer movement" | Matches `src/Experience/World/DrawTrail.ts` (1 importer). ✓ |

### D.5 `docs/BRAND.md` — ACCURATE
No stale claims. References `_import.less` and `main.less` (both exist). ✓

### D.6 `docs/DEVELOPMENT.md` — ACCURATE
No stale claims. References `index.html`, `jlz:webgl-ready`, `bun run` scripts (all exist). ✓

### D.7 `docs/README.md` — MINOR STALE
| Line | Claim | Reality |
| --- | --- | --- |
| 13 | "`PLAN-showreel-shader-plane.md` — The sole active detailed product plan" | The plan still exists at `docs/PLAN-showreel-shader-plane.md` ✓, but `NEXT.md:8-12` marks it "In progress" while the ShowreelButton3D it depends on is disabled (`src/sections/intro/scene.ts:16-18`). The plan's "Already complete" list (lines 27+) is partially inaccurate: the 3D showreel button is disabled, not complete. |
| 35-36 | "`public/basis/README.md` is vendored third-party licensing material and `references/next.junni.co.jp/README.md` is a read-only reference snapshot." | `references/` does NOT exist. |

### D.8 `AGENTS.md` — ACCURATE
No stale claims. References `docs/`, `scripts/session.sh`, `bun run` gate (all exist). ✓

### D.9 `README.md` — STALE
| Line | Claim | Reality |
| --- | --- | --- |
| 47 | "A fixed top bar provides language, theme and sound controls, while the joystick and keyboard control sections." | The **joystick is removed**. `CinematicNav.ts` owns native vertical scroll + keyboard arrows; the `.jlz-joystick*` CSS at `main.less:1196-1373` is dead (A.1). |

### D.10 `NEXT.md` — STALE
| Line | Claim | Reality |
| --- | --- | --- |
| 14-17 | "Studio Console theme evolution — continue the staged, project-owned migration in `docs/PLAN-studio-console-theme.md`" | The plan it points to is itself stale (D.3). |

### D.11 `WORKLOG.md` — historical journal (not flagged)
By design a decision journal; historical entries are accurate-as-of-their-date. Not flagged.

## E. Concrete refactor opportunities (ranked by impact / risk)

### Batch 1 — LOW RISK, pure deletion (do first)

1. **Delete dead `.jlz-*` CSS blocks** — removes ~600 LOC from `main.less` + ~50 from `blog.less`:
   - `.jlz-scroll-hint*` (`main.less:457-487, 1003-1008`)
   - `.jlz-numeral*` (`main.less:1060-1077`)
   - `.jlz-text-subtle` (`main.less:1091-1095`)
   - `.jlz-flex-gap-large` (`main.less:1183-1185`)
   - `.jlz-help-hint` + `.jlz-joystick__arrow-label*` (`main.less:3016-3046`)
   - `.jlz-joystick*` (all, `main.less:1192-1373`) — joystick removed from DOM
   - `.jlz-showreel-overlay`, `.jlz-showreel-trigger*`, `@keyframes jlz-showreel-stroke` (`main.less:2006-2155`)
   - `.jlz-lab-overlay-top`, `.jlz-lab-overlay-bottom`, `.jlz-lab-accordion*` (`main.less:3462-3590`)
   - `.jlz-blog-content*`, `.jlz-blog-eyebrow`, `.jlz-back-link` (`blog.less:98-193, 379-387, 407-423`)

2. **Delete dead TS modules**:
   - `src/Experience/World/MeshTransmissionMaterial.ts` (0 importers)
   - `src/Utils/roundedRectGeometry.ts` (0 importers, 0 exports)

3. **Delete dead assets** (B.3): `public/assets/text-1.png`, `text-2.png`, `public/assets/textures/sec2-bg-text.png`, `flexible-title.png`, `public/textures/glass-flakes.png`, `public/fonts/helvetiker_bold.typeface.json`, `src/assets/fonts/helvetiker_bold.typeface.json`, `public/fonts/inter.css`, `inter-400.woff2`, `inter-700.woff2`, `inter-900.woff2`, `public/logo.png`, `public/icons.svg`, `public/basis/basis_transcoder.js`, `basis_transcoder.wasm`, `public/basis/README.md`, `public/fonts/Onest-OFL.txt`, `public/fonts/Comfortaa-OFL.txt`.

4. **Remove dead UIkit Less imports** (B.2): `progress.less`, `badge.less`, `divider.less`, `overlay.less`, `sticky.less`, `accordion.less`, `notification.less`, `article.less`, `dotnav.less`, `marker.less`, `subnav.less` from `_import.less:464,465,467,478,483,484,486,491,495,497,498`. **Visual diff must be empty** for these (all 0 usages confirmed).

5. **Remove the dead `#jlz-showreel-trigger` document-click handler** in `UIManager.ts:39-46` (the handler can never fire; `FullscreenOverlay` is opened via `jlz:showreel-play` event listener in `Experience.ts:620` which itself is gated on a disabled button).

6. **Update stale docs** (D.1, D.2, D.3, D.7, D.9, D.10):
   - Rewrite `docs/UIKIT3.md` to remove all references to `master-quantum-flares/`, `studio-console/`, `_theme.less`, `_theme-fixes.less`, `_quantum-flares-overrides.less`, `master-vibe/`. Replace with the actual structure (`_import.less` is the only Less entry; `main.less` is the app layer; `blog.less` is the standalone blog layer).
   - Fix `docs/RULES.md:47-48` to remove `studio-console/` and Quantum Flares references.
   - Delete or rewrite `docs/PLAN-studio-console-theme.md` (the migration it describes never happened; the boundary it claims to add does not exist).
   - Fix `docs/README.md:35-36` to remove the `references/` reference (directory does not exist).
   - Fix `README.md:47` to remove "joystick" — the joystick is gone, navigation is native scroll + keyboard.
   - Fix `NEXT.md:14-17` to remove the link to the stale studio-console plan, or mark that plan abandoned.

### Batch 2 — MEDIUM RISK, visual check needed (do second)

7. **Fix the 3 stale-comment Less import bugs** (B.2): either uncomment `spinner.less` / `table.less` / `form-range.less` in `_import.less:477,492,494` OR remove the corresponding `uk-spinner` / `uk-table` / `uk-range` classes from `projects/*.html`, `blog/*.html`, and `FullscreenOverlay.ts:100`. Recommendation: uncomment the imports (the components ARE used) and visually verify the spinner / table / range input render correctly.

8. **Remove the orphan markup classes** (A.2) by either:
   - Adding minimal CSS for `.jlz-bottom-module`, `.jlz-fs-info`, `.jlz-fs-play`, `.jlz-lang-toggle`, `.jlz-menu-launcher__label`, `.jlz-contact-launcher__arrow`, `.jlz-menu-col--nav`, `.jlz-menu-nav__item--direct`, `.jlz-menu-nav__direct-link`, `.jlz-menu-nav__sub-item`, `.jlz-menu-sheet__eyebrow`, `.jlz-telegram-cta__halo/icon/copy/label/handle/arrow`, `.jlz-works-grid`, `.jlz-works-page`, `.jlz-works-slider-arrow--prev/next`, `.jlz-work-card--primary/secondary`, `.jlz-work-slot--primary/secondary`, `.jlz-case-plane` — OR
   - Removing them from the markup if they carry no semantic/querySelector value (`.jlz-works-grid` is a querySelector hook in `WorkCards.ts:100,104` — keep as a hook but document why it has no styling; remove the rest).

9. **Collapse `.jlz-works-composition*`** (C.3): drop the custom modifiers `--feature/--equal/--reverse/--cinematic` and the `> * > *` nested-flex rules at `main.less:1487-1530, 1740-1742, 1836-1840, 1893-1902, 1931-1935`. The markup at `works.ts:97-99` already uses `uk-grid uk-grid-small` + `cardWidth()` returning `uk-width-2-3@m` etc. Verify visual parity on all 4 layouts (feature/equal/reverse/cinematic).

10. **Collapse `.jlz-menu-grid` + `.jlz-menu-col*`** (C.3): replace with `uk-grid uk-grid-large uk-child-width-1-4@m uk-child-width-3-4@m` (stat column 1/4, nav column 3/4). Verify menu sheet layout on desktop and mobile.

11. **Replace `.jlz-flex-gap-small`** with `uk-grid uk-grid-small` (or `gap` utility) in `pages/content/contact.ts:26` and remove the class from `main.less:1179-1181`.

12. **Consolidate the three `.jlz-topbar` definitions** in `main.less:2354, 2982, 3003, 3597` into one. Late cascade overrides are brittle.

### Batch 3 — MEDIUM RISK, structural (do third)

13. **Remove the entire ShowreelButton3D dead path** (B.4): delete `src/Experience/World/ShowreelButton3D.ts`, remove the showreel raycaster fields + handlers from `Experience.ts:59-67, 601-666, 742-744, 817-818, 955-967, 1064-1074, 1170-1178`, remove the dead `_documentClickHandler` in `UIManager.ts:39-46`, and update comments in `src/sections/intro/scene.ts:3-18` and `src/sections/intro/template.ts:4-7,31-32`. The 3D showreel button has been disabled (commented-out) for some time; if product wants it back, this enables a clean reimplementation rather than resurrecting a half-wired path. Risk: product may want the 3D button re-enabled — confirm with owner first.

14. **Extract `homeTop()` + `serviceExplore()` + `descBlock()` helpers** into `_shared/constants.ts` (C.2): collapse the 3 inline copies of the home TOP block + 6+ inline copies of the Explore button + 5 copies of the `class=" uk-margin-small-top"` desc block. Touches `sections/intro/template.ts`, `sections/about/template.ts`, `sections/contact/template.ts`, `pages/content/services.ts`, `pages/content/contact.ts`, `pages/content/manifesto.ts`, `pages/content/lab.ts`. Verify i18n attrs (`data-i18n`, `data-i18n-placeholder`) and `data-eyebrow`/`data-eyebrow-text` survive the extraction.

15. **Extract `contentPageShell(pageKey, mainSections[])` helper** (C.2): collapse the 5 copies of the `jlz-page` wrapper + `labOverlaySection('content')` + 4 main sections + `navOverlaySection('content')` boilerplate. Touches all 5 `pages/content/*.ts` files. Risk: each page has slightly different active-section flagging and section IDs; the helper must accept those as parameters.

### Batch 4 — HIGHER RISK, design-level (defer; needs visual sign-off)

16. **Migrate `FullscreenOverlay.ts` markup to native UIkit modal subcomponents** (A.3): replace `.jlz-fs-dialog` with `uk-modal-dialog`, `.jlz-fs-title` with `uk-modal-title`, `.jlz-fs-desc` with `uk-modal-body > p`, `.jlz-fs-tags` with `uk-subnav`, `.jlz-fs-prev/next` with `uk-slidenav-position` + `uk-slidenav-previous/next`. Risk: the overlay currently uses a custom `.is-entered`/`.is-poster-ready`/`.is-plane-origin` state machine for the WebGL plane handoff; UIKit modal events (`show`/`shown`/`hide`) are already wired at `FullscreenOverlay.ts:190-234`. A pure markup swap is safe; deeper restructuring of the state machine is not.

17. **Migrate `.jlz-menu-overlay` shell to `uk-offcanvas`** (A.3): the markup already uses `uk-nav`/`uk-parent`/`uk-nav-sub`/`uk-nav-parent-icon` for behaviour; only the shell (full-bleed sheet, 2-col grid, stat column) is custom. Risk: CinematicNav owns `body[data-cinematic-sheet="menu"]` state + `inert` toggling; switching to `uk-offcanvas` would require routing UIKit's open/close events through that state machine.

18. **Audit `projects/*.html`** — these 4 standalone HTML files have NO UIkit CSS link in their `<head>` (only inline `<style>` for skip-link + pageLoader). All their `uk-*` classes (`uk-spinner`, `uk-flex`, `uk-text-center`, `uk-navbar`, `uk-grid`, `uk-button`, `uk-height-viewport`, etc.) render with browser defaults. Either add a UIkit CSS link to each, or rewrite them as static HTML without UIkit classes. They appear to be legacy standalone project detail pages superseded by the SPA `/works` route.

### Notes on what NOT to touch
- `StateBus`, `EventBus`, `motionPolicy`, `pageMeta`, `ThemeManager`, `SfxSystem`, `i18n`, `DevPanel`, `ErrorTracker` all earn their complexity (C.1). Do not inline them.
- `WireframeTypography` (uses `comfortaa_bold_subset.typeface.json`), `BakuCarousel`, `CasePlane`, `DrawTrail`, `ParticleBurst`, `JunniParticles`, `SplashCube`, `EnvSphere`, `Lights`, `WorksPlaneStage` — all imported by `World.ts` / `SectionSceneFactory.ts` / section scene factories. Do not delete.
- The six-section model + route table in `docs/ARCHITECTURE.md` matches `router.ts` and `WorldConfig.ts` exactly. Do not "fix" the docs there.
- The typed EventBus → window bridge pattern (`EventBus.ts:47-59`) is intentional. Do not split typed vs raw event systems.


---
Task ID: 5
Agent: b1-deletions
Task: B1 — mechanical deletions (dead TS modules, dead assets, dead UIkit Less imports)

Work Log:
- Read REFACTOR-WORKLOG.md (B.1, B.2, B.3), docs/RULES.md, docs/UIKIT3.md for scope and contract.
- Scope was pure deletion only — did NOT touch main.less / blog.less / template .ts files (owned by another agent).

1. Dead TS modules (B.1):
   - Verified `rg "MeshTransmissionMaterial" src/` → 0 hits outside the file itself; same repo-wide → only REFACTOR-WORKLOG.md mentions + the file's own contents. Deleted `src/Experience/World/MeshTransmissionMaterial.ts`.
   - Verified `rg "roundedRectGeometry" src/` → 0 hits outside the file itself; same repo-wide. Deleted `src/Utils/roundedRectGeometry.ts`.
   - `src/Utils/` is NOT empty after deletion (still has `Noise.ts`, `dispose.ts`); left the directory intact.

2. Dead assets (B.3): verified each with `rg "<filename>"` excluding REFACTOR-WORKLOG.md before deleting.
   - Deleted `public/assets/text-1.png`, `public/assets/text-2.png`
   - Deleted `public/assets/textures/sec2-bg-text.png`, `public/assets/textures/flexible-title.png`
   - Deleted `public/textures/glass-flakes.png` (dir kept — `sec3-particles.jpg` still present)
   - Deleted `public/fonts/helvetiker_bold.typeface.json` and `src/assets/fonts/helvetiker_bold.typeface.json`
   - Deleted `public/fonts/inter.css` + `inter-400.woff2` + `inter-700.woff2` + `inter-900.woff2` (tests/e2e.spec.ts:94,96 already asserts HTML does NOT link `/fonts/inter.css` — regression test continues to pass)
   - Deleted `public/icons.svg` — `public/_headers:48` only references the path for a `Cache-Control: public, max-age=31536000, immutable` header (harmless without the file); left `_headers` untouched per task instruction.
   - Deleted `public/basis/basis_transcoder.js`, `basis_transcoder.wasm`, `README.md` → removed now-empty `public/basis/` directory.
   - Deleted `public/fonts/Onest-OFL.txt` and `public/fonts/Comfortaa-OFL.txt` (vestigial license stubs; the actual fonts in use — `onest.css` + onest-variable.woff2 + the inlined `comfortaa_bold_subset.typeface.json` — are untouched).

   SURPRISE: `public/logo.png` (as named in the audit / task list) does NOT exist at that path. The only `logo.png` in the repo is at `public/assets/logo.png`. `rg "logo.png"` shows 0 references to either path in src/HTML/TS (only REFACTOR-WORKLOG.md mentions the name, and `public/_headers:38` references `/logo.svg` which IS the live asset). Treated `public/assets/logo.png` as the file the audit intended (it is the only candidate matching the audit's "DEAD — 0 references (`logo.svg` is the one in use)" description) and deleted it. Flagging here in case the audit owner wants to confirm the path discrepancy.

3. Dead UIkit Less imports (B.2): removed 11 `@import` lines from `src/assets/_import.less`:
   - `progress.less`, `badge.less`, `divider.less`, `overlay.less`, `sticky.less`, `accordion.less`, `notification.less`, `article.less`, `dotnav.less`, `marker.less`, `subnav.less`
   - Each `@import` line was deleted entirely (no comment stub left behind).
   - Did NOT touch `spinner.less` (~477), `table.less` (~492), `form-range.less` (~494) — those are stale-comment BUGS owned by another agent. Confirmed they remain commented out.

4. Verification:
   - `bun run type-check` (`tsc --noEmit`) → exactly 1 error: `src/entry-app.ts(165,10): error TS2307: Cannot find module '../../la6su-webgpu/src/assets/console-icons'`. Verified PRE-EXISTING via `git stash` + re-run: identical error appears on the unmodified tree. The path resolves OUTSIDE the repo (`/home/la6su-webgpu/...`), an artifact of the dev environment, not caused by any deletion in this batch. No new type errors introduced by Task 5.
   - `bun run lint` → 0 errors, 54 warnings (all pre-existing: `@typescript-eslint/no-explicit-any`, `no-console`, `@typescript-eslint/no-empty-object-type`). No new errors or warnings introduced.
   - `curl -s -o /dev/null -w "%{http_code}" http://localhost:5173/` → `200`. Dev server stays healthy.
   - Did NOT run `bun run build` or playwright tests per task instruction (deferred to the final gate agent).

Stage Summary:
- Deleted 2 dead TS modules (~150 LOC removed incl. comments).
- Deleted 18 dead asset files (4 PNG, 1 typeface JSON in public + 1 in src, 1 CSS + 3 woff2, 1 PNG logo, 1 SVG icon, 2 basis binary + 1 basis README, 2 OFL license stubs) + 1 now-empty directory (`public/basis/`).
- Removed 11 dead UIkit component `.less` imports from `_import.less`.
- No new type-check errors, no new lint errors, dev server still 200. No regressions introduced.

Next Actions for downstream agents:
- The pre-existing `entry-app.ts:165` module-resolution error (external `../../la6su-webgpu/...` path) is NOT in scope for B1; flagging for the orchestration owner — it predates this batch and likely needs an env-level fix (symlink / tsconfig path mapping) rather than a code change.
- Another agent still owns: (a) the 3 stale-comment Less import BUGS (spinner/table/form-range) — decide uncomment-vs-strip-classes; (b) CSS deletions in main.less/blog.less (Batch 1 items 1); (c) the orphan-markup `.jlz-*` classes (A.2); (d) the dead showreel path (B.4 / Batch 3 item 13).

---
Task ID: 7
Agent: b3-showreel
Task: B3 — ShowreelButton3D dead path removal + DOM showreel restore

Work Log:
- Read REFACTOR-WORKLOG.md (audit B.4 — lines 226-232, 389), docs/PLAN-showreel-shader-plane.md ("Intro showreel trigger — resolved" § lines 52-61), docs/RULES.md (UIkit-first contract; rule 4 on raw window.dispatchEvent only banning typed-event duplicates), docs/UIKIT3.md (`.jlz-*` namespace + `uk-button` ownership), src/UI/FullscreenOverlay.ts (open() API: mode:'video', videoSrc, poster, title, category), src/UI/UIManager.ts (dead `#jlz-showreel-trigger` handler), src/Experience/Experience.ts (full dead raycaster path).
- Verified importers before deletion: `rg "ShowreelButton3D" src/` → only TS type-import references in Experience.ts (lines 1172, 1178 — both inside `_getShowreelButton()`) plus comment references in intro/scene.ts and intro/template.ts. No runtime importers. The class was effectively dead per audit B.4.
- Verified `rg "jlz:showreel-play" src/` → dispatch at Experience.ts:661 (inside dead `_showreelClickHandler`) + listen at Experience.ts:620 (`_showreelPlayHandler`). The dispatch site dies with this batch; the listen site moves to UIManager.

1. Deleted `src/Experience/World/ShowreelButton3D.ts` entirely (146 LOC removed). The file is gone; Vite dev server returns the SPA fallback for the now-missing module path (expected).

2. Removed the dead showreel raycaster path from `src/Experience/Experience.ts` (~105 LOC removed; file went 1229 → 1124 lines):
   - Field declarations: `_showreelPlayHandler`, `_showreelClickHandler`, `_showreelMoveHandler`, `_showreelRaycaster`, `_showreelNdc`, `_showreelHovered` (was ~lines 59-67).
   - init() block at lines 601-666: `_showreelRaycaster` / `_showreelNdc` construction, `_showreelPlayHandler` definition + `jlz:showreel-play` window listener, `_showreelMoveHandler` pointermove raycast, `_showreelClickHandler` click raycast + `jlz:showreel-play` dispatch.
   - `_updateInner()` showreel references: `const showreelBtn = this._getShowreelButton()` + `const showreelActive = showreelBtn?.isAnimating ?? false` (was ~lines 742-744), `showreelActive ||` term in the render-needed conditional (~line 776), `showreelBtn?.update(dt)` call (~line 818), `!showreelActive` term in the flag-clear conditional (~line 967) and the matching comment mention.
   - dispose() block: removals for `_showreelPlayHandler` (`jlz:showreel-play`), `_showreelMoveHandler` (pointermove), `_showreelClickHandler` (click) — was lines 1064-1074.
   - `_getShowreelButton()` helper method — was lines 1170-1180.
   - All `jlz:showreel-play` listener wiring in Experience.ts is gone. The dispatch site is gone. `EventBus.ts` does not type `jlz:showreel-play` (it's a raw window event), so no event-bus change needed.
   - `import type { ShowreelButton3D }` was inlined inside `_getShowreelButton()` as `import('./World/ShowreelButton3D').ShowreelButton3D` — both type-imports die with the method.

3. Refactored `src/UI/UIManager.ts` (rewrote):
   - Kept the `_showreelHandler` field and its FullscreenOverlay.open() payload unchanged (mode:'video', videoSrc:'/assets/video/coming-soon.mp4', poster:'/assets/video/coming-soon-cover.jpg', title:'Showreel', category:'2026 · COMING SOON').
   - Wired `window.addEventListener('jlz:showreel-play', this._showreelHandler)` in init() — makes the showreel triggerable from any DOM element that dispatches the event.
   - Replaced the dead `#jlz-showreel-trigger` selector with a live `[data-showreel-trigger]` selector: the `_documentClickHandler` field is preserved (same name) but now matches `[data-showreel-trigger]` and dispatches `window.dispatchEvent(new CustomEvent('jlz:showreel-play'))` instead of calling the handler directly. This keeps the window event as the single trigger contract — both the DOM button and any future 3D/keyboard source can dispatch it.
   - dispose() removes BOTH listeners (`jlz:showreel-play` window listener + `click` document listener).
   - Removed the `// A-4 fix` comments that referenced the dead selector (kept a shorter comment explaining field storage for HMR safety).

4. Added the DOM showreel trigger to `src/sections/intro/template.ts` (rewrote):
   - Header comment updated to document the new DOM-button trigger path (was claiming "No DOM button").
   - Bottom block now wraps the existing Explore `<a>` and a new Play showreel `<button>` in a `uk-flex uk-flex-wrap uk-margin-top` container with the `uk-margin` attribute for UIkit's default margin-between-children behavior.
   - New button: `type="button"`, `class="uk-button uk-button-default uk-button-small"`, `data-showreel-trigger` attribute, `data-i18n="home.studio.showreel"` with English fallback "Play showreel".
   - Kept the existing Explore button markup unchanged.

5. Updated `src/sections/intro/scene.ts` (rewrote):
   - Header comment updated: removed the "ShowreelButton3D is DISABLED" paragraph (no longer relevant — module is deleted); replaced with a one-paragraph note explaining the DOM-button trigger path. Removed the inline `(ShowreelButton3D disabled — see header comment)` comment + the "g.userData.showreelButton is NOT set" rationale.
   - The function body is unchanged: `const g = new THREE.Group(); g.name = 'intro'; return g`.

6. i18n keys (`src/core/i18n.ts`): the `home.studio.showreel` key ALREADY EXISTED with values `'Showreel'` (EN, line 151) / `'Шоурил'` (RU, line 434). Updated both to the task-specified copy: `'Play showreel'` (EN) / `'Смотреть шоурил'` (RU). Same key path, just the values changed — no new key inserted, no other keys touched.

7. Verification:
   - `bun run type-check` (`tsc --noEmit`) → 0 errors. (Note: the pre-existing external-path error in `entry-app.ts:165` flagged by Task 5 is NOT present in this run — either resolved in the meantime or the env differs; either way, no NEW type errors introduced by this batch.)
   - `bun run lint` → 0 errors, 54 warnings — all pre-existing (`@typescript-eslint/no-explicit-any`, `no-console`, `@typescript-eslint/no-empty-object-type`, one unused eslint-disable in JunniParticles.ts). No new errors or warnings introduced.
   - `curl -s -o /dev/null -w "%{http_code}" http://localhost:5173/` → `200`. Updated modules (`/src/sections/intro/template.ts`, `/src/UI/UIManager.ts`) serve 200 with the new content; deleted module (`/src/Experience/World/ShowreelButton3D.ts`) returns the SPA fallback index.html (expected — file is gone, dev server falls back).
   - Did NOT run `bun run build` or Playwright per task instruction (deferred to the final gate agent).

Stage Summary:
- Deleted 1 dead TS module (`ShowreelButton3D.ts`, 146 LOC).
- Removed ~105 LOC of dead raycaster/hover/click wiring from `Experience.ts` (6 private fields, 3 addEventListener sites, 3 removeEventListener sites in dispose(), 1 helper method, 3 in-frame references in `_updateInner()`).
- Rewrote `UIManager.ts` (~30 LOC net change) to swap the dead `#jlz-showreel-trigger` selector for a live `[data-showreel-trigger]` selector + a `jlz:showreel-play` window listener. The window event is now the single showreel trigger contract.
- Rewrote `intro/template.ts` to add a semantic DOM `uk-button` Play showreel trigger alongside the existing Explore button (UIkit flex + `uk-margin` attribute for spacing). No custom `.jlz-*` class introduced (per UIKIT3.md contract).
- Rewrote `intro/scene.ts` comments to reflect the deleted 3D path.
- Updated 2 existing i18n values (`home.studio.showreel` EN/RU) to "Play showreel" / "Смотреть шоурил".
- No new type-check errors, no new lint errors, dev server still 200. No regressions introduced.

Next Actions for downstream agents:
- The orphan CSS in `src/assets/main.less` (lines 2006-2155: `.jlz-showreel-overlay`, `.jlz-showreel-trigger*`, `@keyframes jlz-showreel-stroke`) still targets the old showreel classes that nothing emits anymore. Per audit B.4 / Batch 1, this CSS deletion is owned by another agent — flagged here so the showreel-path cleanup is understood as end-to-end complete only once that CSS batch lands. This batch did NOT touch main.less.
- `EventBus.ts` still does NOT type `jlz:showreel-play` (it's a raw window event, not a typed `AppEvents` entry). This is intentional — the event has one DOM source (the `[data-showreel-trigger]` click handler) and one DOM listener (`UIManager._showreelHandler`), and is never bridged through `eventBus.emit()`. RULES.md rule 4 ("Never use a raw window.dispatchEvent to duplicate a typed EventBus emission") does NOT apply because there is no typed emission to duplicate. Leaving as raw is correct; promoting to a typed event would be over-engineering for a single-source/single-sink trigger.
- If a 3D showreel button is ever wanted again, build it fresh against the current scene and dispatch `jlz:showreel-play` — the UIManager listener is the stable consumer. Do NOT resurrect the deleted `ShowreelButton3D` module (per docs/PLAN-showreel-shader-plane.md "Intro showreel trigger — resolved" §).

---
Task ID: 8
Agent: main (docs + deep refactor)
Task: Phase A (docs refresh) + Phase B (deep code refactor: dead CSS/TS/assets, ShowreelButton3D removal, template helpers, .jlz-* elimination, topbar consolidation)

Work Log:
- Phase A: rewrote docs/UIKIT3.md (removed all master-quantum-flares/studio-console/_theme.less refs; new UIkit-first ownership contract). Rewrote docs/RULES.md (dropped QF migration; added brutal-minimalism + inverse-UIkit-theme + DRY + perf rules). Cleaned NEXT.md, README.md (joystick), docs/README.md (references/), AGENTS.md ($uikit-yootheme-theme skill ref). Deleted docs/PLAN-studio-console-theme.md. Updated docs/PLAN-showreel-shader-plane.md (3D trigger resolved → DOM button).
- Phase B1: deleted dead TS (MeshTransmissionMaterial.ts, roundedRectGeometry.ts), 18+ dead assets (Inter fonts, helvetiker typefaces, basis transcoder, unused textures), 11 dead UIkit Less imports.
- Phase B2: uncommented spinner/table/form-range Less imports (stale-comment bugs — components are used).
- Phase B3 (subagent): removed ShowreelButton3D.ts (−146 LOC) + dead raycaster path in Experience.ts (−106 LOC); restored showreel via DOM uk-button + jlz:showreel-play event.
- Fixed pre-existing broken `. {}` selectors (3 instances — empty class names causing Less SYNTAX ERROR that prevented main.less from compiling → app CSS never loaded). Replaced with proper `.jlz-desc` class + descBlock() helper.
- Removed dead QF preamble from main.less (90 LOC of @internal-* / QF accent vars for a theme never imported). Kept color-mode overrides (needed for UIkit core on dark bg) with corrected comments.
- Deleted ~600 LOC dead CSS: .jlz-scroll-hint*, .jlz-numeral*, .jlz-text-subtle, .jlz-flex-gap-*, .jlz-joystick* (entire block), .jlz-showreel-trigger* (+ keyframes), .jlz-lab-accordion*, .jlz-help-hint*, .jlz-joystick__arrow-label*, commented-out body.uk-light block.
- Cleaned blog.less: removed dead .jlz-blog-content* / .jlz-blog-eyebrow / .jlz-back-link + de-scoped Prism rules from the dead class.
- B4 (DRY): added homeTop(), descBlock(), serviceExplore() helpers to _shared/constants.ts; simplified storyBottom (removed orphan .jlz-bottom-module* classes). Refactored intro/about/contact home templates + services/manifesto/lab/contact content pages to use the shared helpers. Eliminated 3× home TOP boilerplate, 6× Explore button copy, 5× desc-block copy, the `class=" uk-margin-small-top"` typo.
- B5: consolidated three .jlz-topbar definitions (lines 2354+2982+3597) into one. Replaced .jlz-flex-gap-small with native CSS gap. Slimmed .jlz-service-explore (dropped font-size/weight/letter-spacing UIkit already provides).
- Fixed broken entry-app.ts console-icons import path (was ../../la6su-webgpu/... pointing outside repo → ./assets/console-icons).

Stage Summary:
- main.less: 3615 → 2853 lines (−762, −21%). blog.less: 423 → 352 (−71). 
- .jlz-* class count in main.less: ~140 → 109 (−31 classes).
- TS: removed 3 dead modules + ~250 LOC dead showreel raycaster path. Net −~400 LOC.
- Assets: 18+ dead files removed (fonts, textures, basis transcoder).
- UIkit Less imports: 11 dead removed, 3 stale-comment bugs fixed.
- Docs: all stale QF/studio-console/references/joystick refs eliminated; new UIkit-first contract in UIKIT3.md + RULES.md.
- Verification: type-check 0 errors, lint 0 errors (54 pre-existing warnings), build ✓ 2.1s, 86/86 unit tests pass. Agent Browser verified: splash→Enter→home renders, showreel DOM button opens FullscreenOverlay (video src correct), /works renders 8 cards, theme toggle flips uk-light + body bg, mobile 390×844 responsive (topbar + sections adapt).
- CRITICAL FIX: the app's CSS was NEVER loading before this refactor (broken `. {}` Less syntax error). Now fixed and verified loading (7959 chars).

---
Task ID: 9
Agent: main (works/shader deep refactor)
Task: Deep refactor of Works shader-transition path — eliminate duplication between BakuCarousel and WorksPlaneStage, remove WorksPortfolio thin wrapper, simplify Experience project-open wiring, remove dead WorkCards code.

Work Log:
- Identified core duplication: BakuCarousel.beginFullscreenTransition and WorksPlaneStage.openProject were two implementations of the same plane-to-fullscreen film-burn handoff (identical OpeningState shape, identical constants TRANSITION_DURATION=1.15/OVERLAY_TAKEOVER=0.86/CRT_TRIGGER=0.42/CASE_PLANE_HEIGHT=9/16, identical focus-lerp + CRT + takeover logic).
- C1: Created src/Experience/World/CasePlaneTransition.ts — single OpeningState interface + createOpening()/updateOpening()/resetOpening()/computeFullscreenScale(). Both stages now call these.
- C2: Created src/Experience/World/loadProjectTextures.ts — shared sRGB + LinearMipmapLinearFilter + anisotropy=4 texture loader, de-dup'd from both .init() methods.
- Refactored WorksPlaneStage.ts: uses createOpening/updateOpening/resetOpening/computeFullscreenScale + loadProjectTextures. Loop skips the opening card; updateOpening called once after. ~50 LOC removed.
- Refactored BakuCarousel.ts: same shared helpers. Removed _fullscreenScale field, FULLSCREEN_DURATION/FULLSCREEN_TAKEOVER/CRT_TRIGGER/CASE_PLANE_HEIGHT local constants, prefersReducedMotion import (now in CasePlaneTransition). Opening card skipped in loop; updateOpening called once after. ~60 LOC removed.
- C3: Cleaned WorkCards.ts — removed empty pointerMove=()=>{} handler + its addEventListener/removeEventListener, removed unused openTimer/wobbleTimer fields + their clearTimeout in dispose, removed dead activeGrid/moveFocus/onKeydown comments, removed unused inner/targetRx/targetRy/currentRx/currentRy/rafId/pointerLeave fields. Now just click + roving tabindex. ~80 LOC → ~85 LOC (cleaner).
- C4: Deleted src/Experience/WorksPortfolio.ts (thin wrapper: visible=false group + prev/next/goTo that just called onCardClick). Moved projects[] (static PROJECTS import) + _activeProjectIndex (already existed) into Experience. Added public prevProject()/nextProject() methods (DevPanel + overlay arrows). Removed ensurePortfolio() async pipeline + its requestAnimationFrame retry + dynamic import('../Data/Projects'). Replaced with synchronous ensureWorksOverlay() that just creates the overlay + wires carousel click once.
- C6: Simplified _projectNavigateHandler — removed double-routing (was calling both carousel.prev/next AND portfolio.prev/next where portfolio.next re-entered onProjectSelect). Now single path: carousel.prev/next + onProjectSelect(idx+dir). Simplified _openProjectHandler + _worksPlaneTapHandler — removed ensurePortfolio().then() wrappers (no longer async).

Stage Summary:
- New shared modules: CasePlaneTransition.ts (~95 LOC), loadProjectTextures.ts (~40 LOC).
- Deleted: WorksPortfolio.ts (63 LOC).
- Net TS: ~250 LOC removed across BakuCarousel/WorksPlaneStage/WorkCards/Experience.
- Single source of truth for the plane-to-fullscreen film-burn handoff (was 2 implementations).
- Single texture-loader contract (was 2 copies).
- Project navigation: one path (prevProject/nextProject → onProjectSelect), no re-entry.
- Verification: type-check 0 errors, lint 0 errors (54 pre-existing warnings), build ✓, 86/86 unit tests pass. Agent Browser: home→Works section carousel init OK; /works route 8 cards; card click → plane-to-fullscreen transition → overlay opens (title "Ebb Vibes", counter "1/8") after takeover threshold; overlay Next → "Mono Sunday" "2/8"; Close → overlay resets, no errors. Both shader-transition paths (home carousel + /works stage) verified working through the shared CasePlaneTransition module.

---
Task ID: 11
Agent: main (fluid shader + overlay simplification)
Task: (1) Merge works-shader-dedup branch (CasePlaneTransition + loadProjectTextures). (2) Completely rewrite the CasePlane TSL shader as a fluid transition (brutal minimalism). (3) Simplify FullscreenOverlay — remove state-class proliferation. Pipeline + commit + push + PR.

Work Log:
- Merged refactor/works-shader-dedup into current branch (CasePlaneTransition.ts + loadProjectTextures.ts + WorksPortfolio removal). Resolved worklog conflict.
- CasePlane.ts: completely rewrote the TSL shader. Removed 4 burn-noise SDFs, CRT scanlines, charBand/halo/hotCore/ember/amberVeil, inverse-filmic pre-invert (150 LOC of decorative emulsion effect). Replaced with ONE fluid transition: a warped horizontal seam sweeps across the plane as `transition` goes 0→1, with a soft glow riding the seam and a brief exposure lift behind it that decays. Kept: cover-crop UV + parallax, arrival reveal (single vertical exposure line), positionNode (fabric/velocity field), opacityNode arrival mask. Removed the `crt` uniform + triggerCrtOn() — the fluid transition is the single effect. 392 → 242 lines (−38%).
- CasePlaneTransition.ts: removed CRT_TRIGGER constant + crtTriggered field + the CRT pulse block in updateOpening (no longer needed — shader has no CRT effect).
- FullscreenOverlay.ts: removed the `is-entered` / `is-opening` / `is-plane-origin` state-class system. The rAF-staged enter animation (2-frame delay before adding is-entered) is gone — UIkit's own `shown` event is the authoritative "fully open" signal. Removed `_enterRaf` field + its cancelAnimationFrame in dispose. Removed `is-plane-origin` toggle from open()/preload(). The plane→fullscreen handoff is now driven entirely by the CasePlane fluid shader; the overlay is a plain dark viewing room that shows when uk-open is set. State classes: 8 → 5 (is-video-mode, is-image-mode, is-poster-ready, is-playing, is-muted).
- main.less: removed the overlay clip-path aperture (the 0.86s inset/round animation on .jlz-fs-dialog), the is-plane-origin transparent-background special case, the is-image-mode/is-poster-ready opacity gating, and the is-entered meta/controls/mediastage reveal transitions. Overlay CSS is now just: dark surface + grid layout + media stage + control geometry. ~119 LOC removed.

Stage Summary:
- CasePlane shader: 392 → 242 lines. One fluid transition replaces 4-burn-noise + CRT + inverse-filmic.
- FullscreenOverlay: 448 → 428 lines. State classes 8 → 5. No rAF staging, no clip-path aperture, no plane-origin special case.
- main.less: 2836 → 2717 lines (overlay block alone ~119 LOC removed).
- Verification: type-check 0 errors, lint 0 errors (54 pre-existing warnings), build ✓, 86/86 unit tests. Agent Browser: home Works section carousel init OK (no errors); /works card click → fluid plane→fullscreen transition → overlay opens (title "Ebb Vibes", state classes only is-image-mode+is-poster-ready); overlay Next → "Mono Sunday" "2/8"; close + return home; showreel button → overlay opens in video mode (is-video-mode+is-poster-ready+is-playing, videoSrc correct, big-play icon renders). Both paths (works image + showreel video) use the same simplified overlay component.

---
Task ID: 12
Agent: main (inverse theme + wobble shader + textures + icons)
Task: (1) Unify inverse theme — remove redundant body.uk-light overrides, fix toggle lag. (2) Rewrite shader as wobble cloth-like. (3) Fix case texture artifacts + gamut. (4) Unify icons everywhere. (5) Pipeline + commit + push.

Work Log:
- T1 inverse theme: ContentReveal was toggling uk-light on BOTH <html> and <body>. The html.uk-light block in _import.less flips 12 CSS custom properties — that's the single source. The body.uk-light block in main.less (9 nested menu rules) was 100% redundant: every menu element already reads var(--jlz-color-text-subtle) etc., which flip automatically. Removed the body.uk-light block from main.less. Removed the body.classList.toggle from ContentReveal. Fixed body.uk-light .jlz-eyebrow → html.uk-light .jlz-eyebrow. Toggle now: 0-1ms (was laggy from double class mutation + 9 redundant selector evaluations).
- T2 wobble cloth-like shader: replaced the fluid-seam colorNode with a cloth-wobble effect. Two layered low-frequency sin waves (clothX, clothY) create a fabric-fold shading that peaks mid-transition (bell curve: 0 at t=0/1, max at t=0.5) and eases out at both ends. Added a matching positionNode clothWave that billows the plane forward in Z during the transition — the surface physically ripples like fabric catching air. One gesture, no seams, no burn.
- T3 texture artifacts + gamut: increased anisotropy from 4 to 8 in loadProjectTextures.ts (stabilizes oblique textures on high-DPI, fixes shimmering/aliasing). Removed 3 CSS filter rules on .jlz-work-card__image (saturate(0.72) contrast(1.08), saturate(0.9) contrast(1.08) hover, saturate(0.55) brightness(0.65) opening) that shifted the DOM card gamut relative to the raw sRGB 3D CasePlane textures.
- T4 icon unification: switched 2 remaining uk-close component attributes (lab-overlay + nav/template close buttons) to explicit uk-icon="icon: close; ratio: 1.25" spans — same console-themed SVG as FullscreenOverlay. Replaced the literal ↗ character in the Telegram CTA arrow with uk-icon="icon: arrow-up-right; ratio: 0.9". Every icon in the app now resolves through the single console-icons.ts registration via UIkit.icon.add().

Stage Summary:
- main.less: 2718 → 2685 lines (−33). body.uk-light block removed (9 rules), 3 CSS filter rules removed.
- CasePlane.ts: 242 → 246 lines (cloth-wobble colorNode + positionNode clothWave).
- ContentReveal.ts: body.classList.toggle removed — single html.uk-light source.
- loadProjectTextures.ts: anisotropy 4 → 8.
- Icons: 0 uk-close attributes remain. 0 literal glyph characters. All icons via console-icons.
- Verification: type-check 0 errors, lint 0 errors (54 pre-existing warnings), build ✓, 86/86 unit tests. Agent Browser: theme toggle 0-1ms (html-only), menu close icon renders as console SVG, /works card click → wobble transition → overlay opens (title "Ebb Vibes"), showreel overlay icons render (close, big-play, next SVGs). No errors.
