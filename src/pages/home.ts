// src/pages/home.ts — Home page: 6 cube-face sections + footer
//
// The home page is the 3D cube experience. 6 sections (1:1 with cube faces)
// are stacked absolutely in #spa-content. JoystickNav cycles through them.
// The 3D canvas (SplashCube + EnvSphere) is synchronized via section index.
//
// Section order matches cube face order (see _shared/constants.ts):
//   0=Lab overlay (joystick left), 1=Intro (front), 2=About (right),
//   3=Works (back), 4=Contact (bottom), 5=Navigation overlay (joystick right)
//
// PLAN-v3: section 0 = Lab overlay (works list), section 5 = Navigation overlay (hamburger menu).
// Both overlays are shared across ALL pages (home + content).

import { labOverlaySection } from '../sections/lab-overlay/template'
import { introSection } from '../sections/intro/template'
import { aboutSection } from '../sections/about/template'
import { worksSection } from '../sections/works/template'
import { contactSection } from '../sections/contact/template'
import { navOverlaySection } from '../sections/nav/template'
import { FOOTER } from '../sections/_shared/footer'

export function homePage(): string {
  return `
    <!-- ═══ 6 child sections (4 main + 2 overlay sides) — 1:1 cube faces ═══ -->
    ${labOverlaySection('home')}
    ${introSection()}
    ${aboutSection()}
    ${worksSection()}
    ${contactSection()}
    ${navOverlaySection('home')}

    ${FOOTER}
  `
}
