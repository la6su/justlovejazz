import * as THREE from 'three'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const motion = vi.hoisted(() => ({ reduced: false }))

vi.mock('../core/motionPolicy', () => ({
  prefersReducedMotion: () => motion.reduced,
}))

import { CasePlane } from '../Experience/World/CasePlane'

describe('CasePlane reduced-motion policy', () => {
  beforeEach(() => {
    motion.reduced = false
  })

<<<<<<< HEAD
  it('settles wobble, motion and edge warp in one update', () => {
    const card = new CasePlane(new THREE.Texture())
    card.pulse(0.5)
    card.setMotion(0.8, 1)
    card.setEdgeWarp(0.6)
=======
  it('settles wobble in one update', () => {
    const card = new CasePlane(new THREE.Texture())
    card.pulse(0.5)
>>>>>>> main
    motion.reduced = true
    card.setReducedMotion(true)

    card.update(1 / 60, true)

    const state = card as unknown as {
      _wobbleValue: number
      _wobbleTarget: number
<<<<<<< HEAD
      _motionValue: number
      _motionTarget: number
      _edgeWarpValue: number
      _edgeWarpTarget: number
    }
    expect(state._wobbleValue).toBe(0)
    expect(state._wobbleTarget).toBe(0)
    expect(state._motionValue).toBe(0)
    expect(state._motionTarget).toBe(0)
    expect(state._edgeWarpValue).toBe(state._edgeWarpTarget)
=======
    }
    expect(state._wobbleValue).toBe(0)
    expect(state._wobbleTarget).toBe(0)
>>>>>>> main
    expect(card.isAnimating).toBe(false)

    card.dispose()
  })

  it('does not start a new pulse while reduced motion is active', () => {
    const card = new CasePlane(new THREE.Texture())
    motion.reduced = true
    card.setReducedMotion(true)

    card.pulse(0.5)

    const state = card as unknown as { _wobbleTarget: number }
    expect(state._wobbleTarget).toBe(0)
    expect(card.isAnimating).toBe(false)
    card.dispose()
  })
})
