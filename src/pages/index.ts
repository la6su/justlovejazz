// src/pages/index.ts — Page registry + router
//
// 3 pages, each with 6 sections (cube-map: 0=secret, 1=intro, 2-4=main, 5=secret):
//   - home       — Lab/Intro/About/Works/Contact/Process
//   - services   — Secret/Intro/Capabilities/Stack/Process/Secret
//   - manifesto  — Secret/Intro/Principles/Craft/Process/Secret
//
// Structure:
//   src/pages/
//   ├── index.ts              ← this file (registry + renderPage)
//   ├── home.ts               ← home page (6 cube-face sections + dock)
//   ├── content/
//   │   ├── services.ts       ← services content page (6 sections)
//   │   └── manifesto.ts      ← manifesto content page (6 sections)
//
//   src/sections/             ← unified section modules (3D scene + HTML template)
//   ├── _shared/              ← constants, footer, makeParticles
//   ├── lab/                  ← face 0 (top +Y, secret left)
//   ├── intro/                ← face 1 (front +Z, start)
//   ├── about/                ← face 2 (right +X)
//   ├── works/                ← face 3 (back -Z, BakuCarousel)
//   ├── contact/              ← face 4 (bottom -Y)
//   └── process/              ← face 5 (left -X, secret right)

import { homePage } from './home'
import { servicesPage } from './content/services'
import { manifestoPage } from './content/manifesto'

export type PageId = 'home' | 'services' | 'manifesto'

export function renderPage(page: PageId = 'home'): string {
  switch (page) {
    case 'services':
      return servicesPage()
    case 'manifesto':
      return manifestoPage()
    case 'home':
    default:
      return homePage()
  }
}

// Re-export homePage for backward compat (templates.ts shim uses it)
export { homePage } from './home'
