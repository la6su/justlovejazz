import { describe, expect, it } from 'vitest'
import { Section, SectionState } from '../core/Section'
import { StateBus } from '../core/StateBus'
import { getWorldConfigForPage } from '../core/WorldConfig'

describe('Section lifecycle', () => {
  it('ignores late state transitions after channel teardown', () => {
    StateBus.instance = null
    const section = new Section(getWorldConfigForPage('home')[1]!, 1)
    const stateChannel = `section:${section.phaseConfig.id}:state`
    const opacityChannel = `section:${section.phaseConfig.id}:opacity`

    section.dispose()
    section.dispose()
    section.switchState(SectionState.VIEWING)
    section.fadeIn()
    section.forceState(SectionState.PASSED, true)

    const bus = StateBus.getInstance()
    expect(section.state).toBe(SectionState.READY)
    expect(bus.hasChannel(stateChannel)).toBe(false)
    expect(bus.hasChannel(opacityChannel)).toBe(false)
  })
})
