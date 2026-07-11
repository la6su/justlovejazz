// src/sections/process/template.ts — Face 5: Contact (secret right, left face -X)
// data-section="process" matches WorldConfig domSection (3D sync).
// Content shows "06 Contact" — domSection is an internal 3D-sync ID, not title.
import { HOME_SECTIONS, homeSection } from '../_shared/home-data'

export function processSection(): string {
  // HOME_SECTIONS[5] = 06 Contact (secret right)
  return homeSection(HOME_SECTIONS[5]!, 'process', 'large')
}
