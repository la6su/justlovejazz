import * as THREE from 'three'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { SceneCoordinator, type SceneCoordinatorOwners } from '../Experience/SceneCoordinator'
import { SplashCube } from '../Experience/World/SplashCube'
import { getLabExperiment, labExperiments } from '../Experience/Lab/manifest'
import type { PageId } from '../sections/_shared/constants'

const canvasContext = {
  fillStyle: '',
  globalAlpha: 1,
  fillRect: vi.fn(),
}

describe('SceneCoordinator route visuals (Phase 8 slice 10: the gate left `World`)', () => {
  let coordinator: SceneCoordinator
  let cube: SplashCube
  let getContext: ReturnType<typeof vi.spyOn>
  let page: PageId

  function makeOwners(baku: SplashCube): SceneCoordinatorOwners {
    return {
      ground: () => null,
      sectionGroups: () => null,
      envSphere: () => null,
      baku: () => baku,
      particleBurst: () => null,
      drawTrail: () => null,
      carousel: () => null,
      worksPlaneStage: () => null,
      contactCyprusStage: () => null,
      labGamepad: () => null,
    }
  }

  beforeEach(() => {
    page = 'home'
    document.body.dataset.page = 'home'
    getContext = vi
      .spyOn(HTMLCanvasElement.prototype, 'getContext')
      .mockReturnValue(canvasContext as unknown as CanvasRenderingContext2D)
    cube = new SplashCube()
    cube.name = 'baku'
    cube.visible = true
    coordinator = new SceneCoordinator(new THREE.Scene(), makeOwners(cube), () => page)
  })

  afterEach(() => {
    cube.dispose()
    getContext.mockRestore()
    delete document.body.dataset.page
  })

  it('admits only the lazy gamepad experiment for the Lab route', () => {
    expect(labExperiments.map((experiment) => experiment.id)).toEqual(['gamepad'])
    expect(getLabExperiment('lab')?.id).toBe('gamepad')
    expect(getLabExperiment('home')).toBeUndefined()
  })

  it('hides the shared cube on the Lab route', () => {
    page = 'lab'
    document.body.dataset.page = 'home'
    coordinator.syncRouteVisuals()
    expect(coordinator.baku).toBe(cube)
    expect(cube.visible).toBe(false)

    page = 'home'
    document.body.dataset.page = 'lab'
    coordinator.syncRouteVisuals()
    expect(cube.visible).toBe(true)
  })

  it('keeps the cube out of the standalone Works media route', () => {
    page = 'works'
    document.body.dataset.page = 'home'
    coordinator.syncRouteVisuals()
    expect(cube.visible).toBe(false)

    page = 'contact'
    document.body.dataset.page = 'works'
    coordinator.syncRouteVisuals()
    expect(cube.visible).toBe(true)
  })

  it('refreshes page-specific config caches when reinitialized', async () => {
    await coordinator.init()
    expect(coordinator.getConfig('sec_intro')).toBeDefined()

    page = 'works'
    await coordinator.init()

    expect(coordinator.getConfig('content_works_0')).toBeDefined()
    expect(coordinator.getConfig('sec_intro')).toBeUndefined()
    coordinator.dispose()
  })
})
