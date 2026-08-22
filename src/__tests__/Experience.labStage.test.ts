import * as THREE from 'three'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Experience } from '../Experience/Experience'
import { World } from '../core/World'
import * as manifest from '../Experience/Lab/manifest'

// Phase 8 slice 9: the Lab experiment object lifecycle (lazy creation on the
// first /lab visit + final disposal) moved from World to Experience. The
// object is a static scene object — no per-frame update, resize or camera — so
// the test drives `ensureLabGamepad` on an Experience instance created without
// its heavy constructor (renderer capability detection, UI construction),
// asserts through the public World getter, and lets World's `syncRouteVisuals`
// exercise the adapter visibility gate. (The final disposal on `destroy` is
// covered by the live gate's clean-disposal check, like the other slices.)

describe('Experience lab object lifecycle', () => {
  let exp: Experience
  let world: World
  let manifestSpy: ReturnType<typeof vi.spyOn>

  /** Minimal state the lifecycle method touches (constructor bypassed). */
  function makeExperience(scene: THREE.Scene, worldRef: World): Experience {
    return Object.assign(Object.create(Experience.prototype), {
      scene,
      world: worldRef,
      labGamepad: null,
      _labGamepadPromise: null,
    } as unknown as Partial<Experience>) as Experience
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
    world = new World(new THREE.Scene())
    exp = makeExperience(new THREE.Scene(), world)
    manifestSpy = vi.spyOn(manifest, 'getLabExperiment')
  })

  afterEach(() => {
    world.dispose()
    manifestSpy.mockRestore()
    delete document.body.dataset.page
  })

  it('loads one Lab object lazily and toggles its visibility through the World adapter', async () => {
    const object = new THREE.Group()
    object.name = 'lab-gamepad'
    mockExperiment(object)

    document.body.dataset.page = 'lab'
    await exp.ensureLabGamepad()

    // The World getter exposes the Experience-owned object (adapter wiring).
    expect(world.labGamepad).toBe(object)
    expect(object.visible).toBe(true)
    // The object entered the Tres-owned scene directly under Experience.
    expect(exp.scene.children).toContain(object)

    // Leaving /lab hides it via World's `syncRouteVisuals` (frame-path read).
    document.body.dataset.page = 'home'
    world.syncRouteVisuals()
    expect(object.visible).toBe(false)

    // Idempotent: a second visit does not re-create the object.
    document.body.dataset.page = 'lab'
    await exp.ensureLabGamepad()
    expect(world.labGamepad).toBe(object)
  })

  it('is a no-op when the manifest has no experiment for the Lab route', async () => {
    vi.spyOn(manifest, 'getLabExperiment').mockReturnValue(undefined)

    document.body.dataset.page = 'lab'
    await exp.ensureLabGamepad()

    expect(world.labGamepad).toBeNull()
    expect(exp.scene.children).toHaveLength(0)
  })
})
