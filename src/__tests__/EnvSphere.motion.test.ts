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
    expect(sphere.parent).toBeNull()
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
    expect(sphere.parent).toBeNull()
  })

  it('settles an active crossfade synchronously when motion is reduced', () => {
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: false }))
    const sphere = new EnvSphere()
    const back = (sphere.children[1] as THREE.Mesh | undefined)?.material as THREE.MeshBasicMaterial

    sphere.changeSection(3, false)
    sphere.update(0.1)
    const intermediate = back.color.getHex()

    sphere.setReducedMotion(true)

    expect(back.color.getHex()).toBe(0x17120f)
    expect(back.color.getHex()).not.toBe(intermediate)
    sphere.dispose()
    expect(sphere.parent).toBeNull()
  })

  it('reuses section weight arrays across transitions', () => {
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: false }))
    const sphere = new EnvSphere()
    const state = sphere as unknown as { _sectionWeights: number[]; _targetWeights: number[] }
    const sectionWeights = state._sectionWeights
    const targetWeights = state._targetWeights

    sphere.changeSection(3, false)
    sphere.snapToSection(4, false)

    expect(state._sectionWeights).toBe(sectionWeights)
    expect(state._targetWeights).toBe(targetWeights)
    sphere.dispose()
  })

  it('ignores late palette and frame calls after terminal teardown', () => {
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: false }))
    const sphere = new EnvSphere()

    sphere.dispose()
    sphere.dispose()
    sphere.changeSection(3, true)
    sphere.snapToSection(4, false)
    sphere.setReducedMotion(true)
    sphere.update(1 / 60)

    expect(sphere.children).toHaveLength(0)
    expect(sphere.parent).toBeNull()
  })
})
