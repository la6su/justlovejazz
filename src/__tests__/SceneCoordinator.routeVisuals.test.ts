import * as THREE from 'three'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { SceneCoordinator, type SceneCoordinatorOwners } from '../Experience/SceneCoordinator'
import { SplashCube } from '../Experience/World/SplashCube'
import { getLabExperiment, labExperiments } from '../Experience/Lab/manifest'

const canvasContext = {
  fillStyle: '',
  globalAlpha: 1,
  fillRect: vi.fn(),
}

describe('SceneCoordinator route visuals (Phase 8 slice 10: the gate left `World`)', () => {
  let coordinator: SceneCoordinator
  let cube: SplashCube
  let getContext: ReturnType<typeof vi.spyOn>

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
      contactTextStage: () => null,
      contactCyprusStage: () => null,
      labGamepad: () => null,
    }
  }

  beforeEach(() => {
    document.body.dataset.page = 'home'
    getContext = vi
      .spyOn(HTMLCanvasElement.prototype, 'getContext')
      .mockReturnValue(canvasContext as unknown as CanvasRenderingContext2D)
    cube = new SplashCube()
    cube.name = 'baku'
    cube.visible = true
    coordinator = new SceneCoordinator(new THREE.Scene(), makeOwners(cube))
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
    document.body.dataset.page = 'lab'
    coordinator.syncRouteVisuals()
    expect(coordinator.baku).toBe(cube)
    expect(cube.visible).toBe(false)

    document.body.dataset.page = 'home'
    coordinator.syncRouteVisuals()
    expect(cube.visible).toBe(true)
  })

  it('keeps the cube out of the standalone Works media route', () => {
    document.body.dataset.page = 'works'
    coordinator.syncRouteVisuals()
    expect(cube.visible).toBe(false)

    document.body.dataset.page = 'contact'
    coordinator.syncRouteVisuals()
    expect(cube.visible).toBe(true)
  })
})
