// src/sections/contact/template.ts — Face 4: Manifesto (bottom face -Y)
// data-section="contact" matches WorldConfig domSection (3D sync).
// Content shows "04 Manifesto" — domSection is an internal 3D-sync ID, not title.
import { HOME_SECTIONS, homeSection } from '../_shared/home-data'

export function contactSection(): string {
  // HOME_SECTIONS[4] = 04 Manifesto
  return homeSection(HOME_SECTIONS[4]!, 'contact', 'large')
}
