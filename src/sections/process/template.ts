// src/sections/process/template.ts — Face 5: Process (secret right, left face -X)
// Apple Watch layout: TOP (num 06 + title + lead) / 3D CENTER (TimelineNodes) / BOTTOM (timeline)

import { REVEAL, processTimeline } from '../_shared/constants'

export function processSection(): string {
  return `
    <!-- 5: PROCESS (secret right, left face -X) -->
    <section
             class="uk-section uk-section-small uk-section-medium@s uk-section-large@m" id="section-process" data-section="process">
      <div class="uk-position-cover" data-dynamic-content>
        <div class="uk-container uk-container-expand uk-padding uk-flex uk-flex-column uk-flex-between uk-text-center uk-height-1-1">
          <!-- TOP -->
          <div ${REVEAL}>
            <span class="jlz-eyebrow" data-eyebrow></span>
            <div class="jlz-section-num jlz-numeral">06</div>
            <h2 class="studio-title uk-heading-medium uk-margin-small-top uk-margin-remove-bottom">PROCESS</h2>
            <p class="uk-text-lead uk-margin-small-top">Four phases. One shippable milestone per phase.</p>
          </div>
          <!-- BOTTOM: shared vertical timeline (same as services + manifesto pages) -->
          <div ${REVEAL}>
            ${processTimeline()}
          </div>
        </div>
      </div>
    </section>
  `
}
