import { beforeEach, describe, expect, it } from 'vitest'
import { Section, SectionState } from '../core/Section'
import { StateBus } from '../core/StateBus'
import { getWorldConfigForPage } from '../core/WorldConfig'

describe('StateBus completion contract', () => {
  beforeEach(() => {
    StateBus.instance = null
  })

  it('passes the completed channel as event data', () => {
    const bus = StateBus.getInstance()
    const received: [string, unknown][] = []
    bus.channel('state', 0).on('done:state', (eventName, data) => received.push([eventName, data]))

    bus.animate('state', 1, 0.1).tick(0.1)

    expect(received).toEqual([['done:state', 'state']])
  })

  it('updates a Section after its state animation completes', () => {
    const section = new Section(getWorldConfigForPage('home')[1]!, 1)
    section.switchState(SectionState.VIEWING, 0.1)
    StateBus.getInstance().tick(0.1)

    expect(section.state).toBe(SectionState.VIEWING)
    section.dispose()
  })
})
