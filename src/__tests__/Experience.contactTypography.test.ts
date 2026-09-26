import * as THREE from 'three'
import { describe, expect, it, vi } from 'vitest'
import { ContactCyprusStage } from '../Experience/World/ContactCyprusStage'
import { ContactTypographyStage } from '../Experience/World/ContactTypographyStage'
import { seedExperience } from './experienceSeed'

describe('Experience contact typography lazy owner', () => {
  it('contains initialization failure and permits a later retry', async () => {
    const { exp, slots } = seedExperience({
      scene: new THREE.Scene(),
      _contactIsLight: false,
      currentPage: () => 'contact',
    })
    const setActiveSpy = vi
      .spyOn(ContactTypographyStage.prototype, 'setActive')
      .mockImplementationOnce(() => {
        throw new Error('fixture init failure')
      })
    const disposeSpy = vi.spyOn(ContactTypographyStage.prototype, 'dispose')

    try {
      await expect(exp.ensureContactTypographyStageInitialized()).resolves.toBeUndefined()
      expect(slots.contactTypography.getStage()).toBeNull()
      expect(slots.contactTypography.owner.getPromise()).toBeNull()
      expect(disposeSpy).toHaveBeenCalledTimes(1)

      await exp.ensureContactTypographyStageInitialized()
      expect(slots.contactTypography.getStage()).toBeInstanceOf(ContactTypographyStage)
      expect(setActiveSpy).toHaveBeenCalledTimes(2)
    } finally {
      setActiveSpy.mockRestore()
      disposeSpy.mockRestore()
    }
  })

  it('creates the stage on demand and disposes it from the scene', async () => {
    const scene = new THREE.Scene()
    const { exp, slots } = seedExperience({
      scene,
      _contactIsLight: false,
    })
    const disposeSpy = vi.spyOn(ContactTypographyStage.prototype, 'dispose')

    try {
      await exp.ensureContactTypographyStageInitialized()
      const stage = slots.contactTypography.getStage() as ContactTypographyStage
      expect(stage).toBeInstanceOf(ContactTypographyStage)
      expect(stage.parent).toBe(scene)

      exp.disposeContactTypographyStage()
      expect(stage.parent).toBeNull()
      expect(disposeSpy).toHaveBeenCalledTimes(1)
    } finally {
      disposeSpy.mockRestore()
    }
  })
})

describe('Experience contact Cyprus lazy owner', () => {
  it('prewarms exactly once inside the guarded lazy owner', async () => {
    const { exp } = seedExperience({
      scene: new THREE.Scene(),
      _contactCyprusActive: false,
      currentPage: () => 'contact',
      camera: { instance: new THREE.PerspectiveCamera() },
    })
    const loadSpy = vi.spyOn(ContactCyprusStage.prototype, 'load').mockResolvedValue(undefined)
    const prewarmSpy = vi.spyOn(ContactCyprusStage.prototype, 'prewarm')

    try {
      await exp.ensureContactCyprusStageInitialized()
      expect(prewarmSpy).toHaveBeenCalledTimes(1)
    } finally {
      exp.disposeContactCyprusStage()
      loadSpy.mockRestore()
      prewarmSpy.mockRestore()
    }
  })

  it('does not let a stale section callback activate a newer stage', async () => {
    const syncRouteVisuals = vi.fn()
    const { exp, slots } = seedExperience({
      scene: new THREE.Scene(),
      _contactCyprusActive: false,
      currentPage: () => 'contact',
      camera: { instance: new THREE.PerspectiveCamera() },
      coordinator: { syncRouteVisuals },
    })
    let oldResolve!: () => void
    let newResolve!: () => void
    let loadCount = 0
    const loadSpy = vi.spyOn(ContactCyprusStage.prototype, 'load').mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          if (loadCount++ === 0) oldResolve = resolve
          else newResolve = resolve
        }),
    )
    const setActiveSpy = vi.spyOn(ContactCyprusStage.prototype, 'setActive')

    try {
      exp.setContactCyprusStageSection(2)
      await vi.dynamicImportSettled()
      exp.disposeContactCyprusStage()

      exp.setContactCyprusStageSection(2)
      await vi.dynamicImportSettled()
      setActiveSpy.mockClear()
      syncRouteVisuals.mockClear()

      oldResolve()
      await Promise.resolve()
      await Promise.resolve()
      expect(setActiveSpy).not.toHaveBeenCalled()
      expect(syncRouteVisuals).not.toHaveBeenCalled()

      newResolve()
      await slots.contactCyprus.owner.getPromise()
      await Promise.resolve()
      await Promise.resolve()
      expect(setActiveSpy).toHaveBeenCalledTimes(1)
      expect(syncRouteVisuals).toHaveBeenCalledTimes(1)
    } finally {
      exp.disposeContactCyprusStage()
      loadSpy.mockRestore()
      setActiveSpy.mockRestore()
    }
  })

  it('invalidates a pending load when the owner is disposed', async () => {
    const { exp, slots } = seedExperience({
      scene: new THREE.Scene(),
      _contactCyprusActive: false,
      currentPage: () => 'contact',
      camera: { instance: new THREE.PerspectiveCamera() },
    })
    let resolveLoad!: () => void
    const pending = new Promise<void>((resolve) => {
      resolveLoad = resolve
    })
    const loadSpy = vi.spyOn(ContactCyprusStage.prototype, 'load').mockReturnValue(pending)
    const disposeSpy = vi.spyOn(ContactCyprusStage.prototype, 'dispose')

    try {
      const loading = exp.ensureContactCyprusStageInitialized()
      await vi.dynamicImportSettled()
      expect(slots.contactCyprus.getStage()).not.toBeNull()
      exp.disposeContactCyprusStage()
      resolveLoad()
      await loading

      expect(slots.contactCyprus.getStage()).toBeNull()
      expect(slots.contactCyprus.owner.getPromise()).toBeNull()
      expect(disposeSpy).toHaveBeenCalled()
    } finally {
      loadSpy.mockRestore()
      disposeSpy.mockRestore()
    }
  })

  it('cleans up a failed load without creating an unhandled rejection', async () => {
    const { exp, slots } = seedExperience({
      scene: new THREE.Scene(),
      _contactCyprusActive: false,
      currentPage: () => 'contact',
      camera: { instance: new THREE.PerspectiveCamera() },
    })
    const loadSpy = vi
      .spyOn(ContactCyprusStage.prototype, 'load')
      .mockRejectedValue(new Error('fixture load failure'))
    const disposeSpy = vi.spyOn(ContactCyprusStage.prototype, 'dispose')

    try {
      await expect(exp.ensureContactCyprusStageInitialized()).resolves.toBeUndefined()
      expect(slots.contactCyprus.getStage()).toBeNull()
      expect(slots.contactCyprus.owner.getPromise()).toBeNull()
      expect(disposeSpy).toHaveBeenCalledTimes(1)
    } finally {
      loadSpy.mockRestore()
      disposeSpy.mockRestore()
    }
  })
})
