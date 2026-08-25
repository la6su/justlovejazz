import * as THREE from 'three'
import { describe, expect, it, vi } from 'vitest'
import { Experience } from '../Experience/Experience'
import { ContactCyprusStage } from '../Experience/World/ContactCyprusStage'
import { ContactTypographyStage } from '../Experience/World/ContactTypographyStage'

describe('Experience contact typography lazy owner', () => {
  it('contains initialization failure and permits a later retry', async () => {
    const scene = new THREE.Scene()
    const exp = Object.assign(Object.create(Experience.prototype), {
      scene,
      contactTypographyStage: null,
      _contactTypographyStagePromise: null,
      _contactTypographyStageRequest: 0,
      _contactIsLight: false,
      currentPage: () => 'contact',
    } as unknown as Partial<Experience>) as Experience
    const setActiveSpy = vi
      .spyOn(ContactTypographyStage.prototype, 'setActive')
      .mockImplementationOnce(() => {
        throw new Error('fixture init failure')
      })
    const disposeSpy = vi.spyOn(ContactTypographyStage.prototype, 'dispose')

    try {
      await expect(exp.ensureContactTypographyStageInitialized()).resolves.toBeUndefined()
      expect(
        (exp as unknown as { contactTypographyStage: ContactTypographyStage | null })
          .contactTypographyStage,
      ).toBeNull()
      expect(
        (exp as unknown as { _contactTypographyStagePromise: Promise<void> | null })
          ._contactTypographyStagePromise,
      ).toBeNull()
      expect(disposeSpy).toHaveBeenCalledTimes(1)

      await exp.ensureContactTypographyStageInitialized()
      expect(
        (exp as unknown as { contactTypographyStage: ContactTypographyStage | null })
          .contactTypographyStage,
      ).toBeInstanceOf(ContactTypographyStage)
      expect(setActiveSpy).toHaveBeenCalledTimes(2)
    } finally {
      setActiveSpy.mockRestore()
      disposeSpy.mockRestore()
    }
  })

  it('creates the stage on demand and disposes it from the scene', async () => {
    const scene = new THREE.Scene()
    const exp = Object.assign(Object.create(Experience.prototype), {
      scene,
      contactTypographyStage: null,
      _contactTypographyStagePromise: null,
      _contactTypographyStageRequest: 0,
      _contactIsLight: false,
    } as unknown as Partial<Experience>) as Experience
    const disposeSpy = vi.spyOn(ContactTypographyStage.prototype, 'dispose')

    try {
      await exp.ensureContactTypographyStageInitialized()
      const stage = (exp as unknown as { contactTypographyStage: ContactTypographyStage })
        .contactTypographyStage
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
    const scene = new THREE.Scene()
    const exp = Object.assign(Object.create(Experience.prototype), {
      scene,
      contactCyprusStage: null,
      _contactCyprusStagePromise: null,
      _contactCyprusStageRequest: 0,
      _contactCyprusActive: false,
      currentPage: () => 'contact',
      camera: { instance: new THREE.PerspectiveCamera() },
    } as unknown as Partial<Experience>) as Experience
    const loadSpy = vi
      .spyOn(ContactCyprusStage.prototype, 'load')
      .mockResolvedValue(undefined)
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

  it('invalidates a pending load when the owner is disposed', async () => {
    const scene = new THREE.Scene()
    const exp = Object.assign(Object.create(Experience.prototype), {
      scene,
      contactCyprusStage: null,
      _contactCyprusStagePromise: null,
      _contactCyprusStageRequest: 0,
      _contactCyprusActive: false,
      currentPage: () => 'contact',
      camera: { instance: new THREE.PerspectiveCamera() },
    } as unknown as Partial<Experience>) as Experience
    let resolveLoad!: () => void
    const pending = new Promise<void>((resolve) => {
      resolveLoad = resolve
    })
    const loadSpy = vi.spyOn(ContactCyprusStage.prototype, 'load').mockReturnValue(pending)
    const disposeSpy = vi.spyOn(ContactCyprusStage.prototype, 'dispose')

    try {
      const loading = exp.ensureContactCyprusStageInitialized()
      await vi.dynamicImportSettled()
      expect(
        (exp as unknown as { contactCyprusStage: ContactCyprusStage | null }).contactCyprusStage,
      ).not.toBeNull()
      exp.disposeContactCyprusStage()
      resolveLoad()
      await loading

      expect(
        (exp as unknown as { contactCyprusStage: ContactCyprusStage | null }).contactCyprusStage,
      ).toBeNull()
      expect(
        (exp as unknown as { _contactCyprusStagePromise: Promise<void> | null })
          ._contactCyprusStagePromise,
      ).toBeNull()
      expect(disposeSpy).toHaveBeenCalled()
    } finally {
      loadSpy.mockRestore()
      disposeSpy.mockRestore()
    }
  })

  it('cleans up a failed load without creating an unhandled rejection', async () => {
    const scene = new THREE.Scene()
    const exp = Object.assign(Object.create(Experience.prototype), {
      scene,
      contactCyprusStage: null,
      _contactCyprusStagePromise: null,
      _contactCyprusStageRequest: 0,
      _contactCyprusActive: false,
      currentPage: () => 'contact',
      camera: { instance: new THREE.PerspectiveCamera() },
    } as unknown as Partial<Experience>) as Experience
    const loadSpy = vi
      .spyOn(ContactCyprusStage.prototype, 'load')
      .mockRejectedValue(new Error('fixture load failure'))
    const disposeSpy = vi.spyOn(ContactCyprusStage.prototype, 'dispose')

    try {
      await expect(exp.ensureContactCyprusStageInitialized()).resolves.toBeUndefined()
      expect(
        (exp as unknown as { contactCyprusStage: ContactCyprusStage | null }).contactCyprusStage,
      ).toBeNull()
      expect(
        (exp as unknown as { _contactCyprusStagePromise: Promise<void> | null })
          ._contactCyprusStagePromise,
      ).toBeNull()
      expect(disposeSpy).toHaveBeenCalledTimes(1)
    } finally {
      loadSpy.mockRestore()
      disposeSpy.mockRestore()
    }
  })
})
