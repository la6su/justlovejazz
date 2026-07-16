// src/sections/lab-overlay/template.ts — Lab overlay (secret left section on all pages)
//
// This is the "experiments" section — styled list of works/experiments shown
// when user drags joystick LEFT (section 0 on all pages).
//
// Content: grid of project cards (from PROJECTS) with cover thumbnails.
// Style: compact list, accent-lime hover, backdrop blur.

import { sectionShell } from '../_shared/constants'
import { PROJECTS } from '../../Data/Projects'

const LAB_PROJECTS = PROJECTS.slice(0, 6)

function projectCard(project: (typeof LAB_PROJECTS)[number], index: number): string {
  return `
    <a href="/works" class="jlz-lab-card" data-magnetic data-cursor="view">
      <span class="jlz-lab-card__cover" style="background-image: url('${project.textureUrl || project.detailTextureUrl}')"></span>
      <span class="jlz-lab-card__num">${String(index + 1).padStart(2, '0')}</span>
      <span class="jlz-lab-card__title">${project.title}</span>
      <span class="jlz-lab-card__meta">${project.category ?? ''}</span>
    </a>
  `
}

/**
 * The compact Lab representation is intentionally a native UIkit Accordion.
 * It exists only below the desktop breakpoint, where a six-card gallery does
 * not fit above the joystick. Both layouts render from LAB_PROJECTS so the
 * project selection cannot drift between desktop and mobile.
 */
function projectAccordionItem(project: (typeof LAB_PROJECTS)[number], index: number): string {
  const number = String(index + 1).padStart(2, '0')
  const image = project.textureUrl || project.detailTextureUrl
  return `
    <li class="jlz-lab-accordion__item">
      <a class="uk-accordion-title jlz-lab-accordion__title" href="#">
        <span class="jlz-lab-accordion__num">${number}</span>
        <span class="jlz-lab-accordion__name">${project.title}</span>
        <span class="jlz-lab-accordion__meta">${project.category ?? ''}</span>
        <span uk-accordion-icon aria-hidden="true"></span>
      </a>
      <div class="uk-accordion-content jlz-lab-accordion__content">
        <a href="/works" class="jlz-lab-accordion__preview" data-magnetic data-cursor="view">
          <span class="jlz-lab-accordion__image" style="background-image: url('${image}')"></span>
          <span class="jlz-lab-accordion__action" data-i18n="labOverlay.openWorks">Open works</span>
        </a>
      </div>
    </li>
  `
}

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
  const projectsHtml = LAB_PROJECTS.map(projectCard).join('')
  const projectsAccordionHtml = LAB_PROJECTS.map(projectAccordionItem).join('')

  const bottom = `
    <div class="jlz-section-bottom jlz-lab-overlay-bottom">
      <div class="jlz-lab-grid">
        ${projectsHtml}
      </div>
      <ul class="jlz-lab-accordion" uk-accordion="multiple: false; duration: 180">
        ${projectsAccordionHtml}
      </ul>
    </div>
  `
  // On home: data-section="lab" (keeps 3D cube face sync)
  // On content: data-page-section (regular content section)
  if (mode === 'home') {
    return sectionShell('lab', top, bottom, 'home')
  }
  return sectionShell('page-lab', top, bottom, 'content')
}
