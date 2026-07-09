// src/pages/content/process.ts — Process page (vertical timeline)
//
// Content page — transparent over 3D canvas. 2 sections (timeline + principles).
// Mobile-first compact: 4 steps with big numbers + lead text.

import { PAGE_REVEAL } from '../shared/constants'
import { FOOTER } from '../shared/footer'

export function processPage(): string {
  const steps = [
    { num: '01', title: 'Discover', desc: 'Research, audit, define success. We don\'t write shaders until we know the emotion.' },
    { num: '02', title: 'Design', desc: 'Art direction, 3D sketches, interaction prototypes. We test in the browser early.' },
    { num: '03', title: 'Develop', desc: 'WebGPU-first, TSL node graphs, on-demand rendering, TypeScript strict.' },
    { num: '04', title: 'Ship', desc: 'Launch, measure, evolve. We monitor frame times, not just Lighthouse.' },
  ]
  return `
    <article class="jlz-page" data-page-view="process">
      <section class="jlz-page-section section-active uk-section uk-section-small uk-section-medium@s uk-section-large@m" data-page-section="process-overview">
        <div class="uk-container uk-container-expand" ${PAGE_REVEAL}>
          <p class="uk-text-meta uk-text-uppercase" uk-scrollspy-class>Process</p>
          <h1 class="uk-heading-large uk-margin-remove-top" uk-scrollspy-class>How We Work</h1>
          <ul class="uk-list uk-list-divider uk-margin-top">
            ${steps.map((s) => `
              <li class="uk-flex uk-flex-middle uk-margin" uk-scrollspy-class>
                <span class="uk-h3 uk-margin-right" style="min-width: 56px; opacity: 0.5;">${s.num}</span>
                <div class="uk-flex-1">
                  <h2 class="uk-h4 uk-margin-remove">${s.title}</h2>
                  <p class="uk-text-meta uk-margin-small-top">${s.desc}</p>
                </div>
              </li>
            `).join('')}
          </ul>
        </div>
      </section>
      <section class="jlz-page-section uk-section uk-text-center" data-page-section="process-principles">
        <div class="uk-container uk-container-expand" ${PAGE_REVEAL}>
          <p class="uk-text-meta uk-text-uppercase" uk-scrollspy-class>Principles</p>
          <h2 class="uk-heading-medium uk-margin-top" uk-scrollspy-class>The web is a canvas for emotion.</h2>
          <p class="uk-text-meta uk-margin-top" uk-scrollspy-class>Every pixel earns its place. Every frame tells a story.</p>
          <p class="uk-text-meta uk-text-bold uk-margin-top" uk-scrollspy-class>— JUSTLOVEJAZZ</p>
        </div>
      </section>
    </article>
    ${FOOTER}
  `
}
