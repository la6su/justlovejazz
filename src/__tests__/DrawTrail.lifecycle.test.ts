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
})
