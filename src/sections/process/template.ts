// src/sections/process/template.ts — Face 5: Process (secret right, left face -X)
// Apple Watch layout: TOP (title + lead) / 3D CENTER / BOTTOM (timeline)

import { REVEAL } from '../_shared/constants'

export function processSection(): string {
  return `
    <!-- 5: PROCESS (secret right, left face -X) -->
    <section uk-height-viewport="expand: true"
             class="uk-section uk-section-small uk-section-medium@s uk-section-large@m" id="section-process" data-section="process">
      <div class="uk-position-cover" data-dynamic-content>
        <div class="uk-container uk-container-expand uk-padding uk-flex uk-flex-column uk-flex-between uk-text-center uk-height-1-1">
          <!-- TOP -->
          <div ${REVEAL}>
            <span class="jlz-eyebrow uk-text-meta uk-text-uppercase">&gt; PROCESS</span>
            <h2 class="studio-title uk-heading-medium uk-margin-small-top uk-margin-remove-bottom">PROCESS</h2>
            <p class="uk-text-lead uk-margin-small-top">Discover · Design · Develop · Ship</p>
          </div>
          <!-- BOTTOM: timeline -->
          <ul class="uk-list uk-list-divider" ${REVEAL}>
            <li class="uk-flex uk-flex-middle">
              <span class="uk-text-bold uk-text-large uk-margin-right" style="min-width:2rem;">01</span>
              <span class="uk-text-bold uk-margin-right">Discover</span>
              <span class="uk-text-meta">Research, audit, define the problem</span>
            </li>
            <li class="uk-flex uk-flex-middle">
              <span class="uk-text-bold uk-text-large uk-margin-right" style="min-width:2rem;">02</span>
              <span class="uk-text-bold uk-margin-right">Design</span>
              <span class="uk-text-meta">Art direction, 3D, interaction prototypes</span>
            </li>
            <li class="uk-flex uk-flex-middle">
              <span class="uk-text-bold uk-text-large uk-margin-right" style="min-width:2rem;">03</span>
              <span class="uk-text-bold uk-margin-right">Develop</span>
              <span class="uk-text-meta">WebGPU, TSL shaders, performance budgets</span>
            </li>
            <li class="uk-flex uk-flex-middle">
              <span class="uk-text-bold uk-text-large uk-margin-right" style="min-width:2rem;">04</span>
              <span class="uk-text-bold uk-margin-right">Ship</span>
              <span class="uk-text-meta">Launch, measure, evolve</span>
            </li>
          </ul>
        </div>
      </div>
    </section>
  `
}
