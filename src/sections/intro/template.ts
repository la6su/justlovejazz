// src/sections/intro/template.ts — Face 1: Studio (front face +Z, start section)
// Hero tier — uk-heading-xlarge. Active on load.
//
// The showreel play button is a DOM uk-button (data-showreel-trigger) in the
// bottom block. UIManager owns its delegated click behavior and opens
// FullscreenOverlay in video mode; the overlay remains the single media owner.
import { sectionShell, storyBottom, homeTop, descBlock } from '../_shared/constants'

export function introSection(): string {
  const top = homeTop(
    '01',
    'home.studio.title',
    'Studio',
    'home.studio.lead',
    'Crafted with love.',
    'xlarge',
  )
  const bottom = storyBottom(
    `${descBlock([
      {
        key: 'home.studio.desc1',
        text: 'Interfaces and realtime scenes that make a product legible.',
      },
      { key: 'home.studio.desc2', text: 'Strategy, design and WebGPU in one system.' },
    ])}
    <div class="uk-margin-top">
      <button type="button" class="uk-button uk-button-default uk-button-small" id="jlz-showreel-trigger" data-cursor="play">
        <span uk-icon="icon: play; ratio: 0.7" aria-hidden="true"></span>
        <span data-i18n="home.studio.showreel">Play showreel</span>
      </button>
    </div>
`,
  )
  return sectionShell('intro', top, bottom, 'home', false, '')
}
