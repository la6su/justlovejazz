import { describe, expect, it } from 'vitest'
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
})
