// src/sections/_shared/constants.ts — Shared constants for page templates
//
// REVEAL: scrollspy attribute for home sections (per-element, repeatable)
// PAGE_REVEAL: scrollspy attribute for content pages (target children)

export const REVEAL = 'uk-scrollspy="cls: uk-animation-fade; delay: 300; repeat: true"'

export const PAGE_REVEAL = 'uk-scrollspy="cls: uk-animation-fade; delay: 120; target: > *"'

// (PROCESS_STEPS + processTimeline() removed — timeline layout no longer used.
// Process content now lives in the home/services/manifesto section templates
// directly via the unified homeSection/contentSection pattern.)

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

/** Generate the TOP header block — eyebrow shows the section number (01-06)
 *  as a console-like numeral with glitch reveal via NoiseText on section
 *  change (home) or static (content pages). headingTier: 'medium' (default)
 *  | 'large' (primary) | 'xlarge' (hero). */
export function sectionTop(
  eyebrow: string,
  title: string,
  lead?: string,
  headingTier: 'medium' | 'large' | 'xlarge' = 'medium',
): string {
  return `
    <div class="jlz-section-top uk-text-center uk-flex uk-flex-column uk-flex-middle" ${REVEAL}>
      <span class="jlz-eyebrow" data-eyebrow data-eyebrow-text="${eyebrow}">${eyebrow}</span>
      <h2 class="studio-title uk-heading-${headingTier} uk-margin-small-top uk-margin-remove-bottom">${title}</h2>
      ${lead ? `<p class="uk-text-lead uk-margin-small-top">${lead}</p>` : ''}
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

/** Unified section wrapper — ONE function for ALL pages (home + content).
 *  Apple Watch layout: TOP (eyebrow + title + lead) / 3D CENTER / BOTTOM (content).
 *
 *  mode: 'home' (3D cube face, data-section, data-dynamic-content overlay)
 *        | 'content' (page section, data-page-section, no overlay)
 *  isActive: only for content mode — toggles .section-active on initial section.
 *  extraAttrs: additional attributes on the <section> (e.g. project-overlay id).
 *
 *  UIKit3: uk-section-small + uk-section-large@m (responsive padding),
 *  uk-container-expand, uk-flex uk-flex-between uk-height-1-1 (Apple Watch
 *  TOP/CENTER/BOTTOM layout). align via uk-text-left/uk-text-center in topHtml. */
export function sectionShell(
  id: string,
  topHtml: string,
  bottomHtml: string,
  mode: 'home' | 'content' = 'content',
  isActive: boolean = false,
  extraAttrs: string = '',
): string {
  const activeClass = mode === 'content' && isActive ? 'section-active' : ''
  const pageClass = mode === 'content' ? 'jlz-page-section' : ''
  const sectionAttr = mode === 'home' ? `data-section="${id}"` : `data-page-section="${id}"`
  const overlayWrapper = mode === 'home'
    ? `<div class="uk-position-cover" data-dynamic-content>`
    : ''
  const overlayClose = mode === 'home' ? '</div>' : ''

  return `
    <section class="${pageClass} ${activeClass} uk-section uk-section-small uk-section-large@m" id="section-${id}" ${sectionAttr} ${extraAttrs}>
      ${overlayWrapper}
        <div class="uk-container uk-container-expand uk-padding uk-flex uk-flex-column uk-flex-between uk-text-center uk-height-1-1">
          ${topHtml}
          ${bottomHtml}
        </div>
      ${overlayClose}
    </section>
  `
}

/** TOP block for content sections — eyebrow + title + optional lead.
 *  Same structure as sectionTop (home), but eyebrow is static text
 *  (content pages don't use NoiseText/Subtitles — home-only feature).
 *  headingTier: 'medium' (default) | 'large' (primary/intro). */
export function contentTop(
  eyebrow: string,
  title: string,
  lead?: string,
  headingTier: 'medium' | 'large' = 'medium',
): string {
  return `
    <div class="jlz-section-top uk-text-center uk-flex uk-flex-column uk-flex-middle" ${PAGE_REVEAL}>
      <span class="jlz-eyebrow" data-eyebrow data-eyebrow-text="${eyebrow}">${eyebrow}</span>
      <h2 class="studio-title uk-heading-${headingTier} uk-margin-small-top uk-margin-remove-bottom">${title}</h2>
      ${lead ? `<p class="uk-text-lead uk-margin-small-top">${lead}</p>` : ''}
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
