// src/sections/about/template.ts — Face 2: Services (right face +X)
// data-section="about" matches WorldConfig domSection (3D sync).
import { sectionShell, homeTop, i18nDesc, serviceExplore, storyBottom } from '../_shared/constants'

export function aboutSection(): string {
  const bottom = storyBottom(
    `${i18nDesc('home.about', ['A brief becomes an interface people can move through.', 'Direction · product design · realtime build.'])}${serviceExplore('/services', 'common.explore', 'Explore')}`,
  )
  return sectionShell(
    'about',
    homeTop(
      '02',
      'home.about.title',
      'Services',
      'home.about.lead',
      'From strategy to implementation.',
    ),
    bottom,
    'home',
  )
}
