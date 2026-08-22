import * as THREE from 'three'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Experience } from '../Experience/Experience'
import { World } from '../core/World'
import { WorksPlaneStage } from '../Experience/World/WorksPlaneStage'

// Phase 8 slice 7: the /works case-plane stage lifecycle (lazy creation +
// disposal) moved from World to Experience. These methods are self-contained
// (they only touch the stage reference, the request guard, the scene + World
// adapter and the camera), so the test drives them on an Experience instance
// created without its heavy constructor (renderer capability detection, UI
// construction) and asserts through the public World getter.

const canvasContext = {
  fillStyle: '',
  globalAlpha: 1,
  fillRect: vi.fn(),
}

describe('Experience works stage lifecycle', () => {
  let exp: Experience
  let world: World
  let getContext: ReturnType<typeof vi.spyOn>

  /** Minimal state the two lifecycle methods touch (constructor bypassed). */
  function makeExperience(scene: THREE.Scene, worldRef: World): Experience {
    return Object.assign(Object.create(Experience.prototype), {
      scene,
      world: worldRef,
      camera: { instance: new THREE.PerspectiveCamera() },
      _worksPlaneStagePromise: null,
      _worksPlaneStageRequest: 0,
    } as unknown as Partial<Experience>) as Experience
  }

  beforeEach(() => {
    document.body.dataset.page = 'works'
    getContext = vi
      .spyOn(HTMLCanvasElement.prototype, 'getContext')
      .mockReturnValue(canvasContext as unknown as CanvasRenderingContext2D)
    world = new World(new THREE.Scene())
    exp = makeExperience(new THREE.Scene(), world)
  })

  afterEach(() => {
    world.dispose()
    getContext.mockRestore()
    delete document.body.dataset.page
  })

  it('releases a Works stage that finishes after the route was disposed', async () => {
    let resolveInit!: () => void
    const initPromise = new Promise<void>((resolve) => {
      resolveInit = resolve
    })
    const initSpy = vi.spyOn(WorksPlaneStage.prototype, 'init').mockReturnValue(initPromise)
    const disposeSpy = vi.spyOn(WorksPlaneStage.prototype, 'dispose')

    try {
      const pending = exp.ensureWorksPlaneStageInitialized()
      expect(world.worksPlaneStage).toBeInstanceOf(WorksPlaneStage)

      exp.disposeWorksPlaneStage()
      resolveInit()
      await pending

      // The first dispose detaches the World adapter immediately; the second
      // catches textures/cards created by the in-flight init before it settled.
      expect(world.worksPlaneStage).toBeNull()
      expect(disposeSpy).toHaveBeenCalledTimes(2)
    } finally {
      initSpy.mockRestore()
      disposeSpy.mockRestore()
    }
  })

  it('forwards the active /works stage into the World frame path via the adapter', async () => {
    const initSpy = vi.spyOn(WorksPlaneStage.prototype, 'init').mockResolvedValue()
    const disposeSpy = vi.spyOn(WorksPlaneStage.prototype, 'dispose')

    try {
      const pending = exp.ensureWorksPlaneStageInitialized()
      await pending
      const stage = world.worksPlaneStage
      expect(stage).toBeInstanceOf(WorksPlaneStage)

      // Leaving /works disposes the owner and detaches the adapter.
      document.body.dataset.page = 'home'
      exp.disposeWorksPlaneStage()
      expect(world.worksPlaneStage).toBeNull()
      expect(disposeSpy).toHaveBeenCalledTimes(1)
      expect(stage?.parent).toBeNull()
    } finally {
      initSpy.mockRestore()
      disposeSpy.mockRestore()
    }
  })
})
