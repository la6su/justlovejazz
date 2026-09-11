import { describe, expect, it } from 'vitest'
import { Section, SectionState } from '../core/Section'
import { StateBus } from '../core/StateBus'
import { getWorldConfigForPage } from '../core/WorldConfig'

describe('Section lifecycle', () => {
  it('ignores late state transitions after channel teardown', () => {
    StateBus.instance = null
    const section = new Section(getWorldConfigForPage('home')[1]!, 1)
    const stateChannel = `section:${section.phaseConfig.id}:state`

    section.dispose()
    section.dispose()
    section.switchState(SectionState.VIEWING)
    section.forceState(SectionState.PASSED)

    const bus = StateBus.getInstance()
    expect(section.state).toBe(SectionState.READY)
    expect(bus.hasChannel(stateChannel)).toBe(false)
  })
})
