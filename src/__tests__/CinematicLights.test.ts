import { TresCanvas } from '@tresjs/core'
import { h } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { createRendererMock, installCanvasPointerShims } from './tresHarness'
import type { Scene } from 'three'
import CinematicLights from '../app/scene/CinematicLights.vue'
import type { CinematicLightsNodes } from '../Experience/World/Lights'

describe('CinematicLights declarative Tres component', () => {
  beforeAll(() => {
    installCanvasPointerShims()
  })

  afterEach(() => document.body.replaceChildren())

  it('mounts one complete declarative light subtree and releases it with the component', async () => {
    const renderer = createRendererMock()
    const mounted = {
      scene: null as Scene | null,
      lights: null as CinematicLightsNodes | null,
    }
    const dispose = vi.fn()
    const wrapper = mount(TresCanvas, {
      attachTo: document.body,
      props: {
        renderMode: 'manual',
        renderer: (() => renderer) as never,
        onReady: (context: { scene: { value: Scene }; renderer: { loop: { stop(): void } } }) => {
          mounted.scene = context.scene.value
          context.renderer.loop.stop()
        },
      },
      slots: {
        default: () =>
          h(CinematicLights, {
            onReady: (value: CinematicLightsNodes) => {
              mounted.lights = value
            },
            onDispose: dispose,
          }),
      },
    })
    await flushPromises()
    await new Promise((resolve) => setTimeout(resolve, 0))

    const scene = mounted.scene as Scene
    const lights = mounted.lights as CinematicLightsNodes
    expect(scene.getObjectByName('cinematic-lights')).toBe(lights.group)
    expect(lights.group.children).toHaveLength(5)
    expect(lights.key.parent).toBe(lights.group)
    expect(lights.hemisphere.intensity).toBe(0.2)

    wrapper.unmount()

    expect(dispose).toHaveBeenCalledOnce()
    expect(scene.getObjectByName('cinematic-lights')).toBeUndefined()
  })
})
