// src/pages/index.ts — Page registry + router
//
// Re-exports all page renderers. This is the public API consumed by
// src/router.ts and src/templates.ts (backward-compat shim).
//
// Structure:
//   src/pages/
//   ├── index.ts              ← this file (registry + renderPage)
//   ├── home.ts               ← home page (6 cube-face sections + footer)
//   ├── sections/             ← 6 home section templates (1:1 cube faces)
//   │   ├── lab.ts            ← face 0 (top +Y, secret left)
//   │   ├── intro.ts          ← face 1 (front +Z, start)
//   │   ├── about.ts          ← face 2 (right +X)
//   │   ├── works.ts          ← face 3 (back -Z, BakuCarousel)
//   │   ├── contact.ts        ← face 4 (bottom -Y)
//   │   └── process.ts        ← face 5 (left -X, secret right)
//   ├── content/              ← 6 content page templates
//   │   ├── services.ts
//   │   ├── cases.ts
//   │   ├── process.ts
//   │   ├── team.ts
//   │   ├── journal.ts
//   │   └── contact.ts
//   └── shared/
//       ├── constants.ts      ← REVEAL, PAGE_REVEAL, PageId, SectionId
//       └── footer.ts         ← FOOTER (unified, brand + social only)
//
// Cube face → section → 3D sync mapping:
//   See shared/constants.ts for the full table.
//   SplashCube.FACE_ROTATIONS in src/Experience/World/SplashCube.ts must match.

import { homePage } from './home'
import { servicesPage } from './content/services'
import { casesPage } from './content/cases'
import { processPage } from './content/process'
import { teamPage } from './content/team'
import { journalPage } from './content/journal'
import { contactPage } from './content/contact'
import type { PageId } from './shared/constants'

export type { PageId, SectionId } from './shared/constants'

export function renderPage(page: PageId = 'home'): string {
  switch (page) {
    case 'services':
      return servicesPage()
    case 'cases':
      return casesPage()
    case 'process':
      return processPage()
    case 'team':
      return teamPage()
    case 'journal':
      return journalPage()
    case 'contact':
      return contactPage()
    case 'home':
    default:
      return homePage()
  }
}

// Re-export homePage for backward compat (templates.ts shim uses it)
export { homePage } from './home'
