// src/pages/index.ts — Page registry + router
//
// 3 pages, each with 6 sections (4 unique + 2 secret side):
//   - home (index)   — Lab/Intro/About/Works/Contact/Process
//   - services       — Intro/Services-list/Stack/Process/Contact/Values
//   - posts          — Intro/Latest/Featured/Categories/Contact/Archive
//
// Intro (1st) and Contact (last main) are light/inverse by default —
// black splash → light intro → dark sections → light contact.
//
// Structure:
//   src/pages/
//   ├── index.ts              ← this file (registry + renderPage)
//   ├── home.ts               ← home page (6 cube-face sections + footer)
//   ├── content/
//   │   ├── services.ts       ← services page (6 sections)
//   │   └── posts.ts          ← posts page (6 sections)
//   └── shared/               ← (legacy, redirects to sections/_shared)
//
//   src/sections/             ← unified section modules (3D scene + HTML template)
//   ├── _shared/              ← constants, footer, makeParticles
//   ├── lab/                  ← face 0 (top +Y, secret left)
//   ├── intro/                ← face 1 (front +Z, start, light/inverse)
//   ├── about/                ← face 2 (right +X)
//   ├── works/                ← face 3 (back -Z, BakuCarousel)
//   ├── contact/              ← face 4 (bottom -Y, light/inverse)
//   └── process/              ← face 5 (left -X, secret right)

import { homePage } from './home'
import { servicesPage } from './content/services'
import { postsPage } from './content/posts'

export type PageId = 'home' | 'services' | 'posts'

export function renderPage(page: PageId = 'home'): string {
  switch (page) {
    case 'services':
      return servicesPage()
    case 'posts':
      return postsPage()
    case 'home':
    default:
      return homePage()
  }
}

// Re-export homePage for backward compat (templates.ts shim uses it)
export { homePage } from './home'
