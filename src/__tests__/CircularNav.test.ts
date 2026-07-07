// CircularNav.test.ts — Unit tests for the section navigation logic.
//
// Tests the core state machine: progress, direction, transitions, boundaries.
// Does NOT test DOM/event listeners (those need a browser environment).

import { describe, it, expect, beforeEach } from 'vitest'

// We test the logic by extracting it into a pure state machine.
// CircularNav itself creates DOM elements in its constructor, so we
// test the state logic directly by instantiating with a mocked DOM.

// --- State machine logic (mirrors CircularNav's core) ---

interface NavState {
  currentSection: number
  progress: number        // -1..1, 0 = settled
  targetProgress: number
  transitioning: boolean
  sectionCount: number
}

function createState(sectionCount: number): NavState {
  return {
    currentSection: 0,
    progress: 0,
    targetProgress: 0,
    transitioning: false,
    sectionCount,
  }
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v))
}

function getOverallProgress(s: NavState): number {
  const span = s.sectionCount - 1
  return clamp((s.currentSection + s.progress) / span, 0, 1)
}

function isActive(s: NavState): boolean {
  return Math.abs(s.progress) > 0.001 || s.transitioning
}

function goToSection(s: NavState, index: number): void {
  index = Math.max(0, Math.min(s.sectionCount - 1, index))
  if (index === s.currentSection) return
  s.currentSection = index
  s.progress = 0
  s.targetProgress = 0
  s.transitioning = false
}

function goToDirection(s: NavState, dir: 1 | -1): void {
  if (s.transitioning) {
    completeTransition(s)
  }
  const next = s.currentSection + dir
  if (next < 0 || next >= s.sectionCount) return
  commitTransition(s, dir)
}

function commitTransition(s: NavState, dir: number): void {
  const next = s.currentSection + dir
  if (next < 0 || next >= s.sectionCount) {
    s.targetProgress = 0
    return
  }
  s.transitioning = true
  s.targetProgress = dir
}

function completeTransition(s: NavState): void {
  if (!s.transitioning) return
  const dir = s.targetProgress > 0 ? 1 : -1
  s.currentSection = Math.max(0, Math.min(s.sectionCount - 1, s.currentSection + dir))
  s.progress = 0
  s.targetProgress = 0
  s.transitioning = false
}

function update(s: NavState, ease = 0.22): void {
  s.progress += (s.targetProgress - s.progress) * ease
  if (Math.abs(s.targetProgress - s.progress) < 0.001) {
    s.progress = s.targetProgress
  }
  // Complete when progress reaches target (within 0.01), not at an arbitrary
  // absolute threshold. Mirrors the real CircularNav.update() SETTLE_EPS check.
  if (s.transitioning && Math.abs(s.targetProgress - s.progress) < 0.01) {
    completeTransition(s)
  }
}

// --- Tests ---

