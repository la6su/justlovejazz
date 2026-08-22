import * as THREE from 'three'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Experience } from '../Experience/Experience'
import { SceneCoordinator, type SceneCoordinatorOwners } from '../Experience/SceneCoordinator'
import * as manifest from '../Experience/Lab/manifest'
import type { LabExperimentObject } from '../Experience/Lab/manifest'

// Phase 8 slice 9: the Lab experiment object lifecycle (lazy creation on the
// first /lab visit + final disposal) moved from World to Experience. Phase 8
// slice 10: the `World` class leaves production — the object is read through
// the SceneCoordinator's `labGamepad` owner getter and the coordinator's
// `syncRouteVisuals` drives the visibility gate. The object is a static scene
// object (no per-frame update, resize or camera), so the test drives
// `ensureLabGamepad` on an Experience instance created without its heavy
// constructor (renderer capability detection, UI construction). (The final
// disposal on `destroy` is covered by the live gate's clean-disposal check,
// like the other slices.)

describe('Experience lab object lifecycle', () => {
  let exp: Experience
  let coordinator: SceneCoordinator
  let manifestSpy: ReturnType<typeof vi.spyOn>

  /** Minimal state the lifecycle method touches (constructor bypassed). */
  function makeExperience(scene: THREE.Scene): Experience {
    const exp = Object.assign(Object.create(Experience.prototype), {
      scene,
      labGamepad: null,
      _labGamepadPromise: null,
    } as unknown as Partial<Experience>) as Experience
    const bag = exp as unknown as { labGamepad?: LabExperimentObject | null }
    const owners: SceneCoordinatorOwners = {
      ground: () => null,
      sectionGroups: () => null,
      envSphere: () => null,
      baku: () => null,
      particleBurst: () => null,
      drawTrail: () => null,
      carousel: () => null,
      worksPlaneStage: () => null,
      contactTextStage: () => null,
      contactCyprusStage: () => null,
      labGamepad: () => bag.labGamepad ?? null,
    }
    coordinator = new SceneCoordinator(scene, owners)
    exp.coordinator = coordinator
    return exp
  }

  function mockExperiment(object: THREE.Object3D): void {
    vi.spyOn(manifest, 'getLabExperiment').mockReturnValue({
      id: 'gamepad',
      page: 'lab',
      load: () => Promise.resolve(object as never),
    } as never)
  }

  beforeEach(() => {
    document.body.dataset.page = 'lab'
    exp = makeExperience(new THREE.Scene())
    manifestSpy = vi.spyOn(manifest, 'getLabExperiment')
  })

  afterEach(() => {
    manifestSpy.mockRestore()
    delete document.body.dataset.page
  })

  it('loads one Lab object lazily and toggles its visibility through the coordinator gate', async () => {
    const object = new THREE.Group()
    object.name = 'lab-gamepad'
    mockExperiment(object)

    document.body.dataset.page = 'lab'
    await exp.ensureLabGamepad()

    // The coordinator getter exposes the Experience-owned object.
    expect(coordinator.labGamepad).toBe(object)
    expect(object.visible).toBe(true)
    // The object entered the Tres-owned scene directly under Experience.
    expect(exp.scene.children).toContain(object)

    // Leaving /lab hides it via the coordinator's `syncRouteVisuals`.
    document.body.dataset.page = 'home'
    coordinator.syncRouteVisuals()
    expect(object.visible).toBe(false)

    // Idempotent: a second visit does not re-create the object.
    document.body.dataset.page = 'lab'
    await exp.ensureLabGamepad()
    expect(coordinator.labGamepad).toBe(object)
  })

  it('is a no-op when the manifest has no experiment for the Lab route', async () => {
    vi.spyOn(manifest, 'getLabExperiment').mockReturnValue(undefined)

    document.body.dataset.page = 'lab'
    await exp.ensureLabGamepad()

    expect(coordinator.labGamepad).toBeNull()
    expect(exp.scene.children).toHaveLength(0)
  })
})
