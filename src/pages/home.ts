// src/pages/home.ts — Home page: 6 cube-face sections + footer
//
// The home page is the 3D cube experience. 6 sections (1:1 with cube faces)
// are stacked absolutely in #spa-content. JoystickNav cycles through them.
// The 3D canvas (SplashCube + EnvSphere) is synchronized via section index.
//
// Section order matches the displayed cube orientation (see _shared/constants.ts):
//   0=Lab (front), 1=Intro (right), 2=About (back), 3=Works (left),
//   4=Contact (negative Y tilt), 5=Navigation (positive Y tilt).
//
// Sections 0 (Lab) and 5 (Navigation) are shared across all SPA pages.

import { labOverlaySection } from '../sections/lab-overlay/template'
import { introSection } from '../sections/intro/template'
import { aboutSection } from '../sections/about/template'
import { worksSection } from '../sections/works/template'
import { contactSection } from '../sections/contact/template'
import { navOverlaySection } from '../sections/nav/template'

export function homePage(): string {
  return `
    <!-- ═══ 6 child sections (4 main + 2 overlay sides) — 1:1 cube faces ═══ -->
    ${labOverlaySection('home')}
    ${introSection()}
    ${aboutSection()}
    ${worksSection()}
    ${contactSection()}
    ${navOverlaySection('home')}

  `
}
