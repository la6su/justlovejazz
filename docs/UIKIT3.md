# UIKIT3 — Patterns, theme assembly, and hard-won lessons

> Created: 2026-07-11. Scope: `src/assets/_import.less`, `src/assets/main.less`,
> `src/templates.ts`, `projects/*.html`.
>
> Companion to `RULES.md` (engine rules) and `ARCHITECTURE.md` (runtime layout).
> This doc covers the **UIKit 3 theming layer only** — how to build on top of
> UIKit without fighting it, and the specific mistakes we already made and
> reverted.

---

## 1. Theme assembly — `_import.less` is the single entry point

UIKit 3 is imported as **Less source** (not compiled CSS) so we can override
its `@*` variables before components emit their rules. The import order in
`src/assets/_import.less` is **load-bearing** — break it and theme overrides
silently stop applying:

```
1. tokens.less            → @jlz-* design tokens (single source of truth)
2. uikit/variables.less   → UIKit @* defaults (MUST come before overrides)
3. Theme overrides        → map @jlz-* → UIKit @* (buttons, cards, navbar…)
4. uikit/mixin.less       → shared mixins (needed by components below)
5. uikit/components/*.less → component rules, compiled with overridden vars
```

**Rule:** UIKit variables (`@button-primary-background`, `@card-default-background`,
`@navbar-background`, …) are set in `_import.less` §3. Never redeclare them in
`main.less` — it's too late there, components are already compiled.

**Custom theme file:** `src/assets/master-quantum-flares/` is a vendored
YOOtheme Pro theme. **DO NOT TOUCH** (see `RULES.md` §17). It provides the
`black-blue` style variant we load on top.

---

## 2. `main.less` — app layer only, never UIKit duplicates

`main.less` (≈757 LOC) contains **only** what UIKit does not provide:

