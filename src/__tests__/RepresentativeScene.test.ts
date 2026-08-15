import { Scene } from 'three'
import { describe, expect, it, vi } from 'vitest'
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

    resources.attach(scene)
    expect(scene.children).toContain(resources.mesh)

    resources.dispose()

    expect(scene.children).not.toContain(resources.mesh)
    expect(geometryDispose).toHaveBeenCalledOnce()
    expect(materialDispose).toHaveBeenCalledOnce()
  })
})
