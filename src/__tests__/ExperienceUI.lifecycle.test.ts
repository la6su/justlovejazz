import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ExperienceUI, type ExperienceUIHost } from '../Experience/ExperienceUI'
import { eventBus } from '../core/EventBus'

const createHost = (sections: unknown[], carousel: unknown = null): ExperienceUIHost => {
  return {
    page: () => 'home',
    coordinator: () => ({ sections, carousel }) as never,
    camera: () => ({ instance: {} }) as never,
    ui: () => ({ overlay: {} }) as never,
    sfx: () => ({}) as never,
    raise: vi.fn(),
    reducedMotion: () => false,
    ensureCarouselInitialized: vi.fn(async () => undefined),
    ensureWorksPlaneStageInitialized: vi.fn(async () => undefined),
    disposeWorksPlaneStage: vi.fn(),
    ensureContactTypographyStageInitialized: vi.fn(async () => undefined),
    ensureContactCyprusStageInitialized: vi.fn(async () => undefined),
<<<<<<< HEAD
    disposeContactTypographyStage: vi.fn(),
    disposeContactCyprusStage: vi.fn(),
=======
    ensureContactHaloStageInitialized: vi.fn(async () => undefined),
    ensureManifestoInkStageInitialized: vi.fn(async () => undefined),
    disposeManifestoInkStage: vi.fn(),
    disposeContactTypographyStage: vi.fn(),
    disposeContactCyprusStage: vi.fn(),
    disposeContactHaloStage: vi.fn(),
>>>>>>> main
    setContactCyprusStageSection: vi.fn(),
    ensureLabGamepad: vi.fn(async () => undefined),
  }
}

describe('ExperienceUI portfolio lifecycle', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('does not create portfolio resources after destroy during deferred scene readiness', async () => {
    const callbacks: FrameRequestCallback[] = []
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      callbacks.push(callback)
      return callbacks.length
    })
    const cancelAnimationFrame = vi.spyOn(window, 'cancelAnimationFrame')
    const sections: unknown[] = []
    const host = createHost(sections)
    const experienceUI = new ExperienceUI(host)
    const pending = experienceUI.ensurePortfolio()

    experienceUI.destroy()
    expect(cancelAnimationFrame).toHaveBeenCalledWith(1)
    sections.push({})
    callbacks[0]!(0)
    await pending

    expect(experienceUI.portfolio).toBeNull()
    expect(experienceUI.overlay).toBeNull()
  })

  it('creates the portfolio once when the scene is already ready', async () => {
    const experienceUI = new ExperienceUI(createHost([{}]))

    await experienceUI.ensurePortfolio()
    await experienceUI.ensurePortfolio()

    expect(experienceUI.portfolio).not.toBeNull()
    expect(experienceUI.overlay).not.toBeNull()
  })

  it('disposes the portfolio owner before releasing it', async () => {
    const experienceUI = new ExperienceUI(createHost([{}]))
    await experienceUI.ensurePortfolio()
    const portfolio = experienceUI.portfolio!
    const dispose = vi.spyOn(portfolio, 'dispose')

    experienceUI.destroy()

    expect(dispose).toHaveBeenCalledOnce()
    expect(portfolio.projects).toHaveLength(0)
    expect(experienceUI.portfolio).toBeNull()
  })

  it('coalesces concurrent portfolio initialization requests', async () => {
    const callbacks: FrameRequestCallback[] = []
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      callbacks.push(callback)
      return callbacks.length
    })
    const sections: unknown[] = []
    const experienceUI = new ExperienceUI(createHost(sections))
    const first = experienceUI.ensurePortfolio()
    const second = experienceUI.ensurePortfolio()

    expect(first).toBe(second)
    callbacks[0]!(0)
    await first

    expect(experienceUI.portfolio).toBeNull()
    sections.push({})
    await experienceUI.ensurePortfolio()
    expect(experienceUI.portfolio).not.toBeNull()
  })

  it('wakes the render demand after fullscreen project navigation', () => {
    const prev = vi.fn()
    const next = vi.fn()
    const raise = vi.fn()
    const carousel = { prev, next }
    const host = {
      ...createHost([{}], carousel),
      raise,
      sfx: () => ({ setMuted: vi.fn() }) as never,
    }
    const experienceUI = new ExperienceUI(host)
    experienceUI.init()
    experienceUI.overlay = { isOpen: true } as never
    experienceUI.portfolio = { projects: [{}], dispose: vi.fn() } as never
    const select = vi.spyOn(experienceUI, 'onProjectSelect').mockImplementation(() => undefined)

    eventBus.emit('jlz:project-navigate', { direction: 1 })

    expect(next).toHaveBeenCalledOnce()
    expect(select).toHaveBeenCalledWith(1)
    expect(raise).toHaveBeenCalledWith('nav')
    experienceUI.destroy()
  })

  it('routes visual Works taps through the stage owner and wakes its pulse', async () => {
    const raise = vi.fn()
    const openProject = vi.fn((_index: number, open: (index: number) => void) => {
      open(0)
      return true
    })
    const host = {
      ...createHost([{}]),
      page: () => 'works' as const,
      raise,
      sfx: () => ({ setMuted: vi.fn() }) as never,
<<<<<<< HEAD
      coordinator: () => ({ sections: [{}], worksPlaneStage: { hitTest: () => 0, openProject } }) as never,
=======
      coordinator: () =>
        ({ sections: [{}], worksPlaneStage: { hitTest: () => 0, openProject } }) as never,
>>>>>>> main
    }
    const experienceUI = new ExperienceUI(host)
    experienceUI.init()
    experienceUI.portfolio = { projects: [{}], dispose: vi.fn() } as never
    experienceUI.overlay = { isOpen: false, open: vi.fn() } as never

    document.body.dispatchEvent(
      new PointerEvent('pointerup', { bubbles: true, clientX: 20, clientY: 20 }),
    )
    await Promise.resolve()
    await Promise.resolve()

    expect(openProject).toHaveBeenCalledOnce()
    expect(raise).toHaveBeenCalledWith('dirty')
    experienceUI.destroy()
  })
})
