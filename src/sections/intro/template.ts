// src/sections/intro/template.ts — Face 1: Studio (front face +Z, start section)
// Hero tier — uk-heading-xlarge. Active on load.
import { REVEAL, sectionShell } from '../_shared/constants'

export function introSection(): string {
  const top = `
    <div class="jlz-section-top uk-text-center uk-flex uk-flex-column uk-flex-middle" ${REVEAL}>
      <span class="jlz-eyebrow" data-eyebrow data-eyebrow-text="01">01</span>
      <h2 class="studio-title uk-heading-xlarge uk-margin-small-top uk-margin-remove-bottom">Studio</h2>
      <p class="uk-text-lead uk-margin-small-top">Remote · EU · since 2019.</p>
    </div>
  `
  const bottom = `
    <div class="jlz-section-bottom" ${REVEAL}>
      <div class="jlz-service-desc uk-margin-small-top">
        <p class="uk-text-meta uk-margin-remove">A small studio crafting expressive browser experiences.</p>
        <p class="uk-text-meta uk-margin-remove">Glass · motion · light — powered by WebGPU.</p>
      </div>
      <a href="/app/services" class="jlz-service-explore uk-button uk-button-default uk-button-small uk-margin-top">
        <span class="jlz-service-explore__dot" aria-hidden="true"></span>
        Explore
      </a>
    </div>
  `
  return sectionShell('intro', top, bottom, 'home')
}
