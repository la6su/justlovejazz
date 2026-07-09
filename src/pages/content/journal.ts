// src/pages/content/journal.ts — Journal page (magazine grid)
//
// Content page — transparent over 3D canvas. 2 sections (latest + notes).
// Mobile-first: 2 cols mobile → 2 cols desktop.

import { PAGE_REVEAL } from '../shared/constants'
import { FOOTER } from '../shared/footer'

export function journalPage(): string {
  const posts = [
    { cat: 'Shaders', title: 'Why TSL Changes Everything', excerpt: 'TSL node graphs compiled on the fly — WebGPU portability without boilerplate.', date: 'Jul 2026' },
    { cat: 'Process', title: 'Designing in the Browser', excerpt: 'Why we killed static mockups and sketch directly in WebGL.', date: 'Jun 2026' },
    { cat: 'Performance', title: 'On-Demand Rendering', excerpt: 'Zero draw calls when idle. 3D sites that stay fast.', date: 'May 2026' },
    { cat: 'WebGPU', title: 'WebGPU or Bust', excerpt: 'Real WebGPU vs WebGLBackend — what ships to users in 2026.', date: 'Apr 2026' },
  ]
  return `
    <article class="jlz-page" data-page-view="journal">
      <section class="jlz-page-section section-active uk-section uk-section-small uk-section-medium@s uk-section-large@m" data-page-section="journal-latest">
        <div class="uk-container uk-container-expand" ${PAGE_REVEAL}>
          <p class="uk-text-meta uk-text-uppercase" uk-scrollspy-class>Journal</p>
          <h1 class="uk-heading-large uk-margin-remove-top" uk-scrollspy-class>Writing</h1>
          <div class="uk-grid-small uk-child-width-1-2 uk-child-width-1-2@m uk-margin-top" uk-grid>
            ${posts.map((p) => `
              <article class="uk-card uk-card-default uk-card-body uk-card-hover" uk-scrollspy-class>
                <div class="uk-flex uk-flex-between uk-flex-middle">
                  <span class="uk-label">${p.cat}</span>
                  <span class="uk-text-meta">${p.date}</span>
                </div>
                <h2 class="uk-card-title uk-margin-small-top uk-margin-remove-bottom">${p.title}</h2>
                <p class="uk-text-meta uk-margin-small-top uk-visible@m">${p.excerpt}</p>
                <a class="uk-button uk-button-text uk-margin-top uk-visible@m" href="/journal">Read →</a>
              </article>
            `).join('')}
          </div>
        </div>
      </section>
      <section class="jlz-page-section uk-section uk-text-center" data-page-section="journal-notes">
        <div class="uk-container uk-container-expand" ${PAGE_REVEAL}>
          <h2 class="uk-heading-medium uk-margin-remove" uk-scrollspy-class>Notes from the studio</h2>
          <p class="uk-text-meta uk-margin-top uk-width-2-3@m uk-margin-auto" uk-scrollspy-class>Short-form writing about tools, releases, and decisions behind the work. No SEO bait.</p>
        </div>
      </section>
    </article>
    ${FOOTER}
  `
}
