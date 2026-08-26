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
// `hasVisibleParticles` / `hasVisibleAmbientMotion`) and the Experience /
// ExperienceUI reads (`theme` particle blending, low-FPS particle reduction,
// the Works group reference) all read the groups through the
// `world.sceneGroups` getter. Removed with the World scene-coordination
// part when `World` leaves production (Phase 8 completion).
//
// Phase 8 slice 6: the BakuCarousel (created by the works section factory as
// a child of the Works group) keeps its scene-graph position here — its
// disposal (BakuCarousel-first ordering) stays in this owner, while its
// reference + init live on Experience.

import * as THREE from 'three'
// Phase 8 slice 10: the `SectionSceneFactory` (index→creator + geometry
// hiding) is inlined here — the SectionGroups owner is its only production
// consumer, so the standalone factory file leaves production.
import { createSection0 } from '../../sections/lab/scene'
import { createSection1 } from '../../sections/intro/scene'
import { createSection2 } from '../../sections/about/scene'
import { createSection3 } from '../../sections/works/scene'
import { createSection4 } from '../../sections/contact/scene'
import { createSection5 } from '../../sections/menu/scene'
import { disposeMaterialDeep } from '../../Utils/dispose'
import type { PageId } from '../../sections/_shared/constants'
import type { StorySide } from '../../core/storyState'

/** Canonical six-slot layout (one group per world slot / cube face). */
export const SECTION_GROUP_COUNT = 6

/** Dispose geometry/material resources below a root, excluding known owners. */
export function disposeSceneObjectResources(
  root: THREE.Object3D,
  skip: ReadonlySet<THREE.Object3D> = new Set(),
): void {
  root.traverse((obj) => {
    if (skip.has(obj)) return
    if (
      obj instanceof THREE.Mesh ||
      obj instanceof THREE.Points ||
      obj instanceof THREE.Line ||
      obj instanceof THREE.Sprite
    ) {
      obj.geometry?.dispose()
      if (Array.isArray(obj.material)) obj.material.forEach((m) => disposeMaterialDeep(m))
      else if (obj.material) disposeMaterialDeep(obj.material)
    }
  })
}

// Index → creator function. 6 sections (1:1 cube faces).
type SectionCreator = (page: () => PageId, storySide: () => StorySide) => THREE.Group

const SECTION_CREATORS: ReadonlyArray<SectionCreator> = [
  createSection0, // 0: canonical Lab scene behind the public Contact finale
  createSection1, // 1: Intro (front face)
  createSection2, // 2: About (right face)
  createSection3, // 3: Works (back face — BakuCarousel)
  createSection4, // 4: Contact (bottom face)
  createSection5, // 5: Menu sheet — positive Y tilt
]

/** Create the section group for a canonical slot (falls back to slot 0). */
function createSectionGroupByIndex(
  i: number,
  page: () => PageId,
  storySide: () => StorySide,
): THREE.Group {
  const fn = SECTION_CREATORS[i] ?? SECTION_CREATORS[0]
  return (fn ?? SECTION_CREATORS[0]!)(page, storySide)
}

/**
 * Hide non-particle geometry until bespoke visuals are ready (T-070..T-074).
 * Particles (THREE.Points / InstancedMesh) + `userData.keepVisible` objects
 * remain for atmospheric depth.
 */
function hideSectionGeometry(group: THREE.Group): void {
  group.traverse((obj) => {
    if (obj === group) return
    if (obj instanceof THREE.Points) return
    if (obj instanceof THREE.InstancedMesh) return
    if (obj.userData?.keepVisible) return
    obj.visible = false
  })
}

export class SectionGroups {
  readonly groups: THREE.Group[] = []

  constructor(
    scene: THREE.Scene,
    count: number = SECTION_GROUP_COUNT,
    page: () => PageId = () => 'home',
    storySide: () => StorySide = () => 'center',
  ) {
    for (let i = 0; i < count; i++) {
      const group = createSectionGroupByIndex(i, page, storySide)
      // Hide non-particle geometry until bespoke visuals are ready (T-070..T-074).
      // Particles remain for atmospheric depth. Remove this call section by section
      // as real visuals are added.
      hideSectionGeometry(group)
      scene.add(group)
      this.groups.push(group)
      group.visible = i === 1 // Intro = index 1
    }
  }

  public at(i: number): THREE.Group | undefined {
    return this.groups[i]
  }

  public dispose(): void {
    this.groups.forEach((group) => {
      const ownedTextures = group.userData.ownedTextures as THREE.Texture[] | undefined
      ownedTextures?.forEach((texture) => texture.dispose())
      if (ownedTextures) delete group.userData.ownedTextures
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
      disposeSceneObjectResources(group, galleryDescendants)
      group.parent?.remove(group)
    })
    this.groups.length = 0
  }
}
