// src/sections/intro/template.ts — Face 1: Studio (front face +Z, start section)
// Hero tier — uk-heading-xlarge. Active on load.
// Phase 3: Play button centered on cube for showreel modal.
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
  // Phase 3: Play button centered on cube — opens showreel modal
  const playButton = `
    <div class="jlz-showreel-play-wrap" ${REVEAL}>
      <button class="jlz-showreel-play" type="button" id="jlz-showreel-trigger"
              aria-label="Play showreel"
              data-cursor="play" data-magnetic>
        <span class="jlz-showreel-play__ring" aria-hidden="true"></span>
        <span class="jlz-showreel-play__icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
            <path d="M8 5v14l11-7z"/>
          </svg>
        </span>
        <span class="jlz-showreel-play__label" data-i18n="home.studio.showreel">Showreel</span>
      </button>
    </div>
  `
  // Pass playButton as extraAttrs (inserted into section, positioned absolute center)
  return sectionShell('intro', top, bottom, 'home', false, playButton)
}
