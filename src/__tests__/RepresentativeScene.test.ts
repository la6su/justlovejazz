import { Scene } from 'three'
import { describe, expect, it, vi } from 'vitest'
import { SplashCube } from '../Experience/World/SplashCube'
import { canUseTSLPost, createRepresentativeScene } from '../spikes/tres/representativeScene'

describe('representative Tres scene scope', () => {
  it('admits the WebGPU-only TSL post path only for the actual WebGPU backend', () => {
    expect(canUseTSLPost('WebGPUBackend')).toBe(true)
    expect(canUseTSLPost('WebGLBackend')).toBe(false)
    expect(canUseTSLPost(null)).toBe(false)
  })

  it('releases the attached geometry and material on scope disposal', () => {
    const scene = new Scene()
    const resources = createRepresentativeScene()
    const geometryDispose = vi.spyOn(resources.mesh.geometry, 'dispose')
    const materialDispose = vi.spyOn(resources.mesh.material, 'dispose')
    const environmentDispose = vi.spyOn(resources.environment, 'dispose')
    const burstDispose = vi.spyOn(resources.burst, 'dispose')
    const splashDispose = vi.spyOn(resources.splashCube, 'dispose')

    resources.attach(scene)
    expect(scene.children).toContain(resources.environment)
    expect(scene.children).toContain(resources.burst)
    expect(scene.children).toContain(resources.splashCube)
    expect(scene.children).toContain(resources.mesh)

    resources.dispose()
    resources.dispose()

    expect(scene.children).not.toContain(resources.environment)
    expect(scene.children).not.toContain(resources.burst)
    expect(scene.children).not.toContain(resources.splashCube)
    expect(scene.children).not.toContain(resources.mesh)
    expect(environmentDispose).toHaveBeenCalledOnce()
    expect(burstDispose).toHaveBeenCalledOnce()
    expect(splashDispose).toHaveBeenCalledOnce()
    expect(geometryDispose).toHaveBeenCalledOnce()
    expect(materialDispose).toHaveBeenCalledOnce()
  })

  it('owns the real production SplashCube through the representative scope', () => {
    const scene = new Scene()
    const resources = createRepresentativeScene()
    const splashDispose = vi.spyOn(resources.splashCube, 'dispose')

    // Ownership: the scope exposes the unmodified production owner, not a copy.
    expect(resources.splashCube).toBeInstanceOf(SplashCube)
    expect(scene.children).not.toContain(resources.splashCube)

    // Attach: the cube enters the same scene as the other representative owners.
    resources.attach(scene)
    expect(scene.children).toContain(resources.splashCube)

    // Repeated disposal is safe: the owner dispose runs exactly once and the
    // cube is removed from the scene.
    resources.dispose()
    resources.dispose()

    expect(scene.children).not.toContain(resources.splashCube)
    expect(splashDispose).toHaveBeenCalledOnce()
  })

  it('accepts resize before or after asynchronous stage attachment', () => {
    const resources = createRepresentativeScene()

    expect(() => resources.resize(390, 844)).not.toThrow()
    resources.dispose()
    expect(() => resources.resize(1440, 900)).not.toThrow()
  })
})
