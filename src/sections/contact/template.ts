// src/sections/contact/template.ts — Face 4: Manifesto (bottom face -Y)
// data-section="contact" matches WorldConfig domSection (3D sync).
import { sectionShell, homeTop, i18nDesc, serviceExplore, storyBottom } from '../_shared/constants'

export function contactSection(): string {
  const bottom = storyBottom(
    `${i18nDesc('home.manifesto', ['Clarity before spectacle.', 'Every effect must explain a state.', 'Every page must earn attention.'])}${serviceExplore('/manifesto', 'common.explore', 'Explore')}`,
  )
  return sectionShell(
    'contact',
    homeTop(
      '04',
      'home.manifesto.title',
      'Manifesto',
      'home.manifesto.lead',
      'This is what guides us.',
    ),
    bottom,
    'home',
  )
}
