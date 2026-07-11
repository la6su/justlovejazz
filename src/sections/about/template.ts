// src/sections/about/template.ts — Face 2: Services (right face +X)
// data-section="about" matches WorldConfig domSection (3D sync).
import { REVEAL, sectionShell } from '../_shared/constants'

export function aboutSection(): string {
  const top = `
    <div class="jlz-section-top uk-text-center uk-flex uk-flex-column uk-flex-middle" ${REVEAL}>
      <span class="jlz-eyebrow" data-eyebrow data-eyebrow-text="02">02</span>
      <h2 class="studio-title uk-heading-large uk-margin-small-top uk-margin-remove-bottom" data-i18n="home.about.title">Services</h2>
      <p class="uk-text-lead uk-margin-small-top" data-i18n="home.about.lead">From strategy to implementation.</p>
    </div>
  `
  const bottom = `
    <div class="jlz-section-bottom" ${REVEAL}>
      <div class="jlz-service-desc uk-margin-small-top">
        <p class="uk-text-meta uk-margin-remove" data-i18n="home.about.desc1">We cover the full cycle of digital products.</p>
        <p class="uk-text-meta uk-margin-remove" data-i18n="home.about.desc2">Explore our capabilities.</p>
      </div>
      <a href="/services" class="jlz-service-explore uk-button uk-button-default uk-button-small uk-margin-top">
        <span class="jlz-service-explore__dot" aria-hidden="true"></span>
        <span data-i18n="common.explore">Explore</span>
      </a>
    </div>
  `
  return sectionShell('about', top, bottom, 'home')
}
