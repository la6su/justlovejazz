// SectionSceneFactory — creates 3D scene groups for each section.
// Delegates to Section modules (src/Sections/Section*/index.ts) per junni pattern.

import * as THREE from 'three'
import { createSection1 } from '../Sections/Section1Intro'
import { createSection2 } from '../Sections/Section2About'
import { createSection3 } from '../Sections/Section3Flexible'
import { createSection4 } from '../Sections/Section4Challenge'
import { createSection5 } from '../Sections/Section5Innovative'
import { createSection6 } from '../Sections/Section6Contact'

export class SectionSceneFactory {
  static createIntro(): THREE.Group { return createSection1() }
  static createAbout(): THREE.Group { return createSection2() }
  static createFlexible(): THREE.Group { return createSection3() }
  static createChallenge(): THREE.Group { return createSection4() }
  static createInnovative(): THREE.Group { return createSection5() }
  static createContact(): THREE.Group { return createSection6() }

  static byIndex(i: number): THREE.Group {
    switch (i) {
      case 0: return this.createIntro()
      case 1: return this.createAbout()
      case 2: return this.createFlexible()
      case 3: return this.createChallenge()
      case 4: return this.createInnovative()
      case 5: return this.createContact()
      default: return this.createIntro()
    }
  }

  static hideGeometry(group: THREE.Group): void {
    group.traverse((obj) => {
      if (obj === group) return
      if (obj instanceof THREE.Points) return
      if (obj.userData?.keepVisible) return
      obj.visible = false
    })
  }
}
