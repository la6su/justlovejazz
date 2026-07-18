// src/sections/intro/template.ts — Face 1: Studio (front face +Z, start section)
// Hero tier — uk-heading-xlarge. Active on load.
//
// The showreel play button is a 3D TSL shader plane (ShowreelButton3D) in
// front of the cube — see src/sections/intro/scene.ts. No DOM button.
// Experience.ts raycasts on pointermove/click to detect hover + click on
// the 3D button → dispatches jlz:showreel-play → opens FullscreenOverlay.
import { sectionShell, storyBottom } from '../_shared/constants'

export function introSection(): string {
  const top = `
    <div class="jlz-section-top uk-text-center uk-flex uk-flex-column uk-flex-middle">
      <span class="jlz-eyebrow" data-eyebrow data-eyebrow-text="01">01</span>
      <h2 class="studio-title uk-heading-xlarge uk-margin-small-top uk-margin-remove-bottom" data-i18n="home.studio.title">Studio</h2>
      <p class="uk-text-lead uk-margin-small-top" data-i18n="home.studio.lead">Remote · EU · since 2019.</p>
    </div>
  `
  const bottom = storyBottom(
    `
      <div class="jlz-service-desc uk-margin-small-top">
        <p class="uk-text-meta uk-margin-remove" data-i18n="home.studio.desc1">Interfaces and realtime scenes that make a product legible.</p>
        <p class="uk-text-meta uk-margin-remove" data-i18n="home.studio.desc2">Strategy, design and WebGPU in one system.</p>
      </div>
      <div class="uk-flex uk-flex-center uk-flex-middle uk-margin-top" style="gap: 0.75rem;">
        <a href="/services" class="jlz-service-explore uk-button uk-button-default uk-button-small">
          <span class="jlz-service-explore__dot" aria-hidden="true"></span>
          <span data-i18n="common.explore">Explore</span>
        </a>
        <button type="button" class="uk-button uk-button-default uk-button-small" id="jlz-showreel-trigger" data-cursor="play">
          <span uk-icon="icon: play; ratio: 0.7" aria-hidden="true"></span>
          <span data-i18n="common.showreel">Showreel</span>
        </button>
      </div>
  `,
    '01',
  )
  // No DOM showreel button — the 3D TSL shader plane (ShowreelButton3D)
  // handles play. Click raycasting is in Experience.ts.
  return sectionShell('intro', top, bottom, 'home', false, '')
}
