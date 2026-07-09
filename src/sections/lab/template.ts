// src/pages/sections/lab.ts — Face 0: Lab (secret left, top face +Y)
//
// Experiments & R&D playground. Secret side section — reached via
// horizontal joystick left from Intro.
//
// 3D sync: EnvSphere pattern 0 (light blue-grey HSV), SplashCube face 0.

import { REVEAL } from '../_shared/constants'

export function labSection(): string {
  return `
    <!-- 0: LAB (secret left, top face +Y) — Experiments & R&D -->
    <section uk-height-viewport="expand: true"
             class="uk-section uk-section-small uk-section-medium@s uk-section-large@m" id="section-lab" data-section="lab">
      <div class="uk-position-cover" data-dynamic-content>
        <div class="uk-container uk-container-expand uk-padding uk-flex uk-flex-column uk-flex-between uk-text-center uk-height-1-1">
          <div class="uk-flex uk-flex-column uk-flex-middle">
            <h2 class="studio-title uk-heading-medium" ${REVEAL}>LAB</h2>
            <p class="uk-text-lead" ${REVEAL}>
              Where we break things on purpose. Shader experiments, GPU compute
              sketches, interaction prototypes — the playground behind the studio.
            </p>
          </div>
          <div class="uk-grid-small uk-child-width-1-2@s" uk-grid ${REVEAL}>
            <div class="uk-card uk-card-default uk-card-body uk-card-hover uk-flex uk-flex-column uk-flex-middle uk-text-center" data-lab="shader">
              <span class="uk-text-large" aria-hidden="true">◈</span>
              <h3 class="uk-card-title">Shader Lab</h3>
              <p class="uk-text-meta">GLSL & TSL fragments</p>
            </div>
            <div class="uk-card uk-card-default uk-card-body uk-card-hover uk-flex uk-flex-column uk-flex-middle uk-text-center" data-lab="audio">
              <span class="uk-text-large" aria-hidden="true">◉</span>
              <h3 class="uk-card-title">Audio Reactive</h3>
              <p class="uk-text-meta">Sound-driven visuals</p>
            </div>
            <div class="uk-card uk-card-default uk-card-body uk-card-hover uk-flex uk-flex-column uk-flex-middle uk-text-center" data-lab="gen">
              <span class="uk-text-large" aria-hidden="true">⬡</span>
              <h3 class="uk-card-title">Generative</h3>
              <p class="uk-text-meta">Procedural worlds</p>
            </div>
            <div class="uk-card uk-card-default uk-card-body uk-card-hover uk-flex uk-flex-column uk-flex-middle uk-text-center" data-lab="particles">
              <span class="uk-text-large" aria-hidden="true">⁂</span>
              <h3 class="uk-card-title">GPU Particles</h3>
              <p class="uk-text-meta">10k instances</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  `
}
