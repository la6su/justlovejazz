// src/sections/about/template.ts — Face 2: Works (right face +X)
// data-section="about" matches WorldConfig domSection (3D sync).
// Content shows "02 Works" — domSection is an internal 3D-sync ID, not title.
import { HOME_SECTIONS, homeSection } from '../_shared/home-data'

export function aboutSection(): string {
  // HOME_SECTIONS[2] = 02 Works
  return homeSection(HOME_SECTIONS[2]!, 'about', 'large')
}
