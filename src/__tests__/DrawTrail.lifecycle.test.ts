import { describe, expect, it, vi } from 'vitest'
import { DrawTrail } from '../Experience/World/DrawTrail'
import * as THREE from 'three'

describe('DrawTrail lifecycle', () => {
  it('clears the disposed ribbon from its owner group', () => {
    const trail = new DrawTrail()
    expect(trail.object.children).toHaveLength(1)

    trail.dispose()

    expect(trail.object.children).toHaveLength(0)
    expect(() => trail.dispose()).not.toThrow()
  })

  it('reuses camera basis scratch vectors across ribbon rebuilds', () => {
    const trail = new DrawTrail()
    const camera = new THREE.PerspectiveCamera()
    const internals = trail as unknown as {
      _cameraRight: THREE.Vector3
      _cameraUp: THREE.Vector3
      _cameraForward: THREE.Vector3
    }
    const right = internals._cameraRight
    const up = internals._cameraUp
    const forward = internals._cameraForward

    trail.update(1 / 60, camera)
    trail.update(1 / 60, camera)

    expect(internals._cameraRight).toBe(right)
    expect(internals._cameraUp).toBe(up)
    expect(internals._cameraForward).toBe(forward)
    trail.dispose()
  })

  it('rebuilds only for pointer or camera-basis changes while uniforms keep ticking', () => {
    const trail = new DrawTrail()
    const camera = new THREE.PerspectiveCamera()
    const internals = trail as unknown as {
      _rebuildRibbon: (value: THREE.Camera) => void
      _uniforms: { uTime: { value: number }; uEnergy: { value: number } }
    }
    const rebuild = vi.spyOn(internals, '_rebuildRibbon')

    trail.update(1 / 60, camera)
    rebuild.mockClear()
    const timeBefore = internals._uniforms.uTime.value
    trail.update(1 / 60, camera)

    expect(rebuild).not.toHaveBeenCalled()
    expect(internals._uniforms.uTime.value).toBeGreaterThan(timeBefore)

    camera.rotation.y = 0.1
    camera.updateMatrixWorld()
    trail.update(1 / 60, camera)
    expect(rebuild).toHaveBeenCalledOnce()

    trail.dispose()
  })

  it('keeps TSL uniform state isolated between trail owners', () => {
    const first = new DrawTrail()
    const second = new DrawTrail()
    const firstUniforms = (first as unknown as { _uniforms: { uEnergy: { value: number } } })
      ._uniforms
    const secondUniforms = (second as unknown as { _uniforms: { uEnergy: { value: number } } })
      ._uniforms

    firstUniforms.uEnergy.value = 0.37

    expect(firstUniforms).not.toBe(secondUniforms)
    expect(secondUniforms.uEnergy.value).not.toBe(0.37)

    first.dispose()
    second.dispose()
  })

  it('settles energy and motion uniforms when reduced motion is enabled', () => {
    const trail = new DrawTrail()
    const internals = trail as unknown as {
      _energy: number
      _velocity: number
      _uniforms: { uEnergy: { value: number }; uVelocity: { value: number } }
    }
    internals._energy = 1
    internals._velocity = 0.4
    internals._uniforms.uEnergy.value = 1
    internals._uniforms.uVelocity.value = 0.4

    trail.setReducedMotion(true)

    expect(trail.isAnimating).toBe(false)
    expect(internals._energy).toBe(0)
    expect(internals._velocity).toBe(0)
    expect(internals._uniforms.uEnergy.value).toBe(0)
    expect(internals._uniforms.uVelocity.value).toBe(0)
    trail.dispose()
  })
})
