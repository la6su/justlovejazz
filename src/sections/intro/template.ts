// src/sections/intro/template.ts — Face 1: Studio (front face +Z, start section)
// Hero tier — uk-heading-xlarge. Active on load.
// Play button is rendered as a 3D TSL shader mesh in front of the cube
// (see SplashCube.ts → PlayButton3D). DOM overlay only for the label.
import { REVEAL, sectionShell } from '../_shared/constants'

export function introSection(): string {
  const top = `
    <div class="jlz-section-top uk-text-center uk-flex uk-flex-column uk-flex-middle" ${REVEAL}>
      <span class="jlz-eyebrow" data-eyebrow data-eyebrow-text="01">01</span>
      <h2 class="studio-title uk-heading-xlarge uk-margin-small-top uk-margin-remove-bottom" data-i18n="home.studio.title">Studio</h2>
      <p class="uk-text-lead uk-margin-small-top" data-i18n="home.studio.lead">Remote · EU · since 2019.</p>
    </div>
  `
  const bottom = `
    <div class="jlz-section-bottom" ${REVEAL}>
      <div class="jlz-service-desc uk-margin-small-top">
        <p class="uk-text-meta uk-margin-remove" data-i18n="home.studio.desc1">A small studio crafting expressive browser experiences.</p>
        <p class="uk-text-meta uk-margin-remove" data-i18n="home.studio.desc2">Glass · motion · light — powered by WebGPU.</p>
      </div>
      <a href="/services" class="jlz-service-explore uk-button uk-button-default uk-button-small uk-margin-top">
        <span class="jlz-service-explore__dot" aria-hidden="true"></span>
        <span data-i18n="common.explore">Explore</span>
      </a>
    </div>
  `
  // DOM overlay for showreel label (3D play button is in SplashCube scene)
  const playOverlay = `
    <div class="jlz-showreel-overlay" ${REVEAL}>
      <button class="jlz-showreel-trigger" type="button" id="jlz-showreel-trigger"
              aria-label="Play showreel"
              data-cursor="play" data-magnetic>
        <span class="jlz-showreel-trigger__label" data-i18n="home.studio.showreel">Showreel</span>
      </button>
    </div>
  `
  return sectionShell('intro', top, bottom, 'home', false, '', playOverlay)
}
