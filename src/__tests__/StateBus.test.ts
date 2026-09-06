import { beforeEach, describe, expect, it, vi } from 'vitest'
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

  it('removes owner-scoped section channels during disposal', () => {
    const config = getWorldConfigForPage('home')[1]!
    const section = new Section(config, 1)
    const bus = StateBus.getInstance()
    const stateChannel = `section:${config.id}:state`
    const opacityChannel = `section:${config.id}:opacity`

    expect(bus.hasChannel(stateChannel)).toBe(true)
    expect(bus.hasChannel(opacityChannel)).toBe(true)
    section.dispose()

    expect(bus.hasChannel(stateChannel)).toBe(false)
    expect(bus.hasChannel(opacityChannel)).toBe(false)
  })

  it('drops an empty listener bucket after the last unsubscribe', () => {
    const bus = StateBus.getInstance()
    const listener = () => undefined
    bus.on('done:temporary', listener)
    bus.off('done:temporary', listener)

    let calls = 0
    bus.emit('done:temporary', () => calls++)
    expect(calls).toBe(0)
  })

  it('skips unchanged channel writes without changing channel semantics', () => {
    const bus = StateBus.getInstance()
    bus.channel('opacity', 0)
    const mapSet = vi.spyOn(Map.prototype, 'set')
    try {
      mapSet.mockClear()

      expect(bus.set('opacity', 0)).toBe(bus)
      expect(mapSet).not.toHaveBeenCalled()

      bus.set('opacity', Number.NaN)
      expect(mapSet).toHaveBeenCalledOnce()
      mapSet.mockClear()

      bus.set('opacity', Number.NaN)
      expect(mapSet).not.toHaveBeenCalled()
      expect(Number.isNaN(bus.get('opacity'))).toBe(true)

      bus.set('new-channel', 1)
      expect(mapSet).toHaveBeenCalledOnce()
      expect(bus.hasChannel('new-channel')).toBe(true)
    } finally {
      mapSet.mockRestore()
    }
  })
})
