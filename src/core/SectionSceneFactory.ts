// SectionSceneFactory — creates 3D scene groups for each section.
// Delegates to Section modules (src/Sections/Section*/index.ts) per junni pattern.

import * as THREE from 'three'
import { createSection1 } from '../Sections/Section1Intro'
import { createSection2 } from '../Sections/Section2About'
import { createSection3 } from '../Sections/Section3Flexible'
import { createSection4 } from '../Sections/Section4Challenge'
import { createSection5 } from '../Sections/Section5Innovative'
import { createSection6 } from '../Sections/Section6Contact'

// Index → creator function. Single source of truth — no named wrappers.
const SECTION_CREATORS: ReadonlyArray<() => THREE.Group> = [
  createSection1,
  createSection2,
  createSection3,
  createSection4,
  createSection5,
  createSection6,
]

export class SectionSceneFactory {
  static byIndex(i: number): THREE.Group {
    const fn = SECTION_CREATORS[i] ?? SECTION_CREATORS[0]
    return (fn ?? SECTION_CREATORS[0]!)()
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
