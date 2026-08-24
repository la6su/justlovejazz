import * as THREE from 'three'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Experience } from '../Experience/Experience'
import { SceneCoordinator, type SceneCoordinatorOwners } from '../Experience/SceneCoordinator'
import { ContactTextStage } from '../Experience/World/ContactTextStage'
import type { PageId } from '../sections/_shared/constants'

// Phase 8 slice 8: the Contact pixel-title layer lifecycle (lazy creation +
// disposal) moved from World to Experience. Phase 8 slice 10: the `World`
// class leaves production — the stage is read through the SceneCoordinator's
// `contactTextStage` owner getter (Experience owns the field). The methods are
// self-contained (they only touch the stage reference, the request guard, the
// scene + camera), so the test drives them on an Experience instance created
// without its heavy constructor (renderer capability detection, UI
// construction).

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
  let coordinator: SceneCoordinator
  let getContext: ReturnType<typeof vi.spyOn>

  /** Minimal state the lifecycle methods touch (constructor bypassed). */
  function makeExperience(scene: THREE.Scene): Experience {
    const exp = Object.assign(Object.create(Experience.prototype), {
      scene,
      contactTextStage: null,
      camera: { instance: new THREE.PerspectiveCamera() },
      _contactTextStagePromise: null,
      _contactTextStageRequest: 0,
      _contactCyprusStagePromise: null,
      _contactCyprusStageRequest: 0,
      _contactCyprusActive: false,
      _contactTextIsLight: false,
    } as unknown as Partial<Experience>) as Experience
    // The coordinator reads the stage through an owner getter over Experience's
    // own field (the lazy stage changes identity per route). Production wires
    // this from within the constructor (the `this` closure); the test reads the
    // same live field through a cast bag.
    const bag = exp as unknown as { contactTextStage?: ContactTextStage | null }
    const owners: SceneCoordinatorOwners = {
      ground: () => null,
      sectionGroups: () => null,
      envSphere: () => null,
      baku: () => null,
      particleBurst: () => null,
      drawTrail: () => null,
      carousel: () => null,
      worksPlaneStage: () => null,
      contactTextStage: () => bag.contactTextStage ?? null,
      contactCyprusStage: () => null,
      labGamepad: () => null,
    }
    coordinator = new SceneCoordinator(
      scene,
      owners,
      () => (document.body.dataset.page ?? 'home') as PageId,
    )
    exp.coordinator = coordinator
    return exp
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
    exp = makeExperience(new THREE.Scene())
  })

  afterEach(() => {
    getContext.mockRestore()
    delete (document as { fonts?: unknown }).fonts
    delete document.body.dataset.page
  })

  it('releases a Contact text stage that finishes after the route was disposed', async () => {
    const disposeSpy = vi.spyOn(ContactTextStage.prototype, 'dispose')

    try {
      const pending = exp.ensureContactTextStageInitialized()
      expect(coordinator.contactTextStage).toBeInstanceOf(ContactTextStage)

      exp.disposeContactTextStage()
      await pending

      // The first dispose clears the field immediately; the second
      // catches resources created by the in-flight init before it settled.
      expect(coordinator.contactTextStage).toBeNull()
      expect(disposeSpy).toHaveBeenCalledTimes(2)
    } finally {
      disposeSpy.mockRestore()
    }
  })

  it('forwards the active /contact stage into the coordinator frame path via the owner getter', async () => {
    const disposeSpy = vi.spyOn(ContactTextStage.prototype, 'dispose')

    try {
      const pending = exp.ensureContactTextStageInitialized()
      await pending
      const stage = coordinator.contactTextStage
      expect(stage).toBeInstanceOf(ContactTextStage)

      // Leaving /contact disposes the owner and clears the field.
      document.body.dataset.page = 'home'
      exp.disposeContactTextStage()
      expect(coordinator.contactTextStage).toBeNull()
      expect(disposeSpy).toHaveBeenCalledTimes(1)
      expect(stage?.parent).toBeNull()
    } finally {
      disposeSpy.mockRestore()
    }
  })
})
