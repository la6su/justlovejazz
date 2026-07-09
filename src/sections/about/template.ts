// src/sections/about/template.ts — Face 2: About (right face +X)
// Apple Watch layout: TOP (title + tech stack) / 3D CENTER / BOTTOM (stats grid)

import { sectionTop, sectionBottom, sectionShell } from '../_shared/constants'

export function aboutSection(): string {
  const top = sectionTop('ABOUT', 'About', 'WebGPU · Three.js · TSL · UIkit')
  const bottom = sectionBottom(`
    <p class="uk-text-lead uk-text-left" data-content-id="about-text">
      A small studio crafting expressive browser experiences. We merge
      art direction with web engineering — 3D-first interfaces, spatial
      design, and real-time shaders that stay fast under pressure.
    </p>
    <div class="uk-grid-small uk-child-width-1-3 uk-margin-top uk-text-center" uk-grid>
      <div><div class="uk-heading-medium uk-margin-remove">7+</div><span class="uk-text-meta">Years</span></div>
      <div><div class="uk-heading-medium uk-margin-remove">40+</div><span class="uk-text-meta">Projects</span></div>
      <div><div class="uk-heading-medium uk-margin-remove">12</div><span class="uk-text-meta">Awards</span></div>
    </div>
  `)
  return sectionShell('about', 'about', top, bottom)
}
