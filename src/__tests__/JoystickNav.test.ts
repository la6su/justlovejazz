import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { JoystickNav } from '../UI/JoystickNav'

// JoystickNav close-nav behavior is critical: it's the explicit exit from
// the menu overlay (hamburger X click). If broken, users can't leave the menu
// via the on-screen button (only via joystick drag or keyboard).
//
// We test the jlz:close-nav event listener:
//   - Home mode: when _side='menu', close-nav → _side='center', fires
//     onSectionChange with _mainSection (the previous main section).
//   - Home mode: when _side='center' (menu not open), close-nav is a no-op
//     (does not fire section change).
//
// Content-page mode requires [data-page-section] DOM elements + is tested
// via integration (browser), not here — the home-mode test covers the
// core _closeNavHandler logic which is shared.

describe('JoystickNav — jlz:close-nav (menu exit)', () => {
  let joy: JoystickNav | null = null

  beforeEach(() => {
    // Home mode: body.dataset.page === 'home' → _isPageMode() returns false
    document.body.dataset.page = 'home'
  })

  afterEach(() => {
    joy?.dispose()
    joy = null
    delete document.body.dataset.page
  })

  it('returns from menu to the previous main section on jlz:close-nav', () => {
    joy = new JoystickNav(null, null, 6)
    const indices: number[] = []
    joy.onSectionChange((index) => {
      indices.push(index)
    })

    // Navigate to menu (section 5) — simulates hamburger click / joystick right
    joy.goToSection(5) // menu
    expect(joy.getSectionIndex()).toBe(5)

    // Dispatch close-nav — simulates hamburger X click
    window.dispatchEvent(new CustomEvent('jlz:close-nav'))

    // Should return to the previous main section (intro = 1, the default)
    expect(joy.getSectionIndex()).toBe(1)
    // Last fired index should be 1 (the close-nav return)
    expect(indices[indices.length - 1]).toBe(1)
  })

  it('returns to the main section that was active before opening menu', () => {
    joy = new JoystickNav(null, null, 6)
    const indices: number[] = []
    joy.onSectionChange((index) => {
      indices.push(index)
    })

    // Navigate: intro(1) → about(2) → works(3) → then open menu(5)
    joy.goToSection(2) // about
    joy.goToSection(3) // works
    expect(joy.getSectionIndex()).toBe(3)

    joy.goToSection(5) // menu
    expect(joy.getSectionIndex()).toBe(5)

    // Close menu — should return to works(3), NOT to intro(1)
    window.dispatchEvent(new CustomEvent('jlz:close-nav'))

    expect(joy.getSectionIndex()).toBe(3)
    // Last fired index should be 3 (the close-nav return to works)
    expect(indices[indices.length - 1]).toBe(3)
  })

  it('is a no-op when menu is not open (center state)', () => {
    joy = new JoystickNav(null, null, 6)
    let callCount = 0
    joy.onSectionChange(() => {
      callCount++
    })

    // Start on intro (default), menu NOT open
    expect(joy.getSectionIndex()).toBe(1)

    // Dispatch close-nav — should NOT fire section change (no-op)
    window.dispatchEvent(new CustomEvent('jlz:close-nav'))

    expect(joy.getSectionIndex()).toBe(1)
    expect(callCount).toBe(0)
  })

  it('is a no-op when on a secret Lab section (left)', () => {
    joy = new JoystickNav(null, null, 6)
    let callCount = 0
    joy.onSectionChange(() => {
      callCount++
    })

    // Navigate to Lab (section 0, secret left)
    joy.goToSection(0)
    expect(joy.getSectionIndex()).toBe(0)

    // Reset callCount — goToSection(0) fired one callback; we only want to
    // count callbacks from the close-nav dispatch below.
    callCount = 0

    // close-nav should NOT navigate away from Lab (Lab has its own exit via
    // joystick right → center; close-nav is menu-specific)
    window.dispatchEvent(new CustomEvent('jlz:close-nav'))

    expect(joy.getSectionIndex()).toBe(0)
    expect(callCount).toBe(0)
  })
})

describe('JoystickNav — goto-nav (menu open)', () => {
  let joy: JoystickNav | null = null

  beforeEach(() => {
    document.body.dataset.page = 'home'
  })

  afterEach(() => {
    joy?.dispose()
    joy = null
    delete document.body.dataset.page
  })

  it('navigates to menu (section 5) via goToSection(5)', () => {
    // Note: jlz:goto-nav event is listened by Experience.ts (not JoystickNav),
    // which calls joystick.goToSection(5). We test goToSection directly.
    joy = new JoystickNav(null, null, 6)
    const indices: number[] = []
    joy.onSectionChange((index) => {
      indices.push(index)
    })

    // Start on intro (default)
    expect(joy.getSectionIndex()).toBe(1)

    // Go to menu — simulates what Experience.ts does on jlz:goto-nav
    joy.goToSection(5)

    expect(joy.getSectionIndex()).toBe(5)
    expect(indices[indices.length - 1]).toBe(5)
  })

  it('can toggle: goToSection(5) opens menu, close-nav returns to previous', () => {
    joy = new JoystickNav(null, null, 6)
    const indices: number[] = []
    joy.onSectionChange((index) => {
      indices.push(index)
    })

    // Navigate to about(2), then open menu, then close
    joy.goToSection(2) // about
    indices.length = 0

    joy.goToSection(5) // open menu (what Experience.ts does on jlz:goto-nav)
    expect(joy.getSectionIndex()).toBe(5)

    window.dispatchEvent(new CustomEvent('jlz:close-nav')) // close → back to about
    expect(joy.getSectionIndex()).toBe(2)

    // Should have fired: 5 (open), 2 (close)
    expect(indices).toEqual([5, 2])
  })
})
