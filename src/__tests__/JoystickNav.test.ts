import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { JoystickNav } from '../UI/JoystickNav'

// JoystickNav close-nav behavior is critical: it's the explicit exit from
// the menu overlay (the `jlz:close-nav` event). If broken, callers cannot
// restore the prior main section through the explicit close contract.
//
// We test the jlz:close-nav event listener:
//   - Home mode: when _side='menu', close-nav → _side='center', fires
//     onSectionChange with _mainSection (the previous main section).
//   - Home mode: when _side='center' (menu not open), close-nav is a no-op
//     (does not fire section change).
//   - Content-page mode: close-nav from menu returns to the PREVIOUS main
//     section (not always section 1). Regression test for the bug where
//     _syncPageSection clobbered _mainSection to 5 when entering menu.

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

    // Navigate to menu (section 5) — simulates joystick/keyboard right.
    joy.goToSection(5) // menu
    expect(joy.getSectionIndex()).toBe(5)

    // Dispatch close-nav — an explicit programmatic menu close.
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

// ── Content-page mode tests ──────────────────────────────────────────────
// Regression tests for the bug where _syncPageSection clobbered _mainSection
// to 5 when entering menu, causing close-nav to fall back to section 1
// instead of the previous main section. The home-mode tests above cover the
// home branch; these cover the page-mode branch (separate code path).

describe('JoystickNav — content-page mode close-nav', () => {
  let joy: JoystickNav | null = null

  beforeEach(() => {
    // Content-page mode: body.dataset.page !== 'home'
    document.body.dataset.page = 'works'
    // Set up [data-page-section] DOM (6 sections: 0=lab, 1-4=main, 5=menu)
    const spa = document.createElement('div')
    spa.id = 'spa-content'
    for (let i = 0; i < 6; i++) {
      const s = document.createElement('section')
      s.setAttribute('data-page-section', `page-${i}`)
      s.classList.toggle('section-active', i === 1) // start on section 1
      spa.appendChild(s)
    }
    document.body.appendChild(spa)
  })

  afterEach(() => {
    joy?.dispose()
    joy = null
    document.getElementById('spa-content')?.remove()
    delete document.body.dataset.page
  })

  it('close-nav from menu returns to the previous main section (not section 1)', () => {
    joy = new JoystickNav(null, null, 6)

    // Navigate to section 3 (works main) via goToSection
    joy.goToSection(3)
    // Open menu (section 5)
    joy.goToSection(5)
    expect(joy.getSectionIndex()).toBe(5)

    // Close menu — should return to section 3, NOT section 1
    window.dispatchEvent(new CustomEvent('jlz:close-nav'))

    expect(joy.getSectionIndex()).toBe(3)
    // Verify the DOM section-active is on section 3
    const active = document.querySelector('[data-page-section].section-active')
    expect(active?.getAttribute('data-page-section')).toBe('page-3')
  })

  it('close-nav from menu returns to section 2 when that was the previous main', () => {
    joy = new JoystickNav(null, null, 6)

    joy.goToSection(2)
    joy.goToSection(5) // menu
    window.dispatchEvent(new CustomEvent('jlz:close-nav'))

    expect(joy.getSectionIndex()).toBe(2)
  })

  it('horizontal right from Lab returns to the previous main section (not hardcoded middle)', () => {
    joy = new JoystickNav(null, null, 6)

    // Navigate to section 4, then left to Lab (section 0)
    joy.goToSection(4)
    joy.goToSection(0) // Lab
    expect(joy.getSectionIndex()).toBe(0)

    // Right from Lab should return to section 4 (previous main), NOT hardcoded middle=3
    joy.goToSection(joy.getSectionIndex()) // no-op, just to confirm state
    // Simulate joystick right: call _navigateHorizontal via goToSection to center
    // Actually, _navigateHorizontal is private. We test via the public path:
    // ArrowRight from Lab → center → previous main. Use goToSection to simulate
    // the side-toggle by going to the main section the side-tracking remembers.
    // Since _mainSection is preserved (fix), going right from Lab should target _mainSection=4.
    // We verify by dispatching the keyboard event (ArrowRight) which calls _navigateHorizontal.
    const ev = new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true })
    window.dispatchEvent(ev)

    // Should have returned to section 4 (previous main), not section 3 (hardcoded middle)
    expect(joy.getSectionIndex()).toBe(4)
  })
})
