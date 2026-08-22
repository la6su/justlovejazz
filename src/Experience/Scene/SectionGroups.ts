// src/Experience/Scene/SectionGroups.ts — Phase 8 slice 2: the stable
// section groups owner.
//
// Migrates the legacy `World.sceneGroups` creation + disposal: the six
// stable section groups (one per canonical slot, created by
// `SectionSceneFactory` and geometry-hidden until bespoke visuals are ready)
// now enter the Tres-owned scene directly under this owner. Experience
// creates the owner (fresh per World instance) and is the single disposal
// owner.
//
// Consumer (temporary, Phase 8): `World.attachSectionGroups` injects the
// owner; World's frame path (the `updateTransform` group fade/visibility
// step, the `update()` per-group updates, `setContactSceneSection`,
// `hasVisibleParticles` / `hasVisibleAmbientMotion` and
// `ensureCarouselInitialized`) and the Experience / ExperienceUI reads
// (`theme` particle blending, low-FPS particle reduction, the Works group
// reference) all read the groups through the `world.sceneGroups` getter.
// Removed with the World scene-coordination part when `World` leaves
// production (Phase 8 completion).

import * as THREE from 'three'
import { SectionSceneFactory } from '../../core/SectionSceneFactory'
import { disposeSection3Textures } from '../../sections/works/scene'
import { disposeMaterialDeep } from '../../Utils/dispose'

/** Canonical six-slot layout (one group per world slot / cube face). */
export const SECTION_GROUP_COUNT = 6

export class SectionGroups {
  readonly groups: THREE.Group[] = []

  constructor(scene: THREE.Scene, count: number = SECTION_GROUP_COUNT) {
    for (let i = 0; i < count; i++) {
      const group = SectionSceneFactory.byIndex(i)
      // Hide non-particle geometry until bespoke visuals are ready (T-070..T-074).
      // Particles remain for atmospheric depth. Remove this call section by section
      // as real visuals are added.
      SectionSceneFactory.hideGeometry(group)
      scene.add(group)
      this.groups.push(group)
      group.visible = i === 1 // Intro = index 1
    }
  }

  public at(i: number): THREE.Group | undefined {
    return this.groups[i]
  }

  public dispose(): void {
    // Dispose the module-level Works particle texture. The section factory
    // already imports this module to create section 3, so a dynamic import here
    // only produced an ineffective split and a build warning.
    disposeSection3Textures()
    this.groups.forEach((group) => {
      // If the group hosts a BakuCarousel (userData.carousel), call its
      // dispose() FIRST — it removes 6 window listeners + clears snapTimer
      // + disposes card materials/textures/geometry. The traverse below
      // SKIPS the gallery's descendants (already disposed) to avoid a
      // fragile double-dispose on the same materials/geometries.
      const gallery = group.userData.carousel as
        ({ dispose?: () => void } & THREE.Object3D) | undefined
      // Collect gallery + all its descendants so the traverse can skip them.
      const galleryDescendants = new Set<THREE.Object3D>()
      if (gallery) {
        galleryDescendants.add(gallery)
        gallery.traverse((o) => galleryDescendants.add(o))
      }
      gallery?.dispose?.()
      group.traverse((obj) => {
        if (galleryDescendants.has(obj)) return // already disposed by gallery.dispose()
        if (obj instanceof THREE.Mesh) {
          obj.geometry?.dispose()
          if (Array.isArray(obj.material)) obj.material.forEach((m) => disposeMaterialDeep(m))
          else disposeMaterialDeep(obj.material)
        }
      })
      group.parent?.remove(group)
    })
    this.groups.length = 0
  }
}
