import * as THREE from 'three'
import { describe, expect, it, vi } from 'vitest'
import { Experience } from '../Experience/Experience'
import { Renderer } from '../Experience/Renderer'

/**
 * Pins the destroy() ownership boundary established by the Tres transition
 * (docs/TRES_FULL_TRANSITION.md): a runtime destroy disposes every
 * Experience-owned owner exactly once, while Vue-owned scene owners survive
 * because the persistent host's Vue unmount owns their terminal disposal.
 *
 * Follows the established Object.create seeding pattern from
 * Experience.lifecycle.test.ts — destroy() is exercised against real
 * prototype methods with hand-seeded owner fields.
 */
function createSeededExperience() {
  const spies = {
    scheduler: vi.fn(),
    contentReveal: vi.fn(),
    cursor: vi.fn(),
    showreelTheater: vi.fn(),
    features: vi.fn(),
    lights: vi.fn(),
    ground: vi.fn(),
    baku: vi.fn(),
    servicesStage: vi.fn(),
    envSphere: vi.fn(),
    particleBurst: vi.fn(),
    drawTrail: vi.fn(),
    labGamepad: vi.fn(),
    sectionGroups: vi.fn(),
    coordinator: vi.fn(),
    bus: vi.fn(),
    devPanel: vi.fn(),
    renderer: vi.fn(),
    camera: vi.fn(),
    sizes: vi.fn(),
    sfx: vi.fn(),
    environment: vi.fn(),
  }

  const servicesStage = Object.assign(new THREE.Group(), { dispose: spies.servicesStage })
  const envSphere = Object.assign(new THREE.Group(), { dispose: spies.envSphere })
  const particleBurst = Object.assign(new THREE.Group(), { dispose: spies.particleBurst })
  const labGamepad = Object.assign(new THREE.Group(), { dispose: spies.labGamepad })
  const scene = new THREE.Scene()
  scene.environment = { dispose: spies.environment } as unknown as THREE.Texture

  const experience = Object.assign(Object.create(Experience.prototype), {
    _destroyed: false,
    _lifecycleGeneration: 0,
    _readinessGate: null,
    _scheduler: { destroy: spies.scheduler },
    _mouseTrailRafPending: false,
    _mouseTrailRafId: null,
    _onMouseMoveForTrail: null,
    contentReveal: { destroy: spies.contentReveal },
    cursor: { destroy: spies.cursor },
    showreelTheater: { dispose: spies.showreelTheater },
    features: { destroy: spies.features },
    lights: { dispose: spies.lights },
    ground: { dispose: spies.ground },
    baku: { dispose: spies.baku },
    particleBurst,
    drawTrail: { object: new THREE.Group(), dispose: spies.drawTrail },
    servicesStage,
    envSphere,
    labGamepad,
    sectionGroups: { dispose: spies.sectionGroups },
    coordinator: { dispose: spies.coordinator },
    bus: { cancelAll: spies.bus },
    devPanel: { dispose: spies.devPanel },
    renderer: { dispose: spies.renderer },
    camera: { destroy: spies.camera },
    sizes: { destroy: spies.sizes },
    sfx: { dispose: spies.sfx },
    scene,
    _worksPlaneStageRequest: 0,
    _contactTypographyStageRequest: 0,
    _contactCyprusStageRequest: 0,
    _contactHaloStageRequest: 0,
    _manifestoInkStageRequest: 0,
    _labGamepadRequest: 0,
  }) as Experience

  return { experience, spies, servicesStage, envSphere, particleBurst, labGamepad, scene }
}

describe('Experience destroy ownership boundary', () => {
  it('disposes Experience-owned owners exactly once and leaves Vue-owned owners alive', () => {
    const { experience, spies, particleBurst, labGamepad, scene } = createSeededExperience()

    expect(() => experience.destroy()).not.toThrow()

    // Loop driver first, then every Experience-owned owner exactly once.
    expect(spies.scheduler).toHaveBeenCalledOnce()
    expect(spies.contentReveal).toHaveBeenCalledOnce()
    expect(spies.cursor).toHaveBeenCalledOnce()
    expect(spies.showreelTheater).toHaveBeenCalledOnce()
    expect(spies.features).toHaveBeenCalledOnce()
    expect(spies.lights).toHaveBeenCalledOnce()
    expect(spies.ground).toHaveBeenCalledOnce()
    expect(spies.baku).toHaveBeenCalledOnce()
    expect(spies.particleBurst).toHaveBeenCalledOnce()
    expect(spies.drawTrail).toHaveBeenCalledOnce()
    expect(spies.labGamepad).toHaveBeenCalledOnce()
    expect(spies.sectionGroups).toHaveBeenCalledOnce()
    expect(spies.coordinator).toHaveBeenCalledOnce()
    expect(spies.bus).toHaveBeenCalledOnce()
    expect(spies.devPanel).toHaveBeenCalledOnce()
    expect(spies.renderer).toHaveBeenCalledOnce()
    expect(spies.camera).toHaveBeenCalledOnce()
    expect(spies.sizes).toHaveBeenCalledOnce()
    expect(spies.sfx).toHaveBeenCalledOnce()

    // Detached from the Tres scene graph as part of disposal.
    expect(particleBurst.parent).toBeNull()
    expect(labGamepad.parent).toBeNull()

    // Vue-owned owners survive the runtime destroy: their terminal disposal
    // belongs to the persistent host's Vue unmount (ServicesStageOwner.vue /
    // EnvSphereOwner.vue). destroy() only drops the ServicesStage reference.
    expect(spies.servicesStage).not.toHaveBeenCalled()
    expect(spies.envSphere).not.toHaveBeenCalled()
    expect((experience as unknown as { servicesStage: unknown }).servicesStage).toBeNull()

    // The PMREM scene environment is released and its reference cleared.
    expect(spies.environment).toHaveBeenCalledOnce()
    expect(scene.environment).toBeNull()
  })

  it('is idempotent across repeated destroy calls', () => {
    const { experience, spies } = createSeededExperience()

    experience.destroy()
    expect(() => experience.destroy()).not.toThrow()

    expect(spies.renderer).toHaveBeenCalledOnce()
    expect(spies.scheduler).toHaveBeenCalledOnce()
    expect(spies.servicesStage).not.toHaveBeenCalled()
  })

  it('keeps Renderer.dispose exactly-once across repeated calls', () => {
    // Host-first order: the persistent host unmount disposes the unified
    // surface before a late runtime destroy reaches Renderer.dispose(). The
    // _disposed guard must keep the pipeline and instance disposal exactly-once.
    const pipelineDispose = vi.fn()
    const instanceDispose = vi.fn()
    const renderer = Object.assign(Object.create(Renderer.prototype), {
      _disposed: false,
      _lifecycleGeneration: 0,
      _loopCallback: null,
      _onInstanceReplaced: null,
      pipeline: { dispose: pipelineDispose },
      instance: { dispose: instanceDispose },
      _unsupportedOverlay: null,
    }) as Renderer

    renderer.dispose()
    renderer.dispose()

    expect(pipelineDispose).toHaveBeenCalledOnce()
    expect(instanceDispose).toHaveBeenCalledOnce()
  })
})
