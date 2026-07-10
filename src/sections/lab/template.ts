// src/sections/lab/template.ts — Face 0: Lab (secret left, top face +Y)
// Apple Watch layout: TOP (eyebrow+title) / 3D CENTER / BOTTOM (4 lab cards)

import { sectionTop, sectionBottom, sectionShell } from '../_shared/constants'

export function labSection(): string {
  const top = sectionTop('LAB', 'LAB', 'A sandbox for shader, audio, and procedural R&D')
  const bottom = sectionBottom(`
    <div class="uk-grid-small uk-child-width-1-2@s" uk-grid>
      <div class="uk-card uk-card-default uk-card-body uk-card-hover uk-text-center">
        <span uk-icon="icon: bolt; ratio: 1.5" class="uk-text-muted" aria-hidden="true"></span>
        <h3 class="uk-card-title uk-margin-small-top">Shader Lab</h3>
        <p class="uk-text-meta">GLSL & TSL fragments — glass, iridescence, fluid sim</p>
      </div>
      <div class="uk-card uk-card-default uk-card-body uk-card-hover uk-text-center">
        <span uk-icon="icon: soundcloud; ratio: 1.5" class="uk-text-muted" aria-hidden="true"></span>
        <h3 class="uk-card-title uk-margin-small-top">Audio Reactive</h3>
        <p class="uk-text-meta">Web Audio analyser → frequency-driven visuals</p>
      </div>
      <div class="uk-card uk-card-default uk-card-body uk-card-hover uk-text-center">
        <span uk-icon="icon: grid; ratio: 1.5" class="uk-text-muted" aria-hidden="true"></span>
        <h3 class="uk-card-title uk-margin-small-top">Generative</h3>
        <p class="uk-text-meta">Procedural worlds from noise and math</p>
      </div>
      <div class="uk-card uk-card-default uk-card-body uk-card-hover uk-text-center">
        <span uk-icon="icon: cloud-upload; ratio: 1.5" class="uk-text-muted" aria-hidden="true"></span>
        <h3 class="uk-card-title uk-margin-small-top">GPU Particles</h3>
        <p class="uk-text-meta">10k instanced points, on-demand rendering</p>
      </div>
    </div>
  `)
  return sectionShell('lab', 'lab', top, bottom)
}
