// src/pages/content/contact.ts — Contact page (hero CTA + FAQ)
//
// Content page — transparent over 3D canvas. 2 sections (intro + FAQ).
// Mobile-first compact: big email link + CTA + FAQ split.

import { PAGE_REVEAL } from '../shared/constants'
import { FOOTER } from '../shared/footer'

export function contactPage(): string {
  return `
    <article class="jlz-page" data-page-view="contact">
      <section class="jlz-page-section section-active uk-section uk-text-center" data-page-section="contact-intro">
        <div class="uk-container uk-container-expand" ${PAGE_REVEAL}>
          <p class="uk-text-meta uk-text-uppercase" uk-scrollspy-class>Contact</p>
          <h1 class="uk-heading-large uk-margin-top" uk-scrollspy-class>Let's Talk</h1>
          <p class="uk-text-meta uk-margin-top uk-width-2-3@m uk-margin-auto" uk-scrollspy-class>Got a project that needs glass, motion, and light? We take limited engagements per quarter.</p>
          <div class="uk-margin-top" uk-scrollspy-class>
            <a href="mailto:hello@justlovejazz.com" class="uk-link uk-heading-medium jlz-contact-link">
              hello@justlovejazz.com
            </a>
          </div>
          <div class="uk-margin-top" uk-scrollspy-class>
            <a href="mailto:hello@justlovejazz.com" class="uk-button uk-button-primary uk-button-large">
              <span uk-icon="icon: mail; ratio: 1.1" aria-hidden="true"></span>
              <span>Start a project</span>
            </a>
          </div>
        </div>
      </section>
      <section class="jlz-page-section uk-section uk-section-small uk-section-medium@s uk-section-large@m" data-page-section="contact-faq">
        <div class="uk-container uk-container-expand" ${PAGE_REVEAL}>
          <div class="uk-grid uk-child-width-1-2@m uk-grid-match" uk-grid>
            <div uk-scrollspy-class>
              <p class="uk-text-meta uk-text-uppercase">Before You Ask</p>
              <h2 class="uk-heading-medium uk-margin-top">FAQ</h2>
            </div>
            <div uk-scrollspy-class>
              <ul class="uk-list uk-list-divider">
                <li><span class="uk-text-bold">Engagements</span> — 8-12 weeks, one at a time.</li>
                <li><span class="uk-text-bold">Budgets</span> — from €25k. R&D available separately.</li>
                <li><span class="uk-text-bold">Location</span> — remote. Team across EU. Async.</li>
                <li><span class="uk-text-bold">Stack</span> — WebGPU, Three.js, TSL, TS, UIkit.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </article>
    ${FOOTER}
  `
}
