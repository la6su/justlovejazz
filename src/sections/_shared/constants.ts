// src/sections/_shared/constants.ts — Shared constants for page templates
//
// REVEAL: scrollspy attribute for home sections (per-element, repeatable)
// PAGE_REVEAL: scrollspy attribute for content pages (target children)

export const REVEAL = 'uk-scrollspy="cls: uk-animation-fade; delay: 300; repeat: true"'

export const PAGE_REVEAL = 'uk-scrollspy="cls: uk-animation-fade; delay: 120; target: > *"'

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

export type PageId = 'home' | 'services' | 'posts'

// ── Apple Watch layout helpers ──
// Every section follows: TOP (eyebrow + title) / 3D CENTER (transparent) / BOTTOM (UI panel)
// These helpers generate the TUI-like wrapper structure.

/** Generate the TOP header block — eyebrow + title + optional lead text.
 *  TUI-like: monospace eyebrow with terminal cursor `>`, compact, 1-2 lines. */
export function sectionTop(eyebrow: string, title: string, lead?: string): string {
  return `
    <div class="jlz-section-top uk-text-center uk-flex uk-flex-column uk-flex-middle" ${REVEAL}>
      <span class="jlz-eyebrow uk-text-meta uk-text-uppercase">&gt; ${eyebrow}</span>
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

/** Full section wrapper with Apple Watch layout (TOP / 3D / BOTTOM). */
export function sectionShell(
  id: string,
  dataSection: string,
  topHtml: string,
  bottomHtml: string,
  extraAttrs: string = '',
): string {
  return `
    <section uk-height-viewport="expand: true"
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
