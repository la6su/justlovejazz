// src/pages/home.ts — Home page: 6 cube-face sections + footer
//
// The home page is the 3D cube experience. The four main sections form a
// native horizontal story track; section 0/5 enter as Contact/Menu sheets.
// The 3D canvas is synchronized by section index and continuous track progress.
//
// Section order matches the displayed cube orientation (see _shared/constants.ts):
//   0=Contact finale in the canonical Lab slot (front), 1=Intro (right),
//   2=About (back), 3=Works (left), 4=Contact (negative Y tilt),
//   5=Navigation (positive Y tilt).
//
// Sheets 0 (Contact finale) and 5 (Navigation) are shared across SPA pages.

import { labOverlaySection } from '../sections/lab-overlay/template'
import { introSection } from '../sections/intro/template'
import { aboutSection } from '../sections/about/template'
import { worksSection } from '../sections/works/template'
import { contactSection } from '../sections/contact/template'
import { navOverlaySection } from '../sections/nav/template'

export function homePage(): string {
  return `
    <!-- ═══ 6 child sections (4 story frames + 2 sheets) — 1:1 cube states ═══ -->
    ${labOverlaySection('home')}
    ${introSection()}
    ${aboutSection()}
    ${worksSection()}
    ${contactSection()}
    ${navOverlaySection('home')}

  `
}
