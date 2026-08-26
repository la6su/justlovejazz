import { afterEach, describe, expect, it, vi } from 'vitest'
import * as THREE from 'three'
import { CinematicLights } from '../Experience/World/Lights'
import { getWorldConfigForPage } from '../core/WorldConfig'

type LightInternals = {
  keyLight: THREE.DirectionalLight
  fillLight: THREE.DirectionalLight
  rimLight: THREE.DirectionalLight
  volumetricLight: THREE.PointLight
  hemiLight: THREE.HemisphereLight
}

function internals(owner: CinematicLights): LightInternals {
  return owner as unknown as LightInternals
}

describe('CinematicLights reduced-motion transitions', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('snaps section targets immediately when reduced motion is enabled', () => {
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: true }))
    const lights = new CinematicLights(new THREE.Scene())
    const config = getWorldConfigForPage('home').find((entry) => entry.id === 'sec_works')!
    const state = internals(lights)

    lights.changeSection(config)

    expect(state.keyLight.color.getHex()).toBe(0x4466aa)
    expect(state.keyLight.intensity).toBe(1.8)
    expect(state.keyLight.position.toArray()).toEqual([0, 5, 5])
    expect(state.volumetricLight.intensity).toBe(1)
    lights.dispose()
  })

  it('settles an active interpolation when reduced motion changes at runtime', () => {
    const media = { matches: false }
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue(media))
    const lights = new CinematicLights(new THREE.Scene())
    const config = getWorldConfigForPage('home').find((entry) => entry.id === 'sec_works')!
    const state = internals(lights)

    lights.changeSection(config)
    lights.update(0.01)
    expect(state.keyLight.intensity).not.toBe(1.8)

    media.matches = true
    lights.setReducedMotion(true)
    expect(state.keyLight.intensity).toBe(1.8)
    expect(state.keyLight.position.toArray()).toEqual([0, 5, 5])
    lights.dispose()
  })

  it('preserves authored interpolation when reduced motion is disabled', () => {
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: false }))
    const lights = new CinematicLights(new THREE.Scene())
    const config = getWorldConfigForPage('home').find((entry) => entry.id === 'sec_works')!
    const state = internals(lights)
    const initial = state.keyLight.intensity

    lights.changeSection(config)
    lights.update(0.01)

    expect(state.keyLight.intensity).not.toBe(initial)
    expect(state.keyLight.intensity).not.toBe(1.8)
    lights.dispose()
  })

  it('ignores late section, preference and frame calls after teardown', () => {
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: false }))
    const scene = new THREE.Scene()
    const lights = new CinematicLights(scene)
    const config = getWorldConfigForPage('home').find((entry) => entry.id === 'sec_contact')!

    lights.dispose()
    lights.dispose()
    lights.changeSection(config)
    lights.setReducedMotion(true)
    lights.update(1 / 60)

    expect(scene.getObjectByName('cinematic-lights')).toBeUndefined()
  })
})
