import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ExperienceUI, type ExperienceUIHost } from '../Experience/ExperienceUI'

const createHost = (sections: unknown[]): ExperienceUIHost => {
  const carousel = null
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
    disposeContactTypographyStage: vi.fn(),
    disposeContactCyprusStage: vi.fn(),
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
    const sections: unknown[] = []
    const host = createHost(sections)
    const experienceUI = new ExperienceUI(host)
    const pending = experienceUI.ensurePortfolio()

    experienceUI.destroy()
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
})
