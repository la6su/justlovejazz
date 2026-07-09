// src/sections/contact/template.ts — Face 4: Contact (bottom face -Y)
// Apple Watch layout: TOP (title) / 3D CENTER / BOTTOM (email + buttons)

import { REVEAL } from '../_shared/constants'

export function contactSection(): string {
  return `
    <!-- 4: CONTACT (bottom face -Y) -->
    <section
             class="uk-section uk-section-small uk-section-medium@s uk-section-large@m" id="section-contact" data-section="contact">
      <div class="uk-position-cover" data-dynamic-content>
        <div class="uk-container uk-container-expand uk-padding uk-flex uk-flex-column uk-flex-between uk-text-center uk-height-1-1">
          <!-- TOP -->
          <div ${REVEAL}>
            <span class="jlz-eyebrow" data-eyebrow></span>
            <h2 class="studio-title uk-heading-medium uk-margin-small-top uk-margin-remove-bottom"
                data-content-id="contact-title">Contact</h2>
            <p class="uk-text-lead uk-margin-small-top">Let's build something extraordinary.</p>
          </div>
          <!-- BOTTOM: email + buttons -->
          <div ${REVEAL}>
            <a href="mailto:hello@justlovejazz.com" class="uk-link uk-text-large">hello@justlovejazz.com</a>
            <div class="uk-grid-small uk-child-width-auto@s uk-flex uk-flex-center uk-margin-top" uk-grid>
              <a href="mailto:hello@justlovejazz.com" class="uk-button uk-button-primary uk-button-large">
                <span uk-icon="icon: mail; ratio: 1.1" aria-hidden="true"></span>
                <span>Start a project</span>
              </a>
              <a href="https://github.com" class="uk-button uk-button-default uk-button-large" target="_blank" rel="noopener">
                <span uk-icon="icon: github; ratio: 1.1" aria-hidden="true"></span>
                <span>GitHub</span>
              </a>
              <a href="https://twitter.com" class="uk-button uk-button-default uk-button-large" target="_blank" rel="noopener">
                <span uk-icon="icon: twitter; ratio: 1.1" aria-hidden="true"></span>
                <span>Twitter</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  `
}
