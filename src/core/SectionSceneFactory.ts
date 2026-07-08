// SectionSceneFactory — creates 3D scene groups for each section.
// Delegates to Section modules (src/Sections/Section*/index.ts) per junni pattern.

import * as THREE from 'three'
import { createSection0 } from '../Sections/Section0Lab'
import { createSection1 } from '../Sections/Section1Intro'
import { createSection2 } from '../Sections/Section2About'
import { createSection3 } from '../Sections/Section3Flexible'
import { createSection4 } from '../Sections/Section4Challenge'
import { createSection5 } from '../Sections/Section5Innovative'
import { createSection6 } from '../Sections/Section6Contact'
import { createSection7 } from '../Sections/Section7Process'

// Index → creator function. 8 sections (6 main + Lab=0 + Process=7).
const SECTION_CREATORS: ReadonlyArray<() => THREE.Group> = [
  createSection0, // Lab (secret left)
  createSection1, // Intro
  createSection2, // About
  createSection3, // Flexible
  createSection4, // Challenge
  createSection5, // Innovative
  createSection6, // Contact
  createSection7, // Process (secret right)
]

export class SectionSceneFactory {
  static byIndex(i: number): THREE.Group {
    const fn = SECTION_CREATORS[i] ?? SECTION_CREATORS[0]
    return (fn ?? SECTION_CREATORS[0]!)()
  }

  static hideGeometry(group: THREE.Group): void {
    group.traverse((obj) => {
      if (obj === group) return
      // Keep particles visible — both old THREE.Points and new InstancedMesh
      if (obj instanceof THREE.Points) return
      if (obj instanceof THREE.InstancedMesh) return
      if (obj.userData?.keepVisible) return
      obj.visible = false
    })
  }
}
