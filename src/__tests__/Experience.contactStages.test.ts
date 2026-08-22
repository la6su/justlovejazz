import * as THREE from 'three'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Experience } from '../Experience/Experience'
import { World } from '../core/World'
import { ContactTextStage } from '../Experience/World/ContactTextStage'

// Phase 8 slice 8: the Contact pixel-title layer lifecycle (lazy creation +
// disposal) moved from World to Experience. The methods are self-contained
// (they only touch the stage reference, the request guard, the scene + World
// adapter and the camera), so the test drives them on an Experience instance
// created without its heavy constructor (renderer capability detection, UI
// construction) and asserts through the public World getter.

// The ContactTextStage ctor builds a PixelTextScreen, which renders the
// section title through the 2D canvas API — the mock covers every call it
// makes (renderText runs synchronously in the ctor).
const canvasContext = {
  fillStyle: '',
  globalAlpha: 1,
  textAlign: '',
  textBaseline: '',
  font: '',
  imageSmoothingEnabled: false,
  clearRect: vi.fn(),
  fillRect: vi.fn(),
  fillText: vi.fn(),
  drawImage: vi.fn(),
  measureText: () => ({ width: 100 }),
}

describe('Experience contact text stage lifecycle', () => {
  let exp: Experience
  let world: World
  let getContext: ReturnType<typeof vi.spyOn>

  /** Minimal state the lifecycle methods touch (constructor bypassed). */
  function makeExperience(scene: THREE.Scene, worldRef: World): Experience {
    return Object.assign(Object.create(Experience.prototype), {
      scene,
      world: worldRef,
      camera: { instance: new THREE.PerspectiveCamera() },
      _contactTextStagePromise: null,
      _contactTextStageRequest: 0,
      _contactCyprusStagePromise: null,
      _contactCyprusStageRequest: 0,
      _contactCyprusActive: false,
      _contactTextIsLight: false,
    } as unknown as Partial<Experience>) as Experience
  }

  beforeEach(() => {
    document.body.dataset.page = 'contact'
    getContext = vi
      .spyOn(HTMLCanvasElement.prototype, 'getContext')
      .mockReturnValue(canvasContext as unknown as CanvasRenderingContext2D)
    // jsdom has no FontFaceSet — the pixel screen awaits a webfont load.
    Object.defineProperty(document, 'fonts', {
      value: { load: () => Promise.resolve() },
      configurable: true,
    })
    world = new World(new THREE.Scene())
    exp = makeExperience(new THREE.Scene(), world)
  })

  afterEach(() => {
    world.dispose()
    getContext.mockRestore()
    delete (document as { fonts?: unknown }).fonts
    delete document.body.dataset.page
  })

  it('releases a Contact text stage that finishes after the route was disposed', async () => {
    const disposeSpy = vi.spyOn(ContactTextStage.prototype, 'dispose')

    try {
      const pending = exp.ensureContactTextStageInitialized()
      expect(world.contactTextStage).toBeInstanceOf(ContactTextStage)

      exp.disposeContactTextStage()
      await pending

      // The first dispose detaches the World adapter immediately; the second
      // catches resources created by the in-flight init before it settled.
      expect(world.contactTextStage).toBeNull()
      expect(disposeSpy).toHaveBeenCalledTimes(2)
    } finally {
      disposeSpy.mockRestore()
    }
  })

  it('forwards the active /contact stage into the World frame path via the adapter', async () => {
    const disposeSpy = vi.spyOn(ContactTextStage.prototype, 'dispose')

    try {
      const pending = exp.ensureContactTextStageInitialized()
      await pending
      const stage = world.contactTextStage
      expect(stage).toBeInstanceOf(ContactTextStage)

      // Leaving /contact disposes the owner and detaches the adapter.
      document.body.dataset.page = 'home'
      exp.disposeContactTextStage()
      expect(world.contactTextStage).toBeNull()
      expect(disposeSpy).toHaveBeenCalledTimes(1)
      expect(stage?.parent).toBeNull()
    } finally {
      disposeSpy.mockRestore()
    }
  })
})
