import { TresCanvas } from '@tresjs/core'
import { h } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { createRendererMock, installCanvasPointerShims } from './tresHarness'
import type { Scene } from 'three'
import GroundPlane from '../app/scene/GroundPlane.vue'
import type { GroundPlaneNode } from '../Experience/Scene/GroundPlane'

describe('GroundPlane declarative Tres component', () => {
  beforeAll(() => {
    installCanvasPointerShims()
  })

  afterEach(() => document.body.replaceChildren())

  it('mounts and removes the exclusive ground node with the Tres subtree', async () => {
    const renderer = createRendererMock()
    const mounted = { scene: null as Scene | null, ground: null as GroundPlaneNode | null }
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
          h(GroundPlane, { onReady: (node: GroundPlaneNode) => (mounted.ground = node) }),
      },
    })
    await flushPromises()
    await new Promise((resolve) => setTimeout(resolve, 0))

    const scene = mounted.scene as Scene
    const ground = mounted.ground as GroundPlaneNode
    expect(scene.getObjectByName('ground')).toBe(ground)
    expect(ground.geometry.parameters.width).toBe(200)
    expect(ground.material.depthWrite).toBe(false)

    wrapper.unmount()
    expect(scene.getObjectByName('ground')).toBeUndefined()
  })
})
