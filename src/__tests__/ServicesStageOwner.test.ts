import { TresCanvas } from '@tresjs/core'
import { h } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import type { Scene } from 'three'
import * as THREE from 'three'
import ServicesStageOwner from '../app/scene/ServicesStageOwner.vue'
import type { ServicesStage } from '../Experience/World/ServicesStage'

describe('ServicesStageOwner lifecycle spike', () => {
  beforeAll(() => {
    HTMLCanvasElement.prototype.setPointerCapture ??= () => undefined
    HTMLCanvasElement.prototype.releasePointerCapture ??= () => undefined
    HTMLCanvasElement.prototype.hasPointerCapture ??= () => false
  })
  afterEach(() => document.body.replaceChildren())

  it('attaches the imperative owner once and disposes it with Vue teardown', async () => {
    const renderer = {
      isRenderer: true,
      domElement: document.createElement('canvas'),
      init: vi.fn().mockResolvedValue(undefined),
      render: vi.fn(),
      setSize: vi.fn(),
      setPixelRatio: vi.fn(),
      setClearColor: vi.fn(),
      dispose: vi.fn(),
      shadowMap: { enabled: false, type: 0 },
    }
    const mounted = { scene: null as Scene | null, stage: null as ServicesStage | null }
    const wrapper = mount(TresCanvas, {
      attachTo: document.body,
      props: {
        renderMode: 'manual',
        renderer: (() => renderer) as never,
        onReady: (context) => {
          mounted.scene = context.scene.value
          context.renderer.loop.stop()
        },
      },
      slots: {
        default: () =>
          h(ServicesStageOwner, { onReady: (value: ServicesStage) => (mounted.stage = value) }),
      },
    })
    await flushPromises()
    expect(mounted.stage?.parent).toBe(mounted.scene)
    expect(mounted.stage?.getObjectByName('services-orbit-0')).toBeTruthy()
    expect(mounted.stage?.getObjectByName('services-orbit-1')).toBeTruthy()
    expect(mounted.stage?.getObjectByName('services-orbit-2')).toBeTruthy()
    const camera = new THREE.PerspectiveCamera()
    camera.aspect = 1.5
    const offset = (mounted.stage as unknown as { offset: THREE.Vector3 }).offset
    mounted.stage?.updateState(camera, 0, 1 / 60, false)
    mounted.stage?.updateState(camera, 1, 1 / 60, false)
    expect((mounted.stage as unknown as { offset: THREE.Vector3 }).offset).toBe(offset)
    const dispose = vi.spyOn(mounted.stage as ServicesStage, 'dispose')
    wrapper.unmount()
    expect(dispose).toHaveBeenCalledOnce()
    expect(mounted.stage?.parent).toBeNull()
  })
})
