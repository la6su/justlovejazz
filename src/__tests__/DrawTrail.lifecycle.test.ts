import { describe, expect, it } from 'vitest'
import { DrawTrail } from '../Experience/World/DrawTrail'

describe('DrawTrail lifecycle', () => {
  it('clears the disposed ribbon from its owner group', () => {
    const trail = new DrawTrail()
    expect(trail.object.children).toHaveLength(1)

    trail.dispose()

    expect(trail.object.children).toHaveLength(0)
    expect(() => trail.dispose()).not.toThrow()
  })
})
