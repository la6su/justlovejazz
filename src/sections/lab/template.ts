// src/sections/lab/template.ts — Face 0: Lab (secret left, top face +Y)
// Apple Watch layout: TOP (eyebrow+title) / 3D CENTER / BOTTOM (4 lab cards)

import { sectionTop, sectionBottom, sectionShell } from '../_shared/constants'

export function labSection(): string {
  const top = sectionTop('LAB', 'LAB', 'Experiments & R&D playground')
  const bottom = sectionBottom(`
    <div class="uk-grid-small uk-child-width-1-2@s" uk-grid>
      <div class="uk-card uk-card-default uk-card-body uk-card-hover uk-text-center" data-lab="shader">
        <span class="uk-text-large" aria-hidden="true">◈</span>
        <h3 class="uk-card-title uk-margin-small-top">Shader Lab</h3>
        <p class="uk-text-meta">GLSL & TSL fragments</p>
      </div>
      <div class="uk-card uk-card-default uk-card-body uk-card-hover uk-text-center" data-lab="audio">
        <span class="uk-text-large" aria-hidden="true">◉</span>
        <h3 class="uk-card-title uk-margin-small-top">Audio Reactive</h3>
        <p class="uk-text-meta">Sound-driven visuals</p>
      </div>
      <div class="uk-card uk-card-default uk-card-body uk-card-hover uk-text-center" data-lab="gen">
        <span class="uk-text-large" aria-hidden="true">⬡</span>
        <h3 class="uk-card-title uk-margin-small-top">Generative</h3>
        <p class="uk-text-meta">Procedural worlds</p>
      </div>
      <div class="uk-card uk-card-default uk-card-body uk-card-hover uk-text-center" data-lab="particles">
        <span class="uk-text-large" aria-hidden="true">⁂</span>
        <h3 class="uk-card-title uk-margin-small-top">GPU Particles</h3>
        <p class="uk-text-meta">10k instances</p>
      </div>
    </div>
  `)
  return sectionShell('lab', 'lab', top, bottom)
}
