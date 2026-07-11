// src/sections/process/template.ts — Face 5: Contact (secret right, left face -X)
// data-section="process" matches WorldConfig domSection (3D sync).
import { REVEAL, sectionShell } from '../_shared/constants'

export function processSection(): string {
  const top = `
    <div class="jlz-section-top uk-text-center uk-flex uk-flex-column uk-flex-middle" ${REVEAL}>
      <span class="jlz-eyebrow" data-eyebrow data-eyebrow-text="06">06</span>
      <h2 class="studio-title uk-heading-large uk-margin-small-top uk-margin-remove-bottom">Contact</h2>
      <p class="uk-text-lead uk-margin-small-top">Let's create something great together.</p>
    </div>
  `
  const bottom = `
    <div class="jlz-section-bottom" ${REVEAL}>
      <p class="uk-text-meta uk-margin-small-top jlz-text-subtle">@ justlovejazz</p>
      <div class="uk-flex uk-flex-center uk-flex-wrap uk-margin-top jlz-flex-gap-small">
        <a href="mailto:hello@justlovejazz.com" class="jlz-service-explore uk-button uk-button-default uk-button-small">
          <span class="jlz-service-explore__dot" aria-hidden="true"></span>
          Email
        </a>
        <a href="https://t.me/justlovejazz" target="_blank" rel="noopener" class="jlz-service-explore uk-button uk-button-default uk-button-small">
          <span class="jlz-service-explore__dot" aria-hidden="true"></span>
          Telegram
        </a>
        <a href="https://github.com/la6su" target="_blank" rel="noopener" class="jlz-service-explore uk-button uk-button-default uk-button-small">
          <span class="jlz-service-explore__dot" aria-hidden="true"></span>
          GitHub
        </a>
      </div>
    </div>
  `
  return sectionShell('process', top, bottom, 'home')
}
