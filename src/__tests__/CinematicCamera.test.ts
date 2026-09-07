import { TresCanvas } from '@tresjs/core'
import { h } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import type { PerspectiveCamera, Scene } from 'three'
import type { TresContext } from '@tresjs/core'
import CinematicCamera from '../app/scene/CinematicCamera.vue'

function createRenderer() {
  const canvas = document.createElement('canvas')
  return {
    isRenderer: true,
    domElement: canvas,
    init: vi.fn().mockResolvedValue(undefined),
    render: vi.fn(),
    setSize: vi.fn(),
    setPixelRatio: vi.fn(),
    setClearColor: vi.fn(),
    dispose: vi.fn(),
    shadowMap: { enabled: false, type: 0 },
  }
}

describe('CinematicCamera declarative Tres component', () => {
  beforeAll(() => {
    HTMLCanvasElement.prototype.setPointerCapture ??= () => undefined
    HTMLCanvasElement.prototype.releasePointerCapture ??= () => undefined
    HTMLCanvasElement.prototype.hasPointerCapture ??= () => false
  })

  afterEach(() => document.body.replaceChildren())

  it('registers one active camera and removes it with the Tres subtree', async () => {
    const renderer = createRenderer()
    const mounted = {
      scene: null as Scene | null,
      camera: null as PerspectiveCamera | null,
    }
    const tres = { context: null as TresContext | null }
    const wrapper = mount(TresCanvas, {
      attachTo: document.body,
      props: {
        renderMode: 'manual',
        renderer: (() => renderer) as never,
        onReady: (context) => {
          tres.context = context
          mounted.scene = context.scene.value
          context.renderer.loop.stop()
        },
      },
      slots: {
        default: () =>
          h(CinematicCamera, {
            onReady: (camera: PerspectiveCamera) => {
              mounted.camera = camera
            },
          }),
      },
    })
    await flushPromises()
    await new Promise((resolve) => setTimeout(resolve, 0))

    const scene = mounted.scene as Scene
    const camera = mounted.camera as PerspectiveCamera
    expect(scene.getObjectByName('cinematic-camera')).toBe(camera)
    expect(camera.fov).toBe(75)
    expect(camera.near).toBe(0.1)
    expect(camera.far).toBe(1000)
    expect(tres.context?.camera.activeCamera.value?.uuid).toBe(camera.uuid)

    wrapper.unmount()
    expect(scene.getObjectByName('cinematic-camera')).toBeUndefined()
  })
})
