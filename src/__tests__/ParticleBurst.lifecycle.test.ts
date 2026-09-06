import { afterEach, describe, expect, it, vi } from 'vitest'
import { ParticleBurst } from '../Experience/World/ParticleBurst'

describe('ParticleBurst lifecycle', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('becomes terminal after disposal and ignores late triggers', () => {
    const burst = new ParticleBurst()
    burst.trigger(1, 2, 3)
    expect(burst.isActive).toBe(true)

    const geometryDispose = vi.spyOn(burst.geometry, 'dispose')
    const materialDispose = vi.spyOn(burst.material as { dispose: () => void }, 'dispose')
    burst.dispose()
    burst.dispose()
    burst.trigger()

    expect(geometryDispose).toHaveBeenCalledOnce()
    expect(materialDispose).toHaveBeenCalledOnce()
    expect(burst.isActive).toBe(false)
    expect(burst.update(1 / 60)).toBe(false)
  })

  it('keeps TSL trace uniforms isolated between burst owners', () => {
    const first = new ParticleBurst()
    const second = new ParticleBurst()
    const firstUniforms = (first as unknown as { _uniforms: { uTime: { value: number } } })
      ._uniforms
    const secondUniforms = (second as unknown as { _uniforms: { uTime: { value: number } } })
      ._uniforms

    first.trigger()
    first.update(0.2)

    expect(firstUniforms).not.toBe(secondUniforms)
    expect(firstUniforms.uTime.value).toBeGreaterThan(0)
    expect(secondUniforms.uTime.value).toBe(0)

    first.dispose()
    second.dispose()
  })

  it('does not start or retain a burst under reduced motion', () => {
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: true }))
    const burst = new ParticleBurst()

    burst.trigger()
    expect(burst.isActive).toBe(false)
    expect(burst.visible).toBe(false)

    burst.setReducedMotion(false)
    burst.trigger()
    expect(burst.isActive).toBe(true)
    burst.setReducedMotion(true)
    expect(burst.isActive).toBe(false)
    expect(burst.visible).toBe(false)
    burst.dispose()
  })
})
