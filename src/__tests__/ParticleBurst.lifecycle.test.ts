import { describe, expect, it, vi } from 'vitest'
import { ParticleBurst } from '../Experience/World/ParticleBurst'

describe('ParticleBurst lifecycle', () => {
  it('becomes terminal after disposal and ignores late triggers', () => {
    const burst = new ParticleBurst()
    burst.trigger(1, 2, 3)
    expect(burst.isActive).toBe(true)

    const geometryDispose = vi.spyOn(burst.geometry, 'dispose')
    const materialDispose = vi.spyOn((burst.material as { dispose: () => void }), 'dispose')
    burst.dispose()
    burst.dispose()
    burst.trigger()

    expect(geometryDispose).toHaveBeenCalledOnce()
    expect(materialDispose).toHaveBeenCalledOnce()
    expect(burst.isActive).toBe(false)
    expect(burst.update(1 / 60)).toBe(false)
  })
})
