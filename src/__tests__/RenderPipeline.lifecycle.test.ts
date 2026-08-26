import * as THREE from 'three'
import { describe, expect, it, vi } from 'vitest'
import { RenderPipeline } from '../core/RenderPipeline'

class WebGPUBackend {}
class WebGLBackend {}

describe('RenderPipeline failure lifecycle', () => {
  it('disables a failing TSL graph and falls back without retrying it', () => {
    const render = vi.fn(() => {
      throw new Error('device lost during post render')
    })
    const renderer = {
      backend: new WebGPUBackend(),
      toneMapping: THREE.ACESFilmicToneMapping,
      render: vi.fn(),
    }
    const pipeline = Object.assign(Object.create(RenderPipeline.prototype), {
      _renderer: renderer,
      _webgpuPipeline: {
        setScene: vi.fn(),
        updateParams: vi.fn(),
        render,
        dispose: vi.fn(),
      },
      _params: {
        bloom: 0.4,
        vignette: 0.5,
        grain: 0.25,
        chromatic: 0,
        bloomRadius: 0.6,
        bloomThreshold: 0.5,
      },
      _sectionRefract: 0.05,
      _sectionBorder: 0,
      _sectionShadows: new THREE.Vector3(1, 1, 1),
      _sectionHighlights: new THREE.Vector3(1, 1, 1),
      _webgpuParamsCache: {
        bloom: 0,
        bloomRadius: 0,
        bloomThreshold: 0,
        vignette: 0,
        grain: 0,
        chromatic: 0,
        refract: 0,
        border: 0,
        gradeShadows: [1, 1, 1],
        gradeHighlights: [1, 1, 1],
      },
    }) as RenderPipeline

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera()
    expect(() => pipeline.render(scene, camera)).not.toThrow()
    expect(renderer.toneMapping).toBe(THREE.ACESFilmicToneMapping)
    expect(render).toHaveBeenCalledOnce()
    expect(renderer.render).toHaveBeenCalledOnce()

    pipeline.render(scene, camera)
    expect(render).toHaveBeenCalledOnce()
    expect(renderer.render).toHaveBeenCalledTimes(2)
  })

  it('restores scene fog after a WebGLBackend fallback draw fails', () => {
    const render = vi.fn(() => {
      throw new Error('fallback draw failed')
    })
    const renderer = {
      backend: new WebGLBackend(),
      render,
    }
    const scene = new THREE.Scene()
    scene.fog = new THREE.Fog(0x112233, 1, 10)
    const fog = scene.fog
    const pipeline = Object.assign(Object.create(RenderPipeline.prototype), {
      _renderer: renderer,
      _webgpuPipeline: null,
    }) as RenderPipeline

    expect(() => pipeline.render(scene, new THREE.PerspectiveCamera())).toThrow(
      'fallback draw failed',
    )
    expect(scene.fog).toBe(fog)
    expect(render).toHaveBeenCalledOnce()
  })
})
