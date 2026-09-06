import { describe, expect, it } from 'vitest'
import { WorksInstallation } from '../Experience/World/WorksInstallation'

describe('WorksInstallation project direction', () => {
  it('switches the authored assembly for the selected project', () => {
    const installation = new WorksInstallation()
    installation.setProject(0)
    const rings = installation.children[0]
    const ticks = rings?.children[4]
    expect(ticks?.visible).toBe(true)

    installation.setProject(1)
    expect(ticks?.visible).toBe(false)
    expect((rings?.children[3] as { scale: { x: number } }).scale.x).toBe(1)

    installation.setProject(2)
    expect((rings?.children[3] as { scale: { x: number } }).scale.x).toBeCloseTo(1.16)
    installation.dispose()
    expect(installation.children).toHaveLength(0)
  })
})
