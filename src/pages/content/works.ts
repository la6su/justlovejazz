// Works is intentionally composed outside the shared content-page shell.
// The page keeps the six-section navigation contract, while each project pair
// gets an editorial composition sized by UIkit's responsive grid.
//
// The section title is rendered as a 3D pixel-text screen (WorksTextScreen)
// behind the work cards — NOT as HTML. The DOM only
// carries the index header + semantic card buttons.

import { PROJECTS } from '../../Data/Projects'
import { labOverlaySection } from '../../sections/lab-overlay/template'
import { navOverlaySection } from '../../sections/nav/template'

type WorksLayout = 'feature' | 'equal' | 'reverse' | 'cinematic'

function cardWidth(layout: WorksLayout, position: 0 | 1): string {
  const widths: Record<WorksLayout, [string, string]> = {
    feature: ['uk-width-2-3@m', 'uk-width-1-3@m'],
    equal: ['uk-width-1-2@m', 'uk-width-1-2@m'],
    reverse: ['uk-width-1-3@m', 'uk-width-2-3@m'],
    cinematic: ['uk-width-3-5@m', 'uk-width-2-5@m'],
  }
  return widths[layout][position]
}

function workCard(idx: number): string {
  const project = PROJECTS[idx]!
  const number = String(idx + 1).padStart(2, '0')
  const meta = [project.year, project.category].filter(Boolean).join(' · ')
  const disciplines = project.tags?.slice(0, 2).join(' · ') ?? project.category ?? ''

  return `
    <div>
      <button class="jlz-work-card jlz-case-plane uk-position-relative uk-flex uk-flex-bottom" type="button"
              data-project-idx="${idx}" data-project-id="${project.id}" data-cursor="view" data-magnetic
              aria-label="Open project: ${project.title}">
        <span class="jlz-work-card__caption uk-position-bottom uk-width-1-1 uk-flex uk-flex-bottom uk-flex-between">
          <span class="jlz-work-card__eyebrow uk-text-uppercase">${number} · ${disciplines}</span>
          <span class="jlz-work-card__copy uk-flex uk-flex-column">
            <strong class="jlz-work-card__title uk-text-truncate">${project.title}</strong>
            <span class="jlz-work-card__meta uk-text-uppercase">${meta}</span>
          </span>
        </span>
      </button>
    </div>`
}

function worksSection(
  sectionIndex: number,
  projectA: number,
  projectB: number,
  layout: WorksLayout,
  active = false,
): string {
  const number = String(sectionIndex).padStart(2, '0')

  return `
    <section class="jlz-page-section jlz-works-section jlz-works-section--${layout}${active ? ' section-active' : ''}"
             id="section-works-${number}" data-page-section="works-${number}"
             >
      <div class="jlz-works-stage uk-container uk-container-expand uk-position-relative">
        <header class="jlz-works-index uk-flex uk-flex-middle uk-flex-between uk-text-uppercase">
          <div class="uk-flex uk-flex-middle">
            <span class="jlz-works-index__number">${number}</span>
            <h2 class="jlz-works-index__title uk-margin-remove" data-i18n="works.section${sectionIndex}.title">Section ${number}</h2>
          </div>
          <span class="jlz-works-index__progress">${number} / 04</span>
        </header>

        <div class="jlz-works-grid jlz-works-composition uk-grid uk-grid-small uk-height-1-1 uk-flex uk-flex-middle uk-child-width-1-1 uk-child-width-auto@m" data-works-layout="${layout}" uk-grid>
          <div class="${cardWidth(layout, 0)}">${workCard(projectA)}</div>
          <div class="${cardWidth(layout, 1)}">${workCard(projectB)}</div>
        </div>
      </div>
    </section>`
}

export function worksPage(): string {
  return `
    <article class="jlz-page jlz-works-page" data-page-view="works">
      ${labOverlaySection('content')}
      ${worksSection(1, 0, 1, 'feature', true)}
      ${worksSection(2, 2, 3, 'equal')}
      ${worksSection(3, 4, 5, 'reverse')}
      ${worksSection(4, 6, 7, 'cinematic')}
      ${navOverlaySection('content')}
    </article>`
}
