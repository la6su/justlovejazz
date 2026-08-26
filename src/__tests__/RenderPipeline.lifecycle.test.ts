import * as THREE from 'three'
import { describe, expect, it, vi } from 'vitest'
import { RenderPipeline } from '../core/RenderPipeline'

class WebGPUBackend {}

describe('RenderPipeline failure lifecycle', () => {
  it('restores renderer tone mapping when the TSL pipeline throws', () => {
    const render = vi.fn(() => {
      throw new Error('device lost during post render')
    })
    const renderer = {
      backend: new WebGPUBackend(),
      toneMapping: THREE.ACESFilmicToneMapping,
    }
    const pipeline = Object.assign(Object.create(RenderPipeline.prototype), {
      _renderer: renderer,
      _webgpuPipeline: {
        setScene: vi.fn(),
        updateParams: vi.fn(),
        render,
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

    expect(() => pipeline.render(new THREE.Scene(), new THREE.PerspectiveCamera())).toThrow(
      'device lost during post render',
    )
    expect(renderer.toneMapping).toBe(THREE.ACESFilmicToneMapping)
    expect(render).toHaveBeenCalledOnce()
  })
})
