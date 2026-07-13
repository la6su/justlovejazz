import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { themeManager, type ThemeMode } from '../core/ThemeManager'

// ThemeManager is a singleton created at module import time. It reads
// localStorage('jlz:theme') once on construction. We cannot re-import to
// test _loadMode() in isolation, but we CAN test:
//   - setMode() changes mode + isInverse
//   - setMode() persists to localStorage
//   - setMode() dispatches jlz:theme-change with { mode }
//   - toggle() flips auto ↔ inverse and returns the new mode
//
// Reset state between tests: localStorage.clear() + setMode('auto').
// dispatchEvent is stubbed to capture event detail without side effects.

describe('ThemeManager', () => {
  beforeEach(() => {
    localStorage.clear()
    themeManager.setMode('auto')
    // setMode dispatches jlz:theme-change; stub AFTER reset so the stub
    // captures only test-triggered events.
    vi.stubGlobal('dispatchEvent', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('setMode', () => {
    it('sets mode to inverse and updates isInverse', () => {
      themeManager.setMode('inverse')
      expect(themeManager.mode).toBe('inverse')
      expect(themeManager.isInverse).toBe(true)
    })

    it('sets mode to auto and updates isInverse', () => {
      themeManager.setMode('inverse')
      themeManager.setMode('auto')
      expect(themeManager.mode).toBe('auto')
      expect(themeManager.isInverse).toBe(false)
    })

    it('persists mode to localStorage', () => {
      themeManager.setMode('inverse')
      expect(localStorage.getItem('jlz:theme')).toBe('inverse')
      themeManager.setMode('auto')
      expect(localStorage.getItem('jlz:theme')).toBe('auto')
    })

    it('dispatches jlz:theme-change event with mode detail', () => {
      const dispatch = window.dispatchEvent as ReturnType<typeof vi.fn>
      themeManager.setMode('inverse')
      const event = dispatch.mock.calls[0]?.[0] as CustomEvent<{ mode: ThemeMode }>
      expect(event.type).toBe('jlz:theme-change')
      expect(event.detail).toEqual({ mode: 'inverse' })
    })
  })

  describe('toggle', () => {
    it('flips auto → inverse', () => {
      expect(themeManager.mode).toBe('auto')
      const newMode = themeManager.toggle()
      expect(newMode).toBe('inverse')
      expect(themeManager.mode).toBe('inverse')
      expect(themeManager.isInverse).toBe(true)
    })

    it('flips inverse → auto', () => {
      themeManager.setMode('inverse')
      const newMode = themeManager.toggle()
      expect(newMode).toBe('auto')
      expect(themeManager.mode).toBe('auto')
      expect(themeManager.isInverse).toBe(false)
    })

    it('persists after toggle', () => {
      themeManager.toggle() // auto → inverse
      expect(localStorage.getItem('jlz:theme')).toBe('inverse')
      themeManager.toggle() // inverse → auto
      expect(localStorage.getItem('jlz:theme')).toBe('auto')
    })

    it('dispatches jlz:theme-change on each toggle', () => {
      const dispatch = window.dispatchEvent as ReturnType<typeof vi.fn>
      dispatch.mockClear()
      themeManager.toggle()
      themeManager.toggle()
      expect(dispatch).toHaveBeenCalledTimes(2)
      const firstEvent = dispatch.mock.calls[0]?.[0] as CustomEvent
      const secondEvent = dispatch.mock.calls[1]?.[0] as CustomEvent
      expect(firstEvent.detail.mode).toBe('inverse')
      expect(secondEvent.detail.mode).toBe('auto')
    })
  })

  describe('default state', () => {
    it('starts in auto mode when localStorage is empty', () => {
      // After beforeEach reset, mode should be 'auto'
      expect(themeManager.mode).toBe('auto')
      expect(themeManager.isInverse).toBe(false)
    })
  })
})
