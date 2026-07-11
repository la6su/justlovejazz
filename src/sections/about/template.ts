// src/sections/about/template.ts — Face 2: About (right face +X)
// Editorial left-aligned layout — breaks the centered monotony of other sections.
// Apple Watch layout: TOP (title + lead, left-aligned) / 3D CENTER / BOTTOM (description + inline stats)

import { REVEAL, sectionBottom, sectionShell } from '../_shared/constants'

export function aboutSection(): string {
  // Custom left-aligned top block — distinct from the centered sectionTop()
  // helper used by other sections. Creates editorial asymmetry.
  const top = `
    <div class="jlz-section-top uk-text-left uk-flex uk-flex-column" ${REVEAL}>
      <span class="jlz-eyebrow" data-eyebrow></span>
      <h2 class="studio-title uk-heading-large uk-margin-small-top uk-margin-remove-bottom">About</h2>
      <p class="uk-text-meta uk-margin-small-top">Remote · EU · since 2019</p>
    </div>
  `
  const bottom = sectionBottom(`
    <p class="uk-text-lead uk-text-left" data-content-id="about-text">
      A small studio crafting expressive browser experiences. We merge
      art direction with web engineering — 3D-first interfaces, spatial
      design, and real-time shaders that stay fast under pressure.
    </p>
    <div class="uk-flex uk-flex-left uk-flex-wrap uk-margin-top jlz-flex-gap-large">
      <div><span class="uk-heading-medium uk-margin-remove jlz-numeral">6</span> <span class="uk-text-meta">sections</span></div>
      <div><span class="uk-heading-medium uk-margin-remove jlz-numeral">2</span> <span class="uk-text-meta">engineers</span></div>
      <div><span class="uk-heading-medium uk-margin-remove jlz-numeral">1</span> <span class="uk-text-meta">designer</span></div>
    </div>
  `)
  return sectionShell('about', 'about', top, bottom, '', 'left')
}
