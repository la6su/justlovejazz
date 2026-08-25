import { afterEach, describe, expect, it, vi } from 'vitest'

const { update } = vi.hoisted(() => ({ update: vi.fn() }))

vi.mock('uikit', () => ({
  default: { update },
}))

import { UIMenu } from '../UI/UIMenu'

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

    expect(update).toHaveBeenCalledOnce()
    expect(update).toHaveBeenCalledWith(menu.navEl)
    expect(menu.navEl.isConnected).toBe(true)

    menu.dispose()
    expect(menu.navEl.isConnected).toBe(false)
  })
})
