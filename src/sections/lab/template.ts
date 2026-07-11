// src/sections/lab/template.ts — Face 0: Lab (secret left, top face +Y)
// Bento layout — 1 large feature card + 3 compact cards. Breaks the uniform
// 2×2 grid monotony; the first card (Shader Lab) gets visual prominence as
// the signature experiment. Apple Watch layout otherwise.

import { sectionTop, sectionBottom, sectionShell } from '../_shared/constants'

export function labSection(): string {
  const top = sectionTop('LAB', 'LAB', 'A sandbox for shader, audio, and procedural R&D')
  const bottom = sectionBottom(`
    <div class="uk-grid-small uk-child-width-1-3@s" uk-grid>
      <!-- Large feature card — spans 2 columns on @s+ -->
      <div class="uk-width-2-3@s">
        <div class="uk-card uk-card-default uk-card-body uk-card-hover uk-height-1-1 uk-flex uk-flex-column uk-flex-center">
          <span uk-icon="icon: bolt; ratio: 2" class="uk-text-muted uk-margin-small-bottom" aria-hidden="true"></span>
          <h3 class="uk-card-title uk-margin-small-top uk-margin-remove-bottom">Shader Lab</h3>
          <p class="uk-text-meta uk-margin-small-top uk-margin-remove-bottom">GLSL & TSL fragments — glass, iridescence, fluid simulation. The signature experiment: every visual effect on this site starts here.</p>
        </div>
      </div>
      <!-- Compact cards — 1 column each, 3 across -->
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
