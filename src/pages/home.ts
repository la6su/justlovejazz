// src/pages/home.ts — Home page: 6 cube-face sections + footer
//
// The home page is the 3D cube experience. 6 sections (1:1 with cube faces)
// are stacked absolutely in #spa-content. JoystickNav cycles through them.
// The 3D canvas (SplashCube + EnvSphere) is synchronized via section index.
//
// Section order matches cube face order (see _shared/constants.ts):
//   0=Lab (top), 1=Intro (front), 2=About (right),
//   3=Works (back), 4=Contact (bottom), 5=Process (left)
//
// Intro (idx 1) and Contact (idx 4) are light/inverse by default —
// black splash → light intro → dark sections → light contact.
//
// Footer is included but hidden on home (CSS: body[data-page='home'] .jlz-footer)

import { labSection } from '../sections/lab/template'
import { introSection } from '../sections/intro/template'
import { aboutSection } from '../sections/about/template'
import { worksSection } from '../sections/works/template'
import { contactSection } from '../sections/contact/template'
import { processSection } from '../sections/process/template'
import { FOOTER } from '../sections/_shared/footer'

export function homePage(): string {
  return `
    <!-- ═══ 6 child sections (4 main + 2 secret side) — 1:1 cube faces ═══ -->
    ${labSection()}
    ${introSection()}
    ${aboutSection()}
    ${worksSection()}
    ${contactSection()}
    ${processSection()}

    ${FOOTER}
  `
}
