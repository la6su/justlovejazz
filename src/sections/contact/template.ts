// src/sections/contact/template.ts — Face 4: Contact (bottom face -Y)
// Apple Watch layout: TOP (num 04 + title + lead) / 3D CENTER / BOTTOM (inline form + social)

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
            <div class="jlz-section-num jlz-numeral">04</div>
            <h2 class="studio-title uk-heading-large uk-margin-small-top uk-margin-remove-bottom"
                data-content-id="contact-title">Contact</h2>
            <p class="uk-text-lead uk-margin-small-top">Open for new projects. Let's talk.</p>
          </div>
          <!-- BOTTOM: inline mailto form (no-JS fallback) + social -->
          <div ${REVEAL}>
            <form class="jlz-contact-form uk-flex uk-flex-center uk-flex-middle uk-margin-bottom"
                  action="mailto:hello@justlovejazz.com" method="post" enctype="text/plain">
              <div class="uk-inline uk-width-1-1 uk-width-medium@s">
                <span class="uk-form-icon" uk-icon="icon: mail" aria-hidden="true"></span>
                <input class="uk-input" type="text" name="subject"
                       placeholder="What's the project?" aria-label="Project subject" />
              </div>
              <button class="uk-button uk-button-primary uk-margin-small-left" type="submit">
                <span uk-icon="icon: push" aria-hidden="true"></span>
                <span class="uk-margin-small-left">Send</span>
              </button>
            </form>
            <a href="mailto:hello@justlovejazz.com" class="uk-link uk-text-large">hello@justlovejazz.com</a>
            <div class="uk-grid-small uk-child-width-auto@s uk-flex uk-flex-center uk-margin-top" uk-grid>
              <a href="https://github.com/la6su" class="uk-button uk-button-default uk-button-large" target="_blank" rel="noopener">
                <span uk-icon="icon: github; ratio: 1.1" aria-hidden="true"></span>
                <span>GitHub</span>
              </a>
              <a href="https://x.com/justlovejazz" class="uk-button uk-button-default uk-button-large" target="_blank" rel="noopener">
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
