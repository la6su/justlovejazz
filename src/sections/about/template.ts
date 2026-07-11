// src/sections/about/template.ts — Face 2: About (right face +X)
// Apple Watch layout: TOP (title + lead) / 3D CENTER / BOTTOM (studio description + stack)

import { sectionTop, sectionBottom, sectionShell } from '../_shared/constants'

export function aboutSection(): string {
  const top = sectionTop('ABOUT', 'About', 'Remote · EU · since 2019', 'large')
  const bottom = sectionBottom(`
    <p class="uk-text-lead uk-text-left" data-content-id="about-text">
      A small studio crafting expressive browser experiences. We merge
      art direction with web engineering — 3D-first interfaces, spatial
      design, and real-time shaders that stay fast under pressure.
    </p>
    <div class="uk-grid-small uk-child-width-1-3 uk-margin-top uk-text-center" uk-grid>
      <div><div class="uk-heading-medium uk-margin-remove">6</div><span class="uk-text-meta">Sections</span></div>
      <div><div class="uk-heading-medium uk-margin-remove">2</div><span class="uk-text-meta">Engineers</span></div>
      <div><div class="uk-heading-medium uk-margin-remove">1</div><span class="uk-text-meta">Designer</span></div>
    </div>
  `)
  return sectionShell('about', 'about', top, bottom)
}
