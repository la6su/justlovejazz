// src/sections/_shared/constants.ts — Shared constants for page templates
//
// Section motion is owned by CinematicNav's continuous scroll state. Do not
// layer UIkit scrollspy animations over those same top/bottom blocks: the
// duplicate fade introduces delayed, non-seamless section handoffs.

// (PROCESS_STEPS + processTimeline() removed — timeline layout no longer used.
// Process content now lives in the home/services/manifesto section templates
// directly via the unified homeSection/contentSection pattern.)

// ── Cube face → section mapping ──
// 6 sections = 6 cube faces. Each section maps to a cube face direction.
// SplashCube.FACE_ROTATIONS in src/Experience/World/SplashCube.ts must match.
//
//   Index | Section  | Cube face    | Face direction | Theme
//   ------|----------|--------------|----------------|-------
//   0     | Lab*     | Front (+Z)   | toward camera  | light (Contact finale)
//   1     | Intro    | Right (+X)   | right          | light (start)
//   2     | About    | Back (-Z)    | away           | dark
//   3     | Works    | Left (-X)    | left           | dark (carousel)
//   4     | Contact  | Front (+Z)*  | tilt ±π/4      | light
//   5     | Menu     | Front (+Z)*  | tilt ±π/4      | dark (top sheet)
//   * Sections 4-5 use ±π/4 tilt (two side faces visible), not true top/bottom.
//   * Section 0 keeps the canonical Lab id but publicly renders Contact.
//   D-23 fix: updated to match SplashCube.FACE_ROTATIONS (was stale).
//
// Navigation: CinematicNav scrolls horizontally through 1→2→3→4 and opens
// 0 (Contact footer) / 5 (Menu) as bottom/top sheets.

export type SectionId = 'lab' | 'intro' | 'about' | 'works' | 'contact' | 'menu'
// Works section
// (cube face 3, back -Z). It's kept for backward compat — renaming would
// touch Phase enum (types.ts), WorldConfig id, PostProcessingManager keys,
// Lights keys and scene.ts group names. docs/ARCHITECTURE.md documents this
// stable mapping.

export type PageId = 'home' | 'services' | 'works' | 'manifesto' | 'lab' | 'contact'

// ── Apple Watch layout helpers ──
// Every section follows: TOP (eyebrow + title) / 3D CENTER (transparent) / BOTTOM (UI panel)
// These helpers generate the TUI-like wrapper structure.

// (sectionTop/sectionBottom removed — home templates inline TOP/BOTTOM HTML.
//  Content pages use contentTop/contentBottom which produce the same structure.)

/** Unified section wrapper — ONE function for ALL pages (home + content).
 *  Apple Watch layout: TOP (eyebrow + title + lead) / 3D CENTER / BOTTOM (content).
 *
 *  mode: 'home' (3D cube face, data-section) | 'content' (page section, data-page-section)
 *  isActive: only for content mode — toggles .section-active on initial section.
 *  extraAttrs: additional attributes on the <section> (e.g. project-overlay id).
 *  extraHtml: additional HTML content INSIDE the section (e.g. play button overlay).
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
  extraHtml: string = '',
): string {
  const activeClass = mode === 'content' && isActive ? 'section-active' : ''
  const pageClass = mode === 'content' ? 'jlz-page-section' : ''
  const sectionAttr = mode === 'home' ? `data-section="${id}"` : `data-page-section="${id}"`

  return `
    <section class="${pageClass} ${activeClass} uk-section uk-section-small uk-section-large@m" id="section-${id}" ${sectionAttr} ${extraAttrs}>
      <div class="uk-container uk-container-expand uk-padding uk-flex uk-flex-column uk-flex-between uk-text-center uk-height-1-1">
        ${topHtml}
        ${bottomHtml}
      </div>
      ${extraHtml}
    </section>
  `
}

/** TOP block for content sections — eyebrow + title + optional lead.
 *  Same structure as sectionTop (home), but eyebrow is static text
 *  (content pages don't use NoiseText — home-only feature).
 *  headingTier: 'medium' (default) | 'large' (primary/intro).
 *  titleKey/leadKey: optional i18n keys — when provided, data-i18n attrs
 *  are added so applyTranslations() replaces the text at runtime. The
 *  English text passed in title/lead stays as the no-JS fallback. */
export function contentTop(
  eyebrow: string,
  title: string,
  lead?: string,
  headingTier: 'medium' | 'large' = 'medium',
  titleKey?: string,
  leadKey?: string,
): string {
  const titleAttr = titleKey ? ` data-i18n="${titleKey}"` : ''
  const leadAttr = leadKey ? ` data-i18n="${leadKey}"` : ''
  return `
    <div class="jlz-section-top uk-text-center uk-flex uk-flex-column uk-flex-middle">
      <span class="jlz-eyebrow" data-eyebrow data-eyebrow-text="${eyebrow}">${eyebrow}</span>
      <h2 class="studio-title uk-heading-${headingTier} uk-margin-small-top uk-margin-remove-bottom"${titleAttr}>${title}</h2>
      ${lead ? `<p class="uk-text-lead uk-margin-small-top"${leadAttr}>${lead}</p>` : ''}
    </div>
  `
}

/** Shared console module for the lower story beat. */
export function storyBottom(content: string, marker: string = '—'): string {
  return `
    <div class="jlz-section-bottom">
      <div class="jlz-bottom-module">
        <div class="jlz-bottom-module__meta">
          <span data-i18n="story.bottomLabel">Field note</span>
          <span aria-hidden="true">${marker}</span>
        </div>
        <div class="jlz-bottom-module__content">
          ${content}
        </div>
      </div>
    </div>
  `
}

/** BOTTOM block for content sections — wraps cards/grid/list content. */
export function contentBottom(content: string): string {
  return storyBottom(content)
}
