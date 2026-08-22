import * as THREE from 'three'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { World } from '../core/World'
import { SplashCube } from '../Experience/World/SplashCube'
import { getLabExperiment, labExperiments } from '../Experience/Lab/manifest'

const canvasContext = {
  fillStyle: '',
  globalAlpha: 1,
  fillRect: vi.fn(),
}

describe('World route visuals', () => {
  let world: World
  let cube: SplashCube
  let getContext: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    document.body.dataset.page = 'home'
    getContext = vi
      .spyOn(HTMLCanvasElement.prototype, 'getContext')
      .mockReturnValue(canvasContext as unknown as CanvasRenderingContext2D)
    world = new World(new THREE.Scene())
    // Phase 8 slice 4: the glass cube is an Experience-owned scene owner —
    // the test injects it through the attachBaku adapter before driving the
    // World's route-visual gating.
    cube = new SplashCube()
    cube.name = 'baku'
    cube.visible = true
    world.attachBaku(cube)
  })

  afterEach(() => {
    world.dispose()
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
    // Phase 8 slice 9: the Lab object's lazy load moved to Experience (see
    // Experience.labStage.test.ts); the World keeps only the cube-visibility
    // gate for the Lab route.
    document.body.dataset.page = 'lab'
    world.syncRouteVisuals()
    expect(world.baku).toBe(cube)
    expect(cube.visible).toBe(false)

    document.body.dataset.page = 'home'
    world.syncRouteVisuals()
    expect(cube.visible).toBe(true)
  })

  it('keeps the cube out of the standalone Works media route', () => {
    document.body.dataset.page = 'works'
    world.syncRouteVisuals()

    expect(cube.visible).toBe(false)

    document.body.dataset.page = 'contact'
    world.syncRouteVisuals()

    expect(cube.visible).toBe(true)
  })
})