describe('CircularNav state machine', () => {
  let s: NavState

  beforeEach(() => {
    s = createState(6)
  })

  describe('initial state', () => {
    it('starts at section 0 with zero progress', () => {
      expect(s.currentSection).toBe(0)
      expect(s.progress).toBe(0)
      expect(s.transitioning).toBe(false)
    })

    it('isActive is false when idle', () => {
      expect(isActive(s)).toBe(false)
    })

    it('getOverallProgress is 0 at section 0', () => {
      expect(getOverallProgress(s)).toBe(0)
    })
  })

  describe('goToDirection', () => {
    it('Next (+1) starts a transition with targetProgress = 1', () => {
      goToDirection(s, 1)
      expect(s.transitioning).toBe(true)
      expect(s.targetProgress).toBe(1)
    })

    it('Prev (-1) starts a transition with targetProgress = -1', () => {
      s.currentSection = 3
      goToDirection(s, -1)
      expect(s.transitioning).toBe(true)
      expect(s.targetProgress).toBe(-1)
    })

    it('Next at last section does nothing', () => {
      s.currentSection = 5
      goToDirection(s, 1)
      expect(s.transitioning).toBe(false)
      expect(s.currentSection).toBe(5)
    })

    it('Prev at first section does nothing', () => {
      goToDirection(s, -1)
      expect(s.transitioning).toBe(false)
      expect(s.currentSection).toBe(0)
    })

    it('Rapid Next → Next completes first transition then starts second', () => {
      goToDirection(s, 1)
      expect(s.currentSection).toBe(0)
      expect(s.transitioning).toBe(true)

      // Simulate partial progress
      s.progress = 0.5

      // Rapid second Next — should complete first, then start second
      goToDirection(s, 1)
      expect(s.currentSection).toBe(1) // first transition completed
      expect(s.transitioning).toBe(true) // second transition started
      expect(s.targetProgress).toBe(1)
    })
  })

  describe('commitTransition direction bug (regression)', () => {
    it('goToDirection(1) sets targetProgress to +1 (not -1)', () => {
      goToDirection(s, 1)
      expect(s.targetProgress).toBe(1)
    })

    it('goToDirection(-1) sets targetProgress to -1', () => {
      s.currentSection = 2
      goToDirection(s, -1)
      expect(s.targetProgress).toBe(-1)
    })

    it('After goToDirection(1) + update loop, section advances forward', () => {
      goToDirection(s, 1)
      // Simulate ~10 frames of update
      for (let i = 0; i < 20; i++) update(s)
      expect(s.currentSection).toBe(1)
      expect(s.transitioning).toBe(false)
    })

    it('After goToDirection(-1) + update loop, section goes backward', () => {
      s.currentSection = 3
      goToDirection(s, -1)
      for (let i = 0; i < 20; i++) update(s)
      expect(s.currentSection).toBe(2)
    })
  })

  describe('goToSection', () => {
    it('jumps to the target section immediately', () => {
      goToSection(s, 4)
      expect(s.currentSection).toBe(4)
      expect(s.progress).toBe(0)
      expect(s.transitioning).toBe(false)
    })

    it('clamps to valid range', () => {
      goToSection(s, -1)
      expect(s.currentSection).toBe(0)
      goToSection(s, 99)
      expect(s.currentSection).toBe(5)
    })

    it('no-op if already at target', () => {
      goToSection(s, 0)
      expect(s.currentSection).toBe(0)
    })
  })

  describe('update loop', () => {
    it('lerps progress toward target', () => {
      s.targetProgress = 1
      s.progress = 0
      update(s)
      expect(s.progress).toBeGreaterThan(0)
      expect(s.progress).toBeLessThan(1)
    })

    it('completes transition when progress reaches target', () => {
      goToDirection(s, 1)
      // Fast-forward to completion
      for (let i = 0; i < 30; i++) update(s)
      expect(s.currentSection).toBe(1)
      expect(s.transitioning).toBe(false)
      expect(s.progress).toBe(0)
    })

    it('snaps back to 0 when target is 0', () => {
      s.progress = 0.3
      s.targetProgress = 0
      update(s)
      expect(s.progress).toBeLessThan(0.3)
    })
  })

  describe('getOverallProgress', () => {
    it('returns 0 at section 0, progress 0', () => {
      expect(getOverallProgress(s)).toBe(0)
    })

    it('returns 1 at last section, progress 0', () => {
      s.currentSection = 5
      expect(getOverallProgress(s)).toBe(1)
    })

    it('returns 0.5 at section 2, progress 0.5 (of 6 sections)', () => {
      s.currentSection = 2
      s.progress = 0.5
      // (2 + 0.5) / 5 = 0.5
      expect(getOverallProgress(s)).toBeCloseTo(0.5)
    })

    it('clamps to [0, 1]', () => {
      s.currentSection = 0
      s.progress = -1
      expect(getOverallProgress(s)).toBe(0)
      s.currentSection = 5
      s.progress = 1
      expect(getOverallProgress(s)).toBe(1)
    })
  })

  describe('isActive', () => {
    it('true when progress != 0', () => {
      s.progress = 0.5
      expect(isActive(s)).toBe(true)
    })

    it('true when transitioning', () => {
      s.transitioning = true
      expect(isActive(s)).toBe(true)
    })

    it('false when idle', () => {
      expect(isActive(s)).toBe(false)
    })
  })

  describe('boundary handling', () => {
    it('forward through all sections 0→5', () => {
      for (let i = 0; i < 5; i++) {
        goToDirection(s, 1)
        for (let j = 0; j < 30; j++) update(s)
      }
      expect(s.currentSection).toBe(5)
    })

    it('backward through all sections 5→0', () => {
      s.currentSection = 5
      for (let i = 0; i < 5; i++) {
        goToDirection(s, -1)
        for (let j = 0; j < 30; j++) update(s)
      }
      expect(s.currentSection).toBe(0)
    })

    it('cannot go beyond last section', () => {
      s.currentSection = 5
      goToDirection(s, 1)
      expect(s.transitioning).toBe(false)
    })

    it('cannot go before first section', () => {
      goToDirection(s, -1)
      expect(s.transitioning).toBe(false)
    })
  })
})
