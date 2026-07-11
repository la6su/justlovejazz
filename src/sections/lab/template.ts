// src/sections/lab/template.ts — Face 0: Lab (secret left, top face +Y)
// data-section="lab" matches WorldConfig domSection (3D sync).
import { HOME_SECTIONS, homeSection } from '../_shared/home-data'

export function labSection(): string {
  // HOME_SECTIONS[0] = 05 Lab
  return homeSection(HOME_SECTIONS[0]!, 'lab', 'large')
}
