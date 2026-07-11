// src/pages/content/contact.ts — Contact page (4 sections)
// Email / Social / Location / Form
import { sectionShell, contentTop, contentBottom } from '../../sections/_shared/constants'
import { FOOTER } from '../../sections/_shared/footer'

// Section 1: Email — big mailto link
const emailSection = sectionShell('contact-01',
  contentTop('01', 'Email', 'Direct line.', 'large', 'contact.email.title', 'contact.email.lead'),
  contentBottom(`
    <a href="mailto:hello@justlovejazz.com" class="jlz-service-explore uk-button uk-button-default uk-button-small uk-margin-top">
      <span class="jlz-service-explore__dot" aria-hidden="true"></span>
      hello@justlovejazz.com
    </a>
  `),
  'content', true
)

// Section 2: Social — Telegram + GitHub
const socialSection = sectionShell('contact-02',
  contentTop('02', 'Social', 'Find us elsewhere.', 'large', 'contact.social.title', 'contact.social.lead'),
  contentBottom(`
    <div class="uk-flex uk-flex-center uk-flex-wrap uk-margin-top jlz-flex-gap-small">
      <a href="https://t.me/justlovejazz" target="_blank" rel="noopener" class="jlz-service-explore uk-button uk-button-default uk-button-small">
        <span class="jlz-service-explore__dot" aria-hidden="true"></span>
        <span data-i18n="common.telegram">Telegram</span>
      </a>
      <a href="https://github.com/la6su" target="_blank" rel="noopener" class="jlz-service-explore uk-button uk-button-default uk-button-small">
        <span class="jlz-service-explore__dot" aria-hidden="true"></span>
        <span data-i18n="common.github">GitHub</span>
      </a>
    </div>
  `)
)

// Section 3: Location — remote / EU
const locationSection = sectionShell('contact-03',
  contentTop('03', 'Location', 'Where we work.', 'large', 'contact.location.title', 'contact.location.lead'),
  contentBottom(`
    <div class="jlz-service-desc uk-margin-small-top">
      <p class="uk-text-meta uk-margin-remove" data-i18n="contact.location.desc1">Remote · EU · since 2019</p>
      <p class="uk-text-meta uk-margin-remove" data-i18n="contact.location.desc2">Open for new projects.</p>
    </div>
  `)
)

// Section 4: Form — inline mailto form
const formSection = sectionShell('contact-04',
  contentTop('04', 'Form', 'Tell us about your project.', 'large', 'contact.form.title', 'contact.form.lead'),
  contentBottom(`
    <form class="jlz-contact-form uk-flex uk-flex-center uk-flex-middle uk-margin-bottom" action="mailto:hello@justlovejazz.com" method="post" enctype="text/plain">
      <div class="uk-inline uk-width-1-1 uk-width-medium@s">
        <span class="uk-form-icon" uk-icon="icon: mail" aria-hidden="true"></span>
        <input class="uk-input" type="text" name="subject" placeholder="What's the project?" data-i18n-placeholder="contact.form.placeholder" aria-label="Project subject" />
      </div>
      <button class="uk-button uk-button-primary uk-margin-small-left" type="submit">
        <span uk-icon="icon: push" aria-hidden="true"></span>
        <span class="uk-margin-small-left" data-i18n="common.send">Send</span>
      </button>
    </form>
  `)
)

export function contactPage(): string {
  return `
    <article class="jlz-page" data-page-view="contact">
      ${emailSection}
      ${socialSection}
      ${locationSection}
      ${formSection}
    </article>
    ${FOOTER}
  `
}
