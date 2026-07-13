// src/sections/intro/template.ts — Face 1: Studio (front face +Z, start section)
// Hero tier — uk-heading-xlarge. Active on load.
// Play button is rendered as a 3D TSL shader mesh in front of the cube
// (see SplashCube.ts → PlayButton3D). DOM overlay only for the label.
//
// Showreel button: NO data-magnetic (was too aggressive — cursor snapped to
// center constantly). Instead: custom cursor via data-cursor="play" + inline
// SVG play icon with CSS stroke-animation on hover (see docs/UIKIT3.md §7.26
// for uk-svg stroke-animation pattern).
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
  // DOM overlay for showreel label (3D play button is in SplashCube scene).
  // NO data-magnetic — button is too aggressive with magnetic snap. Instead:
  // data-cursor="play" changes cursor to play icon, and the SVG ring animates
  // its stroke on hover (stroke-dashoffset animation, see main.less).
  const playOverlay = `
    <div class="jlz-showreel-overlay" ${REVEAL}>
      <button class="jlz-showreel-trigger" type="button" id="jlz-showreel-trigger"
              aria-label="Play showreel"
              data-cursor="play">
        <span class="jlz-showreel-trigger__ring" aria-hidden="true">
          <svg viewBox="0 0 64 64" width="64" height="64">
            <circle class="jlz-showreel-trigger__circle" cx="32" cy="32" r="28" fill="none" stroke="currentColor" stroke-width="1.5" />
          </svg>
        </span>
        <span class="jlz-showreel-trigger__icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M8 5v14l11-7z"/></svg>
        </span>
        <span class="jlz-showreel-trigger__label" data-i18n="home.studio.showreel">Showreel</span>
      </button>
    </div>
  `
  return sectionShell('intro', top, bottom, 'home', false, '', playOverlay)
}
