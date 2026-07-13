// src/pages/index.ts — Page registry + router
//
// 6 pages (one per cube face), each with 4 main sections:
//   - home       — Studio / Philosophy / Approach / Team
//   - services   — Creative Direction / Interactive Dev / Motion & Realtime / AI Systems
//   - works      — Case studies (4 selected projects)
//   - manifesto  — Purpose / Clarity / Emotion / Simplicity
//   - lab        — Experiments (4 R&D areas)
//   - contact    — Email / Social / Location / Form
//
// Joystick: down/up cycles 4 main sections; left → Lab, right → Contact
// (shared side sections reachable from any page).

import { homePage } from './home'
import { servicesPage } from './content/services'
import { worksPage } from './content/works'
import { manifestoPage } from './content/manifesto'
import { labPage } from './content/lab'
import { contactPage } from './content/contact'

export type PageId = 'home' | 'services' | 'works' | 'manifesto' | 'lab' | 'contact'

export function renderPage(page: PageId = 'home'): string {
  switch (page) {
    case 'services':
      return servicesPage()
    case 'works':
      return worksPage()
    case 'manifesto':
      return manifestoPage()
    case 'lab':
      return labPage()
    case 'contact':
      return contactPage()
    case 'home':
    default:
      return homePage()
  }
}
