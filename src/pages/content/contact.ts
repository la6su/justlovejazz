// Contact is a route-specific transmission board. The 3D pixel title names the
// current frame; the DOM holds one useful action at a time.

import { labOverlaySection } from '../../sections/lab-overlay/template'
import { navOverlaySection } from '../../sections/nav/template'

function contactSection(
  id: string,
  titleKey: string,
  title: string,
  content: string,
  active = false,
): string {
  return `
    <section class="jlz-page-section jlz-contact-section${active ? ' section-active' : ''} uk-section uk-section-small uk-section-large@m" id="section-${id}" data-page-section="${id}">
      <div class="uk-container uk-container-expand uk-padding uk-flex uk-flex-column uk-flex-center uk-height-1-1">
        <h2 class="uk-hidden" data-i18n="${titleKey}">${title}</h2>
        ${content}
      </div>
    </section>
  `
}

function consolePanel(index: string, body: string): string {
  return `
    <div class="jlz-console-card jlz-contact-panel uk-width-1-1 uk-width-2-3@m uk-width-1-2@l" uk-scrollspy="cls: uk-animation-slide-bottom-small; repeat: true">
      <div class="jlz-console-card__chrome" aria-hidden="true">
        <span></span><span></span><span></span>
        <span class="jlz-console-card__index uk-text-meta uk-text-uppercase">${index} / 04</span>
      </div>
      ${body}
    </div>
  `
}

const emailSection = contactSection(
  'contact-01',
  'contact.email.title',
  'Email',
  consolePanel(
    '01',
    `
      <h3 class="jlz-contact-panel__title studio-title uk-heading-medium uk-margin-remove" data-i18n="contact.email.heading">Start here.</h3>
      <a href="mailto:hello@justlovejazz.com" class="jlz-contact-panel__address uk-link-reset">hello@justlovejazz.com</a>
      <p class="jlz-contact-panel__meta uk-text-meta" data-i18n="contact.email.meta">For new work, questions and good ideas.</p>
    `,
  ),
  true,
)

const socialSection = contactSection(
  'contact-02',
  'contact.social.title',
  'Social',
  `
    <div class="jlz-contact-social uk-width-1-1 uk-width-2-3@m" uk-scrollspy="cls: uk-animation-slide-left-small; repeat: true">
      <div class="jlz-contact-social__heading uk-flex uk-flex-between uk-flex-middle">
        <span class="jlz-contact-social__index uk-text-meta uk-text-uppercase" data-eyebrow data-eyebrow-text="02 / 04">02 / 04</span>
        <span class="uk-text-meta uk-text-uppercase" data-i18n="contact.social.lead">Find us</span>
      </div>
      <h3 class="jlz-contact-social__title studio-title uk-heading-large uk-margin-bottom" data-i18n="contact.social.heading">Keep in touch.</h3>
      <div class="jlz-contact-social__channels uk-grid uk-grid-small uk-child-width-1-2@s" uk-grid uk-scrollspy="target: > div; cls: uk-animation-slide-bottom-small; delay: 90; repeat: true">
        <div>
          <a href="https://t.me/justlovejazz" target="_blank" rel="noopener" class="jlz-contact-social__channel uk-card uk-card-body uk-link-reset">
            <span class="jlz-contact-social__icon" uk-icon="icon: telegram; ratio: 1.35" aria-hidden="true"></span>
            <span class="jlz-contact-social__channel-copy">
              <strong>Telegram</strong>
              <small data-i18n="contact.social.telegram">The quickest way to start.</small>
            </span>
            <span uk-icon="icon: arrow-up-right" aria-hidden="true"></span>
          </a>
        </div>
        <div>
          <a href="https://github.com/la6su" target="_blank" rel="noopener" class="jlz-contact-social__channel uk-card uk-card-body uk-link-reset">
            <span class="jlz-contact-social__icon" uk-icon="icon: github; ratio: 1.35" aria-hidden="true"></span>
            <span class="jlz-contact-social__channel-copy">
              <strong>GitHub</strong>
              <small data-i18n="contact.social.github">Open work and experiments.</small>
            </span>
            <span uk-icon="icon: arrow-up-right" aria-hidden="true"></span>
          </a>
        </div>
      </div>
    </div>
  `,
)

const locationSection = contactSection(
  'contact-03',
  'contact.location.title',
  'Location',
  `
    <div class="jlz-contact-location uk-width-1-1" aria-label="Cyprus · Agros" uk-scrollspy="cls: uk-animation-fade; repeat: true">
      <span class="uk-text-meta uk-text-uppercase">34.916° N · 32.999° E</span>
      <h3 class="jlz-contact-location__title studio-title uk-heading-medium uk-margin-remove" data-i18n="contact.location.heading">Find us here.</h3>
      <span data-i18n="contact.location.caption">A quiet base in the Troodos mountains.</span>
    </div>
  `,
)

const ctaSection = contactSection(
  'contact-04',
  'contact.form.title',
  'Start',
  consolePanel(
    '04',
    `
      <h3 class="jlz-contact-panel__title studio-title uk-heading-medium uk-margin-remove" data-i18n="contact.form.heading">Make the move.</h3>
      <a href="mailto:hello@justlovejazz.com?subject=Project%20brief" class="uk-button uk-button-primary uk-margin-medium-top" data-i18n="contact.form.action">Start a project</a>
      <p class="jlz-contact-panel__meta uk-text-meta" data-i18n="contact.form.meta">We will return with the right next question.</p>
    `,
  ),
)

export function contactPage(): string {
  return `
    <article class="jlz-page jlz-contact-page" data-page-view="contact">
      ${labOverlaySection('content')}
      ${emailSection}
      ${socialSection}
      ${locationSection}
      ${ctaSection}
      ${navOverlaySection('content')}
    </article>
  `
}
