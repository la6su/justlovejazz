// src/sections/intro/template.ts — Face 1: Intro (front face +Z, start section)
// Apple Watch layout: TOP (num 01 + hero title + lead) / 3D CENTER (SplashCube) / BOTTOM (pill CTAs + scroll hint)
// Hero tier — uses uk-heading-xlarge (800 weight, dramatic scale).

import { REVEAL } from '../_shared/constants'

export function introSection(): string {
  return `
    <!-- 1: INTRO (front face +Z) — hero + cube + CTA -->
    <section
             class="uk-section uk-section-small uk-section-medium@s uk-section-large@m" id="section-intro" data-section="intro">
      <div class="uk-position-cover" data-dynamic-content>
        <div class="uk-container uk-container-expand uk-padding uk-flex uk-flex-column uk-flex-between uk-text-center uk-height-1-1">
          <!-- TOP: hero -->
          <div class="uk-flex uk-flex-column uk-flex-middle" ${REVEAL}>
            <span class="jlz-eyebrow" data-eyebrow></span>
            <div class="jlz-section-num jlz-numeral">01</div>
            <h1 class="studio-title uk-heading-xlarge uk-margin-small-top"
                data-content-id="hero-title">l@6</h1>
            <p class="uk-text-lead uk-margin-small-top">
              <span class="uk-text-bold">glass</span> ·
              <span class="uk-text-bold">motion</span> ·
              <span class="uk-text-bold">light</span> — powered by WebGPU
            </p>
          </div>
          <!-- BOTTOM: pill CTAs + scroll hint -->
          <div class="uk-flex uk-flex-column uk-flex-middle" ${REVEAL}>
            <div class="uk-flex uk-flex-center uk-flex-wrap uk-flex-middle jlz-flex-gap-small">
              <a href="/app/services" class="jlz-service-explore uk-button uk-button-default uk-button-small">
                <span class="jlz-service-explore__dot" aria-hidden="true"></span>
                Services
              </a>
              <a href="/app/manifesto" class="jlz-service-explore uk-button uk-button-default uk-button-small">
                <span class="jlz-service-explore__dot" aria-hidden="true"></span>
                Manifesto
              </a>
              <a href="/app/#section-contact" class="jlz-service-explore uk-button uk-button-default uk-button-small">
                <span class="jlz-service-explore__dot" aria-hidden="true"></span>
                Contact
              </a>
            </div>
            <div class="jlz-scroll-hint uk-margin-top" aria-hidden="true">
              <span class="jlz-scroll-hint__label">Drag the joystick</span>
              <span class="jlz-scroll-hint__line"></span>
            </div>
          </div>
        </div>
      </div>
    </section>
  `
}
