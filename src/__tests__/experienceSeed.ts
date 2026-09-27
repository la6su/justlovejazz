// Shared Experience test seed (constructor bypass).
//
// The Experience constructor is heavy (renderer capability detection, UI
// construction), so lifecycle-method tests build a bare instance via
// Object.create(Experience.prototype) and seed exactly the state the tested
// methods touch. The six route-owned lazy stages live in the StageRegistry
// owner (StageRegistry.ts), so this helper attaches a registry built over the
// seeded instance and routes the legacy stage bag keys (`worksPlaneStage`,
// `contactCyprusStage`, …) into its public slots: a truthy bag value pre-sets
// the slot's stage reference (fake stage objects), a null/undefined value
// just leaves the fresh slot empty. The registry context reads the seeded
// instance lazily, so bag-driven fields (page, camera, host, polarity,
// reduced motion, coordinator) are observed at contract time.

import * as THREE from 'three'
import { Experience } from '../Experience/Experience'
import { StageRegistry } from '../Experience/StageRegistry'
import type { SceneStagePorts } from '../app/sceneHost'
import type { LazyStageSlot } from '../Experience/LazyStage'

/** The six route-owned lazy-stage slot names (StageRegistry.slots keys). */
export type LazyStageSlotName =
  | 'worksPlane'
  | 'contactTypography'
  | 'contactCyprus'
  | 'contactHalo'
  | 'manifestoInk'
  | 'labGamepad'

/** The no-op `works` two-level port (the tests that exercise it seed their
 *  own `_host`); the plain stage ports attach to the seed scene so the
 *  port-backed contracts keep their "stage joins the scene" behavior under
 *  the constructor-bypass seed (production realizes the same boundary via
 *  SceneHost's Vue `<primitive>` slots). */
function makeEmptyPorts(scene: THREE.Scene): SceneStagePorts {
  // Method parameter bivariance lets one Object3D-typed double satisfy every
  // `StagePort<StageType>` field without per-stage type imports here.
  const slotPort = (): {
    mount(object: THREE.Object3D): Promise<void>
    unmount(object: THREE.Object3D): Promise<void>
  } => ({
    mount: async (object) => {
      scene.add(object)
    },
    unmount: async (object) => {
      object.removeFromParent()
    },
  })
  return {
    works: {
      mountStage: async () => undefined,
      unmountStage: async () => undefined,
      mountInstallation: async () => undefined,
      unmountInstallation: async () => undefined,
    },
    contactHalo: slotPort(),
    manifestoInk: slotPort(),
    contactTypography: slotPort(),
    contactCyprus: slotPort(),
    labGamepad: slotPort(),
  }
}

/** Bag keys that route into a registry slot instead of a plain field.
 *  Keys exist only where a test seeds the stage through the legacy bag;
 *  halo/ink stages are always injected via the returned `slots` record. */
const SLOT_KEY_TO_NAME: Record<string, LazyStageSlotName> = {
  worksPlaneStage: 'worksPlane',
  contactTypographyStage: 'contactTypography',
  contactCyprusStage: 'contactCyprus',
  labGamepad: 'labGamepad',
}

export interface SeededExperience {
  exp: Experience
  /** Per-stage registry slots, for live stage reads and request-id
   *  assertions. Stages are `unknown` — tests narrow with the assertions
   *  they need. */
  slots: Record<LazyStageSlotName, LazyStageSlot<unknown>>
}

/** Bare Experience for lifecycle-method tests: the heavy constructor is
 *  bypassed and `bag` seeds exactly the state the tested methods touch.
 *  Stage bag keys are routed into the attached registry (see module header). */
export function seedExperience(bag: Record<string, unknown> = {}): SeededExperience {
  const slotValues: Record<string, unknown> = {}
  const rest: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(bag)) {
    const slotName = SLOT_KEY_TO_NAME[key]
    if (slotName) slotValues[key] = value
    else rest[key] = value
  }
  const exp = Object.assign(Object.create(Experience.prototype), rest) as Experience
  const seeded = exp as unknown as {
    _stages?: StageRegistry
    currentPage?: unknown
    camera?: { instance: THREE.Camera }
    _host?: unknown
    _contactIsLight?: boolean
    _contactCyprusActive?: boolean
    _reducedMotion?: boolean
    coordinator?: { syncRouteVisuals(): void }
  }
  const scene = (rest.scene as THREE.Scene | undefined) ?? new THREE.Scene()
  const registry = new StageRegistry({
    // The bag may override currentPage with a field (shadowing the prototype
    // method) — the property read resolves the override first.
    currentPage: () => (typeof seeded.currentPage === 'function' ? seeded.currentPage() : 'home'),
    camera: () => seeded.camera ?? { instance: new THREE.PerspectiveCamera() },
    host: () =>
      (seeded._host as { stages?: SceneStagePorts } | undefined)?.stages ?? makeEmptyPorts(scene),
    isContactLight: () => Boolean(seeded._contactIsLight),
    isCyprusActive: () => Boolean(seeded._contactCyprusActive),
    setCyprusActive: (active) => {
      seeded._contactCyprusActive = active
    },
    reducedMotion: () => Boolean(seeded._reducedMotion),
    syncRouteVisuals: () => seeded.coordinator?.syncRouteVisuals(),
  })
  seeded._stages = registry
  for (const [key, value] of Object.entries(slotValues)) {
    if (value != null) {
      ;(registry.slots[SLOT_KEY_TO_NAME[key]!] as LazyStageSlot<unknown>).setStage(value)
    }
  }
  return {
    exp,
    slots: registry.slots as unknown as Record<LazyStageSlotName, LazyStageSlot<unknown>>,
  }
}
