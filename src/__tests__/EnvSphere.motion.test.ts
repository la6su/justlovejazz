import { afterEach, describe, expect, it, vi } from 'vitest'
import * as THREE from 'three'
import { EnvSphere } from '../Experience/World/EnvSphere'

describe('EnvSphere reduced-motion transitions', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('snaps the palette instead of leaving an intermediate color', () => {
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: true }))
    const sphere = new EnvSphere()
    const back = (sphere.children[1] as THREE.Mesh | undefined)?.material as THREE.MeshBasicMaterial

    sphere.changeSection(3, false)

    expect(back.color.getHex()).toBe(0x17120f)
    sphere.update(1)
    expect(back.color.getHex()).toBe(0x17120f)
    sphere.dispose()
  })

  it('keeps the authored color interpolation when motion is enabled', () => {
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: false }))
    const sphere = new EnvSphere()
    const back = (sphere.children[1] as THREE.Mesh | undefined)?.material as THREE.MeshBasicMaterial
    const initial = back.color.getHex()

    sphere.changeSection(3, false)

    expect(back.color.getHex()).toBe(initial)
    sphere.update(0.25)
    expect(back.color.getHex()).not.toBe(initial)
    sphere.dispose()
  })
})
