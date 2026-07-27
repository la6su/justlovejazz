import * as THREE from 'three'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { World } from '../core/World'
import { LabGamepad } from '../Experience/World/LabGamepad'
import { getLabExperiment, labExperiments } from '../Experience/Lab/manifest'

const canvasContext = {
  fillStyle: '',
  globalAlpha: 1,
  fillRect: vi.fn(),
}

describe('World route visuals', () => {
  let world: World
  let getContext: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    document.body.dataset.page = 'home'
    getContext = vi
      .spyOn(HTMLCanvasElement.prototype, 'getContext')
      .mockReturnValue(canvasContext as unknown as CanvasRenderingContext2D)
    world = new World(new THREE.Scene())
  })

  afterEach(() => {
    world.dispose()
    getContext.mockRestore()
    delete document.body.dataset.page
  })

  it('admits only the lazy gamepad experiment for the Lab route', () => {
    expect(labExperiments.map((experiment) => experiment.id)).toEqual(['gamepad'])
    expect(getLabExperiment('lab')?.id).toBe('gamepad')
    expect(getLabExperiment('home')).toBeUndefined()
  })

  it('loads one Lab object lazily and restores the shared cube on home', async () => {
    document.body.dataset.page = 'lab'
    world.syncRouteVisuals()
    world.syncRouteVisuals()

    await vi.dynamicImportSettled()

    expect(world.baku.visible).toBe(false)
    expect(world.labGamepad).toBeInstanceOf(LabGamepad)
    expect(world.labGamepad?.visible).toBe(true)
    expect(world.labGamepad?.position.toArray()).toEqual([0, 0, 0])
    expect(world.children.filter((child) => child.name === 'lab-gamepad')).toHaveLength(1)

    document.body.dataset.page = 'home'
    world.syncRouteVisuals()

    expect(world.baku.visible).toBe(true)
    expect(world.labGamepad?.visible).toBe(false)
  })

  it('disposes the lazy Lab object during shared-world teardown', async () => {
    const dispose = vi.spyOn(LabGamepad.prototype, 'dispose')
    document.body.dataset.page = 'lab'
    world.syncRouteVisuals()
    await vi.dynamicImportSettled()

    world.dispose()

    expect(dispose).toHaveBeenCalledTimes(1)
    expect(world.labGamepad).toBeNull()
    dispose.mockRestore()
  })
})
