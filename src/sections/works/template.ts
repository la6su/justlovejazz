// src/sections/works/template.ts — Face 3: Works (back face -Z)
// Apple Watch layout: TOP (eyebrow + title + drag hint) / 3D CENTER (BakuCarousel) / BOTTOM (overlay)

import { REVEAL } from '../_shared/constants'

export function worksSection(): string {
  return `
    <!-- 3: WORKS (back face -Z) — BakuCarousel -->
    <section
             class="uk-section uk-section-small uk-section-medium@s uk-section-large@m" id="section-challenge" data-section="challenge">
      <div class="uk-position-cover" data-dynamic-content>
        <div class="uk-container uk-container-expand uk-padding uk-flex uk-flex-column uk-flex-between uk-text-center uk-height-1-1">
          <!-- TOP -->
          <div ${REVEAL}>
            <span class="jlz-eyebrow" data-eyebrow></span>
            <h2 class="studio-title uk-heading-medium uk-margin-small-top uk-margin-remove-bottom"
                data-content-id="challenge-title">Works</h2>
            <p class="uk-text-meta uk-margin-small-top">Six interactive experiences</p>
          </div>
          <!-- BOTTOM: drag hint -->
          <div class="uk-text-meta uk-flex uk-flex-center uk-flex-middle jlz-flex-gap-small" ${REVEAL}>
            <span uk-icon="icon: arrow-left; ratio: 0.7" aria-hidden="true"></span>
            <span>drag to spin</span>
            <span uk-icon="icon: arrow-right; ratio: 0.7" aria-hidden="true"></span>
          </div>
        </div>
        <div id="project-overlay" class="uk-position-z-index"></div>
      </div>
    </section>
  `
}
