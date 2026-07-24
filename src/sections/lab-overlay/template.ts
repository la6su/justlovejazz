// Bottom Contact finale.
//
// The runtime keeps the canonical section-0 `lab` identifier for renderer and
// deep-link compatibility, but the former Lab overlay is intentionally absent
// from the public interface. Its spatial slot now presents a cinematic contact
// footer with Telegram as the primary action.

import { sectionShell } from '../_shared/constants'

function contactFooterContent(): { top: string; bottom: string } {
  const top = `
    <div class="jlz-section-top jlz-contact-footer__intro uk-flex uk-flex-column uk-flex-top uk-text-left">
      <span class="jlz-contact-footer__kicker" data-i18n="contactFooter.kicker">Final frame · open channel</span>
      <h2 class="studio-title uk-heading-large uk-margin-small-top uk-margin-remove-bottom" data-blur-fade="off"
          data-i18n="contactFooter.title">Let’s make something worth remembering.</h2>
      <p class="uk-text-lead uk-margin-small-top" data-i18n="contactFooter.lead">Tell us where the story should go next.</p>
    </div>
  `

  const bottom = `
    <div class="jlz-section-bottom jlz-contact-footer__actions uk-flex uk-flex-middle uk-width-1-1">
      <a class="uk-button uk-button-primary jlz-telegram-cta" href="https://t.me/justlovejazz"
         target="_blank" rel="noopener" data-magnetic data-cursor="view">
        <span class="jlz-telegram-cta__halo" aria-hidden="true"></span>
        <span class="jlz-telegram-cta__icon" uk-icon="icon: commenting; ratio: 1.15" aria-hidden="true"></span>
        <span class="jlz-telegram-cta__copy">
          <span class="jlz-telegram-cta__label" data-i18n="contactFooter.telegram">Open Telegram</span>
          <span class="jlz-telegram-cta__handle">@justlovejazz</span>
        </span>
        <span class="jlz-telegram-cta__arrow" aria-hidden="true">↗</span>
      </a>
      <a class="jlz-contact-footer__email" href="mailto:hello@justlovejazz.com">hello@justlovejazz.com</a>
      <button class="uk-close-large uk-margin-auto-left" type="button" uk-close
              data-close-cinematic-sheet aria-label="Close contact footer"></button>
    </div>
  `

  return { top, bottom }
}

/**
 * Render the Contact finale into the legacy section-0 DOM slot.
 * `data-contact-footer` is the public styling/interaction contract; callers
 * should not expose the internal `lab` identifier in navigation copy.
 */
export function labOverlaySection(mode: 'home' | 'content' = 'content'): string {
  const { top, bottom } = contactFooterContent()
  if (mode === 'home') {
    return sectionShell('lab', top, bottom, 'home', false, 'data-contact-footer')
  }
  return sectionShell('page-lab', top, bottom, 'content', false, 'data-contact-footer')
}
