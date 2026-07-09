// SectionSceneFactory — creates 3D scene groups for each section.
// Delegates to unified section modules (src/sections/*/scene.ts).
//
// 6 sections (4 main + Lab=0 + Process=5) — 1:1 with cube faces.

import * as THREE from 'three'
import { createSection0 } from '../sections/lab/scene'
import { createSection1 } from '../sections/intro/scene'
import { createSection2 } from '../sections/about/scene'
import { createSection4 } from '../sections/works/scene'
import { createSection6 } from '../sections/contact/scene'
import { createSection7 } from '../sections/process/scene'

// Index → creator function. 6 sections (1:1 cube faces).
const SECTION_CREATORS: ReadonlyArray<() => THREE.Group> = [
  createSection0, // 0: Lab (secret left — top face)
  createSection1, // 1: Intro (front face)
  createSection2, // 2: About (right face)
  createSection4, // 3: Works (back face — BakuCarousel)
  createSection6, // 4: Contact (bottom face)
  createSection7, // 5: Process (secret right — left face)
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
