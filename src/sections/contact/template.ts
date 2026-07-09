// src/pages/sections/contact.ts — Face 4: Contact (bottom face -Y)
//
// Large CTA with glass buttons. This is the home page footer equivalent.
// The unified .jlz-footer is hidden on home because this section IS the footer.
//
// 3D sync: EnvSphere pattern 4 (light off-white gradient), SplashCube face 4.

import { REVEAL } from '../_shared/constants'

export function contactSection(): string {
  return `
    <!-- 4: CONTACT (bottom face -Y) — large CTA, glass buttons -->
    <section uk-height-viewport="expand: true"
             class="uk-section uk-section-small uk-section-medium@s uk-section-large@m" id="section-contact" data-section="contact">
      <div class="uk-position-cover" data-dynamic-content>
        <div class="uk-container uk-container-expand uk-padding uk-flex uk-flex-column uk-flex-top uk-text-center uk-height-1-1">
          <h2 class="studio-title uk-heading-medium"
              data-content-id="contact-title">Contact</h2>
          <p class="uk-text-lead uk-text-large" ${REVEAL}
             data-content-id="contact-text">
            Let's build something extraordinary.
          </p>
          <a href="mailto:hello@justlovejazz.com"
             class="uk-link uk-margin-top" ${REVEAL}>hello@justlovejazz.com</a>
          <div class="uk-grid-small uk-child-width-auto@s uk-flex uk-flex-center uk-margin-top"
               uk-grid ${REVEAL}
               data-content-id="contact-grid">
            <a href="mailto:hello@justlovejazz.com"
               class="uk-button uk-button-primary uk-button-large">
              <span uk-icon="icon: mail; ratio: 1.1" aria-hidden="true"></span>
              <span>Start a project</span>
            </a>
            <a href="https://github.com" class="uk-button uk-button-default uk-button-large"
               target="_blank" rel="noopener">
              <span uk-icon="icon: github; ratio: 1.1" aria-hidden="true"></span>
              <span>GitHub</span>
            </a>
            <a href="https://twitter.com" class="uk-button uk-button-default uk-button-large"
               target="_blank" rel="noopener">
              <span uk-icon="icon: twitter; ratio: 1.1" aria-hidden="true"></span>
              <span>Twitter</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  `
}
