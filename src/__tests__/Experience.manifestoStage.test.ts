import * as THREE from 'three'
import { describe, expect, it, vi } from 'vitest'

const manifestoModule = vi.hoisted(() => {
  let resolve!: (value: unknown) => void
  const promise = new Promise<unknown>((done) => {
    resolve = done
  })

  return { resolve, promise }
})

vi.mock('../Experience/World/ManifestoInkStage', () => manifestoModule.promise)

import { Experience } from '../Experience/Experience'

class DeferredManifestoInkStage extends THREE.Group {
  static constructed = vi.fn()
  readonly dispose = vi.fn()
  readonly setTheme = vi.fn()
  readonly setReducedMotion = vi.fn()
  readonly setActive = vi.fn()

  constructor() {
    super()
    DeferredManifestoInkStage.constructed()
  }
}

function makeDestroyableExperience(scene: THREE.Scene): Experience {
  return Object.assign(Object.create(Experience.prototype), {
    _destroyed: false,
    _lifecycleGeneration: 0,
    _scheduler: { destroy: vi.fn() },
    _mouseTrailRafId: null,
    _mouseTrailRafPending: false,
    _onMouseMoveForTrail: null,
    _readinessGate: null,
    _worksPlaneStageRequest: 0,
    _contactTypographyStageRequest: 0,
    _contactCyprusStageRequest: 0,
    _contactHaloStageRequest: 0,
    _manifestoInkStageRequest: 0,
    _labGamepadRequest: 0,
    manifestoInkStage: null,
    _manifestoInkStagePromise: null,
    features: { destroy: vi.fn() },
    renderer: { dispose: vi.fn() },
    camera: { destroy: vi.fn() },
    sizes: { destroy: vi.fn() },
    sfx: { dispose: vi.fn() },
    scene,
    _host: {
      unmountManifestoInkStage: vi.fn(async (stage: THREE.Object3D) => {
        stage.removeFromParent()
      }),
    },
  }) as Experience
}

describe('Experience Manifesto ink lazy owner', () => {
  it('retires a pending import during root teardown before it can construct or attach', async () => {
    const scene = new THREE.Scene()
    const experience = makeDestroyableExperience(scene)

    const pending = experience.ensureManifestoInkStageInitialized()
    experience.destroy()
    manifestoModule.resolve({ ManifestoInkStage: DeferredManifestoInkStage })
    await pending

    expect(DeferredManifestoInkStage.constructed).not.toHaveBeenCalled()
    expect(scene.children).toHaveLength(0)
    expect(
      (experience as unknown as { manifestoInkStage: THREE.Group | null }).manifestoInkStage,
    ).toBeNull()
    expect(
      (experience as unknown as { _manifestoInkStagePromise: Promise<void> | null })
        ._manifestoInkStagePromise,
    ).toBeNull()
  })

  it('disposes a live ink stage during root teardown', () => {
    const scene = new THREE.Scene()
    const stage = new DeferredManifestoInkStage()
    scene.add(stage)
    const experience = makeDestroyableExperience(scene)
    ;(experience as unknown as { manifestoInkStage: typeof stage }).manifestoInkStage = stage

    experience.destroy()

    expect(stage.dispose).toHaveBeenCalledOnce()
    expect(stage.parent).toBeNull()
  })
})
