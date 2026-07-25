// src/pages/index.ts — Page registry + router
//
// 6 pages (one per cube face), each with 4 main sections:
//   - home       — Studio / Philosophy / Approach / Team
//   - services   — Creative Direction / Realtime build / Motion / AI
//   - works      — Case studies (4 selected projects)
//   - manifesto  — Purpose / Clarity / Emotion / Simplicity
//   - lab        — Experiments (4 R&D areas)
//   - contact    — Email / Social / Location / Form
//
// CinematicNav scrolls/swipes across each page's four main frames. Contact and
// Menu are shared bottom/top sheets reachable from every page.

import type { PageId } from '../sections/_shared/constants'
import { homePage } from './home'
import { servicesPage } from './content/services'
import { worksPage } from './content/works'
import { manifestoPage } from './content/manifesto'
import { labPage } from './content/lab'
import { contactPage } from './content/contact'

export type { PageId }

const PAGES: Record<PageId, () => string> = {
  home: homePage,
  services: servicesPage,
  works: worksPage,
  manifesto: manifestoPage,
  lab: labPage,
  contact: contactPage,
}

export function renderPage(page: PageId = 'home'): string {
  return (PAGES[page] ?? homePage)()
}
