// src/pages/content/cases.ts — Case Studies page (overlay tile grid)
//
// Content page — transparent over 3D canvas. 2 sections (index + CTA).
// Mobile-first: 2 cols mobile → 3 cols desktop.

import { PAGE_REVEAL } from '../shared/constants'
import { FOOTER } from '../shared/footer'

export function casesPage(): string {
  const cases = [
    { num: '01', title: 'Nocturne Blue', cat: 'Portfolio', desc: 'WebGPU portfolio with glass cube morph.' },
    { num: '02', title: 'Ebb Vibes', cat: 'Brand', desc: 'Ambient warm study, procedural gradients.' },
    { num: '03', title: 'Till At Night', cat: 'Narrative', desc: 'Analog meets algorithm. Synth-glow post.' },
    { num: '04', title: 'Undercurrent', cat: 'Generative', desc: 'Sub-bass meditation. Volume shaders.' },
    { num: '05', title: 'Mono Sunday', cat: 'Launch', desc: 'Monochrome minimalism, reactive light.' },
    { num: '06', title: 'Velvet Echo', cat: 'Identity', desc: 'Interactive identity, live shader hero.' },
  ]
  return `
    <article class="jlz-page" data-page-view="cases">
      <section class="jlz-page-section section-active uk-section uk-section-small uk-section-medium@s uk-section-large@m" data-page-section="cases-index">
        <div class="uk-container uk-container-expand" ${PAGE_REVEAL}>
          <p class="uk-text-meta uk-text-uppercase" uk-scrollspy-class>Case Studies</p>
          <h1 class="uk-heading-large uk-margin-remove-top" uk-scrollspy-class>Selected Work</h1>
          <div class="uk-grid-small uk-child-width-1-2 uk-child-width-1-3@m uk-margin-top" uk-grid>
            ${cases.map((c) => `
              <div uk-scrollspy-class>
                <a class="uk-inline-clip uk-transition-toggle uk-link-toggle uk-display-block" href="/cases">
                  <div class="uk-card uk-card-default uk-card-body uk-card-hover jlz-case-tile">
                    <div class="uk-position-z-index uk-position-relative">
                      <span class="uk-text-meta uk-text-uppercase">${c.cat}</span>
                      <h2 class="uk-card-title uk-margin-small-top uk-margin-remove-bottom">${c.title}</h2>
                      <p class="uk-text-meta uk-margin-small-top uk-transition-fade uk-transition-opaque uk-visible@m">${c.desc}</p>
                      <span class="uk-position-top-right uk-position-small uk-text-bold uk-text-large">${c.num}</span>
                    </div>
                  </div>
                </a>
              </div>
            `).join('')}
          </div>
        </div>
      </section>
      <section class="jlz-page-section uk-section uk-text-center" data-page-section="cases-cta">
        <div class="uk-container uk-container-expand" ${PAGE_REVEAL}>
          <h2 class="uk-heading-medium uk-margin-remove" uk-scrollspy-class>Have a project in mind?</h2>
          <a class="uk-button uk-button-primary uk-button-large uk-margin-top" href="/contact" uk-scrollspy-class>Start a project</a>
        </div>
      </section>
    </article>
    ${FOOTER}
  `
}
