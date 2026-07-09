// src/pages/sections/process.ts — Face 5: Process (secret right, left face -X)
//
// Workflow timeline. Secret side section — reached via horizontal joystick
// right from Contact.
//
// 3D sync: EnvSphere pattern 5 (deep blue-black gradient), SplashCube face 5.

import { REVEAL } from '../_shared/constants'

export function processSection(): string {
  return `
    <!-- 5: PROCESS (secret right, left face -X) — Workflow timeline -->
    <section uk-height-viewport="expand: true"
             class="uk-section uk-section-small uk-section-medium@s uk-section-large@m" id="section-process" data-section="process">
      <div class="uk-position-cover" data-dynamic-content>
        <div class="uk-container uk-container-expand uk-padding uk-flex uk-flex-column uk-flex-between uk-text-center uk-height-1-1">
          <div class="uk-flex uk-flex-column uk-flex-middle">
            <h2 class="studio-title uk-heading-medium" ${REVEAL}>PROCESS</h2>
            <p class="uk-text-lead" ${REVEAL}>
              From concept to launch — every project follows a rhythm.
              Discover, design, develop, ship. Then iterate.
            </p>
          </div>
          <ul class="uk-list uk-list-divider" ${REVEAL}>
            <li class="uk-flex uk-flex-middle">
              <span class="uk-text-bold uk-text-large uk-margin-right">01</span>
              <span class="uk-text-bold uk-margin-right">Discover</span>
              <span class="uk-text-meta">Research, audit, define the problem</span>
            </li>
            <li class="uk-flex uk-flex-middle">
              <span class="uk-text-bold uk-text-large uk-margin-right">02</span>
              <span class="uk-text-bold uk-margin-right">Design</span>
              <span class="uk-text-meta">Art direction, 3D, interaction prototypes</span>
            </li>
            <li class="uk-flex uk-flex-middle">
              <span class="uk-text-bold uk-text-large uk-margin-right">03</span>
              <span class="uk-text-bold uk-margin-right">Develop</span>
              <span class="uk-text-meta">WebGPU, TSL shaders, performance budgets</span>
            </li>
            <li class="uk-flex uk-flex-middle">
              <span class="uk-text-bold uk-text-large uk-margin-right">04</span>
              <span class="uk-text-bold uk-margin-right">Ship</span>
              <span class="uk-text-meta">Launch, measure, evolve</span>
            </li>
          </ul>
        </div>
      </div>
    </section>
  `
}
