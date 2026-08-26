import { describe, expect, it, vi } from 'vitest'
import { Experience } from '../Experience/Experience'

function createExperience(reducedMotion: boolean): Experience {
  return Object.assign(Object.create(Experience.prototype), {
    _reducedMotion: reducedMotion,
    _destroyed: false,
    _scheduler: { settleNow: vi.fn() },
    _cancelBreath: vi.fn(),
    _raiseRenderDemand: vi.fn(),
    contactTypographyStage: null,
  }) as Experience
}

describe('Experience reduced-motion synchronization', () => {
  it('settles the scheduler and cancels ambient breathing when reduction is enabled', () => {
    const experience = createExperience(false)
    const owner = experience as unknown as {
      _handleReducedMotionChange: (reduced: boolean) => void
      _scheduler: { settleNow: () => void }
      _cancelBreath: () => void
      _reducedMotion: boolean
    }

    owner._handleReducedMotionChange(true)

    expect(owner._reducedMotion).toBe(true)
    expect(owner._scheduler.settleNow).toHaveBeenCalledOnce()
    expect(owner._cancelBreath).toHaveBeenCalledOnce()
  })

  it('forwards a live preference change to the mounted Contact typography owner', () => {
    const experience = createExperience(false)
    const setReducedMotion = vi.fn()
    const owner = experience as unknown as {
      _handleReducedMotionChange: (reduced: boolean) => void
      contactTypographyStage: { setReducedMotion: (reduced: boolean) => void }
    }
    owner.contactTypographyStage = { setReducedMotion }

    owner._handleReducedMotionChange(true)

    expect(setReducedMotion).toHaveBeenCalledWith(true)
  })

  it('forwards a live preference change to the shared camera owner', () => {
    const experience = createExperience(false)
    const setReducedMotion = vi.fn()
    const owner = experience as unknown as {
      _handleReducedMotionChange: (reduced: boolean) => void
      camera: { setReducedMotion: (reduced: boolean) => void }
    }
    owner.camera = { setReducedMotion }

    owner._handleReducedMotionChange(true)

    expect(setReducedMotion).toHaveBeenCalledWith(true)
  })

  it('forwards a live preference change to the splash burst owner', () => {
    const experience = createExperience(false)
    const setReducedMotion = vi.fn()
    const owner = experience as unknown as {
      _handleReducedMotionChange: (reduced: boolean) => void
      particleBurst: { setReducedMotion: (reduced: boolean) => void }
    }
    owner.particleBurst = { setReducedMotion }

    owner._handleReducedMotionChange(true)

    expect(setReducedMotion).toHaveBeenCalledWith(true)
  })

  it('forwards a live preference change to the cursor trail owner', () => {
    const experience = createExperience(false)
    const setReducedMotion = vi.fn()
    const owner = experience as unknown as {
      _handleReducedMotionChange: (reduced: boolean) => void
      drawTrail: { setReducedMotion: (reduced: boolean) => void }
    }
    owner.drawTrail = { setReducedMotion }

    owner._handleReducedMotionChange(true)

    expect(setReducedMotion).toHaveBeenCalledWith(true)
  })

  it('forwards a live preference change to the post-processing owner', () => {
    const experience = createExperience(false)
    const setReducedMotion = vi.fn()
    const owner = experience as unknown as {
      _handleReducedMotionChange: (reduced: boolean) => void
      renderer: { postManager: { setReducedMotion: (reduced: boolean) => void } }
    }
    owner.renderer = { postManager: { setReducedMotion } }

    owner._handleReducedMotionChange(true)

    expect(setReducedMotion).toHaveBeenCalledWith(true)
  })

  it('raises one typed demand when reduction is disabled again', () => {
    const experience = createExperience(true)
    const owner = experience as unknown as {
      _handleReducedMotionChange: (reduced: boolean) => void
      _raiseRenderDemand: (reason: string) => void
      _reducedMotion: boolean
    }

    owner._handleReducedMotionChange(false)

    expect(owner._reducedMotion).toBe(false)
    expect(owner._raiseRenderDemand).toHaveBeenCalledWith('motion-preference')
  })

  it('ignores duplicate or post-destroy preference events', () => {
    const experience = createExperience(false)
    const owner = experience as unknown as {
      _handleReducedMotionChange: (reduced: boolean) => void
      _scheduler: { settleNow: () => void }
      _reducedMotion: boolean
      _destroyed: boolean
    }

    owner._handleReducedMotionChange(false)
    owner._destroyed = true
    owner._handleReducedMotionChange(true)

    expect(owner._scheduler.settleNow).not.toHaveBeenCalled()
    expect(owner._reducedMotion).toBe(false)
  })
})
