// src/pages/sections/intro.ts — Face 1: Intro (front face +Z, start section)
//
// Hero with baku cube center, CTA buttons, scroll hint.
// This is the start section — World starts here, EnvSphere pattern 1.
//
// 3D sync: EnvSphere pattern 1 (light HSV rainbow), SplashCube face 1.

import { REVEAL } from '../shared/constants'

export function introSection(): string {
  return `
    <!-- 1: INTRO (front face +Z) — baku cube center, hero at top, scroll hint at bottom -->
    <section uk-height-viewport="expand: true"
             class="uk-section uk-section-small uk-section-medium@s uk-section-large@m" id="section-intro" data-section="intro">
      <div class="uk-position-cover" data-dynamic-content>
        <div class="uk-container uk-container-expand uk-padding uk-flex uk-flex-column uk-flex-between uk-text-center uk-height-1-1">
          <div class="uk-flex uk-flex-column uk-flex-middle">
            <h1 class="studio-title uk-heading-xlarge"
                data-content-id="hero-title">l@6</h1>
            <span class="uk-text-meta uk-margin-small-top" ${REVEAL}>Web Design Studio · est. 2019</span>
            <p class="uk-text-lead uk-margin-top" ${REVEAL}>
              We build cinematic interfaces for the modern browser —
              <span class="uk-text-bold">glass</span>,
              <span class="uk-text-bold">motion</span>, and
              <span class="uk-text-bold">light</span>, powered by WebGPU.
            </p>
            <div class="uk-margin-top uk-flex uk-flex-center uk-flex-wrap uk-flex-middle" uk-scrollspy="cls: uk-animation-fade; delay: 600" style="gap: 0.5rem;">
              <a href="/services" class="uk-button uk-button-primary uk-button-small">Services</a>
              <a href="/cases" class="uk-button uk-button-default uk-button-small">Work</a>
              <a href="/contact" class="uk-button uk-button-default uk-button-small">Contact</a>
            </div>
          </div>
          <div class="jlz-scroll-hint" aria-hidden="true" ${REVEAL}>
            <span class="jlz-scroll-hint__label">Spin the cube</span>
            <span class="jlz-scroll-hint__line"></span>
          </div>
        </div>
      </div>
    </section>
  `
}
