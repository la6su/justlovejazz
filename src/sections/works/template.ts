// src/sections/works/template.ts — Face 3: Works (back face -Z, BakuCarousel)
// data-section="challenge" matches WorldConfig domSection (3D sync).
import { REVEAL, sectionShell } from '../_shared/constants'

export function worksSection(): string {
  const top = `
    <div class="jlz-section-top uk-text-center uk-flex uk-flex-column uk-flex-middle" ${REVEAL}>
      <span class="jlz-eyebrow" data-eyebrow data-eyebrow-text="03">03</span>
      <h2 class="studio-title uk-heading-large uk-margin-small-top uk-margin-remove-bottom">Works</h2>
      <p class="uk-text-lead uk-margin-small-top">Selected projects that define our way.</p>
    </div>
  `
  const bottom = `
    <div ${REVEAL}>
      <div class="jlz-service-desc uk-margin-small-top">
        <p class="uk-text-meta uk-margin-remove">Case studies.</p>
        <p class="uk-text-meta uk-margin-remove">Process. Results.</p>
      </div>
      <a href="/blog" class="jlz-service-explore uk-button uk-button-default uk-button-small uk-margin-top">
        <span class="jlz-service-explore__dot" aria-hidden="true"></span>
        Explore
      </a>
    </div>
  `
  return sectionShell('challenge', top, bottom, 'home')
}