| Section | Why it exists (no UIKit equivalent) |
| --- | --- |
| `#spa-content section[data-section]` stacking | Absolute-stacked SPA sections, `display:none`/`flex` toggle. UIKit has no SPA-section-stack primitive. |
| `.scrollspy-pending [uk-scrollspy]` | Cancels UIKit scrollspy animation during splash so it restarts post-splash. |
| `body.light-theme *` | Global theme toggle (dark↔light) driven by section-active state. UIKit's `uk-light`/`uk-dark` are class-based but don't cascade through our SPA stacking. |
| `.tm-header` mask | Fade-mask edges on the slider nav. UIKit has no edge-fade utility. |
| `.jlz-nav-link`, `#slider-nav` | Slider nav pill styling (UIKit `uk-subnav-pill` doesn't do horizontal scroll + fade mask). |
| `.studio-title.uk-heading-*` | NoiseText animation hook + cinematic font-size/weight overrides on UIKit heading classes. |
| `.jlz-scroll-hint*`, `.jlz-corner-label*` | Custom interaction elements (scroll indicator, drag hint). |
| `#project-overlay`, `.jlz-fs-*` | Fullscreen project viewer (UIKit modal doesn't do edge-to-edge image + custom chrome). |
| `.custom-cursor` | Magnetic cursor (no UIKit equivalent). |
| `.jlz-joystick*` | DOM joystick (no UIKit equivalent). |
| `.jlz-hint*` | Section subtitle pill (UIKit has `uk-notification` but it's toast-style, not inline hint). |

**What does NOT belong in `main.less`:**
- Layout that `uk-container` / `uk-grid` / `uk-flex` already handle
- Spacing that `uk-padding` / `uk-margin-*` already handle
- Typography that `uk-heading-*` / `uk-text-lead` / `uk-text-meta` already handle
- Card styling that `uk-card-default` + `_import.less` `@card-*` overrides handle
- Button styling that `uk-button-*` + `_import.less` `@button-*` overrides handle

---

## 3. Section template — canonical structure

### 3.1 SPA home sections (`src/templates.ts`)

Every section in the SPA follows this skeleton:

```html
<section uk-height-viewport="expand: true"
         class="uk-section uk-section-large"
         id="section-NAME" data-section="NAME">
  <div class="uk-position-cover" data-dynamic-content>
    <div class="uk-container uk-container-expand uk-padding
                uk-flex uk-flex-column uk-flex-ALIGN uk-text-ALIGN
                uk-height-1-1">
      <!-- content -->
    </div>
  </div>
</section>
```

**Class rationale (every token earns its place):**

| Class | Purpose | Replaces (former custom class) |
| --- | --- | --- |
| `uk-section uk-section-large` | UIKit section primitive — vertical padding rhythm | `.section-studio`, `.jlz-section-shell` |
| `uk-height-viewport="expand: true"` | Make section fill viewport (extends to 100dvh via main.less override) | inline `min-height:100vh` |
| `uk-position-cover` | Background layer wrapper (3D canvas shines through) | `.section-bg`, `.section-bg--*` |
| `uk-container uk-container-expand` | Full-bleed container (no max-width cap) | `.jlz-section-shell` |
| `uk-padding` | Section inner padding | `padding: 5vh 5vw` |
| `uk-flex uk-flex-column uk-flex-{between,top}` | Vertical distribution | `.jlz-section-shell--{between,top}` |
| `uk-text-{center,left}` | Horizontal text alignment | inline `text-align` |
| `uk-height-1-1` | Fill parent height (needed for `uk-flex-between` to distribute) | `height: 100%` |

### 3.2 Standalone project pages (`projects/*.html`)

Project pages are **static HTML** (no SPA bootstrap). They use a different
container pattern — **centered, not full-bleed**:

```html
<section id="home" class="section-studio uk-flex uk-flex-middle"
         uk-height-viewport>
  <div class="uk-container">
    <!-- content -->
  </div>
</section>
```

**Differences from SPA sections:**

| Aspect | SPA (`templates.ts`) | Project page (`projects/*.html`) |
| --- | --- | --- |
| Container | `uk-container-expand` (full-bleed) | `uk-container` (centered, max-width ~1200px) |
| Section class | `uk-section uk-section-large` | `section-studio` (custom — page scrolls normally) |
| Layout | Absolute-stacked, one visible at a time | Normal document flow, scroll between sections |
| Theme | `body.light-theme` toggle per active section | Static dark theme per page |
| Navbar | `tm-header` + `uk-slider` (custom) | `uk-navbar-container` + `uk-navbar` (standard) |

**Project page custom classes** (`section-studio`, `section-number`,
`studio-title--xl/--medium`, `studio-tagline`, `studio-text--body/--meta`,
`btn-studio`, `navbar`, `navbar-logo`, `navbar-link`, `text--muted`,
`section-intro`, `section-scrolly`): these are page-specific and live in a
per-page `<style>` block or the vendored theme — **not in `main.less`**.
They're intentionally separate because project pages must render without the
SPA runtime.

---

## 4. Theme toggle — UIKit native `uk-light` + ThemeManager

**Current approach (UIKit native inverse system):**

UIKit 3 has a built-in inverse component (`uk-light` / `uk-dark`). Our base
theme is DARK (white text over 3D canvas). The `uk-light` class applies
INVERSE colors = dark text (for light backgrounds). One class on `<body>`
flips ALL UIKit components natively — no custom per-component overrides.

```less
// _import.less — enable uk-light class generation
@inverse-global-color-mode: light;  // was: none (disabled both classes)

// main.less — ONLY custom non-UIKit elements need overrides
body.uk-light .jlz-joystick__base { background: rgba(0, 0, 0, 0.06); }
body.uk-light .jlz-nav-link { color: rgba(5, 5, 7, 0.55); }
// UIKit components (headings, text, buttons, cards, navbar) — handled by
// uk-light natively, zero custom CSS needed.
```

**ThemeManager** (`src/core/ThemeManager.ts`) — 3 modes:
- `'auto'` — follows the active home section (Lab/Intro/Contact = light,
  others = dark). On content pages, always dark.
- `'light'` — forced light mode (uk-light on body, dark text)
- `'dark'` — forced dark mode (no uk-light, light text)

Persisted to `localStorage('jlz:theme')`. Manual override wins over auto.

**Toggle UI** — 3 buttons (Auto/Light/Dark) in the UIMenu modal
(`#jlz-menu-modal .jlz-theme-toggle`). Active button gets `uk-active` class
+ accent background.

**Experience.ts** calls `themeManager.setAutoTheme(isLightSection)` on
section change. ThemeManager decides whether to apply it (auto mode) or
ignore it (manual override).

### 4.1 Theme toggle scope — home only, NOT content pages

**Symptom:** Content pages (`/music`, `/videos`, `/about`, etc.) render dark
text on a dark 3D background — unreadable.

**Cause:** `Experience.ts` adds `uk-light` on init (intro is a light
section) and toggles it on `jlz:section-change`. On content pages, no
section-change fires (JoystickNav fires `jlz:page-section-change` instead),
so `uk-light` stays from the last home section state. UIKit's `uk-light`
then darkens all text, which is invisible over the dark 3D canvas.

**Fix (via ThemeManager):**

1. **`router.ts`** — on non-home pages, call `themeManager.setAutoTheme(false)`:
   ```ts
   if (page !== 'home') {
     themeManager.setAutoTheme(false)  // forces dark in auto mode
   }
   ```

2. **`Experience.ts`** — guard the theme toggle with `data-page === 'home'`:
   ```ts
   if (document.body.dataset.page === 'home') {
     const isLightSection = idx === 0 || idx === 1 || idx === 6
     themeManager.setAutoTheme(isLightSection)
   }
   ```
   ThemeManager respects manual override (if user set 'light' or 'dark' in
   the menu, auto-toggle is ignored).

3. **`main.less`** — content page color rules use `body .jlz-page` prefix
   to ensure light text + text-shadow over the 3D canvas regardless of
   theme state:
   ```less
   body .jlz-page .uk-heading-xlarge,
   body .jlz-page .uk-text-lead {
     color: rgba(255, 255, 255, 0.94);
     text-shadow: 0 2px 32px rgba(0, 0, 0, 0.55);
   }
   ```

**Provenance:** Initial fix (2026-07-11) used direct classList manipulation.
Refactored (same day) to use ThemeManager + `uk-light` for the menu toggle
feature.

---

## 5. Cards — use `uk-card-default`, override via `_import.less`

**Wrong (former approach):**
```html
<!-- ❌ Custom glass-btn class, overrides UIKit button entirely -->
<a class="uk-button uk-button-default jlz-glass-btn jlz-glass-btn--primary">
```
```less
// ❌ 60+ LOC of .jlz-glass-btn rules duplicating what UIKit already does
.jlz-glass-btn {
  background: rgba(255,255,255,0.04);
  backdrop-filter: blur(14px) saturate(140%);
  border: 1px solid rgba(255,255,255,0.1);
  /* … 8 more declarations re-implementing uk-button */
}
```

**Right (current approach):**
```html
<!-- ✅ Standard UIKit button — themed via _import.less @button-* vars -->
<a class="uk-button uk-button-primary uk-button-large">
```
```less
// ✅ In _import.less §3 — one-line override, applies to ALL uk-button-primary
@button-primary-background: @jlz-color-accent;
@button-primary-hover-background: @jlz-color-accent-hover;
@button-primary-hover-color: #fff;
```

Same principle for cards:
```html
<div class="uk-card uk-card-default uk-card-body uk-card-hover">…</div>
```
```less
// In _import.less §3
@card-default-background: @jlz-color-surface;
@card-default-hover-background: @jlz-color-surface-hover;
```

The `body.light-theme .uk-card-default` rule in `main.less` then layers the
glass effect on top for light sections only.

---

## 6. Hard-won lessons (do not repeat)

Each lesson has a **bug provenance** — a commit or worklog entry where we
learned it the hard way.

### 6.1 `uk-blend-difference` does not blend across stacking contexts

**Symptom:** `mix-blend-mode: difference` on titles over the 3D canvas has
zero visible effect.

**Cause:** The 3D canvas is `position: fixed; z-index: 1` on `<body>`.
`#spa-content` is `z-index: 2`. These are **separate stacking contexts**.
`mix-blend-mode` only blends within the same stacking context — the titles
in `#spa-content` cannot blend with the canvas underneath.

**Fix:** Don't use `uk-blend-difference` over the 3D canvas. Readability is
handled by `text-shadow` + the `body.light-theme` color system instead.

**Provenance:** Worklog `qf-template-refinement` task (2026-07-10).

---

### 6.2 `uk-height-viewport` alone is not a section — pair with `uk-section`

**Symptom:** Section padding is wrong, content sits hard against viewport edges.

**Wrong:**
```html
<!-- ❌ uk-height-viewport gives height, but no padding/section primitive -->
<section uk-height-viewport id="section-about" data-section="about">
```

**Right:**
```html
<!-- ✅ uk-section provides the padding rhythm UIKit expects -->
<section uk-height-viewport="expand: true"
         class="uk-section uk-section-large"
         id="section-about" data-section="about">
```

`uk-section-large` = UIKit's standard large vertical padding (≈70px top+bottom).
Combined with `uk-height-viewport="expand: true"`, the section fills the
viewport while keeping its padding rhythm.

**Provenance:** Worklog `uikit-full-cleanup` task — user reverted to
`class="uk-section uk-section-large"` in commits `some changes #8/#9/#10`.

---

### 6.3 Custom layout classes that duplicate `uk-container` / `uk-flex` / `uk-grid`

**Symptom:** main.less balloons to 1000+ LOC, hard to maintain, theme changes
require touching 5+ selectors.

**Wrong (former classes, all deleted):**
- `.jlz-section-shell` / `.jlz-section-shell--{top,bottom,between,center,split}`
  → duplicates `uk-container uk-container-expand uk-padding uk-flex uk-flex-column uk-flex-*`
- `.jlz-feature-card*` / `.jlz-lab-card*` / `.jlz-timeline*`
  → duplicates `uk-card uk-card-default uk-card-body` + `uk-text-meta` / `uk-text-bold`
- `.jlz-hero*` / `.studio-body` / `.studio-subtitle`
  → duplicates `uk-heading-*` / `uk-text-lead` / `uk-text-meta`
- `.jlz-glass-btn*`
  → duplicates `uk-button-primary` + `_import.less` `@button-*` overrides

**Right:** Use UIKit utilities directly in `templates.ts`. If a visual needs
a small override (font-weight, letter-spacing), add a **scoped** rule in
`main.less` keyed on the UIKit class:

```less
/* ✅ Theme override ON UIKit class, not duplicate */
.studio-title.uk-heading-medium {
  font-weight: 200;        /* brand's 200-weight cinematic feel */
  letter-spacing: -0.035em;
  line-height: 0.92;
  margin: 0 0 var(--jlz-space-3);
}
```

`.studio-title` is kept ONLY as the NoiseText animation hook (entry-app.ts
selectors key off it) — it carries no layout/spacing/typography of its own.

**Provenance:** Worklog `uikit-full-cleanup` task (1622→1012 LOC), then user
refinement to 757 LOC.

---

### 6.4 React-style class soup on cards

**Symptom:** Cards have 6+ classes, most redundant.

**Wrong:**
```html
<!-- ❌ uk-flex uk-flex-column uk-flex-middle redundant — grid + uk-text-center handle it -->
<div class="uk-card uk-card-default uk-card-body uk-card-hover
            uk-flex uk-flex-column uk-flex-middle uk-text-center">
```

**Right:**
```html
<!-- ✅ UIKit grid (uk-child-width-*) + uk-text-center handle alignment -->
<div class="uk-card uk-card-default uk-card-body uk-card-hover uk-text-center">
```

`uk-card-body` is a block element that stacks children vertically by default.
`uk-text-center` centers inline content. `uk-grid` + `uk-child-width-*`
handles the card layout. The `uk-flex uk-flex-column uk-flex-middle` triple
is redundant.

**Provenance:** Worklog `qf-template-refinement` — user reverted to simpler
`uk-card uk-card-default uk-card-body uk-card-hover` in commit `some changes #10`.

---

### 6.5 Section number eyebrows — optional, not mandatory

**What we tried:** Adding `(0) (2) (4) (5) (6) (7)` eyebrows in `uk-h3` above
each title, matching YOOtheme Quantum Flares.

**What happened:** User reverted in commit `some changes #6 — css remove
jlz-eyebrow and content`. The eyebrows added visual noise without aiding
navigation in our SPA model (JoystickNav already shows position).

**Lesson:** Quantum Flares patterns are **reference, not law**. QF is a
scroll-based marketing theme; our SPA is navigation-driven with a visible
joystick. Adopt the patterns that fit our interaction model, skip the rest.

**Provenance:** Commits `some changes #6` (remove eyebrow), `qf-template-refinement`
worklog (added them back), then user revert.

---

### 6.6 Per-section text-shadow overrides

**Symptom:** 40+ LOC of `section[data-section='*'] .uk-text-lead { text-shadow }`
rules, one per section × per text class.

**Wrong:**
```less
// ❌ Per-section, per-class — explodes combinatorially
section[data-section='about'] .uk-text-lead,
section[data-section='about'] .uk-text-large { text-shadow: 0 2px 24px rgba(0,0,0,0.4); }
section[data-section='challenge'] .uk-text-lead { text-shadow: 0 2px 24px rgba(0,0,0,0.4); }
// … ×8 sections
```

**Right:** Either drop text-shadow entirely (the 3D canvas provides enough
visual depth), or apply it globally to UIKit text classes scoped by theme:
```less
// ✅ One rule, theme-scoped
body:not(.light-theme) .uk-text-lead,
body:not(.light-theme) .uk-heading-medium { text-shadow: 0 2px 24px rgba(0,0,0,0.4); }
```

Current state: text-shadow rules removed entirely — the glass theme + canvas
depth is sufficient.

**Provenance:** main.less diff 1012→757 LOC (user cleanup, 2026-07-11).

---

### 6.7 `uk-scrollspy` + splash screen timing

**Symptom:** Scrollspy fade-in animations play behind the splash overlay,
invisible to the user.

**Cause:** UIKit's MutationObserver auto-inits `uk-scrollspy` instances the
moment HTML lands in `#spa-content` — **before** the splash curtains open.

**Fix:** `body.scrollspy-pending` class cancels the animation:
```less
.scrollspy-pending [uk-scrollspy] {
  animation: none !important;
  opacity: 0 !important;
}
```
`entry-app.ts` drops the class when `jlz:webgl-ready` fires (post-splash).
The `animation-name` computed value flips from `none` back to `uk-fade`,
which **restarts** the animation so the fade-in is visible.

**Never:** remove `.scrollspy-pending` before the splash opens, or remove
the `!important` (UIKit's animation shorthand wins specificity otherwise).

**Provenance:** Worklog `uikit3-cleanup` task; commit `some changes #8`.

---

### 6.8 Synthetic `window.scroll` event for scrollspy re-evaluation

**Symptom:** After navigating to a new section via JoystickNav, the new
section's `[uk-scrollspy]` children stay at `opacity: 0` forever.

**Cause:** SPA sections are `position: absolute` stacked, `display: none` by
default, `display: flex` when `.section-active`. UIKit scrollspy only
re-evaluates viewport entry on actual `scroll`/`resize` events. Switching
sections doesn't trigger a scroll.

**Fix:** `ContentReveal.ts` dispatches a synthetic scroll event after the
`.section-active` swap:
```ts
requestAnimationFrame(() => window.dispatchEvent(new Event('scroll')))
```
Verified safe — no other app code listens to `window.scroll` (only UIKit
internally).

**Provenance:** Worklog `uikit3-cleanup` task (2026-07-10).

---

### 6.9 Content page background — transparent over 3D, NOT opaque

**Symptom:** Content pages (`/music`, `/videos`, etc.) show a flat dark
background — the 3D canvas (cube + EnvSphere) is invisible.

**Cause:** `.jlz-page` had `background: linear-gradient(180deg, rgba(5,5,7,0.82), rgba(5,5,7,0.96)), var(--jlz-color-bg)` — nearly opaque (82-96%), blocking the 3D canvas underneath.

**Wrong:**
```less
// ❌ Opaque gradient blocks 3D canvas
.jlz-page {
  background:
    linear-gradient(180deg, rgba(5, 5, 7, 0.82), rgba(5, 5, 7, 0.96)),
    var(--jlz-color-bg);
}
```

**Right:**
```less
// ✅ Transparent — 3D canvas shows through (like QF background video)
.jlz-page {
  background: transparent;
}
// Subtle radial scrim on each section for text readability
.jlz-page-section {
  background: radial-gradient(
    ellipse 80% 60% at 50% 50%,
    rgba(5, 5, 7, 0.28),
    rgba(5, 5, 7, 0.08) 60%,
    transparent 100%
  );
}
// text-shadow on headings/body for readability over any 3D background
body .jlz-page .uk-heading-xlarge,
body .jlz-page .uk-text-lead {
  text-shadow: 0 2px 32px rgba(0, 0, 0, 0.55);
}
```

**Why not `uk-blend-difference`?** QF uses it on text over background video,
but it doesn't work in our architecture — see §6.1 (3D canvas at z-index:1
on `<body>` is in a separate stacking context from `#spa-content` at
z-index:2). The radial scrim + text-shadow is our equivalent.

**Provenance:** This task (2026-07-11) — content pages had opaque background
blocking the 3D canvas; user requested transparency to see the 3D layer.

---

## 7. UIKit components we use — quick reference

| Component | Where | Notes |
| --- | --- | --- |
| `uk-section` | All SPA sections | `uk-section-large` for vertical rhythm |
| `uk-container` / `uk-container-expand` | Section shells | `-expand` for SPA (full-bleed), plain for project pages (centered) |
| `uk-height-viewport` | Sections + `#spa-content` | `expand: true` attribute; main.less extends to `100dvh` |
| `uk-position-cover` | Section background layer | 3D canvas shines through |
| `uk-flex` / `uk-flex-column` / `uk-flex-{between,top,middle}` | Section content distribution | Pair with `uk-height-1-1` |
| `uk-grid` / `uk-child-width-*` / `uk-grid-match` | Card grids, about split | `uk-grid-small` for tight gaps |
| `uk-card` / `uk-card-default` / `uk-card-body` / `uk-card-hover` | Feature + lab cards | Themed via `@card-*` in `_import.less` |
| `uk-button` / `uk-button-primary` / `uk-button-default` / `uk-button-large` | CTA buttons | Themed via `@button-*` in `_import.less` |
| `uk-list` / `uk-list-divider` | Process timeline | Custom `li` styling in `main.less` for glass rows |
| `uk-heading-medium` / `uk-heading-xlarge` | Section + hero titles | `.studio-title` hook + override in `main.less` |
| `uk-text-lead` / `uk-text-meta` / `uk-text-large` / `uk-text-bold` | Body, meta, emphasis | Themed via `body.light-theme` |
| `uk-link` | Contact email | — |
| `uk-icon` | Button icons | `icon: mail; ratio: 1.1` |
| `uk-navbar` / `uk-navbar-container` / `uk-navbar-left/right` / `uk-navbar-nav` | Project pages only | SPA uses custom `tm-header` + `uk-slider` |
| `uk-modal` | UIMenu (hamburger menu) | `#jlz-menu-modal` |
| `uk-slider` | SPA top nav | Custom `#slider-nav` + `.jlz-nav-link` pill styling |
| `uk-scrollspy` | Per-element reveal | `cls: uk-animation-fade; delay: 300; repeat: true` |
| `uk-animation-fade` | Scrollspy animation | Cancelled by `.scrollspy-pending` during splash |
| `uk-spinner` | Project page loader | `#pageLoader` |
| `uk-height-1-1` | Fill parent height | Needed for `uk-flex-between` to work |

---

## 8. When to add a custom class vs. use UIKit

**Add a custom class only if ALL of these are true:**
1. No UIKit utility/component covers the use case
2. The styling is project-specific (not reusable across UIKit sites)
3. The class name is semantic (describes intent, not appearance)

**Examples that pass the test (kept as custom):**
- `.studio-title` — NoiseText animation hook (semantic, no UIKit equivalent)
- `.jlz-scroll-hint` — custom scroll indicator (no UIKit equivalent)
- `.jlz-joystick` — DOM joystick (no UIKit equivalent)
- `.jlz-fs-*` — fullscreen project viewer chrome (UIKit modal doesn't fit)
- `.jlz-nav-link` — slider nav pill (UIKit subnav-pill doesn't scroll + fade-mask)

**Examples that fail the test (deleted):**
- `.jlz-section-shell` → `uk-container uk-container-expand uk-padding uk-flex uk-flex-column` (UIKit covers it)
- `.jlz-glass-btn` → `uk-button-primary` + `@button-*` override (UIKit covers it)
- `.jlz-feature-card__title` → `uk-card-title` (UIKit covers it)
- `.jlz-hero__tagline` → `uk-text-lead` (UIKit covers it)
- `.studio-body` → `uk-text-lead` (UIKit covers it)

---

## 9. Workflow — how to add a new section

1. **HTML** (`templates.ts`): Use the canonical skeleton from §3.1. Add
   `class="uk-section uk-section-large"` + `uk-height-viewport="expand: true"`.
   Use `uk-container uk-container-expand uk-padding uk-flex uk-flex-column`
   for the shell. Use UIKit utilities for all layout/spacing/typography.

2. **Theme** (`_import.less`): If the section needs a new button/card variant,
   override the `@button-*` / `@card-*` variable in §3. Never add component
   CSS in `main.less`.

3. **App layer** (`main.less`): Add rules ONLY for:
   - Section-specific overrides on UIKit classes (scoped by
     `section[data-section='NAME']` or `body.light-theme`)
   - Custom interaction elements with no UIKit equivalent
   - SPA layout (`#spa-content section[data-section]` stacking)

4. **Section map** (`ARCHITECTURE.md` §Sections): Add the section to the
   8-section table with its theme (light/dark) so `ContentReveal.ts` knows
   whether to toggle `body.light-theme`.

5. **Verify**: `bun run type-check && bun run lint && bun run build`. Then
   agent-browser check: page loads, 0 console errors, section renders with
   correct theme.

---

## 10. References

- `RULES.md` — hard engine rules (TSL, WebGPU, section IDs, etc.)
- `ARCHITECTURE.md` — runtime layout, z-index map, section table
- `src/assets/_import.less` — UIKit theme assembly (the canonical source)
- `src/assets/main.less` — app layer (only what UIKit doesn't provide)
- `src/templates.ts` — SPA section templates (UIKit utilities in markup)
- `projects/*.html` — standalone project page pattern (UIKit navbar + container)
- Worklog (`/home/z/my-project/worklog.md`) — full history of UIKit cleanup tasks
