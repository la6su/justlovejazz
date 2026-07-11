// src/sections/lab/template.ts — Face 0: Lab (secret left, top face +Y)
// Apple Watch layout: TOP (num 05 + title + lead) / 3D CENTER (ShaderOrb) / BOTTOM (experiment cards)
// Simplified from bento to 2×2 grid — consistent with other sections.

import { sectionBottom, sectionShell } from '../_shared/constants'

export function labSection(): string {
  const top = `
    <div class="jlz-section-top uk-text-center uk-flex uk-flex-column uk-flex-middle" >
      <span class="jlz-eyebrow" data-eyebrow></span>
      <div class="jlz-section-num jlz-numeral">05</div>
      <h2 class="studio-title uk-heading-medium uk-margin-small-top uk-margin-remove-bottom">LAB</h2>
      <p class="uk-text-meta uk-margin-small-top">A sandbox for shader, audio, and procedural R&D</p>
    </div>
  `
  const bottom = sectionBottom(`
    <div class="uk-grid-small uk-child-width-1-2@s" uk-grid>
      <div class="uk-card uk-card-default uk-card-body uk-card-hover uk-text-center">
        <span uk-icon="icon: bolt; ratio: 1.5" class="uk-text-muted" aria-hidden="true"></span>
        <h3 class="uk-card-title uk-margin-small-top">Shader Lab</h3>
        <p class="uk-text-meta uk-margin-small-top uk-margin-remove-bottom">GLSL & TSL fragments — glass, iridescence, fluid sim</p>
      </div>
      <div class="uk-card uk-card-default uk-card-body uk-card-hover uk-text-center">
        <span uk-icon="icon: soundcloud; ratio: 1.5" class="uk-text-muted" aria-hidden="true"></span>
        <h3 class="uk-card-title uk-margin-small-top">Audio Reactive</h3>
        <p class="uk-text-meta uk-margin-small-top uk-margin-remove-bottom">Web Audio analyser → frequency-driven visuals</p>
      </div>
      <div class="uk-card uk-card-default uk-card-body uk-card-hover uk-text-center">
        <span uk-icon="icon: grid; ratio: 1.5" class="uk-text-muted" aria-hidden="true"></span>
        <h3 class="uk-card-title uk-margin-small-top">Generative</h3>
        <p class="uk-text-meta uk-margin-small-top uk-margin-remove-bottom">Procedural worlds from noise and math</p>
      </div>
      <div class="uk-card uk-card-default uk-card-body uk-card-hover uk-text-center">
        <span uk-icon="icon: cloud-upload; ratio: 1.5" class="uk-text-muted" aria-hidden="true"></span>
        <h3 class="uk-card-title uk-margin-small-top">GPU Particles</h3>
        <p class="uk-text-meta uk-margin-small-top uk-margin-remove-bottom">10k instanced points, on-demand rendering</p>
      </div>
    </div>
  `)
  return sectionShell('lab', 'lab', top, bottom)
}
