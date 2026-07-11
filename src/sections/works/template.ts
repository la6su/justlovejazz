// src/sections/works/template.ts — Face 3: Services (back face -Z)
// data-section="challenge" matches WorldConfig domSection (3D sync).
// Content shows "03 Services" — domSection is an internal 3D-sync ID, not title.
// Note: BakuCarousel 3D object still renders here (3D scene rewiring is a
// follow-up — at this stage we unify the 2D template + content).
import { HOME_SECTIONS, homeSection } from '../_shared/home-data'

export function worksSection(): string {
  // HOME_SECTIONS[3] = 03 Services
  return homeSection(HOME_SECTIONS[3]!, 'challenge', 'large')
}
