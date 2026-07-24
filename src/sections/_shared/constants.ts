// src/sections/_shared/constants.ts — Shared helpers for page templates.
//
// Section motion is owned by CinematicNav's continuous scroll state. Do not
// layer UIkit scrollspy animations over those same top/bottom blocks.

// ── Cube face → section mapping ──
// 6 sections = 6 cube faces. SplashCube.FACE_ROTATIONS in SplashCube.ts must match.
//
//   Index | Section  | Cube face    | Theme
//   ------|----------|--------------|-------
//   0     | Lab*     | Front (+Z)   | light (Contact finale)
//   1     | Intro    | Right (+X)   | light (start)
//   2     | About    | Back (-Z)    | dark
//   3     | Works    | Left (-X)    | dark (carousel)
//   4     | Contact  | tilt ±π/4    | light
//   5     | Menu     | tilt ±π/4    | dark (top sheet)
//   * Section 0 keeps the canonical Lab id but publicly renders Contact.

export type SectionId = 'lab' | 'intro' | 'about' | 'works' | 'contact' | 'menu'

export type PageId = 'home' | 'services' | 'works' | 'manifesto' | 'lab' | 'contact'

// ── Layout helpers ──
// Every section follows: TOP (eyebrow + title) / 3D CENTER (transparent) /
// BOTTOM (UI panel). These helpers generate the wrapper structure using UIkit
// utilities. No .jlz-* utility classes; see docs/UIKIT3.md.

/** Unified section wrapper — ONE function for ALL pages (home + content).
 *  TOP/CENTER/BOTTOM layout via uk-flex uk-flex-between uk-height-1-1. */
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
      <div class=" uk-container uk-container-expand uk-padding uk-flex uk-flex-column uk-flex-between uk-height-1-1">
        ${topHtml}
        ${bottomHtml}
      </div>
      ${extraHtml}
    </section>
  `
}

/** TOP block for home sections — eyebrow + title + lead.
 *  Eyebrow uses data-eyebrow/data-eyebrow-text for NoiseText typewriter. */
export function homeTop(
  eyebrow: string,
  titleKey: string,
  titleFallback: string,
  leadKey: string,
  leadFallback: string,
  tier: 'large' | 'xlarge' = 'large',
): string {
  return `
    <div class="jlz-section-top uk-text-center uk-flex uk-flex-column uk-flex-middle">
      <span class="jlz-eyebrow" data-eyebrow data-eyebrow-text="${eyebrow}">${eyebrow}</span>
      <h2 class="studio-title uk-heading-${tier} uk-margin-small-top uk-margin-remove-bottom" data-i18n="${titleKey}">${titleFallback}</h2>
      <p class="uk-text-lead uk-margin-small-top" data-i18n="${leadKey}">${leadFallback}</p>
    </div>
  `
}

/** TOP block for content sections — eyebrow + title + optional lead.
 *  headingTier: 'medium' (default) | 'large' (primary/intro). */
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
      <div class="jlz-cinematic-shell">
        <div>
          <span data-i18n="story.bottomLabel">Field note</span>
          <span aria-hidden="true">${marker}</span>
        </div>
        <div>
          ${content}
        </div>
      </div>
    </div>
  `
}

/** Stacked uk-text-meta description lines below a section title.
 *  Accepts an i18n key prefix and string lines — generates data-i18n keys
 *  automatically (prefix.desc1, prefix.desc2, ...). */
export function i18nDesc(key: string, lines: readonly string[]): string {
  if (lines.length === 0) return ''
  return `<div class="jlz-service-desc uk-flex uk-flex-column uk-margin-small-top">${lines
    .map((line, i) => `<p class="uk-text-meta uk-margin-remove" data-i18n="${key}.desc${i + 1}">${line}</p>`)
    .join('')}</div>`
}

/** Stacked uk-text-meta description lines below a section title (legacy alias). */
export function descBlock(lines: { key: string; text: string }[]): string {
  return `<div class="jlz-desc uk-margin-small-top">${lines
    .map((l) => `<p class="uk-text-meta uk-margin-remove" data-i18n="${l.key}">${l.text}</p>`)
    .join('')}</div>`
}

/** Explore / Read more / Send pill button with a console-style dot marker.
 *  UIkit owns button sizing/weight; the dot is the only bespoke element. */
export function serviceExplore(
  href: string,
  labelKey: string,
  labelFallback: string,
  extraClass: string = '',
): string {
  return `<a href="${href}" class="jlz-service-explore uk-button uk-button-default uk-button-small uk-text-uppercase uk-margin-top${extraClass ? ' ' + extraClass : ''}">
    <span class="jlz-service-explore__dot" aria-hidden="true"></span>
    <span data-i18n="${labelKey}">${labelFallback}</span>
  </a>`
}
