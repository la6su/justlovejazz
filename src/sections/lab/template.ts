// src/sections/lab/template.ts — Face 0: Lab (secret left, top face +Y)
// data-section="lab" matches WorldConfig domSection (3D sync).
import { REVEAL, sectionShell } from '../_shared/constants'

export function labSection(): string {
  const top = `
    <div class="jlz-section-top uk-text-center uk-flex uk-flex-column uk-flex-middle" ${REVEAL}>
      <span class="jlz-eyebrow" data-eyebrow data-eyebrow-text="05">05</span>
      <h2 class="studio-title uk-heading-large uk-margin-small-top uk-margin-remove-bottom" data-i18n="home.lab.title">Lab</h2>
      <p class="uk-text-lead uk-margin-small-top" data-i18n="home.lab.lead">Always in progress.</p>
    </div>
  `
  const bottom = `
    <div class="jlz-section-bottom" ${REVEAL}>
      <div class="jlz-service-desc uk-margin-small-top">
        <p class="uk-text-meta uk-margin-remove" data-i18n="home.lab.desc1">We explore.</p>
        <p class="uk-text-meta uk-margin-remove" data-i18n="home.lab.desc2">We prototype.</p>
        <p class="uk-text-meta uk-margin-remove" data-i18n="home.lab.desc3">We push boundaries.</p>
      </div>
      <a href="/" class="jlz-service-explore uk-button uk-button-default uk-button-small uk-margin-top">
        <span class="jlz-service-explore__dot" aria-hidden="true"></span>
        <span data-i18n="common.explore">Explore</span>
      </a>
    </div>
  `
  return sectionShell('lab', top, bottom, 'home')
}
