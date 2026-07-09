// src/pages/home.ts — Home page: 6 cube-face sections + footer
//
// The home page is the 3D cube experience. 6 sections (1:1 with cube faces)
// are stacked absolutely in #spa-content. JoystickNav cycles through them.
// The 3D canvas (SplashCube + EnvSphere) is synchronized via section index.
//
// Section order matches cube face order (see shared/constants.ts):
//   0=Lab (top), 1=Intro (front), 2=About (right),
//   3=Works (back), 4=Contact (bottom), 5=Process (left)
//
// Footer is included but hidden on home (CSS: body[data-page='home'] .jlz-footer)

import { labSection } from './sections/lab'
import { introSection } from './sections/intro'
import { aboutSection } from './sections/about'
import { worksSection } from './sections/works'
import { contactSection } from './sections/contact'
import { processSection } from './sections/process'
import { FOOTER } from './shared/footer'

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
