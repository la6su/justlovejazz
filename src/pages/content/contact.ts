// Contact is a route-specific transmission board. The pixel title stays in
// the 3D layer; this semantic DOM layer carries the useful next action.

import { labOverlaySection } from '../../sections/lab-overlay/template'
import { navOverlaySection } from '../../sections/nav/template'

function contactSection(
  id: string,
  index: string,
  titleKey: string,
  title: string,
  body: string,
  active = false,
): string {
  return `
    <section class="jlz-page-section jlz-contact-section${active ? ' section-active' : ''} uk-section uk-section-small uk-section-large@m" id="section-${id}" data-page-section="${id}">
      <div class="uk-container uk-container-expand uk-padding uk-flex uk-flex-column uk-flex-center uk-height-1-1">
        <h2 class="uk-hidden" data-i18n="${titleKey}">${title}</h2>
        <div class="jlz-contact-panel uk-width-1-1 uk-width-2-3@m uk-width-1-2@l">
          <div class="jlz-contact-panel__chrome" aria-hidden="true">
            <span></span><span></span><span></span>
            <span class="jlz-contact-panel__index uk-text-meta uk-text-uppercase">${index} / 04</span>
          </div>
          ${body}
        </div>
      </div>
    </section>
  `
}

const emailSection = contactSection(
  'contact-01',
  '01',
  'contact.email.title',
  'Email',
  `
    <p class="jlz-contact-panel__copy" data-i18n="contact.email.copy">For a new product, a sharper interface or a realtime scene — write the first clear sentence.</p>
    <a href="mailto:hello@justlovejazz.com" class="jlz-contact-panel__address uk-link-reset">hello@justlovejazz.com</a>
    <p class="jlz-contact-panel__meta uk-text-meta" data-i18n="contact.email.meta">A reply channel, not a ticket queue.</p>
  `,
  true,
)

const socialSection = contactSection(
  'contact-02',
  '02',
  'contact.social.title',
  'Social',
  `
    <p class="jlz-contact-panel__copy" data-i18n="contact.social.copy">Follow the work in public, or send a short note where a conversation can start quickly.</p>
    <div class="uk-flex uk-flex-wrap uk-flex-middle uk-margin-medium-top jlz-contact-panel__actions">
      <a href="https://t.me/justlovejazz" target="_blank" rel="noopener" class="uk-button uk-button-default uk-button-small">Telegram</a>
      <a href="https://github.com/la6su" target="_blank" rel="noopener" class="uk-button uk-button-text uk-button-small">GitHub <span uk-icon="icon: arrow-right" aria-hidden="true"></span></a>
    </div>
  `,
)

const locationSection = contactSection(
  'contact-03',
  '03',
  'contact.location.title',
  'Location',
  `
    <p class="jlz-contact-panel__copy" data-i18n="contact.location.copy">Remote by default. We work across time zones with teams that care about the last ten percent.</p>
    <dl class="jlz-contact-panel__facts uk-description-list uk-margin-medium-top">
      <div><dt data-i18n="contact.location.fact1.label">Base</dt><dd data-i18n="contact.location.fact1.value">Remote · EU</dd></div>
      <div><dt data-i18n="contact.location.fact2.label">Practice</dt><dd data-i18n="contact.location.fact2.value">Strategy, interface, realtime</dd></div>
    </dl>
  `,
)

const briefSection = contactSection(
  'contact-04',
  '04',
  'contact.form.title',
  'Brief',
  `
    <p class="jlz-contact-panel__copy" data-i18n="contact.form.copy">A useful first message names the context, the decision ahead and the person we should reply to.</p>
    <a href="mailto:hello@justlovejazz.com?subject=Project%20brief" class="uk-button uk-button-primary uk-margin-medium-top" data-i18n="contact.form.action">Start an email</a>
    <p class="jlz-contact-panel__meta uk-text-meta" data-i18n="contact.form.meta">We will return with the right next question.</p>
  `,
)

export function contactPage(): string {
  return `
    <article class="jlz-page jlz-contact-page" data-page-view="contact">
      ${labOverlaySection('content')}
      ${emailSection}
      ${socialSection}
      ${locationSection}
      ${briefSection}
      ${navOverlaySection('content')}
    </article>
  `
}
