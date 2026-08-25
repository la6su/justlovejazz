import * as THREE from 'three'
import { describe, expect, it, vi } from 'vitest'
import { Experience } from '../Experience/Experience'
import { ContactTypographyStage } from '../Experience/World/ContactTypographyStage'

describe('Experience contact typography lazy owner', () => {
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
