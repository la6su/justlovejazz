import { TresCanvas } from '@tresjs/core'
import { h } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { createRendererMock, installCanvasPointerShims } from './tresHarness'
import type { PerspectiveCamera, Scene } from 'three'
import type { TresContext } from '@tresjs/core'
import CinematicCamera from '../app/scene/CinematicCamera.vue'

describe('CinematicCamera declarative Tres component', () => {
  beforeAll(() => {
    installCanvasPointerShims()
  })

  afterEach(() => document.body.replaceChildren())

  it('registers one active camera and removes it with the Tres subtree', async () => {
    const renderer = createRendererMock()
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
