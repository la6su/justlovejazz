// src/pages/content/works.ts — Works page (4 sections × 2 large 3D cards)
//
// Layout: 4 joystick-navigable sections, each containing a 2-card grid row.
// Together the 4 sections form a conceptual 4×2 grid of 8 case studies.
// Each card is near-fullscreen-large with a CSS 3D tilt effect (perspective +
// rotateY/X tracked to mouse). Clicking a card opens the fullscreen
// ProjectOverlay (same overlay used by the home BakuCarousel) via the
// jlz:open-project CustomEvent → Experience.ts.
//
// 8 projects sourced from PROJECTS (Data/Projects.ts) — 2 added for this grid.
import { sectionShell, contentBottom } from '../../sections/_shared/constants'
import { FOOTER } from '../../sections/_shared/footer'
import { PROJECTS } from '../../Data/Projects'

/** A pair of projects shown together in one section's card grid. */
function workCardsGrid(idxA: number, idxB: number): string {
  const a = PROJECTS[idxA]!
  const b = PROJECTS[idxB]!
  return `<div class="jlz-works-grid uk-grid uk-grid-large uk-child-width-1-2@m" uk-grid>
    ${workCard(idxA, a.title, a.year ?? '', a.category ?? '', a.textureUrl, a.color)}
    ${workCard(idxB, b.title, b.year ?? '', b.category ?? '', b.textureUrl, b.color)}
  </div>`
}

/** One 3D tilt card. data-project-idx drives the click → overlay open.
 *  CSS custom props --rx/--ry are set by WorkCards.ts on pointermove. */
function workCard(
  idx: number,
  title: string,
  year: string,
  category: string,
  cover: string,
  accent: string,
): string {
  const num = String(idx + 1).padStart(2, '0')
  return `
    <button class="jlz-work-card" type="button" data-project-idx="${idx}"
            aria-label="Open project: ${title}"
            data-cursor="view" data-magnetic
            style="--jlz-card-accent: ${accent}">
      <div class="jlz-work-card__inner">
        <div class="jlz-work-card__image" style="background-image: url('${cover}')"></div>
        <div class="jlz-work-card__sheen" aria-hidden="true"></div>
        <div class="jlz-work-card__overlay">
          <span class="jlz-work-card__num">${num}</span>
          <div class="jlz-work-card__info">
            <h3 class="jlz-work-card__title">${title}</h3>
            <span class="jlz-work-card__meta">${year}${category ? ` · ${category}` : ''}</span>
          </div>
          <span class="jlz-work-card__arrow" aria-hidden="true">↗</span>
        </div>
      </div>
    </button>
  `
}

/** Section TOP — compact eyebrow + title (cards are the visual hero). */
function worksTop(num: string, title: string, lead: string, titleKey: string, leadKey: string): string {
  return `
    <div class="jlz-section-top jlz-section-top--compact uk-text-center uk-flex uk-flex-column uk-flex-middle">
      <span class="jlz-eyebrow" data-eyebrow data-eyebrow-text="${num}">${num}</span>
      <h2 class="studio-title uk-heading-large uk-margin-small-top uk-margin-remove-bottom" data-i18n="${titleKey}">${title}</h2>
      <p class="uk-text-lead uk-margin-small-top" data-i18n="${leadKey}">${lead}</p>
    </div>
  `
}

export function worksPage(): string {
  // 8 projects → 4 sections × 2 cards
  return `
    <article class="jlz-page jlz-works-page" data-page-view="works">
      ${sectionShell('works-01',
        worksTop('01', 'Selected Works', 'Projects that define our way.', 'works.section1.title', 'works.section1.lead'),
        contentBottom(workCardsGrid(0, 1)),
        'content', true
      )}
      ${sectionShell('works-02',
        worksTop('02', 'Case Studies', 'Process, craft, and results.', 'works.section2.title', 'works.section2.lead'),
        contentBottom(workCardsGrid(2, 3))
      )}
      ${sectionShell('works-03',
        worksTop('03', 'Experiments', 'Where R&D meets production.', 'works.section3.title', 'works.section3.lead'),
        contentBottom(workCardsGrid(4, 5))
      )}
      ${sectionShell('works-04',
        worksTop('04', 'Recent', 'The latest from the studio.', 'works.section4.title', 'works.section4.lead'),
        contentBottom(workCardsGrid(6, 7))
      )}
    </article>
    ${FOOTER}
  `
}
