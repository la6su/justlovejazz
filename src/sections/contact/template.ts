// src/sections/contact/template.ts — Face 4: Manifesto (bottom face -Y)
// data-section="contact" matches WorldConfig domSection (3D sync).
import { REVEAL, sectionShell } from '../_shared/constants'

export function contactSection(): string {
  const top = `
    <div class="jlz-section-top uk-text-center uk-flex uk-flex-column uk-flex-middle" ${REVEAL}>
      <span class="jlz-eyebrow" data-eyebrow data-eyebrow-text="04">04</span>
      <h2 class="studio-title uk-heading-large uk-margin-small-top uk-margin-remove-bottom">Manifesto</h2>
      <p class="uk-text-lead uk-margin-small-top">This is what guides us.</p>
    </div>
  `
  const bottom = `
    <div ${REVEAL}>
      <div class="jlz-service-desc uk-margin-small-top">
        <p class="uk-text-meta uk-margin-remove">Our principles.</p>
        <p class="uk-text-meta uk-margin-remove">Our way of thinking.</p>
        <p class="uk-text-meta uk-margin-remove">Our promises.</p>
      </div>
      <a href="/app/manifesto" class="jlz-service-explore uk-button uk-button-default uk-button-small uk-margin-top">
        <span class="jlz-service-explore__dot" aria-hidden="true"></span>
        Explore
      </a>
    </div>
  `
  return sectionShell('contact', top, bottom, 'home')
}
