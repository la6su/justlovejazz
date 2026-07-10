// src/sections/_shared/constants.ts — Shared constants for page templates
//
// REVEAL: scrollspy attribute for home sections (per-element, repeatable)
// PAGE_REVEAL: scrollspy attribute for content pages (target children)

export const REVEAL = 'uk-scrollspy="cls: uk-animation-fade; delay: 300; repeat: true"'

export const PAGE_REVEAL = 'uk-scrollspy="cls: uk-animation-fade; delay: 120; target: > *"'

// ── Shared process steps (used by services + manifesto pages) ──
export const PROCESS_STEPS = [
  { num: '01', title: 'Discover', desc: 'Audit + define.' },
  { num: '02', title: 'Design', desc: '3D prototypes.' },
  { num: '03', title: 'Develop', desc: 'WebGPU + TSL.' },
  { num: '04', title: 'Ship', desc: 'Launch + evolve.' },
] as const

// ── Cube face → section mapping ──
// 6 sections = 6 cube faces. Each section maps to a cube face direction.
// SplashCube.FACE_ROTATIONS in src/Experience/World/SplashCube.ts must match.
//
//   Index | Section  | Cube face    | Face direction | Theme
//   ------|----------|--------------|----------------|-------
//   0     | Lab      | Top (+Y)     | up             | light (secret left)
//   1     | Intro    | Front (+Z)   | toward camera  | light (start)
//   2     | About    | Right (+X)   | right          | dark
//   3     | Works    | Back (-Z)    | away           | dark (carousel)
//   4     | Contact  | Bottom (-Y)  | down           | light
//   5     | Process  | Left (-X)    | left           | dark (secret right)
//
// Navigation: JoystickNav vertical cycles 1→2→3→4 (main sections),
// horizontal toggles 0 (Lab) ↔ center ↔ 5 (Process) (secret side sections).

export type SectionId = 'lab' | 'intro' | 'about' | 'challenge' | 'contact' | 'process'
// Note: 'challenge' is the historical SectionId for the Works section
// (cube face 3, back -Z). It's kept for backward compat — renaming would
// touch Phase enum (types.ts), WorldConfig id, PostProcessingManager keys,
// Lights keys, scene.ts group name. RULES.md §14 documents this mapping.

export type PageId = 'home' | 'services' | 'manifesto'

// ── Apple Watch layout helpers ──
// Every section follows: TOP (eyebrow + title) / 3D CENTER (transparent) / BOTTOM (UI panel)
// These helpers generate the TUI-like wrapper structure.

/** Generate the TOP header block — eyebrow (empty, populated by Subtitles
 *  via NoiseText on home sections) + title + optional lead text. */
export function sectionTop(_eyebrow: string, title: string, lead?: string): string {
  return `
    <div class="jlz-section-top uk-text-center uk-flex uk-flex-column uk-flex-middle" ${REVEAL}>
      <span class="jlz-eyebrow" data-eyebrow></span>
      <h2 class="studio-title uk-heading-medium uk-margin-small-top uk-margin-remove-bottom">${title}</h2>
      ${lead ? `<p class="uk-text-meta uk-margin-small-top">${lead}</p>` : ''}
    </div>
  `
}

/** Generate the BOTTOM panel wrapper — for cards/grid/slider/list.
 *  Transparent, slides up, contains UIKit builder elements. */
export function sectionBottom(content: string): string {
  return `
    <div class="jlz-section-bottom" ${REVEAL}>
      ${content}
    </div>
  `
}

/** Full section wrapper with Apple Watch layout (TOP / 3D / BOTTOM).
 *  Height is handled by CSS `100dvh` on `#spa-content section[data-section]`
 *  + `.jlz-page-section { min-height: 100dvh }` — no uk-height-viewport needed
 *  (avoid double computation: UIkit JS vs native CSS, diverges on mobile URL-bar). */
export function sectionShell(
  id: string,
  dataSection: string,
  topHtml: string,
  bottomHtml: string,
  extraAttrs: string = '',
): string {
  return `
    <section
             class="uk-section uk-section-small uk-section-medium@s uk-section-large@m"
             id="section-${id}" data-section="${dataSection}" ${extraAttrs}>
      <div class="uk-position-cover" data-dynamic-content>
        <div class="uk-container uk-container-expand uk-padding uk-flex uk-flex-column uk-flex-between uk-text-center uk-height-1-1">
          ${topHtml}
          ${bottomHtml}
        </div>
      </div>
    </section>
  `
}

/** Content page section wrapper — same Apple Watch layout as sectionShell,
 *  but uses data-page-section (for JoystickNav page-mode navigation)
 *  instead of data-section (home cube-face navigation). No data-dynamic-content
 *  wrapper (content pages don't have 3D scene groups per section).
 *
 *  Structure: TOP (eyebrow + title + lead) / 3D CENTER (transparent) / BOTTOM (content).
 *  Same visual rhythm as home sections — consistent across the site. */
export function contentSection(
  id: string,
  topHtml: string,
  bottomHtml: string,
  isActive: boolean = false,
): string {
  return `
    <section class="jlz-page-section ${isActive ? 'section-active' : ''} uk-section uk-section-small uk-section-medium@s uk-section-large@m" data-page-section="${id}">
      <div class="uk-container uk-container-expand uk-padding uk-flex uk-flex-column uk-flex-between uk-text-center uk-height-1-1">
        ${topHtml}
        ${bottomHtml}
      </div>
    </section>
  `
}

/** TOP block for content sections — eyebrow + title + optional lead.
 *  Same structure as sectionTop (home), but eyebrow is static text
 *  (content pages don't use NoiseText/Subtitles — home-only feature). */
export function contentTop(eyebrow: string, title: string, lead?: string): string {
  return `
    <div class="jlz-section-top uk-text-center uk-flex uk-flex-column uk-flex-middle" ${PAGE_REVEAL}>
      <span class="jlz-eyebrow">&gt; ${eyebrow}</span>
      <h2 class="studio-title uk-heading-medium uk-margin-small-top uk-margin-remove-bottom">${title}</h2>
      ${lead ? `<p class="uk-text-meta uk-margin-small-top">${lead}</p>` : ''}
    </div>
  `
}

/** BOTTOM block for content sections — wraps cards/grid/list content. */
export function contentBottom(content: string): string {
  return `
    <div class="jlz-section-bottom" ${PAGE_REVEAL}>
      ${content}
    </div>
  `
}
