import { describe, expect, it, vi } from 'vitest'
import { adoptResource } from '../core/overlayOwnership'

describe('adoptResource', () => {
  it('adopts a shared resource without taking ownership', () => {
    const shared = {}
    const create = vi.fn(() => ({}))
    expect(adoptResource(shared, create)).toEqual({ value: shared, owned: false })
    expect(create).not.toHaveBeenCalled()
  })

  it('creates and owns a resource when no shared instance exists', () => {
    const created = {}
    const create = vi.fn(() => created)
    expect(adoptResource(null, create)).toEqual({ value: created, owned: true })
    expect(create).toHaveBeenCalledTimes(1)
  })
})
