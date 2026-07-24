// Works is intentionally composed outside the shared content-page shell.
// The page keeps the six-section navigation contract, while each project pair
// gets an editorial composition sized by UIkit's responsive grid.

import { PROJECTS } from '../../Data/Projects'
import { labOverlaySection } from '../../sections/lab-overlay/template'
import { navOverlaySection } from '../../sections/nav/template'

type WorksLayout = 'feature' | 'equal' | 'reverse' | 'cinematic'

const SECTION_COPY = [
  [
    'Selected works',
    'works.section1.title',
    'Projects that define our way.',
    'works.section1.lead',
  ],
  ['Case studies', 'works.section2.title', 'Process, craft, result.', 'works.section2.lead'],
  [
    'Interactive systems',
    'works.section3.title',
    'Technology shaped into experience.',
    'works.section3.lead',
  ],
  ['Recent', 'works.section4.title', 'Latest from the studio.', 'works.section4.lead'],
] as const

function cardWidth(layout: WorksLayout, position: 0 | 1): string {
  const widths: Record<WorksLayout, [string, string]> = {
    feature: ['uk-width-2-3@m', 'uk-width-1-3@m'],
    equal: ['uk-width-1-2@m', 'uk-width-1-2@m'],
    reverse: ['uk-width-1-3@m', 'uk-width-2-3@m'],
    cinematic: ['uk-width-3-5@m', 'uk-width-2-5@m'],
  }
  return widths[layout][position]
}

function workCard(idx: number, prominence: 'primary' | 'secondary'): string {
  const project = PROJECTS[idx]!
  const number = String(idx + 1).padStart(2, '0')
  const meta = [project.year, project.category].filter(Boolean).join(' · ')
  const disciplines = project.tags?.slice(0, 2).join(' · ') ?? project.category ?? ''

  return `
    <div class="${prominence === 'primary' ? 'jlz-work-slot--primary' : 'jlz-work-slot--secondary'}">
      <button class="jlz-work-card jlz-case-plane jlz-work-card--${prominence} uk-inline uk-transition-toggle" type="button"
              data-project-idx="${idx}" data-project-id="${project.id}" data-cursor="view" data-magnetic
              aria-label="Open project: ${project.title}">
        <span class="jlz-work-card__inner">
          <span class="jlz-work-card__media uk-cover-container">
            <img class="jlz-work-card__image uk-transition-scale-up uk-transition-opaque"
                 src="${project.textureUrl}" alt="" loading="${idx < 2 ? 'eager' : 'lazy'}" uk-cover>
            <span class="jlz-work-card__chromatic" aria-hidden="true"></span>
          </span>
          <span class="jlz-work-card__number">${number}</span>
          <span class="jlz-work-card__discipline">${disciplines}</span>
          <span class="jlz-work-card__overlay uk-position-bottom">
            <span class="jlz-work-card__copy">
              <strong class="jlz-work-card__title">${project.title}</strong>
              <span class="jlz-work-card__meta">${meta}</span>
            </span>
            <span class="jlz-work-card__arrow" aria-hidden="true" uk-icon="icon: arrow-up-right; ratio: 1.1"></span>
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
  const [title, titleKey, lead, leadKey] = SECTION_COPY[sectionIndex - 1]!

  return `
    <section class="jlz-page-section jlz-works-section jlz-works-section--${layout}${active ? ' section-active' : ''}"
             id="section-works-${number}" data-page-section="works-${number}"
             >
      <div class="jlz-works-stage uk-container uk-container-expand">
        <header class="jlz-works-index uk-flex uk-flex-middle uk-flex-between uk-text-uppercase">
          <div class="uk-flex uk-flex-middle">
            <span class="jlz-works-index__number">${number}</span>
            <h2 class="jlz-works-index__title uk-margin-remove" data-i18n="${titleKey}">${title}</h2>
          </div>
          <span class="jlz-works-index__progress">${number} / 04</span>
        </header>

        <div class="jlz-works-statement" aria-hidden="true">
          <span class="jlz-works-statement__title" data-i18n="${titleKey}">${title}</span>
          <span class="jlz-works-statement__lead ${layout === 'reverse' || layout === 'cinematic' ? 'uk-text-left' : 'uk-text-right'}" data-i18n="${leadKey}">${lead}</span>
        </div>

        <div class="jlz-works-grid jlz-works-composition jlz-works-composition--${layout} uk-grid uk-grid-small uk-height-1-1" uk-grid>
          <div class="${cardWidth(layout, 0)}">${workCard(projectA, 'primary')}</div>
          <div class="${cardWidth(layout, 1)}">${workCard(projectB, 'secondary')}</div>
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
