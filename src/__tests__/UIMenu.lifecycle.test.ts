import { afterEach, describe, expect, it, vi } from 'vitest'

const { update } = vi.hoisted(() => ({ update: vi.fn() }))

vi.mock('uikit', () => ({
  default: { update },
}))

import { UIMenu } from '../UI/UIMenu'
import { eventBus } from '../core/EventBus'

type MenuInternals = {
  navEl: HTMLElement
  dispose: () => void
}

describe('UIMenu UIkit ownership', () => {
  afterEach(() => {
    update.mockClear()
    document.body.innerHTML = ''
  })

  it('hydrates only its persistent shell at construction', () => {
    const menu = new UIMenu() as unknown as MenuInternals

    expect(update).toHaveBeenCalledTimes(2)
    expect(update).toHaveBeenCalledWith(menu.navEl)
    expect(menu.navEl.isConnected).toBe(true)

    menu.dispose()
    expect(menu.navEl.isConnected).toBe(false)
  })

  it('rehydrates the sound icon after an external toggle', () => {
    const menu = new UIMenu() as unknown as MenuInternals
    const soundIcon = menu.navEl.querySelector<HTMLElement>('#jlz-sound-toggle [uk-icon]')!
    const initialUpdates = update.mock.calls.length

    eventBus.emit('jlz:sound-toggle', { muted: false })

    expect(soundIcon.getAttribute('uk-icon')).toBe('icon: sound')
    expect(update).toHaveBeenCalledTimes(initialUpdates + 1)
    expect(update).toHaveBeenLastCalledWith(soundIcon)
    menu.dispose()
  })
})
