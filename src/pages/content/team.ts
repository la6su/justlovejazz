// src/pages/content/team.ts — Team page (split bio cards)
//
// Content page — transparent over 3D canvas. 2 sections (intro + values).
// Mobile-first: 1 col mobile → 2 col desktop.

import { PAGE_REVEAL } from '../shared/constants'
import { FOOTER } from '../shared/footer'

export function teamPage(): string {
  const team = [
    { role: 'Creative Director', bio: '15 years in motion design. Obsessed with light and timing.' },
    { role: 'Lead Engineer', bio: 'WebGPU early adopter. Ships production TSL. TypeScript maximalist.' },
    { role: 'Shader Artist', bio: 'Generative art background. Lives in fragment shaders. Glass is a lifestyle.' },
    { role: 'Interaction Designer', bio: 'Gesture-driven UI, magnetic cursors, scroll choreography.' },
  ]
  return `
    <article class="jlz-page" data-page-view="team">
      <section class="jlz-page-section section-active uk-section uk-section-small uk-section-medium@s uk-section-large@m" data-page-section="team-intro">
        <div class="uk-container uk-container-expand" ${PAGE_REVEAL}>
          <p class="uk-text-meta uk-text-uppercase" uk-scrollspy-class>Team</p>
          <h1 class="uk-heading-large uk-margin-remove-top" uk-scrollspy-class>Who We Are</h1>
          <p class="uk-text-meta uk-margin-top uk-width-3-4@m" uk-scrollspy-class>Engineers who design, designers who code. No handoffs — everyone ships.</p>
          <div class="uk-grid-small uk-child-width-1-2@m uk-margin-top" uk-grid>
            ${team.map((m, i) => `
              <div class="uk-card uk-card-default uk-card-body uk-card-hover" uk-scrollspy-class>
                <span class="uk-text-meta uk-text-bold">0${i + 1}</span>
                <h2 class="uk-card-title uk-margin-small-top uk-margin-remove-bottom">${m.role}</h2>
                <p class="uk-text-meta uk-margin-small-top">${m.bio}</p>
              </div>
            `).join('')}
          </div>
        </div>
      </section>
      <section class="jlz-page-section uk-section uk-section-small uk-section-medium@s uk-section-large@m" data-page-section="team-values">
        <div class="uk-container uk-container-expand" ${PAGE_REVEAL}>
          <div class="uk-grid uk-child-width-1-2@m uk-grid-match" uk-grid>
            <div uk-scrollspy-class>
              <p class="uk-text-meta uk-text-uppercase">Values</p>
              <h2 class="uk-heading-medium uk-margin-top">Craft over speed.</h2>
            </div>
            <div uk-scrollspy-class>
              <p class="uk-text-meta">Depth over surface. We'd rather ship one thing that feels alive than ten that feel flat. One engagement at a time.</p>
            </div>
          </div>
        </div>
      </section>
    </article>
    ${FOOTER}
  `
}
