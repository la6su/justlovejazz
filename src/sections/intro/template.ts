// src/sections/intro/template.ts — Face 1: Philosophy (front face +Z, start section)
// Hero tier — uk-heading-xlarge. Active on load.
// data-section="intro" matches WorldConfig domSection (3D sync).
import { HOME_SECTIONS, homeSection } from '../_shared/home-data'

export function introSection(): string {
  // HOME_SECTIONS[1] = 01 Philosophy (active on load)
  return homeSection(HOME_SECTIONS[1]!, 'intro', 'xlarge')
}
