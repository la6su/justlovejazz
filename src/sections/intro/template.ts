// src/sections/intro/template.ts — Face 1: Intro (front face +Z, start section)
// Apple Watch layout: TOP (hero title) / 3D CENTER (SplashCube) / BOTTOM (CTA + scroll hint)

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
            <span class="jlz-eyebrow">&gt; WEB DESIGN STUDIO · est. 2019</span>
            <h1 class="studio-title uk-heading-xlarge uk-margin-small-top"
                data-content-id="hero-title">l@6</h1>
            <p class="uk-text-lead uk-margin-small-top">
              <span class="uk-text-bold">glass</span> ·
              <span class="uk-text-bold">motion</span> ·
              <span class="uk-text-bold">light</span> — powered by WebGPU
            </p>
          </div>
          <!-- BOTTOM: CTA + scroll hint -->
          <div class="uk-flex uk-flex-column uk-flex-middle" ${REVEAL}>
            <div class="uk-flex uk-flex-center uk-flex-wrap uk-flex-middle jlz-flex-gap-small">
              <a href="/services" class="uk-button uk-button-primary uk-button-small">Services</a>
              <a href="/posts" class="uk-button uk-button-default uk-button-small">Posts</a>
              <a href="/#section-contact" class="uk-button uk-button-default uk-button-small">Contact</a>
            </div>
            <div class="jlz-scroll-hint uk-margin-top" aria-hidden="true">
              <span class="jlz-scroll-hint__label">Spin the cube</span>
              <span class="jlz-scroll-hint__line"></span>
            </div>
          </div>
        </div>
      </div>
    </section>
  `
}
