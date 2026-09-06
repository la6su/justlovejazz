import * as THREE from 'three'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const motion = vi.hoisted(() => ({ reduced: false }))

vi.mock('../../core/motionPolicy', () => ({
  prefersReducedMotion: () => motion.reduced,
}))

// The halo reads the shared Input singleton; stub its mouse so pointer tests
// are deterministic in jsdom.
const mouseMock = vi.hoisted(() => ({ x: 0, y: 0 }))

vi.mock('../Experience/Input', () => ({
  input: {
    getMouse: () => mouseMock,
  },
}))

import { ContactHaloStage } from '../Experience/World/ContactHaloStage'

describe('ContactHaloStage lifecycle', () => {
  beforeEach(() => {
    motion.reduced = false
    mouseMock.x = 0
    mouseMock.y = 0
  })

  it('stays hidden and inert until activated', () => {
    const stage = new ContactHaloStage()
    expect(stage.visible).toBe(false)
    expect(stage.isAnimating).toBe(false)

    stage.update(1 / 60)
    expect(stage.isAnimating).toBe(false)
    stage.dispose()
  })

  it('reveals with a damp, reports ambient motion while active, and hides on deactivate', () => {
    const stage = new ContactHaloStage()
    stage.setActive(true)
    expect(stage.visible).toBe(true)

    stage.update(0.1)
    const reveal = (stage as unknown as { reveal: number }).reveal
    expect(reveal).toBeGreaterThan(0)
    expect(reveal).toBeLessThan(1)
    expect(stage.isAnimating).toBe(true)

    // Settle the reveal (exponential damp asymptote).
    for (let i = 0; i < 200; i++) stage.update(1 / 60)
    expect((stage as unknown as { reveal: number }).reveal).toBeGreaterThan(0.999)

    stage.setActive(false)
    expect(stage.visible).toBe(false)
    expect(stage.isAnimating).toBe(false)
    // The next visit starts from a clean transparent state.
    expect((stage as unknown as { reveal: number }).reveal).toBe(0)
    stage.dispose()
  })

  it('moves the ink focus toward the pointer and decays its energy at rest', () => {
    const stage = new ContactHaloStage()
    stage.setActive(true)

    mouseMock.x = 1
    mouseMock.y = 0.5
    stage.update(1 / 60)

    const pointer = (stage as unknown as { _pointerUni: { value: THREE.Vector2 } })._pointerUni
      .value
    expect(pointer.x).toBeGreaterThan(0)
    expect(pointer.y).toBeGreaterThan(0)

    const energy = () => (stage as unknown as { energy: number }).energy
    expect(energy()).toBeGreaterThan(0)

    // Pointer rests: energy must decay toward zero, not freeze.
    mouseMock.x = 1
    mouseMock.y = 0.5
    for (let i = 0; i < 120; i++) stage.update(1 / 60)
    expect(energy()).toBeLessThan(0.01)

    stage.dispose()
  })

  it('keeps uniforms settled under reduced motion and refuses new pointer energy', () => {
    const stage = new ContactHaloStage()
    stage.setActive(true)
    motion.reduced = true
    stage.setReducedMotion(true)

    const snapshot = () => {
      const s = stage as unknown as {
        energy: number
        reveal: number
        _timeUni: { value: number }
        _pointerUni: { value: THREE.Vector2 }
      }
      return {
        energy: s.energy,
        reveal: s.reveal,
        time: s._timeUni.value,
        pointer: `${s._pointerUni.value.x},${s._pointerUni.value.y}`,
      }
    }

    stage.update(1 / 60)
    const settled = snapshot()
    expect(settled.energy).toBe(0)
    expect(settled.time).toBe(0)
    expect(settled.pointer).toBe('0,0')

    mouseMock.x = 0.8
    mouseMock.y = -0.4
    stage.update(1 / 60)
    expect(snapshot()).toEqual(settled)
    expect(stage.isAnimating).toBe(false)

    stage.dispose()
  })

  it('matches the greeting ink on either theme and ignores late mutations', () => {
    const stage = new ContactHaloStage()
    stage.setTheme(true)
    const tint = (stage as unknown as { _tintUni: { value: THREE.Color } })._tintUni.value
    expect(tint.getHexString()).toBe('233329')

    stage.setTheme(false)
    expect(tint.getHexString()).toBe('dfffe9')

    stage.dispose()
    stage.setTheme(true)
    stage.setActive(true)
    stage.update(1 / 60)
    expect(stage.isAnimating).toBe(false)
  })

  it('disposes exactly once and leaves the shared geometry alive', () => {
    const stage = new ContactHaloStage()
    const mesh = stage.getObjectByName('contact-halo') as THREE.Mesh
    const material = mesh.material as THREE.Material
    const materialDispose = vi.spyOn(material, 'dispose')
    const geometryDispose = vi.spyOn(mesh.geometry, 'dispose')

    stage.dispose()
    stage.dispose()

    expect(materialDispose).toHaveBeenCalledTimes(1)
    expect(geometryDispose).not.toHaveBeenCalled()
  })
})
