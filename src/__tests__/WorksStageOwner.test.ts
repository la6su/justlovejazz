import { TresCanvas } from '@tresjs/core'
import { h, shallowRef } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import * as THREE from 'three'
import WorksStageOwner from '../app/scene/WorksStageOwner.vue'
import { WorksPlaneStage } from '../Experience/World/WorksPlaneStage'

describe('WorksStageOwner declarative attachment', () => {
  beforeAll(() => {
    HTMLCanvasElement.prototype.setPointerCapture ??= () => undefined
    HTMLCanvasElement.prototype.releasePointerCapture ??= () => undefined
    HTMLCanvasElement.prototype.hasPointerCapture ??= () => false
  })

  afterEach(() => document.body.replaceChildren())

  it('attaches and detaches the lazy stage without taking its disposal ownership', async () => {
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
    const stage = new WorksPlaneStage()
    const dispose = vi.spyOn(stage, 'dispose')
    const stageRef = shallowRef<WorksPlaneStage | null>(null)
    const mounted = { scene: null as THREE.Scene | null }
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
        default: () => h(WorksStageOwner, { stage: stageRef.value }),
      },
    })
    await flushPromises()

    stageRef.value = stage
    await flushPromises()
    expect(stage.parent).toBe(mounted.scene)

    stageRef.value = null
    await flushPromises()
    expect(stage.parent).toBeNull()
    expect(dispose).not.toHaveBeenCalled()

    wrapper.unmount()
    stage.dispose()
    expect(dispose).toHaveBeenCalledTimes(1)
  })
})
