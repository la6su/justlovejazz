// src/sections/contact/template.ts — Face 4: Manifesto (bottom face -Y)
// data-section="contact" matches WorldConfig domSection (3D sync).
import { sectionShell, storyBottom } from '../_shared/constants'

export function contactSection(): string {
  const top = `
    <div class="jlz-section-top uk-text-center uk-flex uk-flex-column uk-flex-middle">
      <span class="jlz-eyebrow" data-eyebrow data-eyebrow-text="04">04</span>
      <h2 class="studio-title uk-heading-large uk-margin-small-top uk-margin-remove-bottom" data-i18n="home.manifesto.title">Manifesto</h2>
      <p class="uk-text-lead uk-margin-small-top" data-i18n="home.manifesto.lead">This is what guides us.</p>
    </div>
  `
  const bottom = storyBottom(
    `
      <div class="jlz-service-desc uk-margin-small-top">
        <p class="uk-text-meta uk-margin-remove" data-i18n="home.manifesto.desc1">Clarity before spectacle.</p>
        <p class="uk-text-meta uk-margin-remove" data-i18n="home.manifesto.desc2">Every effect must explain a state.</p>
        <p class="uk-text-meta uk-margin-remove" data-i18n="home.manifesto.desc3">Every page must earn attention.</p>
      </div>
      <a href="/manifesto" class="jlz-service-explore uk-button uk-button-default uk-button-small uk-margin-top">
        <span class="jlz-service-explore__dot" aria-hidden="true"></span>
        <span data-i18n="common.explore">Explore</span>
      </a>
  `,
    '04',
  )
  return sectionShell('contact', top, bottom, 'home')
}
