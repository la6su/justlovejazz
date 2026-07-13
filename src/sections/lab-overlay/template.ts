// src/sections/lab-overlay/template.ts — Lab overlay (secret left section on all pages)
//
// This is the "experiments" section — styled list of works/experiments shown
// when user drags joystick LEFT (section 0 on all pages).
//
// Content: grid of project cards (from PROJECTS) with cover thumbnails.
// Style: compact list, accent-lime hover, backdrop blur.

import { sectionShell } from '../_shared/constants'
import { PROJECTS } from '../../Data/Projects'

/** Lab overlay section — shown as section 0 (joystick left) on ALL pages.
 *  Styled list of works/experiments with cover thumbnails.
 *  On home page it replaces the old labSection. On content pages it replaces
 *  the old "secret left" section. */
export function labOverlaySection(mode: 'home' | 'content' = 'content'): string {
  const top = `
    <div class="jlz-section-top jlz-lab-overlay-top uk-text-center uk-flex uk-flex-column uk-flex-middle">
      <span class="jlz-eyebrow" data-eyebrow data-eyebrow-text="←">←</span>
      <h2 class="studio-title uk-heading-large uk-margin-small-top uk-margin-remove-bottom" data-i18n="labOverlay.title">Lab</h2>
      <p class="uk-text-lead uk-margin-small-top" data-i18n="labOverlay.lead">Experiments · works · R&D.</p>
    </div>
  `
  // Grid of project cards (compact, with covers)
  const projectsHtml = PROJECTS.slice(0, 6).map((p, i) => `
    <a href="/works" class="jlz-lab-card" data-magnetic data-cursor="view">
      <span class="jlz-lab-card__cover" style="background-image: url('${p.textureUrl || p.detailTextureUrl}')"></span>
      <span class="jlz-lab-card__num">${String(i + 1).padStart(2, '0')}</span>
      <span class="jlz-lab-card__title">${p.title}</span>
      <span class="jlz-lab-card__meta">${p.category ?? ''}</span>
    </a>
  `).join('')

  const bottom = `
    <div class="jlz-section-bottom jlz-lab-overlay-bottom">
      <div class="jlz-lab-grid">
        ${projectsHtml}
      </div>
    </div>
  `
  // On home: data-section="lab" (keeps 3D cube face sync)
  // On content: data-page-section (regular content section)
  if (mode === 'home') {
    return sectionShell('lab', top, bottom, 'home')
  }
  return sectionShell('page-lab', top, bottom, 'content')
}
