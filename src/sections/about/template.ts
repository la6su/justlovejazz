// src/sections/about/template.ts — Face 2: Services (right face +X)
// data-section="about" matches WorldConfig domSection (3D sync).
import { sectionShell, storyBottom } from '../_shared/constants'

export function aboutSection(): string {
  const top = `
    <div class="jlz-section-top uk-text-center uk-flex uk-flex-column uk-flex-middle">
      <span class="jlz-eyebrow" data-eyebrow data-eyebrow-text="02">02</span>
      <h2 class="studio-title uk-heading-large uk-margin-small-top uk-margin-remove-bottom" data-i18n="home.about.title">Services</h2>
      <p class="uk-text-lead uk-margin-small-top" data-i18n="home.about.lead">From strategy to implementation.</p>
    </div>
  `
  const bottom = storyBottom(
    `
      <div class="jlz-service-desc uk-margin-small-top">
        <p class="uk-text-meta uk-margin-remove" data-i18n="home.about.desc1">A brief becomes an interface people can move through.</p>
        <p class="uk-text-meta uk-margin-remove" data-i18n="home.about.desc2">Direction · product design · realtime build.</p>
      </div>
      <a href="/services" class="jlz-service-explore uk-button uk-button-default uk-button-small uk-margin-top">
        <span class="jlz-service-explore__dot" aria-hidden="true"></span>
        <span data-i18n="common.explore">Explore</span>
      </a>
  `,
    '02',
  )
  return sectionShell('about', top, bottom, 'home')
}
